# PROJECT-STATUS.md — TractionFI

> Living status doc. The wrapup skill updates this at the end of each session.

## Purpose

Personal finance decision engine + web app implementing the US Personal Income Spending flowchart.

## Tech Stack

- TypeScript monorepo — engine (pure TS) + web (Next.js 16 / React 19 / Tailwind 4)
- Current deploy target: Cloudflare Workers + Assets (via @opennextjs/cloudflare) + D1 + Better Auth
- **Planned migration target (tasks/vercel-migration.md):** Vercel + Neon Postgres + Better Auth (vanilla Next, no OpenNext)

## Current Phase

**Vercel + Neon migration planning complete. Next: Phase 0 of `tasks/vercel-migration.md` (user account setup), then Phase 1 (Postgres schema) once Neon `DATABASE_URL` is provided. Dashboard Steps 5.4–5.6 are already complete on `main` (per-tab components, RecommendationsTab, sidebar empty states — committed 2026-05-22), along with Playwright e2e specs. Remaining product work (Phases 6–9: settings, observability, design pass) resumes after migration.**

## Last Changed

- **2026-07-07 (Session P)** — **Project review + repo reconciliation.** Fixed `web` test suite: `vitest.config.mts` had no `include` filter, so Playwright `e2e/*.spec.ts` files were collected into the Cloudflare workers pool and crashed it (`npm test` exited 1 since 2026-05-22 despite all 8 unit tests passing). Corrected this doc's stale claims (Steps 5.4–5.6 were already done). Reconciled local git with the rewritten public remote (2026-05-29 rewrite purged AI agent config files from history); `CLAUDE.md`, `web/CLAUDE.md`, `web/AGENTS.md`, and `tasks/` are now local-only (gitignored). Old local history preserved on `backup/pre-remote-rewrite`.
- **2026-06-02 (Session O)** — **Vercel + Neon migration plan locked.** Planning session only; no code changes.
- *All prior session summaries (Sessions A–N) have been archived to NotebookLM.*

## In Progress

- **Vercel + Neon migration** — plan locked in `tasks/vercel-migration.md`. Blocked on user: Neon account + pooled `DATABASE_URL`. Phase 1 (schema) starts once provided.
- **Phase 5 — dashboard rebuild: Steps 5.1–5.6 complete on `main`** (shell, hook, per-tab components, RecommendationsTab, sidebar empty states). Phases 6–9 (settings, observability, design pass) resume after migration.

## Implemented But Not Deployed

- **All Phase 4–5.6 code is on `main`** (theme toggle, landing redesign, shadcn, dashboard shell + real per-tab components, `use-engine-state`, verify-pending fixes). Production (tractionfi.com, Cloudflare) is still serving the **Phase-4-era build from session G** — verified 2026-07-07: no theme FOUC script, old `<title>` in served HTML.
- **Blocked:** deploy target is changing. Nothing deploys until Phase 9 of vercel-migration (or an optional final CF deploy if Phase 0 stays blocked much longer).

## Implementation Notes

- **Migration (session O)** — `api/check-verified/route.ts` has a silent boolean bug: `row?.emailVerified === 1` (D1 int) must become `=== true` (PG boolean) in Phase 5 of vercel-migration. Already flagged in the plan.
- **Migration (session O)** — Better Auth needs the Neon WebSocket `Pool` driver (not pure-HTTP `neon()`); Better Auth uses transactions, and the HTTP driver doesn't support them. Use `@neondatabase/serverless` with `PostgresDialect` in Kysely.
- **shadcn stack is base-nova → `@base-ui/react`, not Radix.** `import { ... } from "@base-ui/react/..."`. Check `node_modules/@base-ui/react/dist/docs/` if a component behaves unexpectedly.
- **`text-brand-foreground` is the CTA text token, not `text-accent-foreground`.** Dark `#0a0a10`, light `#fdfdfe`. Any `bg-brand` CTA must use `text-brand-foreground` for polarity flip.
- **Tailwind v4: no `cursor: pointer` on buttons by default.** Add `cursor-pointer` explicitly; `disabled:cursor-not-allowed` on disabled states.
- _Full historical implementation notes (Phases 1–5.3) archived to NotebookLM._

## Open Items

### Vercel + Neon Migration (`tasks/vercel-migration.md`)
- [ ] **Phase 0** — user: Neon + Vercel accounts, secrets into `.env.local`. **BLOCKED ON USER.**
- [ ] **Phase 1** — Postgres schema (Better Auth CLI + `user_state` JSONB on Neon)
- [ ] **Phase 2** — Shared `db.ts` Kysely module
- [ ] **Phase 3** — `auth.ts` rewrite (D1 → PG, `process.env`)
- [ ] **Phase 4** — Query layer rewrite (D1 API → Kysely)
- [ ] **Phase 5** — API routes (drop `getCloudflareContext`, fix boolean bug)
- [ ] **Phase 6** — Strip OpenNext/wrangler, `next build` clean
- [ ] **Phase 7** — Test harness rebuild (workers pool → node + Neon branch)
- [ ] **Phase 8** — Local E2E verify + autosave 500→1500ms
- [ ] **Phase 9** — Deploy to Vercel (user sets env vars)
- [ ] **Phase 10** — Decommission Cloudflare (user)
- [ ] **Phase 11** — Docs + memory cleanup

### Dashboard + Product (paused during migration)
- [x] **Phase 0–4** — complete (CF infra, auth, engine, UI all on `main`).
- [x] **Theme toggle + shadcn + dashboard shell** — on `main`, sessions J–M.
- [x] **`/verify-pending` UX polish** — session N.
- [x] **Phase 5.4** — per-tab components — done 2026-05-22.
- [x] **Phase 5.5** — `RecommendationsTab` (blocked + active states) — done 2026-05-22.
- [x] **Phase 5.6** — summary-sidebar empty states + Playwright e2e specs (signup-flow, multi-device, smokes) — done 2026-05-22.
- [ ] **Phases 6–9** — settings, observability, remaining E2E, design pass. Resumes after migration.
- [ ] **Spec drift:** `BlockerTab` 4-member union in design spec §2.5 vs. 3-member in code. Reconcile Phase 12.
