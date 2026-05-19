import { type BlobV1, SCHEMA_VERSION_V1, emptyBlobV1 } from './v1'

export const CURRENT_SCHEMA_VERSION = SCHEMA_VERSION_V1

export type CurrentBlob = BlobV1
export { emptyBlobV1 }

export interface MigrateResult {
  data: CurrentBlob
  migratedFrom: number | null
}

/**
 * Migrate a blob from any prior schemaVersion to CURRENT_SCHEMA_VERSION.
 * migratedFrom is the original version when migration occurred, null otherwise.
 * The GET handler writes the migrated blob back to D1 before returning (spec §3.3).
 */
export function migrateBlob(raw: unknown): MigrateResult {
  if (raw === null || raw === undefined) {
    return { data: emptyBlobV1(), migratedFrom: null }
  }
  if (typeof raw !== 'object') {
    throw new Error('migrateBlob: raw is not an object')
  }
  const blob = raw as { schemaVersion?: number }
  const from = blob.schemaVersion ?? 0

  if (from === CURRENT_SCHEMA_VERSION) {
    // Passthrough preserves reference identity by contract — callers may skip
    // serialization when migratedFrom is null. Do not clone.
    return { data: raw as CurrentBlob, migratedFrom: null }
  }

  // No prior versions yet — when v2 ships, chain v1→v2 here.
  throw new Error(`migrateBlob: unknown schemaVersion ${from}`)
}
