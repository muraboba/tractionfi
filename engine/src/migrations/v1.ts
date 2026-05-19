import type { UserData } from '../types'

export const SCHEMA_VERSION_V1 = 1

export interface BlobV1 {
  schemaVersion: 1
  userData: UserData
  settings: {
    skippedMilestones: string[]
  }
}

export function emptyBlobV1(): BlobV1 {
  return {
    schemaVersion: 1,
    userData: {
      paycheck: {
        grossAmount: 0,
        netAmount: 0,
        contribution401k: 0,
        ytdContribution401k: 0,
        projected401kContribution: 0,
        contribution401kPercentage: 0,
        employerOffers401kMatch: false,
        employerMatchPercentage: 0,
        payFrequency: 'biweekly',
      },
      incomes: [],
      expenses: [],
      assets: [],
      debts: [],
    },
    settings: { skippedMilestones: [] },
  }
}
