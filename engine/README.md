# @tractionfi/engine

Decision engine for TractionFI personal finance recommendations. Implements the US Personal Income Spending Flowchart as a pure TypeScript module — no I/O, no framework dependencies, fully unit-tested.

This package is consumed by the TractionFI web app (Next.js on Cloudflare Pages). The engine itself runs identically in the browser, in a Cloudflare Worker, or in a Node script.

## Usage

```ts
import { evaluate, ENGINE_VERSION, type UserData } from '@tractionfi/engine'

const userData: UserData = {
  paycheck: { /* … */ },
  incomes: [],
  expenses: [/* … */],
  assets: [/* must mark one as isEmergencyFund: true */],
  debts: [/* … */],
  hasHDHP: false,
  hasCollegeBoundChildren: false,
  longTermGoal: 'standard_retirement',
}

const result = evaluate(userData, {
  skippedMilestones: [],   // optional
})

console.log(result.currentPriority)   // the single "what to do next" milestone
console.log(result.milestones)        // all 9 phase milestones with statuses
console.log(result.blockers)          // any reasons the engine couldn't run
console.log(result.metrics)           // derived metrics for the UI summary
console.log(result.engineVersion)     // semver — stamp this on saved results
```

## What's in here

```
src/
  index.ts                  Main evaluate() entry point + ENGINE_VERSION
  types.ts                  Domain types (UserData, Milestone, EngineOutput, …)
  constants.ts              IRS contribution limits per tax year + APR thresholds
  frequency.ts              Helpers for monthly-equivalent conversions
  rules/
    phase2-starter-emergency-fund.ts   $1k or 1 month of expenses
    phase3-employer-match.ts           Capture full 401(k) match
    phase4a-high-interest-debt.ts      APR ≥ 10%, non-mortgage
    phase4b-full-emergency-fund.ts     3–6 months of expenses
    phase4c-moderate-interest-debt.ts  4% ≤ APR < 10%, non-mortgage
    phase5-retirement.ts               15% of pre-tax income
    phase6a-hsa.ts                     Max HSA if HDHP-eligible
    phase6b-college.ts                 529 / college savings
    phase6c-long-term.ts               Early-retire / near-term goal paths
tests/                                  Vitest suite, one file per phase
```

Phase 1 (complete budget) is not a rule — it's an upfront gate in the orchestrator (`src/index.ts`). If required inputs are missing, `evaluate()` returns early with a `blocked` milestone and a list of human-readable blockers in `result.blockers`.

## Design contract

- **Pure functions.** No `fetch`, no `localStorage`, no `Date.now()` outside the user-provided `taxYear` option. Same inputs → same outputs, every time.
- **Engine version stamped on every output.** When the engine changes rules or thresholds, saved historical results carry the version that produced them, so the UI can flag stale recommendations and offer to recompute.
- **Year-dependent values are isolated.** IRS limits live in `constants.ts` keyed by year. Updating annually is a single-file change.
- **Canonical flowchart thresholds.** High interest = APR ≥ 10%. Moderate = 4% ≤ APR < 10%, excluding mortgage. These are the canonical values from the US Personal Income Spending Flowchart, not the legacy 6%/4–5% values from the prior v0 app.
- **Emergency fund is an explicit flag.** Assets with `isEmergencyFund: true` are summed. No name-matching heuristics, no falling back to "all cash counts."

## Scripts

```
npm install      # install vitest + typescript
npm test         # run the full test suite once
npm run test:watch
npm run typecheck
```

## Updating IRS limits

Each January (or whenever the IRS announces new figures), edit `src/constants.ts` and update `CURRENT_LIMITS` in place. The engine always uses current-year limits — there is no historical lookup, because users input current financial state and want recommendations against current rules.

**⚠️ Before any production deploy, verify every number in `CURRENT_LIMITS` against the IRS source documents:**
- 401(k) / IRA limits: [IRS COLA increases page](https://www.irs.gov/retirement-plans/cola-increases-for-dollar-limitations-on-benefits-and-contributions)
- HSA limits: the annual IRS Revenue Procedure (search "Rev. Proc. HSA <year>")

The values shipped with this repo were generated from training data and have not been verified against IRS publications.

## Engine version policy

`ENGINE_VERSION` in `src/index.ts` is the semver string stamped on every output. Bump it when:

- **Patch**: bug fixes that don't change recommendations for any user.
- **Minor**: new milestones added, new computed fields, new not-applicable conditions — but existing users see the same active/completed states.
- **Major**: thresholds change, milestone IDs are renamed/removed, or the order of phases shifts — any change that could move an existing user from "completed" to "active" or vice versa.
