export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyId } from '@/lib/auth-helpers'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ الإصلاح: تأكد إن المستخدم مسجل دخول
    const companyId = await requireCompanyId()

    const { prisma } = await import('@/lib/prisma')
    const { replacePlaceholders } = await import('@/lib/contract-engine')

    const { type, content } = await req.json()

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        tenant: true,
        company: true,
        template: { include: { clauses: { orderBy: { order: 'asc' } } } },
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    // ✅ الإصلاح الحرج: تحقق إن العقد ملك نفس شركة المستخدم قبل إضافة ملحق له
    if (contract.companyId !== companyId) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    let finalContent = content
    if (type === 'AMENDMENT' && content) {
      finalContent = replacePlaceholders(content, contract.contractData as any)
    }

    const addendum = await prisma.addendum.create({
      data: {
        type,
        contractId: params.id,
        content: finalContent,
        creationDate: new Date(),
      },
    })

    return NextResponse.json(addendum, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح - يرجى تسجيل الدخول' }, { status: 401 })
    }
    console.error('Addendum error:', error)
    return NextResponse.json({ error: 'خطأ في إضافة الملحق' }, { status: 500 })
  }
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ الإصلاح: تأكد إن المستخدم مسجل دخول
    const companyId = await requireCompanyId()

    const { prisma } = await import('@/lib/prisma')

    // ✅ الإصلاح الحرج: تحقق إن العقد ملك نفس شركة المستخدم قبل إرجاع ملحقاته
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      select: { companyId: true },
    })

    if (!contract || contract.companyId !== companyId) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    const addendums = await prisma.addendum.findMany({
      where: { contractId: params.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(addendums)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح - يرجى تسجيل الدخول' }, { status: 401 })
    }
    console.error('GET addendums error:', error)
    return NextResponse.json([])
  }
}