# PROJECT-STATUS.md — TractionFI

> Living status doc. The wrapup skill updates this at the end of each session.

## Purpose

Personal finance decision engine + web app implementing the US Personal Income Spending flowchart.

## Tech Stack

- TypeScript monorepo — engine (pure TS) + web (Next.js 16 / React 19 / Tailwind 4)
- Deploy target: Cloudflare Workers + Assets (via @opennextjs/cloudflare) + D1 + Better Auth

## Current Phase

**Design lockdown complete — ready to begin implementation.** PRD at v0.5, design spec written at [docs/superpowers/specs/2026-05-19-tractionfi-v1-migration-design.md](docs/superpowers/specs/2026-05-19-tractionfi-v1-migration-design.md), implementation plan written at [tasks/todo.md](tasks/todo.md) with 12 phases + ~80 bite-sized steps. Next session begins Phase 0 (repo prep) via subagent-driven execution.

## Last Changed

- 2026-05-18: Phase 2 follow-up — consolidated to solo-minimal D1 model. Dropped tractionfi-dev and tractionfi-staging cloud DBs; created tractionfi (database_id fff44e43-cb58-458e-b8e0-3dbd990f2579) as the single production DB. Local dev uses Wrangler's --local mode against the same name. No [env.staging] stanza in wrangler.toml. Migration 0001_initial.sql applied to both remote and local.
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

Phase 3 — query layer + API routes. Phase 2 complete (D1 provisioned, migration applied to local + remote; solo-minimal model).

## Implemented But Not Deployed

_Nothing yet._

## Implementation Notes

- 2026-05-18: Phase 2 — Better Auth schema generation: hand-transcribed because `@better-auth/cli generate` failed with `dialect.createDriver is not a function` — the SQLite dialect stub requires a live driver instance, not just `{ dialect: "sqlite", type: "sqlite" }`. Schema was verified directly against `@better-auth/core/dist/db/get-tables.mjs` and `better-auth/dist/db/get-migration.mjs`. Table names are singular (`user`, `session`, `account`, `verification`). Date fields use SQLite `DATE` type; booleans use `INTEGER`. Indexes on `session.userId`, `account.userId`, `verification.identifier` match what the CLI would have emitted.
- 2026-05-18: Phase 2 — `db:migrate:staging` script requires `--env staging` flag (not just `--remote`) because `tractionfi-staging` is declared under `[env.staging]` in `wrangler.toml`. Updated script accordingly.
- 2026-05-18: Phase 2 — Switched deploy target from Cloudflare Pages (`@cloudflare/next-on-pages`, archived Sept 2025) to Cloudflare Workers + Assets (`@opennextjs/cloudflare`). Dropped `output: "export"` from `next.config.ts` to enable route handlers and Better Auth server-side.

## Open Items

- [x] **Phase 0 of `tasks/todo.md` — repo prep.** Done — `feat/v1-migration` branch active.
- [x] **Phase 1 — engine 0.2.0 bump** (structured `Blocker[]`). Done (commit f19cca7).
- [x] **Phase 2 — Cloudflare env + D1 provisioning.** Done — two D1 DBs, wrangler.toml, OpenNext config, initial migration applied to local + staging.
- [ ] **Phases 3–7** — query layer, Better Auth + verify, dashboard rebuild, landing/settings, observability.
- [ ] **Phase 8** — E2E verification on staging (14-step manual checklist).
- [ ] **Phase 9** — `/ui-ux-pro-max` design system pass.
- [ ] **Phase 10–11** — production cutover + cleanup of v0 Worker + KV `USER_DATA`.
- [ ] Verify Cloudflare Workers Alerts thresholding granularity on the Pages-Functions tier (Phase 7 step 7.5 — fallback is Axiom free tier).
