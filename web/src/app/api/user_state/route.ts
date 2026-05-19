import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getOrCreateUserState, updateUserState } from '@/server/queries/user_state'
import { getSession } from '@/server/auth'
import type { CurrentBlob } from '@tractionfi/engine'

export async function GET(request: Request) {
  const session = await getSession(request)
  if (!session || !session.user.emailVerifiedAt) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { env } = await getCloudflareContext({ async: true })
  const state = await getOrCreateUserState(env.DB, session.user.id)
  return NextResponse.json(state)
}

export async function PUT(request: Request) {
  const session = await getSession(request)
  if (!session || !session.user.emailVerifiedAt) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { env } = await getCloudflareContext({ async: true })
  const body = (await request.json()) as { blob: CurrentBlob; version: number }

  // v1: trust the client blob shape. The client is the only writer; Better Auth gates access.
  // Deeper validation deferred — would duplicate engine type guards.

  const result = await updateUserState(env.DB, session.user.id, body.blob, body.version)
  if (result.ok) {
    return NextResponse.json({ version: result.version })
  }
  return NextResponse.json(
    { error: 'conflict', current: result.conflict },
    { status: 409 },
  )
}
