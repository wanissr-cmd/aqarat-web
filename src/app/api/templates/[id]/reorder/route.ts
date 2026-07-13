export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح - يرجى تسجيل الدخول' }, { status: 401 })
  }

  const template = await prisma.template.findUnique({
    where: { id: params.id },
    select: { companyId: true, isGlobal: true },
  })

  if (!template) {
    return NextResponse.json({ error: 'القالب غير موجود' }, { status: 404 })
  }

  // ✅ الإصلاح: صلاحية التعديل حسب الحالة
  // - Super Admin يقدر يعدّل أي تمبلت (عام أو خاص)
  // - شركة عادية تقدر تعدّل بس تمبلتاتها الخاصة (مش العامة)
  const isOwner = template.companyId === user.companyId
  const isSuperAdminUser = user.role === 'SUPER_ADMIN'

  if (!isSuperAdminUser && (template.isGlobal || !isOwner)) {
    return NextResponse.json({ error: 'غير مخول' }, { status: 403 })
  }

  const { clauses } = await req.json()
  await Promise.all(
    clauses.map(({ id, order }: { id: string; order: number }) =>
      prisma.templateClause.update({ where: { id }, data: { order } })
    )
  )
  const updated = await prisma.template.findUnique({
    where: { id: params.id },
    include: { clauses: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(updated)
}