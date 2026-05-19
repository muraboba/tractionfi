# TractionFI v1 Migration — Design Spec

**Status:** Locked, ready for implementation planning
**Date:** 2026-05-19
**Author:** murasaki35@gmail.com
**Source PRD:** [`PRD.md`](../../../PRD.md) v0.5
**Predecessor sessions:** [`sessions/session_summary_2026_05_18_b.md`](../../../sessions/session_summary_2026_05_18_b.md) (Tier 1), this session (Tier 2)

---

## 0. Purpose of this document

This spec captures **every locked design decision** for the v1 migration in one place, so the implementation plan (and the engineers running it) don't have to triangulate between PRD sections, session summaries, and chat history. The PRD is the long-form product doc; this spec is the engineer-facing technical contract.

**Migration goal:** rebuild the existing `tractionfi.com` v0 (Next.js + hand-rolled Worker + KV) onto Cloudflare Pages + D1 + Better Auth, deploy to `staging.tractionfi.com`, then cut over production. No real-user data migration required (v0 has no outside users).

---

## 1. Scope summary

| Layer | Decision |
|---|---|
| Engine | Pure-TS module in `engine/`. Bumped to **0.2.0** for `Blocker[]` change. |
| Web | Next.js 16 + React 19 + Tailwind 4 + shadcn/ui in `web/`. |
| Hosting | Cloudflare Pages. |
| Database | Cloudflare D1 (one DB per env: `staging`, `production`). |
| Auth | Better Auth with D1 adapter, HTTP-only cookies. |
| Email | Resend (existing `reset@tractionfi.com` sender preserved). |
| Observability | Cloudflare-native (Workers Logs + Logpush to R2 + Workers Alerts), no third-party APM. |
| Migrations | Wrangler native for SQL + pure-TS migrator in engine for the blob. |

Everything below expands these decisions.

---

## 2. Data model (locked)

### 2.1 Schema

```
users
  id               TEXT PRIMARY KEY    -- uuid
  email            TEXT UNIQUE NOT NULL
  password_hash    TEXT NOT NULL
  email_verified_at TEXT                -- ISO timestamp, NULL until verified
  created_at       TEXT NOT NULL
  updated_at       TEXT NOT NULL

sessions
  id          TEXT PRIMARY KEY
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
  expires_at  TEXT NOT NULL
  created_at  TEXT NOT NULL

user_state
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
  blob        TEXT NOT NULL              -- JSON; see §2.3
  version     INTEGER NOT NULL DEFAULT 0 -- optimistic-concurrency token
  created_at  TEXT NOT NULL
  updated_at  TEXT NOT NULL
```

Better Auth may require additional columns/tables (`accounts`, `verification`, etc.) — accept whatever `@better-auth/cli` emits. The `user_state` table is owned by us, not Better Auth.

### 2.2 What we deliberately do NOT have

- **No `results` column.** Engine recomputes on every load. Eliminates stale-cache concerns and "stored output uses old engine version" UX. Confirmed cheap: engine has no I/O, runs in < 5ms on typical UserData.
- **No `status` column** (in_progress / completed). The blob is always "live"; there is no completion event in the live-dashboard model.
- **No `user_state_snapshots` table** in v1. Snapshot history deferred to v1.5. When added, the existing `version` column becomes the snapshot key — non-breaking.
- **No separate `user_settings` table.** `skippedMilestones` lives in the blob. Expand only when settings count and unrelated-ness justifies it.

### 2.3 Blob shape

```ts
interface UserStateBlob {
  schemaVersion: number              // 1 in v1; bumped when blob shape changes
  userData: UserData                  // from @tractionfi/engine (paycheck, incomes, expenses, assets, debts)
  settings: {
    skippedMilestones: MilestoneId[]
  }
}
```

Initial schemaVersion is `1`. The blob is stored as a JSON string in D1; we `JSON.parse`/`JSON.stringify` at the query layer.

