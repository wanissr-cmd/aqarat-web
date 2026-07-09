export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    if (!contract) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

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
    console.error('Addendum error:', error)
    return NextResponse.json({ error: 'خطأ في إضافة الملحق' }, { status: 500 })
  }
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const addendums = await prisma.addendum.findMany({
      where: { contractId: params.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(addendums)
  } catch (error) {
    return NextResponse.json([])
  }
}
