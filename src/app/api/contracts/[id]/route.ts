import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCompanyId } from '@/lib/auth-helpers'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ الإصلاح: تأكد إن المستخدم مسجل دخول
    const companyId = await requireCompanyId()

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        tenant: true,
        company: true,
        template: { include: { clauses: { orderBy: { order: 'asc' } } } },
        addendums: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    // ✅ الإصلاح الحرج: تحقق إن العقد ملك نفس شركة المستخدم قبل إرجاعه
    // لو مش كذلك، نرجّع 404 (مش 403) عشان منأكدش لحد بره إن الـ id ده موجود أصلاً
    if (contract.companyId !== companyId) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    return NextResponse.json(contract)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح - يرجى تسجيل الدخول' }, { status: 401 })
    }
    console.error('GET contract error:', error)
    return NextResponse.json({ error: 'خطأ في جلب البيانات' }, { status: 500 })
  }
}

// ✅ الإصلاح: قائمة صريحة بالحقول المسموح تعديلها فقط
// يمنع أي حد من تعديل companyId أو id أو أي حقل حساس عن طريق الـ body
const ALLOWED_UPDATE_FIELDS = [
  'status',
  'startDate',
  'endDate',
  'durationYears',
  'durationText',
  'hasGracePeriod',
  'gracePeriodStart',
  'gracePeriodEnd',
  'gracePeriodText',
  'monthlyRent',
  'monthlyRentText',
  'deposit',
  'advance',
  'advanceText',
  'paymentStartDate',
  'electricityOn',
  'waterOn',
  'propertyBlock',
  'propertyZone',
  'propertySection',
  'propertyStreet',
  'propertyAlley',
  'unitNumber',
  'floor',
  'autoNumber',
  'residentialPurpose',
  'occupantsCount',
  'occupantsCompany',
  'businessPurpose',
  'hasGuarantor',
  'activationPeriod',
  'pdfUrl',
  'wordUrl',
] as const

function pickAllowedFields(body: Record<string, unknown>) {
  const result: Record<string, unknown> = {}
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (key in body) {
      result[key] = body[key]
    }
  }
  return result
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ الإصلاح: تأكد إن المستخدم مسجل دخول
    const companyId = await requireCompanyId()

    // ✅ الإصلاح الحرج: تحقق إن العقد ملك نفس شركة المستخدم قبل السماح بأي تعديل
    const existingContract = await prisma.contract.findUnique({
      where: { id: params.id },
      select: { companyId: true },
    })

    if (!existingContract) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    if (existingContract.companyId !== companyId) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    const body = await req.json()

    // ✅ الإصلاح: نسمح فقط بتعديل الحقول المحددة، مش أي حاجة تيجي في الـ body
    const safeData = pickAllowedFields(body)

    const contract = await prisma.contract.update({
      where: { id: params.id },
      data: safeData,
    })

    return NextResponse.json(contract)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح - يرجى تسجيل الدخول' }, { status: 401 })
    }
    console.error('PATCH contract error:', error)
    return NextResponse.json({ error: 'خطأ في التحديث' }, { status: 500 })
  }
}