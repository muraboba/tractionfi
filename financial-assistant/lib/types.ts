// User data types
export interface PaycheckData {
  grossAmount: number
  netAmount: number
  contribution401k: number
  ytdContribution401k: number
  projected401kContribution: number
  contribution401kPercentage: number
  employerOffers401kMatch: boolean
  employerMatchPercentage: number
  ptoAdded: number
  ptoBalance: number
  projectedPtoBalance: number
  sickAdded: number
  sickBalance: number
  projectedSickBalance: number
  payPeriodsRemaining: number
  payFrequency: "weekly" | "biweekly" | "semi-monthly" | "monthly"
  lastPayDate: string // ISO date string
}

export interface IncomeEntry {
  id: string
  name: string
  amount: number
  frequency: string // weekly, biweekly, monthly, quarterly, annually
  isPaycheckEntry?: boolean // Flag to identify the special paycheck entry
}

export interface ExpenseEntry {
  id: string
  name: string
  amount: number
  frequency: string // weekly, biweekly, monthly, quarterly, annually
  category: string // essential, discretionary
}

export interface AssetEntry {
  id: string
  name: string
  value: number
  category: string // cash, investments, retirement, property, vehicle, other
}

export interface DebtEntry {
  id: string
  name: string
  balance: number
  interestRate: number
  minimumPayment: number
  category: string // credit-card, mortgage, auto-loan, student-loan, personal-loan, other
}

export interface UserData {
  paycheck: PaycheckData
  incomes: IncomeEntry[]
  expenses: ExpenseEntry[]
  assets: AssetEntry[]
  debts: DebtEntry[]
}

// Password reset token interface
export interface PasswordResetToken {
  token: string
  email: string
  createdAt: number // timestamp
  expiresAt: number // timestamp
}

// Default values
export const defaultPaycheckData: PaycheckData = {
  grossAmount: 0,
  netAmount: 0,
  contribution401k: 0,
  ytdContribution401k: 0,
  projected401kContribution: 0,
  contribution401kPercentage: 0,
  employerOffers401kMatch: false,
  employerMatchPercentage: 0,
  ptoAdded: 0,
  ptoBalance: 0,
  projectedPtoBalance: 0,
  sickAdded: 0,
  sickBalance: 0,
  projectedSickBalance: 0,
  payPeriodsRemaining: 0,
  payFrequency: "biweekly",
  lastPayDate: new Date().toISOString().split("T")[0],
}

export const defaultUserData: UserData = {
  paycheck: defaultPaycheckData,
  incomes: [],
  expenses: [],
  assets: [],
  debts: [],
}
