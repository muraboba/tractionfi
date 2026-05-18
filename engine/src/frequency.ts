import type { Frequency, PayFrequency } from './types'

const PAY_PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  'semi-monthly': 24,
  monthly: 12,
}

export function payPeriodsPerYear(frequency: PayFrequency): number {
  return PAY_PERIODS_PER_YEAR[frequency]
}

/** Convert an amount + frequency to a monthly-equivalent amount. */
export function toMonthly(amount: number, frequency: Frequency): number {
  switch (frequency) {
    case 'weekly':
      return (amount * 52) / 12
    case 'biweekly':
      return (amount * 26) / 12
    case 'monthly':
      return amount
    case 'quarterly':
      return amount / 3
    case 'annually':
      return amount / 12
  }
}

/** Convert a paycheck amount to monthly equivalent. */
export function paycheckToMonthly(amount: number, frequency: PayFrequency): number {
  switch (frequency) {
    case 'weekly':
      return (amount * 52) / 12
    case 'biweekly':
      return (amount * 26) / 12
    case 'semi-monthly':
      return amount * 2
    case 'monthly':
      return amount
  }
}
