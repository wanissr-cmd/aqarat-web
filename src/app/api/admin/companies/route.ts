export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-helpers'

// GET /api/admin/companies?status=PENDING
// يجيب كل الشركات، مع إمكانية الفلترة بالحالة (PENDING / APPROVED / REJECTED)
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // PENDING | APPROVED | REJECTED | null (الكل)

    const where = status ? { approvalStatus: status as any } : {}

    const companies = await prisma.company.findMany({
      where,
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        representativeName: true,
        approvalStatus: true,
        canEditTemplates: true,
        createdAt: true,
        approvedAt: true,
        users: {
          select: { email: true, name: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(companies)
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'غير مصرح - هذه الصفحة لمدير النظام فقط' }, { status: 403 })
    }
    console.error('GET admin companies error:', error)
    return NextResponse.json({ error: 'خطأ في جلب الشركات' }, { status: 500 })
  }
}