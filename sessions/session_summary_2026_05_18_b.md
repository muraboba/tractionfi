# Session Summary: TractionFI — 2026-05-18

## What We Did

**PRD review and Tier 1 design lockdown.** Reviewed `PRD.md` (v0.4), identified three tiers of gaps, then worked through Tier 1 one item at a time.

### PRD review findings
- §13 step 2 is already done — engine extraction complete (all 6 phases in `engine/src/rules/`, tests passing, canonical 10%/4-10% thresholds, version 0.1.0). PRD's "next steps" list is stale on this point.
- **Tier 1 gaps (plan-changing):** data model under-specified, DB migration tooling unchosen, concurrency unaddressed.
- **Tier 2 gaps (worth resolving):** email-verification UX, empty-state UX, "complete budget" UX, observability call.
- **Tier 3 gaps (flag-and-move):** web testing strategy, rate limiting beyond `/api/auth/*`, milestone-copy ownership, a11y verification in CI, legal review owner, D1 backups.

### Tier 1 #1 — Data model (LOCKED)
- **Storage shape:** single mutable row per user in `user_state` table (renamed from `interviews`). One JSON blob holds `{ schemaVersion, userData, settings: { skippedMilestones } }`.
- **Concurrency:** optimistic locking via `version` integer column. Atomic `UPDATE ... WHERE user_id = ? AND version = ?` pattern; check `meta.changes` for conflict detection (return 409 on mismatch).
- **No `results` column** — engine recomputes on every load. Eliminates stale-cache concerns.
- **FR-4d dropped.** Engine version surfaces in footer only; no "stale results / recompute" UX since nothing is stored.
- **Snapshot history deferred to v1.5.** Privacy stance + no v1 success metric requires it. The `version` column doubles as a snapshot key when we add `user_state_snapshots` later, so deferral is non-breaking.
- **Settings in the blob** (not a separate `user_settings` table) — fewer tables until justified.

### Tier 1 #2 — Migration tooling (LOCKED)
Three-layer model:
1. **SQL schema migrations:** Wrangler native (`wrangler d1 migrations create/apply`). Plain SQL files in `web/migrations/`. One initial migration with Better Auth tables (generated via `@better-auth/cli`) + `user_state`.
2. **Query layer:** Native D1 prepared statements. Centralize in `web/src/server/queries/*.ts`, one file per table. No ORM (5–10 queries total — ORM doesn't earn its keep). Kysely as a hedge if query count grows past ~20; not now.
3. **Blob schema migrations:** Pure-TS migrator in `engine/src/migrations/`. `migrateBlob(raw) → { data, migratedFrom: number | null }`. Runs on read; writes back through the GET handler if migration occurred (so client only ever sees post-migration version). Migrators are immutable once shipped — bugs fixed by appending new migrators.
4. **Deploy workflow:** manual `wrangler d1 migrations apply` for staging and production. Not part of `wrangler deploy` — finance app, eyes on every schema change.

### Self-review gotchas folded in
- GET-time migration write-back contract pinned (client never sees pre-migration version).
- Optimistic-concurrency UPDATE pattern made explicit (atomic, single statement, check `meta.changes`).
- Better Auth → Wrangler SQL pipeline flagged as "verify during implementation" — not yet confirmed working.
- Blob migrator must be exported from `@tractionfi/engine`.
- Field name standardized: `migratedFrom: number | null`.
- Local-dev gotcha: `wrangler d1 migrations apply --local` after every pull adding a migration. Document in README or wrap in a setup script.
- Blob migration policy: additive preferred; destructive changes require explicit deprecation cycle.

## Status Update

`PROJECT-STATUS.md` updated:
- Current Phase: **Tier 1 design locked; Tier 2 + spec writing next.**
- Open Items refreshed with current task list (Tier 2 gaps → PRD update → spec → writing-plans handoff).
- Implemented But Not Deployed remains empty — no code shipped this session.

## Open Threads (Next Steps)

**Top priority for next session:** resolve **Tier 2 UX gaps** as a group (email-verification UX, empty-state UX, complete-budget banner, observability/Sentry call). Then update PRD.md to v0.5 with all locked decisions, write the design spec to `docs/superpowers/specs/2026-05-19-tractionfi-v1-migration-design.md`, and hand off to the writing-plans skill.

**Locked-decision changes to apply when updating PRD:**
- Rename `interviews` → `user_state` throughout §9.4.
- Remove `results` and `status` columns from §9.4 schema.
- Add `version` integer column and document optimistic-concurrency contract.
- Drop FR-4d (or restate as engine-version-displayed-only).
- Mark §13 step 2 as ✅ completed.
- Add §9.5 (Migrations): Wrangler native + native D1 statements + blob migrator in engine.
- Add a v1.5 line under §10 (Out of scope) for snapshot history.

**Verify-during-implementation flag:** confirm `@better-auth/cli` emits Wrangler-compatible SQL for the D1 adapter. If it doesn't, we transcribe the schema by hand into `0001_initial.sql` — minor extra work, not a blocker.
