import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getAuth } from '@/server/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth()
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/login')
  }
  if (!session.user.emailVerified) {
    const email = session.user.email
    redirect(email ? `/verify-pending?email=${encodeURIComponent(email)}` : '/verify-pending')
  }

  return <>{children}</>
}
