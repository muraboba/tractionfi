# TractionFI — Product Requirements Document

**Owner:** murasaki35@gmail.com
**Last updated:** 2026-05-19
**Status:** Draft v0.5

---

## 1. Overview

TractionFI is a personal finance guidance app that takes a user's financial inputs and outputs the **single next action** they should take, plus a prioritized roadmap of subsequent steps. The decision logic is driven by the US Personal Income Spending Flowchart (see `flowchart.jpeg`), a well-established 6-phase framework for ordering financial priorities.

The product replaces the cognitive load of reading a flowchart with a live, structured dashboard: a user fills in their financial state across organized tabs, the app continuously evaluates that state against the decision tree, and surfaces "what to do next with your next dollar."

### 1.1 Problem

Most people know they should budget, save, and invest — but don't know the correct **order** of operations. Should I pay off my 18% credit card or max my 401(k) match first? Build emergency fund before paying down debt, or after? Roth or Traditional? The flowchart answers all of this, but it's a static image that requires interpretation.

### 1.2 Solution

A web app that:
1. Collects structured financial inputs from the user.
2. Walks the inputs through the flowchart logic.
3. Outputs a personalized, ordered action plan with a clear "do this next" recommendation.
4. Explains the *why* behind each step so users build financial literacy.

### 1.3 Non-goals (v1)

- Not a budgeting tracker (no transaction ingestion, no Plaid integration).
- Not investment advice (no specific fund/ticker recommendations).
- Not a tax filing tool.
- Not multi-country — US-only logic in v1.

---

## 2. Target users

**Primary:** US adults aged 22–45 who earn income, have some debt and/or savings, and want clarity on financial priorities. Comfortable with the web, not necessarily financially literate.

**Secondary:** Financial-literacy educators and personal-finance content creators who want a tool to point readers/viewers to.

---

## 3. The Flowchart Logic (Source of Truth)

The app's decision engine implements the 6 phases of the US Personal Income Spending Flowchart:

### Phase 1 — Budget & reduce expenses, set realistic goals
- Create budget covering: rent/mortgage, food/groceries, essential items (power, water, heat, toiletries), income-earning expenses (transportation, internet/phone, anything required to keep earning).
- Pay non-essential bills in full (cable, internet, phone).
- Make minimum payments on all debts & loans (student loans, credit cards).
- Pay health costs (insurance, healthcare).

### Phase 2 — Build a small emergency fund
- Build to **$1,000 OR one month of expenses, whichever is greater**.
- Use a savings or checking account (liquid).

### Phase 3 — Employer-sponsored matching funds
- If employer offers a retirement match: contribute exactly the amount needed to capture the full match. **Not a dollar more** at this phase.

### Phase 4 — Pay down high/moderate interest debts

Aligned with the canonical flowchart:

- **High interest** = APR ≥ 10%. Pay off using Avalanche (highest rate first) or Snowball (smallest balance first) based on personal/psychological fit.
- Then grow emergency fund to **3–6 months of living expenses**.
- **Moderate interest** = APR ≥ 4% AND APR < 10%, **excluding mortgage**. Pay off using same Avalanche/Snowball choice.
- **Low interest** = APR < 4%, or any mortgage. No accelerated payoff needed at this phase; minimums only.

⚠️ The existing app currently uses 6% as the high-interest threshold and 4–5% (exact range) as moderate. v1 will realign to the canonical 10% / 4–10% thresholds when migrating the engine.

### Phase 5 — Save for retirement
- Evaluate Roth vs. Traditional IRA based on situation; max yearly contributions accordingly.
- Save for known large near-term expenses (college, certification, car needed for work) in a savings or checking account.
- Confirm **≥15% of pre-tax income** is going to retirement (across all accounts).
  - If not, and employer offers 401(k)-style plan: increase contributions until 15% is hit.
  - If self-employed: contribute to Individual 401(k), SEP-IRA, or SIMPLE IRA to reach 15%.
  - If not self-employed and already maxed tax-advantaged: use a taxable account to reach the goal.

### Phase 6 — Save more for retirement goals & advanced methods
- If on a qualified HDHP: max HSA contributions (treat as investable).
- If saving for children's college: evaluate 529 plan or similar; contribute accordingly.
- **Choose your path:**
  - **Early retirement:** max 401(k)/403(b)/employer plan, consider Mega Backdoor Roth, then taxable account.
  - **Immediate goals (<3–5 years):** keep funds in savings. **Goals >3–5 years out:** conservative stock/bond mix. (Down payments, vehicles, mortgage paydown, vacation funds.)