### 2.4 Optimistic concurrency contract

Every write to `user_state` is a single atomic SQL statement:

```sql
UPDATE user_state
SET blob = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
WHERE user_id = ? AND version = ?
```

The client sends the `version` it last read. The server checks `meta.changes` from the D1 response.

- `meta.changes === 1` → success. Return new `version` to client.
- `meta.changes === 0` → version mismatch. The API returns **HTTP 409 Conflict** with the current server `version` and `blob`. The client surfaces a "your data changed in another tab — reload to continue" banner and re-reads.

**Never last-write-wins by default.** The user must explicitly re-read and re-apply their change after a conflict.

**First save for a new user:** the API treats a missing `user_state` row as `version: 0`. The write becomes `INSERT INTO user_state ... ON CONFLICT(user_id) DO UPDATE SET ... WHERE user_state.version = 0`. (Or: the GET handler always pre-creates an empty row with `version: 0` so subsequent writes are pure UPDATEs. Pick one in implementation — both are correct.)

### 2.5 Engine output contract change (engine 0.2.0)

The engine's `blockers` field changes from `string[]` to a structured `Blocker[]`. This is a pre-1.0 minor bump because no live consumers or stored outputs exist yet.

```ts
export type BlockerCode = 'no_income' | 'no_expenses' | 'no_ef_designation'
export type BlockerTab = 'paycheck' | 'incomes' | 'expenses' | 'assets'

export interface Blocker {
  code: BlockerCode
  message: string   // human-readable, same content as the existing strings
  tab: BlockerTab   // which dashboard tab the user should visit to resolve this blocker
}

// Updated EngineOutput fields:
//   blockers: Blocker[]
//   currentPriority.data.blockers (when id === 'complete_budget'): Blocker[]
//   Both reference the same array.
```

The `complete_budget` milestone's `description` becomes a generic one-liner: `"Add the items below to start getting recommendations."` (The structured blockers carry per-item detail; description is just the card subtitle.)

Mapping from existing blockers in `engine/src/index.ts`:

| Existing string | New code | tab |
|---|---|---|
| "No income entered..." | `no_income` | `paycheck` |
| "No expenses entered..." | `no_expenses` | `expenses` |
| "You have cash assets but none are marked as your emergency fund..." | `no_ef_designation` | `assets` |

Tests in `engine/tests/` that assert blocker contents update accordingly.

---

## 3. Migration tooling (locked)

Three-layer model.

### 3.1 SQL schema migrations

- **Tool:** Wrangler native — `wrangler d1 migrations create/apply`.
- **Location:** `web/migrations/` containing plain SQL files (`0001_initial.sql`, etc.).
- **Initial migration:** `0001_initial.sql` contains the Better Auth schema (users, sessions, accounts, verification, …) + our `user_state` table.
- **Better Auth schema generation:** run `@better-auth/cli generate` and verify it emits Wrangler-compatible SQL for the D1 adapter. **Flagged risk:** if it emits Postgres-flavored SQL or non-D1 dialect, transcribe by hand. Minor extra work, not a blocker.
- **Apply workflow:**
  - Staging: `wrangler d1 migrations apply tractionfi-staging --remote`
  - Production: `wrangler d1 migrations apply tractionfi-production --remote` (manual, eyes on every change)
  - Local dev: `wrangler d1 migrations apply tractionfi-dev --local` after every `git pull` adding a migration. Wrap in `web/scripts/dev-setup.sh` or document in `web/README.md`.
- **Not part of `wrangler deploy`.** Schema changes never auto-apply on deploy. Finance app, human eyes required.

### 3.2 Query layer

