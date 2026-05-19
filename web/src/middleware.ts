import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const sessionRes = await fetch(new URL('/api/auth/get-session', req.url), {
    headers: { cookie: req.headers.get('cookie') ?? '' },
  })
  const session = sessionRes.ok
    ? ((await sessionRes.json()) as { user?: { email?: string; emailVerified?: boolean } } | null)
    : null

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (!session.user.emailVerified) {
    const url = new URL('/verify-pending', req.url)
    if (session.user.email) url.searchParams.set('email', session.user.email)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*'] }
