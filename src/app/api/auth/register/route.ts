export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email, password, companyNameAr, representativeName } = await req.json()

    if (!email || !password || !companyNameAr || !representativeName) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'فشل إنشاء الحساب' }, { status: 400 })
    }

    // ✅ الإصلاح: الشركة بتتعمل بحالة PENDING افتراضياً (موجودة أصلاً كـ default في الـ schema)
    // لسه مش هتقدر تستخدم النظام لحد ما الـ Super Admin يوافق عليها
    const company = await prisma.company.create({
      data: {
        nameAr: companyNameAr,
        representativeName,
        authUserId: authData.user.id,
      },
    })

    await prisma.user.create({
      data: {
        authUserId: authData.user.id,
        email,
        name: representativeName,
        role: 'ADMIN',
        companyId: company.id,
      },
    })

    // ✅ الإصلاح: رسالة واضحة إن الطلب محتاج مراجعة، مش تفعيل فوري
    return NextResponse.json(
      {
        success: true,
        message: 'تم إرسال طلبك بنجاح، سيتم مراجعته والتواصل معك قريباً',
        companyId: company.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء الحساب: ' + error.message }, { status: 500 })
  }
}