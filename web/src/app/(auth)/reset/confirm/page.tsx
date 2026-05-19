'use client'

import { useEffect, useState } from 'react'

export default function ResetConfirmPage() {
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token'))
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError('Reset link is missing a token. Request a new one.')
      return
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ newPassword: password, token }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null
        setError(data?.message ?? 'Could not reset your password. The link may have expired.')
        setSubmitting(false)
        return
      }
      window.location.href = '/login?reset=1'
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <form onSubmit={onSubmit} className="max-w-md w-full rounded-2xl border p-6 space-y-4">
        <h1 className="text-xl font-medium">Set a new password</h1>
        <label className="block">
          <span className="text-sm">New password (12+ characters)</span>
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
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </main>
  )
}
