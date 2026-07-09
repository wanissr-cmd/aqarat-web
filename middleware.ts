import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon')

  if (isPublic) return NextResponse.next()

  // ابحث عن أي cookie بتاع Supabase
  const allCookies = request.cookies.getAll()
  const hasAuth = allCookies.some(c =>
    c.name.includes('auth') ||
    c.name.includes('supabase') ||
    c.name.startsWith('sb-')
  )

  if (!hasAuth) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
}