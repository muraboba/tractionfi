import type {
  AssetEntry,
  DebtEntry,
  ExpenseEntry,
  IncomeEntry,
  PaycheckData,
  UserData,
} from '../src/types'

export function makePaycheck(overrides: Partial<PaycheckData> = {}): PaycheckData {
  return {
    grossAmount: 4_000,
    netAmount: 3_000,
    contribution401k: 0,
    ytdContribution401k: 0,
    projected401kContribution: 0,
    contribution401kPercentage: 0,
    employerOffers401kMatch: false,
    employerMatchPercentage: 0,
    payFrequency: 'biweekly',
    ...overrides,
  }
}

export function makeExpense(overrides: Partial<ExpenseEntry> = {}): ExpenseEntry {
  return {
    id: overrides.id ?? `expense-${Math.random().toString(36).slice(2)}`,
    name: 'Rent',
    amount: 1_500,
    frequency: 'monthly',
    category: 'essential',
    ...overrides,
  }
}

export function makeAsset(overrides: Partial<AssetEntry> = {}): AssetEntry {
  return {
    id: overrides.id ?? `asset-${Math.random().toString(36).slice(2)}`,
    name: 'Savings',
    value: 0,
    category: 'cash',
    isEmergencyFund: false,
    ...overrides,
  }
}

export function makeDebt(overrides: Partial<DebtEntry> = {}): DebtEntry {
  return {
    id: overrides.id ?? `debt-${Math.random().toString(36).slice(2)}`,
    name: 'Credit Card',
    balance: 1_000,
    interestRate: 15,
    minimumPayment: 50,
    category: 'credit-card',
    ...overrides,
  }
}

export function makeIncome(overrides: Partial<IncomeEntry> = {}): IncomeEntry {
  return {
    id: overrides.id ?? `income-${Math.random().toString(36).slice(2)}`,
    name: 'Side gig',
    amount: 500,
    frequency: 'monthly',
    ...overrides,
  }
}

/**
 * A "healthy baseline" user: has income, expenses, and a designated emergency fund —
 * so Phase 1 (complete_budget) is satisfied. Individual tests adjust from here.
 */
export function makeUserData(overrides: Partial<UserData> = {}): UserData {
  return {
    paycheck: makePaycheck(),
    incomes: [],
    expenses: [makeExpense()],
    assets: [makeAsset({ name: 'Emergency Fund', value: 10_000, isEmergencyFund: true })],
    debts: [],
    ...overrides,
  }
}
