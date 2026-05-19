import { CURRENT_LIMITS } from './constants'
import { toMonthly, paycheckToMonthly, payPeriodsPerYear } from './frequency'
import { phase2StarterEmergencyFund } from './rules/phase2-starter-emergency-fund'
import { phase3EmployerMatch } from './rules/phase3-employer-match'
import { phase4aHighInterestDebt } from './rules/phase4a-high-interest-debt'
import { phase4bFullEmergencyFund } from './rules/phase4b-full-emergency-fund'
import { phase4cModerateInterestDebt } from './rules/phase4c-moderate-interest-debt'
import { phase5Retirement } from './rules/phase5-retirement'
import { phase6aHSA } from './rules/phase6a-hsa'
import { phase6bCollege } from './rules/phase6b-college'
import { phase6cLongTerm } from './rules/phase6c-long-term'
import type {
  Blocker,
  EngineOutput,
  EvaluateOptions,
  Milestone,
  MilestoneId,
  MilestoneStatus,
  RuleContext,
  RuleOutput,
  UserData,
} from './types'

export const ENGINE_VERSION = '0.2.0'

export * from './types'
export { CURRENT_LIMITS, THRESHOLDS } from './constants'
export { toMonthly, paycheckToMonthly, payPeriodsPerYear } from './frequency'
export {
  migrateBlob,
  emptyBlobV1,
  CURRENT_SCHEMA_VERSION,
  type CurrentBlob,
  type MigrateResult,
} from './migrations'

const RULES = [
  phase2StarterEmergencyFund,
  phase3EmployerMatch,
  phase4aHighInterestDebt,
  phase4bFullEmergencyFund,
  phase4cModerateInterestDebt,
  phase5Retirement,
  phase6aHSA,
  phase6bCollege,
  phase6cLongTerm,
] as const

function computeMetrics(userData: UserData) {
  const paycheckMonthly = paycheckToMonthly(userData.paycheck.netAmount, userData.paycheck.payFrequency)
  const otherIncomeMonthly = userData.incomes.reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0)
  const monthlyIncome = paycheckMonthly + otherIncomeMonthly

  const monthlyExpenses = userData.expenses.reduce((sum, e) => sum + toMonthly(e.amount, e.frequency), 0)

  const totalAssets = userData.assets.reduce((sum, a) => sum + a.value, 0)
  const totalDebts = userData.debts.reduce((sum, d) => sum + d.balance, 0)

  const emergencyFundBalance = userData.assets
    .filter((a) => a.isEmergencyFund)
    .reduce((sum, a) => sum + a.value, 0)

  const annualGrossIncome =
    userData.paycheck.grossAmount * payPeriodsPerYear(userData.paycheck.payFrequency)

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlyCashFlow: monthlyIncome - monthlyExpenses,
    totalAssets,
    totalDebts,
    netWorth: totalAssets - totalDebts,
    emergencyFundBalance,
    annualGrossIncome,
  }
}

function findBlockers(userData: UserData): Blocker[] {
  const blockers: Blocker[] = []

  const hasAnyIncome =
    userData.paycheck.grossAmount > 0 ||
    userData.paycheck.netAmount > 0 ||
    userData.incomes.length > 0
  if (!hasAnyIncome) {
    blockers.push({
      code: 'no_income',
      message: 'Add your paycheck — or other income on the Incomes tab.',
      tab: 'paycheck',
    })
  }

  if (userData.expenses.length === 0) {
    blockers.push({
      code: 'no_expenses',
      message: 'Add at least your essential monthly expenses.',
      tab: 'expenses',
    })
  }

  const hasCashAssets = userData.assets.some((a) => a.category === 'cash' && a.value > 0)
  const hasEFDesignated = userData.assets.some((a) => a.isEmergencyFund)
  if (hasCashAssets && !hasEFDesignated) {
    blockers.push({
      code: 'no_ef_designation',
      message: 'Mark which cash asset is your emergency fund.',
      tab: 'assets',
    })
  }

  return blockers
}

function buildBlockedMilestone(blockers: Blocker[]): Milestone {
  return {
    id: 'complete_budget',
    phase: 1,
    status: 'blocked',
    title: 'Complete your budget',
    description: 'Add the items below to start getting recommendations.',
    rationale:
      'The flowchart begins with a complete budget — income, essential expenses, and a designated emergency fund. Without these, downstream recommendations would be computed against zeros and produce misleading guidance.',
    data: { blockers },
  }
}

export function evaluate(userData: UserData, options: EvaluateOptions = {}): EngineOutput {
  const skipped = new Set<MilestoneId>(options.skippedMilestones ?? [])
  const metrics = computeMetrics(userData)
  const blockers = findBlockers(userData)

  if (blockers.length > 0) {
    const blockedMilestone = buildBlockedMilestone(blockers)
    return {
      engineVersion: ENGINE_VERSION,
      taxYear: CURRENT_LIMITS.taxYear,
      currentPriority: blockedMilestone,
      milestones: [blockedMilestone],
      blockers,
      metrics,
    }
  }

  const ctx: RuleContext = {
    userData,
    monthlyIncome: metrics.monthlyIncome,
    monthlyExpenses: metrics.monthlyExpenses,
    emergencyFundBalance: metrics.emergencyFundBalance,
    annualGrossIncome: metrics.annualGrossIncome,
  }

  const ruleOutputs: RuleOutput[] = RULES.map((rule) => rule(ctx))

  let foundActive = false
  const milestones: Milestone[] = ruleOutputs.map((output) => {
    let status: MilestoneStatus
    if (output.rawStatus === 'completed') {
      status = 'completed'
    } else if (output.rawStatus === 'not_applicable') {
      status = 'not_applicable'
    } else if (skipped.has(output.milestone.id)) {
      status = 'skipped'
    } else if (!foundActive) {
      status = 'active'
      foundActive = true
    } else {
      status = 'not_started'
    }
    return { ...output.milestone, status }
  })

  const currentPriority = milestones.find((m) => m.status === 'active') ?? null

  return {
    engineVersion: ENGINE_VERSION,
    taxYear: CURRENT_LIMITS.taxYear,
    currentPriority,
    milestones,
    blockers: [],
    metrics,
  }
}
