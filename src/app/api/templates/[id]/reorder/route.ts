export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCompanyId } from '@/lib/auth-helpers'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = await requireCompanyId()
  const template = await prisma.template.findUnique({
    where: { id: params.id },
    select: { companyId: true },
  })
  if (!template || template.companyId !== companyId) {
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
