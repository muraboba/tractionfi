# PROJECT-STATUS.md — TractionFI

> Living status doc. The wrapup skill updates this at the end of each session.

## Purpose

Personal finance decision engine + web app implementing the US Personal Income Spending flowchart.

## Tech Stack

- TypeScript monorepo — engine (pure TS) + web (Next.js 16 / React 19 / Tailwind 4)
- Deploy target: Cloudflare Workers + Assets (via @opennextjs/cloudflare) + D1 + Better Auth

## Current Phase

**Phase 4 — Better Auth wiring + email-verification flow.** Phases 0–3 complete on `feat/v1-migration`. Engine at 0.2.0. D1 query layer + `user_state` GET/PUT API + blob migrator landed (commit `e80f5bb`). Auth stub returns null until Phase 4 wires Better Auth. **Before starting Phase 4:** set `RESEND_API_KEY` + `BETTER_AUTH_SECRET` via `wrangler secret put` (from `web/`).

## Last Changed

- 2026-05-18 (session E) — **Phase 3 implemented** (subagent-driven, two-stage review on `feat/v1-migration`, commit `e80f5bb`):
  - **engine/migrations/**: pure-TS blob migrator at `engine/src/migrations/` (`v1.ts` + `index.ts`). `CURRENT_SCHEMA_VERSION = 1`; identity migrator for v1 blobs (paycheck + 4 entry arrays + `settings.skippedMilestones`). `migrateBlob(raw)` returns `{ data, migratedFrom }`; passthrough on current-version blobs preserves reference identity by contract (callers can skip JSON.stringify when `migratedFrom === null`). Throws on unknown schema versions. Exported from `@tractionfi/engine`. 4 new tests in `engine/tests/migrations.test.ts` (56 engine tests total).
  - **web/server/queries/user_state.ts**: `getOrCreateUserState` INSERTs an empty v1 row on first read; on existing rows runs `migrateBlob` and writes back via the spec §2.4 optimistic-concurrency UPDATE before returning. Single bounded re-read on write-back race; throws if still stale (no unbounded recursion). `updateUserState` uses the same `UPDATE … WHERE user_id = ? AND version = ?` pattern; on `meta.changes === 0` returns 409-style `{ ok: false, conflict }` via plain SELECT (no INSERT side-effect on concurrent-delete races).
  - **web/app/api/user_state/route.ts**: GET + PUT handlers. NO `runtime = 'edge'` declaration — runs under Node.js compat per OpenNext. D1 binding accessed via `getCloudflareContext({ async: true }).env.DB`. Both handlers 401 when session is null or unverified.
  - **web/server/auth.ts**: minimal stub returning `null` until Phase 4. Has a TODO breadcrumb flagging the shape mismatch with Better Auth (`emailVerified: INTEGER` vs `emailVerifiedAt: string | null`).
  - **Vitest pool**: added `vitest@^4.1.6` + `@cloudflare/vitest-pool-workers@^0.16.6` to `web/`. Config is `.mts` (pool is ESM-only). Real Miniflare D1 with `applyD1Migrations` from `tests/setup.ts` via `vitest.provide('D1_MIGRATIONS', …)`. Test file seeds stub `user` rows to satisfy the FK constraint. 4 web tests cover: empty row on first read, idempotent re-read, version bump on update, 409 on stale expectedVersion.
  - **dashboard/page.tsx**: one-line surgical fix to render the engine 0.2.0 `Blocker[]` shape (`key={b.code}` / `{b.message}`). Pre-existing breakage from commit `a5ed389`.
- 2026-05-18 (session D) — **Phases 0–2 implemented** (subagent-driven on `feat/v1-migration`):
  - **Phase 0:** Committed scaffolding (PRD v0.5, design spec, implementation plan) to `main`; created `feat/v1-migration` branch.
  - **Phase 1:** Engine 0.2.0 — replaced `blockers: string[]` with `Blocker[]` (`code`, `message`, `tab`). `BlockerTab` union is 3 members (dropped dead `'incomes'`). New `engine/tests/blockers.test.ts` covers tab mapping + array-identity invariant. 52 tests pass.
  - **Phase 2:** Installed `@opennextjs/cloudflare` + Wrangler + Better Auth. Switched deploy target from archived `@cloudflare/next-on-pages` (static export) to `@opennextjs/cloudflare` (Workers + Assets). Dropped `output: "export"` from `next.config.ts`. Created single cloud D1 `tractionfi` (fff44e43-cb58-458e-b8e0-3dbd990f2579) — solo-minimal model, no staging concept. Migration `0001_initial.sql` applied to local and remote. `wrangler.toml` has no env stanzas.
  - **Architecture decision:** deploy target is Cloudflare Workers (not Pages). Custom domain + D1 + secrets all work identically; just a different Cloudflare product surface.
  - **Deferred to Phase 4 start:** Set `RESEND_API_KEY` + `BETTER_AUTH_SECRET` secrets via `wrangler secret put`.
- 2026-05-18 (session C) — **Tier 2 UX gaps resolved** (one-at-a-time lockdown with self-review on each item):
  - **Tier 2 #1 email-verification UX:** locked Option A (full lockout `/verify-pending` screen, middleware-enforced gate, `/verify?token` flow). No data entry possible while unverified — eliminates buffer-flush / cross-device sync edge cases.
  - **Tier 2 #2 empty-state UX:** locked — newly-verified user lands on Recommendations tab; empty-state IS the complete-budget banner. Card has deep-link CTAs per blocker. No first-run flag, no welcome modal, no tour.
  - **Tier 2 #3 complete-budget banner UX:** locked — engine 0.2.0 bumps `blockers: string[]` → `Blocker[] = { code, message, tab }`. Cross-tab "Setup: N left" header pill + small gear icon on Recommendations tab label when blocked. Card flips to normal active-milestone view when blockers clear.
  - **Tier 2 #4 observability:** locked Cloudflare-native only (Workers Logs + Logpush to R2 + Workers Alerts + Resend webhook mirror). No third-party APM in v1. Sentry deferred to v1.5 with explicit re-eval triggers. PII discipline written into NFR-8.
  - **PRD.md updated to v0.5** with all locked Tier 1 + Tier 2 decisions: renamed `interviews` → `user_state`, dropped `results`/`status` columns, added `version` integer + optimistic-concurrency contract, dropped FR-4d (no stored results to be stale), added FR-4e (structured blockers), added FR-17b (email-verification UX), added §4.5 (empty-state + complete-budget banner UX), rewrote NFR-8 (Cloudflare-native), added §9.5 (Migrations), marked §13 step 2 ✅, deferred snapshot history + pay-statement OCR to v1.5.
  - **Design spec written** at `docs/superpowers/specs/2026-05-19-tractionfi-v1-migration-design.md` (12 sections, engineer-facing technical contract).
  - **Implementation plan written** at `tasks/todo.md` (12 phases: repo prep → engine 0.2.0 → Cloudflare env + D1 → query layer + API + blob migrator → Better Auth + verify flow → dashboard rebuild → landing + settings → observability → E2E staging → design system pass → production cutover → cleanup → review).
  - **Late-session addition:** pay statement screenshot OCR / vision extraction explicitly deferred to v1.5 — added to PRD §10 and spec §8. Needs its own privacy-design pass for PII surface (SSN suffix, address, employer, account numbers) before implementation.
- 2026-05-18 (session B) — PRD review session. Identified gaps across 3 tiers. Locked Tier 1 #1 (data model) and Tier 1 #2 (migration tooling).
- 2026-05-18 (session A) — Project initialized via `init-project` skill.

## In Progress

Phase 4 — Better Auth wiring + email-verification flow. Start here next session. Before kicking off Phase 4 work, set `RESEND_API_KEY` + `BETTER_AUTH_SECRET` via `wrangler secret put` from `web/`.

## Implemented But Not Deployed

_Nothing yet._

## Implementation Notes

- 2026-05-18: Phase 3 — `@cloudflare/vitest-pool-workers@^0.16.6` requires `vitest@^4.1.0` peer; web/ runs vitest 4, engine/ stays on vitest 2. The pool is ESM-only — config must be `vitest.config.mts`. The `cloudflareTest` Vite plugin (NOT `defineWorkersConfig`) is the supported API in this version; use `defineConfig({ plugins: [cloudflareTest({ main, wrangler })] })`. globalSetup receives a `Vitest` instance from `vitest/node` and calls `vitest.provide('D1_MIGRATIONS', migrations)` so each test can `inject('D1_MIGRATIONS')` and pass to `applyD1Migrations(env.DB, migrations)`. Tests must seed stub `user` rows because `user_state.user_id` FKs to `user(id)`.
- 2026-05-18: Phase 3 — `user_state` SQL uses CURRENT_TIMESTAMP at INSERT/UPDATE time. The `created_at` and `updated_at` columns are TEXT (not DATE) per `0001_initial.sql`, which differs from Better Auth's DATE columns. Spec §2.1 specified TEXT for our application table; intentional.
- 2026-05-18: Phase 3 — `migrateBlob` reference-identity contract: when `migratedFrom === null`, the returned `data` is the SAME REFERENCE as the input. This is contractual, not incidental — do NOT wrap a future migrator in `structuredClone` for "safety" without auditing every caller for skipped serialization paths.
- 2026-05-18: Phase 2 — Better Auth schema generation: hand-transcribed because `@better-auth/cli generate` failed with `dialect.createDriver is not a function` — the SQLite dialect stub requires a live driver instance, not just `{ dialect: "sqlite", type: "sqlite" }`. Schema was verified directly against `@better-auth/core/dist/db/get-tables.mjs` and `better-auth/dist/db/get-migration.mjs`. Table names are singular (`user`, `session`, `account`, `verification`). Date fields use SQLite `DATE` type; booleans use `INTEGER`. Indexes on `session.userId`, `account.userId`, `verification.identifier` match what the CLI would have emitted.
- 2026-05-18: Phase 2 — `@cloudflare/next-on-pages` was archived Sept 2025. Switched to `@opennextjs/cloudflare` (Workers + Assets). Deploy target is now Cloudflare Workers, not Pages. Functionally equivalent — custom domain, D1, secrets work identically.
- 2026-05-18: Phase 2 — Solo-minimal D1 model: one cloud DB `tractionfi` for production; local dev uses `--local` mode (Wrangler local SQLite shadow). No staging DB. Phase 10 cutover = DNS flip only.
- 2026-05-18: Phase 2 — Better Auth schema hand-transcribed (CLI requires live SQLite driver, not just dialect stub). Verified against `@better-auth/core/dist/db/get-tables.mjs`. Table names are singular (`user`, not `users`). Date fields: SQLite `DATE` type. Booleans: `INTEGER`.
- 2026-05-18: Phase 4 note — Better Auth + OpenNext requires `async authBuilder()` singleton pattern. `getCloudflareContext()` is only available at request time; auth instance must be initialized inside a lazy singleton, not at module top-level. See `better-auth-cloudflare` OpenNext example.
- 2026-05-18: Phase 3 note — `user_state` API route handler uses `getCloudflareContext().env.DB` (not `process.env.DB`). No `export const runtime = 'edge'` on route files — Node.js compat mode is correct runtime.

## Open Items

- [x] **Phase 0** — scaffolding committed to `main`, `feat/v1-migration` branch active.
- [x] **Phase 1** — engine 0.2.0 with structured `Blocker[]` (commit `a5ed389`).
- [x] **Phase 2** — Cloudflare Workers + D1 wired. Single `tractionfi` DB. OpenNext adapter. Initial migration applied (commits `c998548`, `c9a9947`).
- [x] **Phase 3** — query layer + user_state GET/PUT API + blob migrator (commit `e80f5bb`). 56 engine + 4 web tests; clean typechecks.
- [ ] **Phase 4** — Better Auth + email verify flow. **Start here.** Before starting: set `RESEND_API_KEY` + `BETTER_AUTH_SECRET` via `wrangler secret put` (from `web/`). Resolve the auth-stub shape mismatch (`emailVerified: INTEGER` vs `emailVerifiedAt: string | null`) — see TODO in `web/src/server/auth.ts`.
- [ ] **Phases 5–7** — dashboard rebuild, landing/settings, observability.
- [ ] **Phase 8** — E2E verification (14-step manual checklist).
- [ ] **Phase 9** — `/ui-ux-pro-max` design system pass.
- [ ] **Phase 10–11** — production cutover + cleanup of v0 Worker + KV `USER_DATA`.
- [ ] **Spec drift:** design spec §2.5 still lists `BlockerTab` as 4-member union (includes `'incomes'`); code is now 3-member. Reconcile in Phase 12 cleanup.
- [ ] **Verify Workers Alerts thresholding** on Workers tier (Phase 7 step 7.5 — Axiom free tier is fallback).
