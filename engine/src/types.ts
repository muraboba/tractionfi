export type Phase = 1 | 2 | 3 | 4 | 5 | 6

export type PayFrequency = 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly'

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'

export interface PaycheckData {
  grossAmount: number
  netAmount: number
  contribution401k: number
  ytdContribution401k: number
  projected401kContribution: number
  contribution401kPercentage: number
  employerOffers401kMatch: boolean
  employerMatchPercentage: number
  payFrequency: PayFrequency
}

export interface IncomeEntry {
  id: string
  name: string
  amount: number
  frequency: Frequency
}

export type ExpenseCategory = 'essential' | 'discretionary'

export interface ExpenseEntry {
  id: string
  name: string
  amount: number
  frequency: Frequency
  category: ExpenseCategory
}

export type AssetCategory =
  | 'cash'
  | 'investments'
  | 'retirement'
  | 'property'
  | 'vehicle'
  | 'other'

export interface AssetEntry {
  id: string
  name: string
  value: number
  category: AssetCategory
  /**
   * FR-4b: User explicitly designates which asset(s) constitute their emergency
   * fund. No name-matching heuristics; this flag is the only source of truth.
   */
  isEmergencyFund: boolean
}

export type DebtCategory =
  | 'credit-card'
  | 'mortgage'
  | 'auto-loan'
  | 'student-loan'
  | 'personal-loan'
  | 'other'

export interface DebtEntry {
  id: string
  name: string
  balance: number
  /** Annual percentage rate as a percent (e.g., 7.5 means 7.5%). */
  interestRate: number
  minimumPayment: number
  category: DebtCategory
}

export type LongTermGoal = 'standard_retirement' | 'early_retirement' | 'near_term_goal'

export interface UserData {
  paycheck: PaycheckData
  incomes: IncomeEntry[]
  expenses: ExpenseEntry[]
  assets: AssetEntry[]
  debts: DebtEntry[]
  isSelfEmployed?: boolean
  hasHDHP?: boolean
  hasCollegeBoundChildren?: boolean
  longTermGoal?: LongTermGoal
}

export type MilestoneId =
  | 'complete_budget'
  | 'starter_emergency_fund'
  | 'employer_match'
  | 'high_interest_debt'
  | 'full_emergency_fund'
  | 'moderate_interest_debt'
  | 'retirement_15_percent'
  | 'hsa_contributions'
  | 'college_savings'
  | 'long_term_goals'

export type MilestoneStatus =
  | 'active'
  | 'completed'
  | 'not_applicable'
  | 'not_started'
  | 'skipped'
  | 'blocked'

export interface Milestone {
  id: MilestoneId
  phase: Phase
  status: MilestoneStatus
  title: string
  description: string
  rationale: string
  data: Record<string, unknown>
}

export type BlockerCode = 'no_income' | 'no_expenses' | 'no_ef_designation'
export type BlockerTab = 'paycheck' | 'expenses' | 'assets'

export interface Blocker {
  code: BlockerCode
  message: string
  tab: BlockerTab
}

export interface EngineOutput {
  engineVersion: string
  taxYear: number
  currentPriority: Milestone | null
  milestones: Milestone[]
  /** Structured blockers when Phase 1 inputs are missing. Empty when unblocked. */
  blockers: Blocker[]
  /** Derived metrics exposed for the UI summary section. */
  metrics: {
    monthlyIncome: number
    monthlyExpenses: number
    monthlyCashFlow: number
    totalAssets: number
    totalDebts: number
    netWorth: number
    emergencyFundBalance: number
    annualGrossIncome: number
  }
}

export interface EvaluateOptions {
  /** Milestones the user has explicitly skipped via the UI. */
  skippedMilestones?: MilestoneId[]
}

/** Internal: result of a single rule before the orchestrator assigns final status. */
export type RawStatus = 'completed' | 'not_applicable' | 'needs_action'

export interface RuleOutput {
  rawStatus: RawStatus
  milestone: Omit<Milestone, 'status'>
}

/** Internal: shared context passed to every rule. */
export interface RuleContext {
  userData: UserData
  monthlyIncome: number
  monthlyExpenses: number
  emergencyFundBalance: number
  annualGrossIncome: number
}
