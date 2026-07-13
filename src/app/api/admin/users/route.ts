export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth-helpers'
import { z } from 'zod'

const addUserSchema = z.object({
  companyId: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'STAFF']),
})

// POST /api/admin/users
// يضيف مستخدم جديد (ADMIN أو STAFF) لشركة موجودة بالفعل
export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin()

    const body = await req.json()
    const { companyId, email, password, name, role } = addUserSchema.parse(body)

    // تأكد إن الشركة موجودة فعلاً
    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) {
      return NextResponse.json({ error: 'الشركة غير موجودة' }, { status: 404 })
    }

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

    const user = await prisma.user.create({
      data: {
        authUserId: authData.user.id,
        email,
        name,
        role,
        companyId,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'غير مصرح - هذه الصفحة لمدير النظام فقط' }, { status: 403 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('POST admin add user error:', error)
    return NextResponse.json({ error: 'خطأ في إنشاء المستخدم' }, { status: 500 })
  }
}