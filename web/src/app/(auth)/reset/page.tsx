'use client'

import { useState } from 'react'

export default function RequestResetPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, redirectTo: '/reset/confirm' }),
    }).catch(() => null)
    // Always show the same confirmation — Better Auth doesn't reveal account existence.
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md w-full rounded-2xl border p-6 space-y-4">
          <h1 className="text-xl font-medium">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for {email}, we just sent a password reset link. The link expires in 1 hour.
          </p>
          <a href="/login" className="inline-block rounded-lg border px-4 py-2">Back to login</a>
        </div>
      </main>
    )
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <form onSubmit={onSubmit} className="max-w-md w-full rounded-2xl border p-6 space-y-4">
        <h1 className="text-xl font-medium">Reset your password</h1>
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
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg border px-4 py-2"
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
        <a href="/login" className="block text-sm underline">Back to login</a>
      </form>
    </main>
  )
}
