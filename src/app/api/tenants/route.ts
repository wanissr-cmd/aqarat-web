export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId') || 'company-default'

  const tenants = await prisma.tenant.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(tenants)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ✅ لو civilId موجود، ابحث عن المستأجر الموجود
    if (body.civilId && !body.civilId.startsWith('temp-')) {
      const existing = await prisma.tenant.findFirst({
        where: {
          civilId: body.civilId,
          companyId: body.companyId || 'company-default',
        }
      })
      if (existing) return NextResponse.json(existing)
    }

    const tenant = await prisma.tenant.create({
      data: {
        companyId: body.companyId || 'company-default',
        tenantType: body.tenantType || 'INDIVIDUAL',
        tenantName: body.tenantName || null,
        nationality: body.nationality || null,
        civilId: body.civilId || null,
        workAddress: body.workAddress || null,
        phone: body.phone || null,
        companyName: body.companyName || null,
        repName: body.repName || null,
        repCivilId: body.repCivilId || null,
        repNationality: body.repNationality || null,
        repPhone: body.repPhone || null,
        legalCapacity: body.legalCapacity || null,
        legalDoc: body.legalDoc || null,
        legalDocDate: body.legalDocDate ? new Date(body.legalDocDate) : null,
        companyAddress: body.companyAddress || null,
      }
    })

    return NextResponse.json(tenant, { status: 201 })
  } catch (error: any) {
    console.error('POST tenant error:', error)
    return NextResponse.json(
      { error: 'خطأ في حفظ المستأجر: ' + error.message },
      { status: 500 }
    )
  }
}
