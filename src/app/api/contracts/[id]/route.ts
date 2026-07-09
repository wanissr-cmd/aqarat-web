import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        tenant: true,
        company: true,
        template: { include: { clauses: { orderBy: { order: 'asc' } } } },
        addendums: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!contract) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    return NextResponse.json(contract)
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في جلب البيانات' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const contract = await prisma.contract.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(contract)
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في التحديث' }, { status: 500 })
  }
}
