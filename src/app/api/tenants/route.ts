export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCompanyId } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    // ✅ الإصلاح: companyId بييجي من جلسة المستخدم، مش من الرابط، ومفيش fallback لـ 'company-default'
    const companyId = await requireCompanyId()

    const tenants = await prisma.tenant.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tenants)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح - يرجى تسجيل الدخول' }, { status: 401 })
    }
    console.error('GET tenants error:', error)
    return NextResponse.json({ error: 'خطأ في جلب المستأجرين' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // ✅ الإصلاح: companyId بييجي من الجلسة، مش من body.companyId، ومفيش fallback لـ 'company-default'
    const companyId = await requireCompanyId()

    const body = await req.json()

    // ✅ لو civilId موجود، ابحث عن المستأجر الموجود داخل نفس الشركة فقط
    if (body.civilId && !body.civilId.startsWith('temp-')) {
      const existing = await prisma.tenant.findFirst({
        where: {
          civilId: body.civilId,
          companyId, // ✅ من الجلسة
        }
      })
      if (existing) return NextResponse.json(existing)
    }

    const tenant = await prisma.tenant.create({
      data: {
        companyId, // ✅ من الجلسة
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
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح - يرجى تسجيل الدخول' }, { status: 401 })
    }
    console.error('POST tenant error:', error)
    return NextResponse.json(
      { error: 'خطأ في حفظ المستأجر: ' + error.message },
      { status: 500 }
    )
  }
}