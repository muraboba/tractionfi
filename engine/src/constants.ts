/**
 * IRS contribution limits and other year-dependent values.
 *
 * ⚠️ VERIFICATION REQUIRED: The numbers below were sourced from AI training data,
 * not from an authoritative IRS publication. Before launching to real users,
 * verify every value against:
 *   - 401(k)/IRA limits: https://www.irs.gov/retirement-plans/cola-increases-for-dollar-limitations-on-benefits-and-contributions
 *   - HSA limits: published annually in an IRS Revenue Procedure (search "Rev. Proc. HSA <year>")
 *
 * UPDATE POLICY: Each January (or whenever the IRS announces new figures), edit
 * the values below in place. We do not retain historical years — saved
 * recommendations are recomputed against current limits, which is the desired
 * behavior since users input current financial state, not historical state.
 */

export interface YearlyConstants {
  taxYear: number
  contribution401k: number
  contribution401kCatchUp50Plus: number
  contributionIRA: number
  contributionIRACatchUp50Plus: number
  contributionHSAIndividual: number
  contributionHSAFamily: number
  contributionHSACatchUp55Plus: number
}

export const CURRENT_LIMITS: YearlyConstants = {
  taxYear: 2026,
  contribution401k: 24_500,
  contribution401kCatchUp50Plus: 8_000,
  contributionIRA: 7_500,
  contributionIRACatchUp50Plus: 1_100,
  contributionHSAIndividual: 4_400,
  contributionHSAFamily: 8_750,
  contributionHSACatchUp55Plus: 1_000,
}

/** Engine-wide thresholds matching the canonical US Personal Income Spending Flowchart. */
export const THRESHOLDS = {
  /** Phase 4a: APR at or above this is "high interest." */
  HIGH_INTEREST_APR: 10,
  /** Phase 4c: APR at or above this (and below HIGH_INTEREST_APR) is "moderate interest." */
  MODERATE_INTEREST_APR: 4,
  /** Phase 2 starter emergency fund floor. */
  STARTER_EMERGENCY_FUND_MIN: 1_000,
  /** Phase 4b full emergency fund: number of months of expenses to target. */
  FULL_EMERGENCY_FUND_MONTHS: 6,
  /** Phase 5: target retirement savings rate as fraction of pre-tax income. */
  RETIREMENT_SAVINGS_RATE: 0.15,
} as const
