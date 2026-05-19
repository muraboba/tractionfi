import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '../src/middleware'

function dashboardRequest(cookie: string) {
  return new NextRequest('http://localhost:3000/dashboard', {
    headers: cookie ? { cookie } : {},
  })
}

describe('middleware', () => {
  it('redirects /dashboard to /login when no session cookie', () => {
    const res = middleware(dashboardRequest(''))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login')
  })

  it('redirects /dashboard to /login when cookie does not contain a session token', () => {
    const res = middleware(dashboardRequest('other-cookie=value'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login')
  })

  it('passes through /dashboard when session cookie present (secure-prefixed)', () => {
    const res = middleware(
      dashboardRequest('__Secure-better-auth.session_token=abc123.signature'),
    )
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).toBe(200)
  })

  it('passes through /dashboard when session cookie present (unprefixed for dev)', () => {
    const res = middleware(
      dashboardRequest('better-auth.session_token=abc123.signature'),
    )
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).toBe(200)
  })
})