---

## 4. User flow

### 4.1 High-level

```
Landing (value prop) → Sign up / Log in → Dashboard (6 tabs + live summary + live recommendations) → All changes autosave to D1
```

Unauthenticated visitors hit a landing page that explains the product and offers signup/login. Authenticated users land in the dashboard, which is the entire app. Data entry and recommendations live side-by-side; there is no separate "interview" and "results" mode.

### 4.2 Landing page (`/`, unauthenticated)

Public-facing marketing page. Goals: explain the product in <10 seconds, drive signups.

Required surfaces:
- Hero: one-line value prop, screenshot or short looping demo, primary CTA "Get started free."
- 3–4 line explanation of what the app does and what flowchart it implements.
- Optional: "Try a sample" link that loads a read-only demo dashboard with prepopulated data (no signup required) — defer to v1.5 if it slows launch.
- Footer: privacy policy, terms, "not financial advice" disclaimer, source-of-truth link to the flowchart image.

### 4.3 Dashboard (`/dashboard`, authenticated)

A persistent, tab-based interface. Each tab is a domain area; recommendations update live as data changes.

| Tab | Purpose | Drives |
|---|---|---|
| **Paycheck** | Pay frequency, gross/net amount, 401(k) % + employer match %, PTO/sick balances | Phase 3 (match), Phase 5 (retirement %) |
| **Incomes** | All income sources beyond primary paycheck (side gigs, rentals, etc.) | Total income baseline |
| **Expenses** | Recurring expenses tagged essential vs discretionary, with frequency | Phase 1 budget, Phase 2/4 emergency fund target |
| **Assets** | Cash, investments, retirement accounts, property; with explicit "this is my emergency fund" designation | Phase 2/4 emergency fund detection, Phase 5 retirement total |
| **Debts** | Each debt with name, balance, APR, min payment, category (mortgage excluded from Phase 4) | Phase 4 high/moderate classification |
| **Recommendations** | Current priority milestone with explainer + roadmap of remaining phases | Output of the engine |

Sidebar / summary section: net worth, monthly cashflow, savings rate, debt-to-income — always visible regardless of active tab.

### 4.4 Recommendations output

The Recommendations tab displays:

- **Current priority:** the first incomplete phase, rendered as a detailed card (progress bar, $ amount, "why this matters," action steps).
- **Roadmap:** the full ordered list of phases, each marked completed / active / skipped / not-applicable / not-started.
- **Skip flow:** users may explicitly skip a milestone after a confirmation dialog. Skipped milestones are tracked in saved state and surfaced in the roadmap with a "revisit" affordance. (Inherited from existing app behavior; deliberate UX divergence from the flowchart — the flowchart has no skip concept.)
- **Caveats:** if any required input is missing (e.g., no expenses entered yet), surface a "complete this first" banner instead of a recommendation. See §5.1 FR-4a and §4.5 below.

### 4.5 Empty-state and complete-budget banner UX

When the engine returns the `complete_budget` blocked milestone (Phase 1 inputs missing), the UI behaves as follows:

**First-run / empty-state landing.** A newly-verified user with no `user_state` data lands on the **Recommendations tab**. The tab renders the same complete-budget card as the not-empty blocked state — empty-state IS the banner state. No first-run flag, no welcome modal, no guided tour. Rendering is purely derived from `engineOutput.currentPriority.id === 'complete_budget'`.

**Recommendations tab card (blocked state).**
- Title: "Set up your budget to start"
- Subtitle: a generic one-liner from the engine's `complete_budget` milestone `description` (e.g., "Add the items below to start getting recommendations.")
- Checklist: one row per `Blocker` in `currentPriority.data.blockers`. Each row shows the blocker's `message` and a "Go to {tab} →" deep-link button derived from `blocker.tab`.
- For `no_income`: the row message mentions both Paycheck and Incomes ("Add your paycheck — or other income on the Incomes tab"), but the button routes to Paycheck. Accepted rough edge for v1.
- When a blocker clears, its row disappears in the next render. When all blockers clear, the card flips to the normal active-milestone view.

**Cross-tab indicators (visible on tabs other than Recommendations).**
- **Header pill:** "Setup: N left" where `N = engineOutput.blockers.length`. Neutral tone (warm gray / muted accent), not red — this is "setup mode," not an error. Click → routes to Recommendations tab. Hidden when `blockers.length === 0`. Remains visible on the Recommendations tab too (harmless redundancy with the card).
- **Tab-label gear icon:** a small settings-gear icon on the Recommendations tab label only, when blocked. Reinforces the "setup mode" framing.

