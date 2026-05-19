import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export function middleware(req: NextRequest) {
  // Edge runtime — only do a cookie-presence check here (no DB call, no
  // node: imports). The dashboard layout does the full session lookup +
  // emailVerified check server-side.
  const sessionToken = getSessionCookie(req)
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*'] }
