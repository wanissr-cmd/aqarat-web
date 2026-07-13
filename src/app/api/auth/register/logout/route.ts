import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  await supabase.auth.signOut()

  // ✅ الإصلاح: نجيب رابط الموقع الحالي من الـ request نفسه
  // ده بيشتغل صح سواء محلياً (localhost:3000) أو على الإنتاج (aqarat-web.vercel.app)
  // بدون أي علاقة برابط Supabase
  const origin = req.nextUrl.origin

  return NextResponse.redirect(new URL('/login', origin))
}