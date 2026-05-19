import { migrateBlob, emptyBlobV1, type CurrentBlob } from '@tractionfi/engine'
import type { UserStateParsed } from './types'

export async function getOrCreateUserState(
  db: D1Database,
  userId: string,
): Promise<UserStateParsed> {
  const row = await db
    .prepare('SELECT user_id, blob, version FROM user_state WHERE user_id = ?')
    .bind(userId)
    .first<{ user_id: string; blob: string; version: number }>()

  if (!row) {
    const empty = emptyBlobV1()
    await db
      .prepare(
        'INSERT INTO user_state (user_id, blob, version, created_at, updated_at) VALUES (?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      )
      .bind(userId, JSON.stringify(empty))
      .run()
    return { user_id: userId, blob: empty, version: 0 }
  }

  const { data: parsed, migratedFrom } = migrateBlob(JSON.parse(row.blob))

  if (migratedFrom !== null) {
    // Write back via optimistic-concurrency UPDATE (spec §3.3).
    const result = await db
      .prepare(
        'UPDATE user_state SET blob = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND version = ?',
      )
      .bind(JSON.stringify(parsed), userId, row.version)
      .run()
    if (result.meta.changes !== 1) {
      // Race: someone else migrated/wrote between our read and write-back. Re-read once.
      const reread = await db
        .prepare('SELECT user_id, blob, version FROM user_state WHERE user_id = ?')
        .bind(userId)
        .first<{ user_id: string; blob: string; version: number }>()
      if (!reread) {
        // Row was deleted between our read and re-read — should be impossible while session is live.
        throw new Error('getOrCreateUserState: row disappeared during write-back race')
      }
      const { data: rereadParsed, migratedFrom: rereadFrom } = migrateBlob(JSON.parse(reread.blob))
      if (rereadFrom !== null) {
        throw new Error(
          'getOrCreateUserState: blob still stale after re-read; concurrent writer holding old schema',
        )
      }
      return { user_id: userId, blob: rereadParsed, version: reread.version }
    }
    return { user_id: userId, blob: parsed, version: row.version + 1 }
  }

  return { user_id: userId, blob: parsed, version: row.version }
}

export type UpdateResult =
  | { ok: true; version: number }
  | { ok: false; conflict: { version: number; blob: CurrentBlob } }

export async function updateUserState(
  db: D1Database,
  userId: string,
  blob: CurrentBlob,
  expectedVersion: number,
): Promise<UpdateResult> {
  const result = await db
    .prepare(
      'UPDATE user_state SET blob = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND version = ?',
    )
    .bind(JSON.stringify(blob), userId, expectedVersion)
    .run()

  if (result.meta.changes === 1) {
    return { ok: true, version: expectedVersion + 1 }
  }

  // Conflict — re-read current state (without INSERT side-effect) for the client.
  const current = await db
    .prepare('SELECT blob, version FROM user_state WHERE user_id = ?')
    .bind(userId)
    .first<{ blob: string; version: number }>()
  if (!current) {
    // Row was deleted concurrently. Return an empty blob at version 0; the client will
    // re-GET, which will recreate the row, and they can re-apply their change.
    return { ok: false, conflict: { version: 0, blob: emptyBlobV1() } }
  }
  const { data: currentBlob } = migrateBlob(JSON.parse(current.blob))
  return { ok: false, conflict: { version: current.version, blob: currentBlob } }
}
