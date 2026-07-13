export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCompanyId } from '@/lib/auth-helpers'

// GET /api/templates/[id]/clauses
// يرجّع بنود تمبلت واحد بمعرفة الـ id بتاعه
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = await requireCompanyId()

    const template = await prisma.template.findUnique({
      where: { id: params.id },
      select: { isGlobal: true, companyId: true },
    })

    if (!template) {
      return NextResponse.json({ error: 'القالب غير موجود' }, { status: 404 })
    }

    // ✅ تحقق: التمبلت لازم يكون إما عام أو ملك نفس الشركة
    if (!template.isGlobal && template.companyId !== companyId) {
      return NextResponse.json({ error: 'غير مصرح بالوصول لهذا القالب' }, { status: 403 })
    }

    const clauses = await prisma.templateClause.findMany({
      where: { templateId: params.id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(clauses)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح - يرجى تسجيل الدخول' }, { status: 401 })
    }
    console.error('GET template clauses error:', error)
    return NextResponse.json({ error: 'خطأ في جلب بنود القالب' }, { status: 500 })
  }
}