export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildActiveClauses } from '@/lib/contract-engine'
import { z } from 'zod'
import type { ContractData } from '@/types/contract'
import { requireCompanyId } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const companyId = await requireCompanyId()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { companyId }
    if (status) where.status = status
    if (type) where.type = type
    if (search) {
      where.OR = [
        { tenant: { tenantName: { contains: search } } },
        { tenant: { companyName: { contains: search } } },
        { unitNumber: { contains: search } },
      ]
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          tenant: {
            select: {
              tenantName: true, companyName: true,
              tenantType: true, civilId: true, phone: true
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ])

    return NextResponse.json({
      contracts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    console.error('GET contracts error:', error)
    return NextResponse.json({ error: 'خطأ في جلب البيانات' }, { status: 500 })
  }
}

const createContractSchema = z.object({
  templateId: z.string(),
  tenantId: z.string(),
  contractData: z.object({}).passthrough(),
})

// ✅ الإصلاح: توليد رقم عقد تسلسلي تلقائي لكل شركة على حدة
// الصيغة: السنة-رقم تسلسلي بترقيم 4 خانات، مثال: 2026-0001
async function generateContractNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear()

  // عدد العقود الحالية لنفس الشركة (بغض النظر عن السنة) + 1
  // نستخدم count بدل البحث عن آخر رقم لتجنب مشاكل التزامن البسيطة
  const count = await prisma.contract.count({ where: { companyId } })
  const sequence = String(count + 1).padStart(4, '0')

  const candidate = `${year}-${sequence}`

  // تحقق من عدم وجود تعارض (احتياط إضافي، نادر الحدوث)
  // ملحوظة: contractNumber ليس @unique في الـ schema، لذا نستخدم findFirst
  const exists = await prisma.contract.findFirst({ where: { contractNumber: candidate } })
  if (!exists) return candidate

  // في حالة نادرة لتعارض، أضف طابع زمني كإجراء احتياطي
  return `${year}-${sequence}-${Date.now().toString().slice(-4)}`
}

export async function POST(req: NextRequest) {
  try {
    const companyId = await requireCompanyId()

    const body = await req.json()
    const { templateId, tenantId, contractData } = createContractSchema.parse(body)
    const data = contractData as unknown as ContractData

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { clauses: { orderBy: { order: 'asc' } } }
    })

    if (!template) {
      return NextResponse.json({ error: 'القالب غير موجود' }, { status: 404 })
    }

    // ✅ تحقق: التمبلت لازم يكون إما عام أو ملك نفس الشركة
    if (!template.isGlobal && template.companyId !== companyId) {
      return NextResponse.json({ error: 'غير مصرح باستخدام هذا القالب' }, { status: 403 })
    }

    // ✅ تحقق: المستأجر لازم يكون تابع لنفس الشركة
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant || tenant.companyId !== companyId) {
      return NextResponse.json({ error: 'المستأجر غير موجود' }, { status: 404 })
    }

    const activeClauses = buildActiveClauses(template.clauses, data)

    // ✅ الإصلاح: توليد رقم العقد قبل الإنشاء
    const contractNumber = await generateContractNumber(companyId)

    const contract = await prisma.contract.create({
      data: {
        contractNumber, // ✅ الحقل الناقص اللي كان بيسبب الخطأ
        type: data.type as any,
        status: 'ACTIVE',
        template: { connect: { id: templateId } },
        tenant: { connect: { id: tenantId } },
        company: { connect: { id: companyId } },
        creationDate: new Date(data.creationDate),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        durationYears: data.durationYears,
        durationText: data.durationText,
        hasGracePeriod: data.hasGracePeriod,
        gracePeriodStart: data.gracePeriodStart ? new Date(data.gracePeriodStart) : null,
        gracePeriodEnd: data.gracePeriodEnd ? new Date(data.gracePeriodEnd) : null,
        gracePeriodText: data.gracePeriodText,
        monthlyRent: data.monthlyRent,
        monthlyRentText: data.monthlyRentText,
        deposit: data.deposit,
        advance: data.advance,
        advanceText: data.advanceText,
        paymentStartDate: data.paymentStartDate ? new Date(data.paymentStartDate) : null,
        electricityOn: data.electricityOn as any,
        waterOn: data.waterOn as any,
        propertyBlock: data.propertyBlock,
        propertyZone: data.propertyZone,
        propertySection: data.propertySection,
        propertyStreet: data.propertyStreet,
        propertyAlley: data.propertyAlley,
        unitNumber: data.unitNumber,
        floor: data.floor,
        autoNumber: data.autoNumber,
        residentialPurpose: data.residentialPurpose ? data.residentialPurpose as any : null,
        occupantsCount: data.occupantsCount,
        occupantsCompany: data.occupantsCompany,
        businessPurpose: data.businessPurpose,
        hasGuarantor: data.hasGuarantor,
        activationPeriod: data.activationPeriod,
        contractData: data as any,
        clausesSnapshot: activeClauses as any,
      },
      include: { tenant: true },
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    console.error('POST contract error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'خطأ في إنشاء العقد' }, { status: 500 })
  }
}