**Sidebar metrics in empty state.** Net worth, cashflow, savings rate, debt-to-income render as `$0` or `—` placeholders, not hidden. The user can see what TractionFI tracks even before filling anything in.

**Other tabs during empty state.** Render normally with empty add-item rows; only the cross-tab pill + gear icon indicate the blocked state.

---

## 5. Functional requirements

### 5.1 Decision engine

- **FR-1:** Engine must implement all 6 phases as deterministic rules. Same inputs → same output, every time.
- **FR-2:** Engine returns an ordered list of action items, each tagged with phase and rationale.
- **FR-3:** Engine identifies the **first incomplete action** as the "next step."
- **FR-4:** Engine handles missing/unknown inputs gracefully — flags them rather than guessing.
- **FR-4a (Phase 1 / incomplete budget):** If required Phase 1 inputs are missing — no income entered, no expenses entered, or no debts/assets ever populated — the engine returns a `"complete_budget"` recommendation pointing the user to fill in those tabs. It does NOT silently default to $0 and produce downstream recommendations against an empty budget.
- **FR-4b (Emergency fund detection):** Emergency fund balance comes from assets explicitly designated as `isEmergencyFund: true` (via a checkbox in the Assets tab), summed. No name-matching heuristics or cash-asset fallbacks. If the user has cash assets but none designated, the engine prompts them to designate one.
- **FR-4c (Yearly constants):** All year-dependent values (IRS 401k limit, IRA limit, HSA limits, catch-up amounts) live in a single `lib/engine/constants.ts` module keyed by tax year. The engine reads from the current year's constants. Updating annually is a single-file change.
- **FR-4d (Engine version surfaced in UI):** The engine module exports a semver string. The dashboard footer displays the current `ENGINE_VERSION` for transparency. **No stored results, so no "stale recompute" UX** — every page load recomputes against current `userData` using the current engine version. (Revised from earlier draft that proposed stamping results; results are not persisted in v1 — see §9.4.)
- **FR-4e (Structured blockers):** When the engine returns the `complete_budget` blocked milestone, both top-level `engineOutput.blockers` and `currentPriority.data.blockers` are typed as `Blocker[]` where `Blocker = { code, message, tab }`. `code ∈ { 'no_income' | 'no_expenses' | 'no_ef_designation' }`. `tab` is the dashboard tab the user should visit to resolve the blocker. The web app uses `tab` to render deep-link CTAs.
- **FR-5:** Decision logic must be unit-testable in isolation from the UI. (Pure functions, no I/O.) Coverage target: every flowchart phase has at least one test for the active state, completed state, and not-applicable state where relevant.

### 5.2 Interview UI

- **FR-6:** Multi-step form with progress indicator.
- **FR-7:** Inputs validated client-side (positive numbers, valid percentages, etc.).
- **FR-8:** User can navigate back and edit prior answers without losing state.
- **FR-9:** Adaptive — skip questions made irrelevant by prior answers.
- **FR-10:** In-progress interview state persisted to the user's account (server-side) so refresh/device-switch doesn't wipe input. Autosave on each step transition.

### 5.3 Results

- **FR-11:** Single, unambiguous "next step" displayed prominently.
- **FR-12:** Full roadmap visible below.
- **FR-13:** User can re-run the interview or edit answers and see updated results.
- **FR-14:** Optional export to PDF or shareable link (v1.5).

### 5.4 Education

- **FR-15:** Each step links to a short explainer (avalanche vs. snowball, Roth vs. Traditional, HSA basics, etc.).
- **FR-16:** Glossary tooltip on any jargon term in the UI.

### 5.5 Accounts & authentication

