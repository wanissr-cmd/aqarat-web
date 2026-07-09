export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCompanyId } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const companyId = await requireCompanyId()
    const templates = await prisma.template.findMany({
      where: { companyId, isActive: true },
      include: { clauses: { orderBy: { order: 'asc' } } },
      orderBy: { type: 'asc' },
    })
    return NextResponse.json(templates)
  } catch (error) {
    console.error('GET /api/templates error:', error)
    return NextResponse.json({ error: 'غير مخول' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = await requireCompanyId()
    const body = await req.json()
    const template = await prisma.template.create({
      data: {
        type: body.type,
        nameAr: body.nameAr,
        companyId,
      },
      include: { clauses: true },
    })
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('POST /api/templates error:', error)
    return NextResponse.json({ error: 'غير مخول' }, { status: 401 })
  }
}
