'use client'

import { useState } from 'react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 12) {
      setError('Password must be at least 12 characters.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: email.split('@')[0] || email,
          callbackURL: '/dashboard',
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null
        setError(data?.message ?? 'Could not create your account. Please try again.')
        setSubmitting(false)
        return
      }
      window.location.href = `/verify-pending?email=${encodeURIComponent(email)}`
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <form onSubmit={onSubmit} className="max-w-md w-full rounded-2xl border p-6 space-y-4">
        <h1 className="text-xl font-medium">Create your account</h1>
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
          <span className="text-sm">Password (12+ characters)</span>
          <input
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
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
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
        <p className="text-sm text-muted-foreground">
          Already have an account? <a href="/login" className="underline">Log in</a>
        </p>
      </form>
    </main>
  )
}
