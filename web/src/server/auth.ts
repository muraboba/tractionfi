// Stub. Real implementation lands in Phase 4 (Better Auth + email-verification flow).
// Returns null until Phase 4 wires Better Auth — routes will 401 in the meantime.
//
// TODO(Phase 4) — emailVerifiedAt shape mismatch with Better Auth:
// Better Auth stores `user.emailVerified` as INTEGER (0/1), not a timestamp.
// Phase 4 must choose one of:
//   A) Expose `emailVerified: boolean` in Session, checking `emailVerified > 0` — no schema change.
//   B) Add an `emailVerifiedAt: DATE` column to the migration and bridge from the INTEGER flag.
// The truthiness check in route.ts works for either shape; the type here just needs updating then.
export interface Session {
  user: {
    id: string
    emailVerifiedAt: string | null
  }
}

export async function getSession(_request: Request): Promise<Session | null> {
  return null
}
