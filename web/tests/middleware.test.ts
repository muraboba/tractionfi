import { describe, it, expect, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '../src/middleware'

function mockSession(body: unknown | null) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(body == null ? 'null' : JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

function dashboardRequest() {
  return new NextRequest('http://localhost:3000/dashboard', {
    headers: { cookie: 'session=stub' },
  })
}

describe('middleware', () => {
  it('redirects /dashboard to /login when no session', async () => {
    mockSession(null)
    const res = await middleware(dashboardRequest())
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login')
  })

  it('redirects /dashboard to /verify-pending when emailVerified is false', async () => {
    mockSession({ user: { id: 'u1', email: 'a@b.com', emailVerified: false } })
    const res = await middleware(dashboardRequest())
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/verify-pending')
    expect(location).toContain('email=a%40b.com')
  })

  it('passes through /dashboard when verified', async () => {
    mockSession({ user: { id: 'u1', email: 'a@b.com', emailVerified: true } })
    const res = await middleware(dashboardRequest())
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).toBe(200)
  })
})
