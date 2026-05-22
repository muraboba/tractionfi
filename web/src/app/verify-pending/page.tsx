'use client'

import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Status = 'idle' | 'sending' | 'sent' | 'error'
type EmailState = 'loading' | 'present' | 'missing'
type CheckStatus = 'idle' | 'checking' | 'not-yet'

export default function VerifyPendingPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [email, setEmail] = useState<string | null>(null)
  const [emailState, setEmailState] = useState<EmailState>('loading')
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('idle')

  useEffect(() => {
    const queryEmail = new URLSearchParams(window.location.search).get('email')
    if (queryEmail) {
      setEmail(queryEmail)
      setEmailState('present')
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/auth/get-session')
        if (cancelled) return
        if (!res.ok) {
          setEmailState('missing')
          return
        }
        const data = (await res.json()) as { user?: { email?: string } } | null
        const sessionEmail = data?.user?.email
        if (sessionEmail) {
          setEmail(sessionEmail)
          setEmailState('present')
        } else {
          setEmailState('missing')
        }
      } catch {
        if (!cancelled) setEmailState('missing')
      }
    })()
    return () => {
      cancelled = true
    }
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
    setCheckStatus('checking')
    try {
      const res = await fetch('/api/auth/get-session')
      if (!res.ok) { setCheckStatus('idle'); return }
      const data = (await res.json()) as { user?: { emailVerified?: boolean } } | null
      if (data?.user?.emailVerified) {
        window.location.href = '/dashboard'
      } else {
        setCheckStatus('not-yet')
      }
    } catch {
      setCheckStatus('idle')
    }
  }

  async function logoutAndRetry() {
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.href = '/signup'
  }

  function goToLogin() {
    window.location.href = '/login'
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full rounded-2xl border p-6 space-y-4">
        <h1 className="text-xl font-medium">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to {email ?? 'your email address'}.
        </p>
        <div className="flex flex-col gap-2">
          {emailState === 'missing' ? (
            <button type="button" onClick={goToLogin} className="cursor-pointer rounded-lg border px-4 py-2">
              Log in to retry
            </button>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={status === 'sending' || emailState === 'loading' || !email}
              className="cursor-pointer rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'sent' ? 'Sent — check your inbox' : status === 'sending' ? 'Sending…' : 'Resend'}
            </button>
          )}
          <button type="button" onClick={check} disabled={checkStatus === 'checking'} className="cursor-pointer rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50">
            {checkStatus === 'checking' ? 'Checking…' : 'Already verified?'}
          </button>

          <Dialog open={checkStatus === 'not-yet'} onOpenChange={(open) => { if (!open) setCheckStatus('idle') }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Not verified yet</DialogTitle>
                <DialogDescription>
                  Your email hasn&apos;t been verified. Check your inbox and spam folder for the link we sent
                  {email ? ` to ${email}` : ''}.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton>
                {email && (
                  <button
                    type="button"
                    onClick={() => { setCheckStatus('idle'); void resend() }}
                    className="cursor-pointer rounded-lg border px-4 py-2 text-sm"
                  >
                    Resend link
                  </button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <button type="button" onClick={logoutAndRetry} className="cursor-pointer rounded-lg border px-4 py-2">
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
