export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'

const decisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
})

// PATCH /api/admin/companies/[id]/approve
// بيوافق أو يرفض شركة معلّقة
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superAdmin = await requireSuperAdmin()

    const body = await req.json()
    const { decision } = decisionSchema.parse(body)

    const company = await prisma.company.findUnique({
      where: { id: params.id },
    })

    if (!company) {
      return NextResponse.json({ error: 'الشركة غير موجودة' }, { status: 404 })
    }

    const updated = await prisma.company.update({
      where: { id: params.id },
      data: {
        approvalStatus: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        approvedAt: decision === 'APPROVE' ? new Date() : null,
        approvedBy: decision === 'APPROVE' ? superAdmin.authUserId : null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'غير مصرح - هذه الصفحة لمدير النظام فقط' }, { status: 403 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'قرار غير صالح' }, { status: 400 })
    }
    console.error('PATCH approve company error:', error)
    return NextResponse.json({ error: 'خطأ في تحديث حالة الشركة' }, { status: 500 })
  }
}