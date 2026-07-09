export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCompanyId } from '@/lib/auth-helpers'

export async function GET(_: NextRequest) {
  try {
    const companyId = await requireCompanyId()
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        representativeName: true,
        logo: true,
      },
    })

    if (!company) {
      return NextResponse.json({ error: 'الشركة غير موجودة' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'غير مخول' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const companyId = await requireCompanyId()
    const body = await req.json()

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        nameAr: body.nameAr || undefined,
        nameEn: body.nameEn || undefined,
        representativeName: body.representativeName || undefined,
        logo: body.logo || undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/settings error:', error)
    return NextResponse.json({ error: 'تعذر تحديث الإعدادات' }, { status: 500 })
  }
}
