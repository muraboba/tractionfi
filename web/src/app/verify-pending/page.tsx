'use client'

import { useEffect, useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function VerifyPendingPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setEmail(params.get('email'))
  }, [])

  async function resend() {
    if (!email) return
    setStatus('sending')
    try {
      const res = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, callbackURL: '/dashboard' }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  async function check() {
    const res = await fetch('/api/auth/get-session')
    if (!res.ok) return
    const data = (await res.json()) as { user?: { emailVerified?: boolean } } | null
    if (data?.user?.emailVerified) {
      window.location.href = '/dashboard'
    }
  }

  async function logoutAndRetry() {
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.href = '/signup'
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md w-full rounded-2xl border p-6 space-y-4">
        <h1 className="text-xl font-medium">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to {email ?? 'your email address'}.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={resend}
            disabled={status === 'sending' || !email}
            className="rounded-lg border px-4 py-2"
          >
            {status === 'sent' ? 'Sent — check your inbox' : status === 'sending' ? 'Sending…' : 'Resend'}
          </button>
          <button onClick={check} className="rounded-lg border px-4 py-2">
            Already verified?
          </button>
          <button onClick={logoutAndRetry} className="rounded-lg border px-4 py-2">
            Use different email
          </button>
        </div>
        {status === 'error' ? (
          <p className="text-sm text-red-600">Couldn&apos;t resend right now. Try again in a moment.</p>
        ) : null}
      </div>
    </main>
  )
}
