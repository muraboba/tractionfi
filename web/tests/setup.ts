import { readD1Migrations } from '@cloudflare/vitest-pool-workers'
import path from 'node:path'
import type { Vitest } from 'vitest/node'

export async function setup(vitest: Vitest) {
  const migrationsPath = path.resolve(__dirname, '../migrations')
  const migrations = await readD1Migrations(migrationsPath)
  vitest.provide('D1_MIGRATIONS', migrations)
}
