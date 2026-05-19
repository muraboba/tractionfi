'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, callbackURL: '/dashboard' }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string; code?: string } | null
        if (data?.code === 'EMAIL_NOT_VERIFIED') {
          window.location.href = `/verify-pending?email=${encodeURIComponent(email)}`
          return
        }
        setError(data?.message ?? 'Invalid email or password.')
        setSubmitting(false)
        return
      }
      window.location.href = '/dashboard'
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <form onSubmit={onSubmit} className="max-w-md w-full rounded-2xl border p-6 space-y-4">
        <h1 className="text-xl font-medium">Welcome back</h1>
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg border px-4 py-2"
        >
          {submitting ? 'Signing in…' : 'Log in'}
        </button>
        <div className="flex justify-between text-sm">
          <a href="/reset" className="underline">Forgot password?</a>
          <a href="/signup" className="underline">Create account</a>
        </div>
      </form>
    </main>
  )
}