- **Tool:** Native D1 prepared statements via the Workers `D1Database` binding.
- **Location:** `web/src/server/queries/*.ts`, one file per table (`users.ts`, `sessions.ts`, `user_state.ts`). Each file exports typed functions taking a `D1Database` arg.
- **No ORM in v1.** Estimated ~5–10 distinct queries across the app. ORM doesn't earn its keep at that scale.
- **Kysely as a hedge.** If query count crosses ~20 or we need composable query building, drop in Kysely with the D1 dialect. Not now.
- **Type safety:** queries return typed shapes derived from the SQL columns. Bundle a small `types.ts` in `web/src/server/queries/` for row shapes; resist generating from SQL until query count justifies it.

### 3.3 Blob schema migrations

- **Tool:** Pure-TS migrator in `engine/src/migrations/`.
- **Signature:**

  ```ts
  export function migrateBlob(raw: unknown): {
    data: UserStateBlob       // post-migration shape, always CURRENT_SCHEMA_VERSION
    migratedFrom: number | null  // original schemaVersion, or null if already current
  }
  ```

- **Composition:** version-N → N+1 migrators chain. Each migrator is a pure function `(blobAtN) → blobAtN+1`.
- **Where it runs:** **on every GET** in the `user_state` API. The handler:
  1. Reads row from D1.
  2. Calls `migrateBlob(JSON.parse(row.blob))`.
  3. If `migratedFrom !== null`, writes back through the same optimistic-concurrency UPDATE (using the version it just read) before returning to the client.
  4. Returns the post-migration blob + new version to the client.
- **Guarantee:** clients only ever see post-migration data.
- **Immutability:** shipped migrators are never edited. Bugs in a shipped migrator are fixed by appending a new migrator (N+1 → N+2 that undoes/repairs the bad state).
- **Export from `@tractionfi/engine`** so both the web server and any future client-side fallback can run identical logic.
- **Migration policy:** additive preferred (add new fields, deprecate old in place). Destructive changes (rename, remove) require leaving the old field readable for at least one release.

### 3.4 Deploy workflow summary

- Code: `git push` → Cloudflare Pages auto-deploy (staging on branch push, production on tag/merge — TBD in implementation).
- SQL schema: manual `wrangler d1 migrations apply`.
- Blob schema: automatic on next GET per user.

---

## 4. Auth and email-verification flow (locked)

### 4.1 Better Auth setup

- Self-hosted via the Better Auth Workers/D1 adapter.
- Email + password only in v1. Social login deferred to v1.5 (FR-19).
- Password rules: min 12 chars, breach-list check enabled (FR-17a). No complexity / expiry rules.
- Sessions: 30-day rolling, HTTP-only secure cookies, refreshed on use (FR-20).
- Argon2id password hashing (Better Auth default).

### 4.2 Signup → verification flow (FR-17b)

```
POST /api/auth/signup  (email, password)
  → 200 + sets session cookie (unverified state — email_verified_at IS NULL)
  → triggers Better Auth's "send verification email" through Resend
  → client redirects to /verify-pending

/verify-pending  (page)
  Card:
    "We sent a verification link to {email}."
    [Resend]   — POST /api/auth/send-verification (rate-limited per FR-23)
    [Use different email]  — logs out, redirects to /signup
    [Already verified?]    — GET /api/auth/session, if verified → /dashboard

middleware:
  any request to /dashboard* with session && email_verified_at == null
    → redirect to /verify-pending

/verify?token=...  (route)
  GET → Better Auth verifies token
       → on success: sets email_verified_at, ensures session cookie, redirects to /dashboard
       → expired token (Better Auth default ~24h): renders "Link expired" + resend CTA
       → invalid token: renders generic "Link no longer valid" + resend CTA
  works in any browser — token is source of truth, not the originating session
```

**Explicit non-feature:** no data entry, no D1 writes possible while `email_verified_at IS NULL`. Avoids buffer-flush + cross-device sync edge cases. Tradeoff: user can't preview the product before verifying. Accepted; they're past the landing page.

### 4.3 Password reset flow

