import { betterAuth } from 'better-auth'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { Resend } from 'resend'

export interface Session {
  user: {
    id: string
    email: string
    emailVerified: boolean
  }
}

type AuthEnv = CloudflareEnv & {
  BETTER_AUTH_SECRET: string
  RESEND_API_KEY: string
}

let authInstance: ReturnType<typeof buildAuth> | null = null

function buildAuth(env: AuthEnv) {
  const resend = new Resend(env.RESEND_API_KEY)
  return betterAuth({
    appName: 'TractionFI',
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    trustedProxyHeaders: true,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      requireEmailVerification: true,
      autoSignIn: false,
      sendResetPassword: async ({ user, url }) => {
        await resend.emails.send({
          from: 'reset@tractionfi.com',
          to: user.email,
          subject: 'Reset your TractionFI password',
          html: `<p>Reset your password by clicking the link below. This link expires in 1 hour.</p><p><a href="${url}">${url}</a></p>`,
        })
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) => {
        await resend.emails.send({
          from: 'reset@tractionfi.com',
          to: user.email,
          subject: 'Verify your TractionFI account',
          html: `<p>Click to verify your account:</p><p><a href="${url}">${url}</a></p>`,
        })
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
  })
}

export async function getAuth() {
  if (authInstance) return authInstance
  const { env } = await getCloudflareContext({ async: true })
  authInstance = buildAuth(env as AuthEnv)
  return authInstance
}

export async function getSession(request: Request): Promise<Session | null> {
  const auth = await getAuth()
  const result = await auth.api.getSession({ headers: request.headers })
  if (!result?.user) return null
  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      emailVerified: result.user.emailVerified,
    },
  }
}
