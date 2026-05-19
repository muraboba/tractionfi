import { describe, it, expect } from 'vitest'
import { migrateBlob, emptyBlobV1, CURRENT_SCHEMA_VERSION } from '../src/migrations'

describe('migrateBlob', () => {
  it('returns empty v1 blob for null/undefined input', () => {
    const { data, migratedFrom } = migrateBlob(null)
    expect(data.schemaVersion).toBe(1)
    expect(migratedFrom).toBeNull()
  })

  it('passes through a current-version blob unchanged', () => {
    const empty = emptyBlobV1()
    const { data, migratedFrom } = migrateBlob(empty)
    expect(data).toBe(empty)
    expect(migratedFrom).toBeNull()
  })

  it('throws on unknown schemaVersion', () => {
    expect(() => migrateBlob({ schemaVersion: 999 })).toThrow()
  })

  it('CURRENT_SCHEMA_VERSION is 1', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(1)
  })
})