- Existing v0 Resend template + sender (`reset@tractionfi.com`) preserved. Re-bind `RESEND_API_KEY` as a Worker secret on the new app.
- Better Auth handles token generation, hash, single-use, 1h expiry (FR-18).

### 4.4 Account deletion (FR-22)

- Typed-confirmation dialog ("type DELETE to confirm").
- Hard delete: `DELETE FROM users WHERE id = ?` cascades via FK to `sessions` and `user_state`.
- No retention window. Email reusable immediately.

### 4.5 Data export (FR-22a)

- One-click JSON download from settings.
- Server constructs `{ user: {…}, userData: {…}, settings: {…}, computedRecommendations: engine.evaluate(userData) }`.
- No email delivery.

---

## 5. Dashboard UX (locked)

### 5.1 Tab structure (unchanged from PRD §4.3)

Paycheck / Incomes / Expenses / Assets / Debts / Recommendations + always-visible summary sidebar (net worth, monthly cashflow, savings rate, debt-to-income).

### 5.2 Empty-state / first-run UX

- Newly-verified user lands on **Recommendations tab** by default.
- Tab renders the same complete-budget card as the not-empty blocked state — empty-state and blocked state are the same UI.
- Detection: purely derived from `engineOutput.currentPriority?.id === 'complete_budget'`. No first-run flag, no welcome modal, no guided tour.
- Sidebar metrics show `$0` / `—` placeholders, not hidden.

### 5.3 Complete-budget banner / blocked state

**Recommendations tab card (when blocked):**

```
┌─────────────────────────────────────────────┐
│ ⚙  Set up your budget to start              │
│                                              │
│ Add the items below to start getting        │
│ recommendations.                             │
│                                              │
│  ◯ Add your paycheck                         │
│    (or other income on the Incomes tab)     │
│                              [Go to Paycheck →]│
│                                              │
│  ◯ Add your monthly expenses                 │
│                              [Go to Expenses →]│
│                                              │
│  ◯ Mark which cash asset is your             │
│    emergency fund         [Go to Assets →]   │
└─────────────────────────────────────────────┘
```

- Title: "Set up your budget to start"
- Subtitle: from `engineOutput.currentPriority.description` (generic one-liner per §2.5).
- Checklist: one row per `Blocker` in `currentPriority.data.blockers`. Row shows `message`, deep-link button routes to `blocker.tab`.
- For `no_income`: row message mentions Incomes alternative, button routes to Paycheck. Accepted rough edge.
- The `no_ef_designation` row only appears once the user has at least one cash asset (engine logic — already implemented in `findBlockers()`).
- When a blocker clears, its row disappears in the next render. When `blockers.length === 0`, the card flips to the normal active-milestone view.

**Cross-tab indicators (visible across all tabs when blocked):**

- **Header pill:** `Setup: {N} left` where `N = engineOutput.blockers.length`. Neutral tone (warm gray / muted accent — not red). Click → routes to Recommendations tab. Hidden when `blockers.length === 0`. Remains visible on Recommendations tab too (harmless redundancy).
- **Tab-label gear icon:** small settings-gear icon on the Recommendations tab label only, when blocked. Reinforces "setup mode" framing over "error" framing.

### 5.4 Normal Recommendations tab (unblocked)

- Current-priority card: progress bar, $ amount, "why this matters," action steps. (Unchanged from PRD §4.4.)
- Roadmap below: full ordered phase list with completed / active / skipped / not-applicable / not-started statuses.
- Skip flow: confirmation dialog → toggles `settings.skippedMilestones` entry in the blob.
- Footer: `Engine version {ENGINE_VERSION} · Tax year {taxYear}` for transparency.

### 5.5 Data persistence

- Autosave on every change (debounced ~500ms per field; tune in implementation).
- Each autosave fires the optimistic-concurrency UPDATE (§2.4).
- On 409: show "your data changed in another tab — reload" banner; user clicks reload, client re-GETs.
- On 5xx / network: show "we can't save right now — your changes are held locally and will sync when service is restored" banner (NFR-9). Client retries with backoff; once 200 returns, banner clears.

