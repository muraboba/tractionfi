import { describe, it, expect } from 'vitest'
import { evaluate } from '../src/index'
import { makeAsset, makePaycheck, makeUserData } from './fixtures'

// A user with all three blocker conditions: no income, no expenses, cash without EF.
function tripleBlocked() {
  return makeUserData({
    paycheck: makePaycheck({ grossAmount: 0, netAmount: 0 }),
    incomes: [],
    expenses: [],
    assets: [makeAsset({ name: 'Checking', value: 5_000, category: 'cash', isEmergencyFund: false })],
  })
}

describe('Blocker shape', () => {
  it('maps each code to the correct tab', () => {
    const result = evaluate(tripleBlocked())
    const byCode = Object.fromEntries(result.blockers.map((b) => [b.code, b.tab]))
    expect(byCode.no_income).toBe('paycheck')
    expect(byCode.no_expenses).toBe('expenses')
    expect(byCode.no_ef_designation).toBe('assets')
  })

  it('top-level blockers and currentPriority.data.blockers reference the same array', () => {
    const result = evaluate(tripleBlocked())
    expect(result.currentPriority?.data.blockers).toBe(result.blockers)
  })
})