- **FR-17:** Email + password signup and login. Email verification required before first save.
- **FR-17a:** Passwords: minimum 12 characters, no other complexity requirements. Better Auth's breach-list check enabled (rejects passwords found in known compromise dumps). No periodic expiry.
- **FR-17b (Email-verification UX):** After signup, the user is redirected to `/verify-pending` — a full-page lockout screen with a single card: "We sent a verification link to {email}." The card offers **Resend** (rate-limited per FR-23), **Use different email** (logs out, returns to signup), and **Already verified?** (re-checks server state, useful when the link was clicked in another tab). Any request to `/dashboard*` from a session whose `email_verified_at` is null is intercepted by middleware and redirected to `/verify-pending`. Verification link → `/verify?token=...` → marks `email_verified_at`, signs the user in (sets cookie), redirects to `/dashboard`. The verify endpoint works in any browser, not just the one that signed up; the token is the source of truth, not the session cookie. Expired token (Better Auth default ~24h) shows "Link expired" with a resend CTA; invalid token shows a generic "Link no longer valid" with resend. **No data entry or D1 writes are possible while unverified** — eliminates buffer-flush and cross-device sync edge cases at the cost of the user not seeing the product before verification (acceptable; they're already past the landing page).
- **FR-18:** Password reset via emailed link to `reset@tractionfi.com`. Tokens are single-use, expire in 1 hour, and invalidate on use.
- **FR-19:** Optional: social login (Google, Apple) for v1.5. Email/password is sufficient v1.
- **FR-20:** Session management via secure HTTP-only cookies. Sessions valid for 30 days, refreshed on use.
- **FR-21:** Logged-in users can access their saved data from any device.
- **FR-22 (Account deletion):** Users can delete their account from settings. Behavior: immediate hard delete of all rows in `users`, `sessions`, and `interviews` for that user. No retention window in v1 — the action is irreversible and is preceded by a typed-confirmation dialog ("type DELETE to confirm"). Email address can be reused for a new signup immediately.
- **FR-22a (Data export):** Users can export all their data as a JSON file from settings. Covers paycheck, incomes, expenses, assets, debts, and computed recommendations. One-click download, no email delivery.
- **FR-23:** Rate limiting on auth endpoints (login, signup, reset). Implementation: Cloudflare Rate Limiting rules — 5 requests per minute per IP on `/api/auth/*`. Returns 429 with backoff message.
- **FR-24 (MFA):** Out of scope for v1. Targeted for v1.5 (TOTP). Documented here so users asking about it get a clear answer.

---

## 6. Non-functional requirements

- **NFR-1 (Privacy):** Financial data is stored only in TractionFI's database, scoped to the authenticated user. No third-party analytics on input or results pages. No selling, sharing, or training of data on outside services. Privacy policy explicit on this.
- **NFR-2 (Disclaimer):** Every results page must include a clear "not financial advice" disclaimer.
- **NFR-3 (Performance):** Interview-to-result latency <300ms end-to-end (computation is client-side; only persistence touches the network).
- **NFR-4 (Accessibility):** WCAG 2.1 AA. Keyboard navigable, screen-reader friendly.
- **NFR-5 (Mobile):** Fully responsive. Most users will arrive on mobile.
- **NFR-6 (Security):** Passwords hashed with Argon2id (or bcrypt as fallback). All traffic HTTPS (Cloudflare-managed cert). Financial data encrypted at rest at the storage layer (D1 default). Sensitive fields (income, debt balances) optionally encrypted application-side with a per-user key derived from password — decision deferred, see OQ-3.
- **NFR-7 (Data residency):** US-based storage to align with US-only product scope.
- **NFR-8 (Observability):** v1 uses Cloudflare-native observability — no third-party APM. Stack:
  - **Workers Logs** (Cloudflare dashboard) — primary live-debug and recent-log search surface. Source maps are uploaded with the bundle so stack traces resolve to original engine/web source.
  - **Workers Logpush to R2** — long-term persistent log retention beyond the Workers Logs dashboard window.
  - **`wrangler tail`** — local-dev tail.
  - **Workers Alerts / Notifications** — invocation-error alerts to `murasaki35@gmail.com`. Exact threshold is configured during implementation against whatever the Pages-Functions tier supports. If Cloudflare-native thresholding is insufficient, fallback is **Axiom free tier** (Workers-native, no PII export — preserves the no-third-party-APM stance for stack traces and request bodies).
  - **Structured error log schema** — every error path (all D1 write failures, all auth errors, all engine throw paths, all Resend send failures mirrored via Resend webhook) emits a fixed JSON line: `{ event: 'error', route, operation, error_class, user_id, engine_version, timestamp, detail }`. `detail` is a short string. **Never raw financial values, never `email`, never session tokens.** `user_id` (UUID) is fine — it's already an opaque identifier.
  - **Resend monitoring** — Resend's own delivery dashboard is the source of truth for email delivery health; the Resend webhook mirrors failure events into our Worker logs for unified search.
  - **Sentry deferred to v1.5.** Re-evaluation trigger: a production bug unresolvable from Workers Logs + source maps, OR MAU crosses ~1k where error grouping starts paying off. If added, requires strict `beforeSend` scrubbing of financial values, emails, and tokens.
- **NFR-9 (Graceful degradation):** If D1 is unavailable, the dashboard surfaces a clear "we can't save right now — your changes are held locally and will sync when service is restored" banner. The engine runs entirely client-side, so recommendations still compute on whatever data is loaded. If Resend is unavailable during password reset, the user sees "email service is temporarily unavailable — try again in a few minutes."

---

## 7. Edge cases & open questions

- **EC-1:** User with no income (unemployed, student) — engine should route to a simplified "stabilize first" path.
- **EC-2:** User with negative net worth and no emergency fund — current logic is correct (build $1k, then minimums, then attack high-interest debt) but the messaging needs to avoid feeling hopeless.
- **EC-3:** Mortgage handling — mortgage is excluded from "moderate interest" debt logic. Need to confirm UX makes this clear.
- **EC-4:** Variable income (freelancers, commission) — should we ask for an average or a low-month estimate? Lean conservative.
- **EC-5:** State-specific tax considerations (e.g., no-income-tax states changing Roth vs. Traditional math) — **out of scope v1**, flag as known limitation.
- **OQ-1:** Should v1 support couples/households filing jointly, or single-person only? **Recommendation: single-person v1**, household v2.
- **OQ-2:** Do we surface the actual flowchart image as a reference, or hide it behind "show me the source"?
- **OQ-3:** Should we add application-side encryption of sensitive fields (income, debt) with a key derived from the user's password? Pro: zero-knowledge, even DB breach leaks nothing useful. Con: lose password = lose data (no recovery), and breaks any future server-side analytics/aggregation. **Recommendation: skip v1, revisit if we add multi-factor auth.**
- **OQ-4:** Auth provider — Better Auth (self-hosted, free, aligned with privacy stance) vs. Clerk (managed, faster to ship, free to 10k MAU). **Recommendation: Better Auth.**

---

## 8. Success metrics

- **Activation:** % of landing-page visitors who complete the interview.
- **Comprehension:** % of users who report (via 1-question post-result survey) that the "next step" is clear and actionable.
- **Retention:** % of users who return within 30/60/90 days to re-run with updated numbers.
- **Reach:** organic shares / referrals per 100 completed interviews.

Target for v1 launch: ≥50% interview completion, ≥80% comprehension self-report.

---

## 9. Tech stack

### 9.1 Stack summary

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js + TypeScript + Tailwind | Familiar, great DX, deploys cleanly to Cloudflare Pages |
| Hosting | **Cloudflare Pages** | Domain already on Cloudflare; one ecosystem; free tier ample |
| Backend runtime | **Cloudflare Workers** (via Next.js on Pages) | Edge functions for API routes, no separate server to manage |
| Database | **Cloudflare D1** | See §9.2 |
| Auth | **Better Auth** with D1 adapter | See §9.3 |
| Decision engine | Pure TypeScript module, no framework deps | Unit-testable with Vitest, runs identically client-side or in a Worker |
| Email (verification, password reset) | Resend or Cloudflare Email Routing + Workers | Cheap, simple, reliable |
| Analytics | None v1, optional self-hosted Plausible later | Privacy stance |

### 9.2 Why D1 over Cloudflare KV and Firestore

| Need | KV | Firestore | **D1** |
|---|---|---|---|
| Strong consistency (user saves, immediately re-reads) | ❌ eventual (~60s) | ✅ | ✅ |
| Native to Cloudflare ecosystem | ✅ | ❌ (Google Cloud) | ✅ |
| Query capability (e.g., "all my interviews over time") | ❌ key-value only | ✅ | ✅ SQL |
| Free tier sufficient for v1 | ✅ | ✅ | ✅ (5 GB, 5M reads/day, 100K writes/day) |
| Single ecosystem (one dashboard, one bill) | ✅ | ❌ | ✅ |
| Fits "small structured JSON per user" workload | ⚠️ workable but wrong tool | ✅ | ✅ |

**Verdict: D1.** KV's eventual consistency is the dealbreaker — "I saved my data, why is it gone after I refreshed?" is a confidence-destroying bug for a finance app. Firestore works technically but pulls us out of the Cloudflare ecosystem for no benefit on a workload this small and this US-centric.

### 9.3 Auth: Better Auth over Clerk

**Better Auth** is recommended because:
- Self-hosted — no third-party sees user emails or auth events, aligned with NFR-1.
- Native D1/SQLite adapter, runs in Workers.
- No per-MAU pricing — free forever, scales with our infra cost only.
- Modern API, framework-agnostic, ergonomic.

**Clerk** is the fallback if we want to ship in days, not weeks. Tradeoff: every user's email and login event flows through Clerk; free up to 10k MAU then ~$25/mo per 1k MAU. Acceptable but inconsistent with our privacy posture.

### 9.4 Data model

```
users
  id (uuid, pk)
  email (unique)
  password_hash
  email_verified_at
  created_at
  updated_at

sessions
  id (uuid, pk)
  user_id (fk)
  expires_at
  created_at

user_state
  user_id (uuid, pk, fk → users.id)
  blob (json — { schemaVersion, userData, settings: { skippedMilestones } })
  version (integer — optimistic-concurrency token; incremented on every write)
  created_at
  updated_at
```

**One mutable row per user.** No history table in v1. The engine recomputes recommendations on every load, so there is **no `results` column** — eliminates stale-cache concerns and the "stored output uses old engine version" UX entirely.

**Optimistic concurrency contract.** Every write is an atomic SQL statement of the form:

```sql
UPDATE user_state
SET blob = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
WHERE user_id = ? AND version = ?
```

The client sends the version it last read. The server checks `meta.changes` from the D1 response; if `0`, the version did not match (another tab/device wrote concurrently) and the API returns **HTTP 409 Conflict** with the current server version and blob. The client surfaces a "your data changed in another tab — reload to continue" banner and re-reads. Last-write-wins is never the default — the user must explicitly accept by re-reading and re-applying their change.

**Settings live in the blob**, not a separate `user_settings` table. v1 has only `skippedMilestones`; expanding to a real settings table only when justified by multiple unrelated settings.

**Blob shape (TypeScript):**

```ts
{
  schemaVersion: number          // bumped when blob shape changes; drives the migrator
  userData: UserData              // from @tractionfi/engine — paycheck, incomes, expenses, assets, debts
  settings: {
    skippedMilestones: MilestoneId[]
  }
}
```

**Snapshot history deferred to v1.5.** No `user_state_snapshots` table in v1. When added in v1.5, the `version` column doubles as the snapshot key — non-breaking. Aligns with NFR-1 (don't store data the product doesn't actively use).

### 9.5 Migrations

Three-layer migration model:

1. **SQL schema migrations (D1 tables).** Wrangler native — `wrangler d1 migrations create/apply`. Plain SQL files in `web/migrations/`. One initial migration (`0001_initial.sql`) covering the Better Auth schema + `user_state`. Better Auth schema is generated via `@better-auth/cli` if it emits Wrangler-compatible SQL; otherwise transcribed by hand into the same file. (Verify during implementation — flagged in PROJECT-STATUS.md open items.)

2. **Query layer.** Native D1 prepared statements, centralized in `web/src/server/queries/*.ts`, one file per table. No ORM in v1 — query count is ~5–10, an ORM doesn't earn its keep at that scale. **Kysely as a hedge** if query count grows past ~20.

3. **Blob schema migrations (the JSON inside `user_state.blob`).** Pure-TS migrator in `engine/src/migrations/`. Signature:

   ```ts
   migrateBlob(raw: unknown): { data: BlobV<N>, migratedFrom: number | null }
   ```

   Runs on every GET. If the read blob's `schemaVersion < CURRENT_SCHEMA_VERSION`, the migrator chains version-N → N+1 migrators and returns the migrated blob with `migratedFrom` set to the original version. **The GET handler writes the migrated blob back through the same optimistic-concurrency UPDATE** before returning to the client, so the client only ever sees post-migration data. Migrators are **immutable once shipped** — bugs in a shipped migrator are fixed by appending a new migrator (version N+1 → N+2), never by editing the old one. The migrator is exported from `@tractionfi/engine` so both the web server and any future client-side fallback can run identical logic.

   **Migration policy:** additive changes preferred (add new fields, deprecate old ones in place). Destructive changes (renaming, removing) require an explicit deprecation cycle — leave the old field readable for at least one release.

4. **Deploy workflow.** SQL migrations are applied manually via `wrangler d1 migrations apply <db> --remote` for staging and production. **Not wired into `wrangler deploy`** — this is a finance app, every schema change gets human eyes. Local dev: `wrangler d1 migrations apply <db> --local` after every pull that adds a migration; wrap in a setup script or document prominently in `web/README.md`.

---

## 10. Out of scope (explicit)

- Transaction-level budgeting or bank-account linking.
- Specific investment recommendations (funds, tickers, allocations beyond "conservative stock/bond mix").
- Tax filing or tax-optimization beyond Roth vs. Traditional framing.
- Non-US tax regimes.
- Couples/household joint planning (v2).
- Mobile native apps (web responsive is sufficient v1).
- Multi-factor authentication (v1.5, see FR-24).
- Bank-account linking, Plaid integration, or transaction import.
- Real-time market data, portfolio rebalancing, or fund recommendations.
- **Snapshot history of user financial state (v1.5).** The `user_state` row is mutable, last-write-wins (after concurrency check). No "see how my plan evolved over time" view in v1 — added in v1.5 via a `user_state_snapshots` table keyed by the existing `version` column. Aligns with NFR-1: don't store data the product doesn't actively use.
- **Pay statement screenshot OCR / vision extraction to auto-fill the Paycheck tab (v1.5).** Out of v1 because it adds a vision-API dependency and a PII surface (full pay statement contents — SSN suffix, address, employer, sometimes account numbers) that needs its own privacy-design pass against NFR-1. v1 ships with manual entry only. v1.5 design must specify: which provider, what data leaves our system, retention/training policy with the provider, low-confidence/partial-extraction UX, and review-before-save flow.

---

## 10b. Migration from existing app

A working v0 of TractionFI already exists at `tractionfi.com`, built as Next.js + a hand-rolled Cloudflare Worker + KV. We are not starting fully from scratch — we are migrating the parts that work onto a secure, scalable backend.

### Keep as-is

- **Domain types** ([financial-assistant/lib/types.ts](financial-assistant/lib/types.ts)) — `PaycheckData`, `IncomeEntry`, `ExpenseEntry`, `AssetEntry`, `DebtEntry`, `UserData`. Stable, well-shaped.
- **Tab UI structure** — Paycheck / Incomes / Expenses / Assets / Debts / Recommendations + summary sidebar. This is a better UX than the linear-interview model originally sketched in §4 of v0.1 — the user can fill data in any order and immediately see results.
- **Recommendation engine** ([financial-assistant/components/tabs/recommendations-tab.tsx](financial-assistant/components/tabs/recommendations-tab.tsx)) — emergency fund logic, 401(k) match math, debt classification, milestone progression, skip flow. Move thresholds to the canonical 10% / 4–10%, otherwise keep.
- **Resend email integration + reset email template** — the sending sender `reset@tractionfi.com` and the HTML template stay. Re-add `RESEND_API_KEY` as a secret on the new Worker.
- **shadcn/ui + Tailwind setup**, component primitives in `components/ui/`.

### Adapt

- **Frontend auth flow** — swap `localStorage`-backed tokens for HTTP-only secure cookies. The `lib/auth.ts` / `lib/api.ts` modules get rewritten to talk to the new auth endpoints and remove all token-in-localStorage code.
- **Dashboard data loading** — `lib/data.ts` and the dashboard load/save effects get repointed at the new D1-backed API.

### Replace entirely

- **`worker.js`** → new typed backend (TypeScript + Hono on Cloudflare Workers) with proper route handlers.
- **KV `USER_DATA`** → Cloudflare D1 with the schema from §9.4. The "all users in one key" pattern in the current worker has a write race condition and won't scale.
- **Unsigned base64 session tokens** → Better Auth sessions stored in D1 with HTTP-only cookie delivery.
- **SHA-256 password hashing** → Argon2id (Better Auth default).
- **Static-export + Workers Assets** → either keep static export + dedicated API Worker, or move to `@cloudflare/next-on-pages` for SSR. Recommendation: keep static export for now (simpler, faster), revisit if we need server components.

### Update §4 (user flow) accordingly

The linear "interview" model in §4 of earlier drafts is superseded by the existing tab-based dashboard model. v1 user flow is:

```
Landing → Sign up / Log in → Dashboard (6 tabs + live summary + live recommendations) → All changes autosave to D1
```

---

## 11. Deployment strategy: staging route first

To avoid downtime on the existing app while we rebuild, we deploy the new version to a staging route and only swap production once it works end-to-end.

### Phase A — Build in parallel
- New Worker deployed to `staging.tractionfi.com/*` (new Cloudflare Worker, new D1 database, new KV-free).
- Existing app keeps running at `tractionfi.com/*` untouched.
- Build, test, dogfood the new app on the staging subdomain.

### Phase B — Cutover
- Update DNS / Worker routes: new Worker takes `tractionfi.com/*`, old Worker removed from production.
- (No user data migration needed in v1 since the current app has no real outside users — confirm before cutover.)

### Phase C — Cleanup (after stable on production for ~1 week)
Delete the old Cloudflare resources to avoid clutter and accidental edits:

**Delete:**
1. Worker `personal-finance-worker` — Cloudflare dashboard → Workers & Pages → personal-finance-worker → Manage → Delete. (Or `wrangler delete personal-finance-worker`.)
2. KV namespace `USER_DATA` (id `026e48cfe49f4e65a853400cda9ec5df`) — Workers & Pages → KV → ⋯ → Delete.
3. The local `financial-assistant/` directory can be archived or removed once everything we need has been migrated.

**Keep (do NOT delete):**
- Domain `tractionfi.com` and its zone configuration.
- All DNS records that make Resend work: SPF (`TXT v=spf1 …`), DKIM (`CNAME`s with `resend._domainkey` or similar), and any MX records you added for it.
- Cloudflare account.
- Resend account and API key (we'll re-bind it as a Worker secret on the new app).

---

## 12. Design phase timing

The existing app uses default shadcn/ui styling — functional but generic. For a finance product where trust is a major conversion factor, we want a deliberate visual identity.

**Recommended sequencing:**

1. Migration phase 1: ship the new auth + dashboard skeleton on staging using **default shadcn styles** (no design work yet). Goal: prove the backend works end-to-end.
2. Once the skeleton works, invoke **`/ui-ux-pro-max`** to establish the design system: palette, typography pairing, component patterns, motion language. Output is a DESIGN.md / spec we apply to subsequent work.
3. Migration phase 2: re-skin the tab UIs and add polish (the summary section, recommendation cards, progress bars) using the new design system.
4. Optional later pass: `/frontend-design` for engineering polish on specific high-traffic surfaces (landing page, signup flow).

Running design skills before any code exists wastes effort. Running them after everything is built makes retrofitting expensive. After the skeleton works is the sweet spot.

---

## 13. Next steps

1. ✅ Review and approve this PRD (v0.5).
2. ✅ **Extract the recommendation engine into a standalone pure-TS module with unit tests.** Done — `engine/` package shipped at version 0.1.0 with all 6 phase rules, canonical 10% / 4–10% thresholds, year-dependent constants isolated in `engine/src/constants.ts`, `complete_budget` blocked-milestone state (FR-4a), explicit emergency fund detection (FR-4b), engine version surfaced via `ENGINE_VERSION` export. Vitest coverage in `engine/tests/`.
3. **Bump engine to 0.2.0** — add structured `Blocker[]` type (FR-4e) replacing the existing `blockers: string[]` and `data.blockers: string[]`. Update tests. (Minor bump rationale: pre-1.0, no live consumers, recommendations unchanged.)
4. Scaffold the new app: Next.js 16 + React 19 + TypeScript + Tailwind 4 + shadcn/ui in `web/` (already partly in place). Wire the workspace dep on `@tractionfi/engine`.
5. Set up the staging Cloudflare environment: Cloudflare Pages on `staging.tractionfi.com`, new D1 database, secrets (`RESEND_API_KEY`, auth secret). Apply initial SQL migration (§9.5).
6. Wire up Better Auth + D1: signup, login, password reset (using existing Resend template + sender), email verification (FR-17b: `/verify-pending` lockout, `/verify?token` flow, middleware gate), sessions via HTTP-only cookies.
7. Implement the `user_state` query layer (§9.4) with the optimistic-concurrency contract. Implement the blob migrator scaffolding (§9.5) with `schemaVersion = 1` as the initial version.
8. Port the dashboard tabs to the new app. Repoint data load/save at the D1-backed API. Add the explicit `isEmergencyFund` flag to asset entries. Implement the empty-state + complete-budget banner UX (§4.5): header pill, Recommendations-tab gear icon, blocker checklist card with deep-link CTAs.
9. Build the landing page (§4.2) — value prop, signup CTA, footer with privacy/ToS/disclaimer.
10. Build settings: account deletion (FR-22) and data export (FR-22a).
11. Wire up observability (NFR-8): structured error log schema, Workers Logpush to R2, Workers Alerts on invocation errors, source maps in bundle, Resend webhook → Worker log mirror.
12. Verify end-to-end on staging: signup → `/verify-pending` → click verify link → `/dashboard` empty state → fill paycheck → blocker clears → fill expenses → blocker clears → see active milestone → log out → log in from another device → see same data → trigger 409 conflict by editing in two tabs.
13. Invoke `/ui-ux-pro-max` to establish the design system. Apply it.
14. Cutover: swap the production route from old Worker to new Worker.
15. (After ~1 week stable) Run the cleanup checklist in §11 Phase C.