---

## 6. Observability (locked, NFR-8 rewrite)

### 6.1 Stack

| Surface | Tool | Purpose |
|---|---|---|
| Recent logs (live) | Workers Logs (Cloudflare dashboard) | Primary debug surface. Source maps uploaded with the bundle. |
| Long-term logs | Workers Logpush → R2 | Persistent retention beyond Workers Logs window. |
| Local dev | `wrangler tail` | Tail local Worker output. |
| Alerts | Workers Alerts / Notifications | Invocation-error alerts to `murasaki35@gmail.com`. Threshold tuned during implementation. |
| Fallback alerts | Axiom free tier (if Cloudflare-native is insufficient) | Workers-native, no PII export. |
| Email delivery | Resend dashboard + Resend webhook → Worker log | Mirror failures into our log stream. |

### 6.2 Structured error log schema

Every error path emits a single JSON line:

```ts
interface ErrorLogEvent {
  event: 'error'
  route: string           // e.g., '/api/user_state', '/api/auth/signup'
  operation: string       // e.g., 'user_state.update', 'auth.send_verification', 'engine.evaluate'
  error_class: string     // constructor name / known error type
  user_id: string | null  // UUID, fine to log (already opaque)
  engine_version: string  // from ENGINE_VERSION
  timestamp: string       // ISO
  detail: string          // short human-readable; NEVER raw financial values, email, tokens
}
```

