import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get('email')
  if (!email) return NextResponse.json({ verified: false })

  const { env } = await getCloudflareContext({ async: true })
  const row = await (env.DB as D1Database)
    .prepare('SELECT emailVerified FROM "user" WHERE email = ? LIMIT 1')
    .bind(email)
    .first<{ emailVerified: number | null }>()

  return NextResponse.json({ verified: row?.emailVerified === 1 })
}
