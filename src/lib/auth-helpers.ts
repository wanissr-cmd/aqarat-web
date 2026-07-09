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
  const companyId = await getCurrentCompanyId()
  if (!companyId) {
    throw new Error('UNAUTHORIZED')
  }
  return companyId
}