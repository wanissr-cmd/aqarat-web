export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!params?.id) {
    return NextResponse.json({ error: 'Template ID missing' }, { status: 400 })
  }

  try {
    const clauses = await prisma.templateClause.findMany({
      where: { templateId: params.id },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(clauses)
  } catch (error) {
    console.error('GET /api/templates/[id]/clauses error:', error)
    return NextResponse.json({ error: 'فشل في تحميل البنود' }, { status: 500 })
  }
}
