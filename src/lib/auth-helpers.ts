import { createClient } from '@/lib/supabase/server'
import { prisma } from './prisma'

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { authUserId: user.id },
    include: { company: true },
  })

  return dbUser
}

export async function getCurrentCompanyId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.companyId || null
}

export async function requireCompanyId(): Promise<string> {
  const user = await getCurrentUser()

  if (!user || !user.companyId) {
    throw new Error('UNAUTHORIZED')
  }

  // ✅ Super Admin مش مرتبط بشركة، فمش المفروض يستخدم requireCompanyId أصلاً
  // (له دوال منفصلة requireSuperAdmin)
  if (user.role === 'SUPER_ADMIN') {
    throw new Error('UNAUTHORIZED')
  }

  // ✅ الإصلاح: امنع أي استخدام للنظام لو الشركة لسه معلّقة أو مرفوضة
  if (user.company?.approvalStatus === 'PENDING') {
    throw new Error('PENDING_APPROVAL')
  }
  if (user.company?.approvalStatus === 'REJECTED') {
    throw new Error('REJECTED')
  }

  return user.companyId
}

// ✅ جديد: يتأكد إن المستخدم Super Admin
export async function isSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'SUPER_ADMIN'
}

// ✅ جديد: لصفحات ولوحة الـ Super Admin فقط، يرمي خطأ لو مش سوبر أدمن
export async function requireSuperAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('FORBIDDEN')
  }
  return user
}