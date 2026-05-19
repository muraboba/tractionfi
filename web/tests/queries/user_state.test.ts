import { describe, it, expect, beforeAll } from 'vitest'
import { env, applyD1Migrations } from 'cloudflare:test'
import type { D1Migration } from '@cloudflare/vitest-pool-workers'
import { inject } from 'vitest'
import { getOrCreateUserState, updateUserState } from '../../src/server/queries/user_state'

// user_state has a FK to user(id), so seed stub user rows for each test user.
const TEST_USERS = ['user-1', 'user-2', 'user-3', 'user-4']

beforeAll(async () => {
  const migrations = inject('D1_MIGRATIONS') as D1Migration[]
  await applyD1Migrations(env.DB, migrations)

  // Seed minimal user rows to satisfy the FK constraint.
  for (const id of TEST_USERS) {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    )
      .bind(id, `Test ${id}`, `${id}@test.com`)
      .run()
  }
})

describe('user_state queries', () => {
  it('creates an empty row on first read', async () => {
    const state = await getOrCreateUserState(env.DB, 'user-1')
    expect(state.version).toBe(0)
    expect(state.blob.schemaVersion).toBe(1)
  })

  it('is idempotent on second read for the same user', async () => {
    const first = await getOrCreateUserState(env.DB, 'user-2')
    const second = await getOrCreateUserState(env.DB, 'user-2')
    expect(second.version).toBe(first.version)
  })

  it('update with correct expectedVersion succeeds and bumps version', async () => {
    const state = await getOrCreateUserState(env.DB, 'user-3')
    const result = await updateUserState(env.DB, 'user-3', state.blob, state.version)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.version).toBe(state.version + 1)
  })

  it('update with stale expectedVersion returns conflict with current state', async () => {
    const state = await getOrCreateUserState(env.DB, 'user-4')
    await updateUserState(env.DB, 'user-4', state.blob, state.version)
    const result = await updateUserState(env.DB, 'user-4', state.blob, state.version)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.conflict.version).toBe(state.version + 1)
  })
})