Required coverage:
- All D1 write failures (preserves the existing NFR-8 requirement).
- All auth flow errors (signup, login, verify, reset).
- All `engine.evaluate()` throws (shouldn't happen given pure functions, but defensive logging stays cheap).
- All Resend send failures (via the webhook).

### 6.3 PII discipline

- Never log `email`.
- Never log raw financial values (income, balances, APRs).
- Never log session tokens or password hashes.
- `user_id` (UUID) is fine — already opaque.
- `detail` field is human-readable but constrained: e.g., `"d1 update returned 0 changes (version mismatch)"`, never `"user 5b8e... has income 95000"`.

### 6.4 Sentry posture

- **Not in v1.** Privacy stance + low traffic + native source maps make the marginal value low and the misconfiguration risk non-zero.
- **Re-evaluation triggers for v1.5:**
  - A production bug we cannot resolve from Workers Logs + source maps within reasonable time, OR
  - MAU crosses ~1k (error grouping starts paying off).
- If added later: strict `beforeSend` scrubbing required, mirroring §6.3 rules.

---

## 7. Deployment topology (locked)

### 7.1 Environments

| Env | URL | D1 DB name | Cloudflare resources |
|---|---|---|---|
| Local dev | http://localhost:3000 | `tractionfi-dev` (D1 local) | None |
| Staging | https://staging.tractionfi.com | `tractionfi-staging` | Cloudflare Pages project, D1 binding |
| Production | https://tractionfi.com | `tractionfi-production` | Cloudflare Pages project, D1 binding |

### 7.2 Secrets (per env)

- `RESEND_API_KEY`
- `BETTER_AUTH_SECRET` (or whatever Better Auth requires)
- Any D1 binding handled by `wrangler.toml`, not a secret.

### 7.3 Cutover plan (from PRD §11)

1. Build + verify on `staging.tractionfi.com`.
2. Confirm v0 has no real outside-user data (verify before cutover).
3. Update DNS / Pages routes: new project takes `tractionfi.com/*`, old Worker removed from production.
4. Monitor for ~1 week. If stable, run cleanup (delete old Worker, delete `USER_DATA` KV namespace, archive `financial-assistant/`).
5. Do NOT delete: domain, DNS records for Resend (SPF/DKIM), Cloudflare account, Resend account/API key.

---

## 8. Out of scope (v1, explicit)

Carrying forward from PRD §10:

- Transaction-level budgeting / bank linking / Plaid
- Specific fund/ticker recommendations
- Tax filing / non-US tax regimes
- Couples / household joint planning (v2)
- Mobile native apps (web responsive)
- MFA (v1.5, FR-24)
- Real-time market data / portfolio rebalancing
- **Snapshot history of user financial state** (v1.5 — added via `user_state_snapshots` keyed by `version`)
- **Pay statement screenshot OCR / vision extraction to auto-fill the Paycheck tab** (v1.5 — needs its own privacy-design pass for the PII surface beyond gross/net: SSN suffix, address, employer, account numbers. v1.5 design must specify provider, what data leaves our system, retention/training policy, low-confidence/partial-extraction UX, review-before-save flow.)
- Social login (v1.5, FR-19)
- Application-side encryption of sensitive fields (OQ-3 — deferred until MFA at earliest)
- "Try a sample" demo dashboard (v1.5 if it slows launch — PRD §4.2)
- Export to PDF / shareable link (v1.5, FR-14)
- Sentry / third-party APM (v1.5 if triggered per §6.4)

---

## 9. Open implementation-time questions

These are explicit "verify during implementation, may surface gotchas":

1. **Does `@better-auth/cli generate` emit Wrangler-compatible D1 SQL?** If not, transcribe schema by hand into `0001_initial.sql`. Test during step 5 of PRD §13.
2. **Cloudflare Workers Alerts thresholding granularity on the Pages-Functions tier.** Test what's available; fall back to Axiom free tier if insufficient.
3. **First-save UPSERT vs. pre-create-on-GET** for `user_state`. Both correct; pick during implementation. Recommend pre-create-on-GET for symmetry — GET always returns a row, never 404.
4. **Autosave debounce timing.** Spec says ~500ms; tune against feel during implementation. Too short → excess writes; too long → 409s when the user tabs fast.
5. **Cloudflare Pages vs. `@cloudflare/next-on-pages` vs. static export + dedicated API Worker.** PRD §10b recommends static export + API Worker. Re-evaluate if Next.js 16 server-component needs push us toward `next-on-pages`. Pre-flag.

---

## 10. Test plan summary

Engine (Vitest, existing in `engine/tests/`):
- Existing phase tests stay green after the 0.2.0 `Blocker[]` change. Update blocker assertions.
- Add tests for each `BlockerCode` → `tab` mapping.

Web (TBD test framework — Vitest + React Testing Library likely):
- `/verify-pending` middleware redirect for unverified sessions.
- `/verify?token` happy path + expired + invalid.
- Empty-state Recommendations tab renders blocker checklist with correct deep-links.
- Header pill count matches `engineOutput.blockers.length`; hidden when zero.
- Optimistic-concurrency: two simulated tabs → second write returns 409.
- Autosave debounce smoke test.
- Account deletion cascades to `user_state`.
- Data export shape matches §4.5 of this spec.

E2E (manual on staging before cutover, per PRD §13 step 12):
- Full signup → verify → empty state → fill paycheck → blocker clears → fill expenses → blocker clears → see active milestone → log out → log in from another device → see same data → trigger 409 by editing in two tabs.

---

## 11. Out-of-scope-for-this-spec questions (flagged from PRD review, Tier 3)

These are not blockers for implementation but should be revisited:

- Web testing strategy beyond smoke tests
- Rate limiting beyond `/api/auth/*` (per FR-23)
- Milestone copy ownership (who writes the "why this matters" prose for each phase)
- a11y verification in CI (WCAG 2.1 AA target from NFR-4)
- Legal review owner (privacy policy, ToS, "not financial advice" disclaimer)
- D1 backup strategy (Cloudflare offers point-in-time recovery on paid tier; sufficient?)

---

## 12. Handoff

Next step: invoke `writing-plans` skill with this spec as input to produce a phased implementation plan, suitable for execution via `subagent-driven-development` or direct work.
