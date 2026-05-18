"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserData } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface SummarySectionProps {
  userData: UserData
}

export default function SummarySection({ userData }: SummarySectionProps) {
  // Calculate total monthly income
  const calculateMonthlyIncome = (income: any): number => {
    switch (income.frequency) {
      case "weekly":
        return (income.amount * 52) / 12 // 52 weeks per year / 12 months
      case "biweekly":
        return (income.amount * 26) / 12 // 26 pay periods per year / 12 months
      case "monthly":
        return income.amount // Already monthly
      case "quarterly":
        return income.amount / 3 // 4 quarters per year / 12 months = 1/3 per month
      case "annually":
        return income.amount / 12 // 1 per year / 12 months
      default:
        return income.amount
    }
  }

  const totalMonthlyIncome = userData.incomes.reduce((sum, income) => sum + calculateMonthlyIncome(income), 0)

  // Calculate total monthly expenses
  const calculateMonthlyExpense = (expense: any): number => {
    switch (expense.frequency) {
      case "weekly":
        return (expense.amount * 52) / 12 // 52 weeks per year / 12 months
      case "biweekly":
        return (expense.amount * 26) / 12 // 26 pay periods per year / 12 months
      case "monthly":
        return expense.amount // Already monthly
      case "quarterly":
        return expense.amount / 3 // 4 quarters per year / 12 months = 1/3 per month
      case "annually":
        return expense.amount / 12 // 1 per year / 12 months
      default:
        return expense.amount
    }
  }

  const totalMonthlyExpenses = userData.expenses.reduce((sum, expense) => sum + calculateMonthlyExpense(expense), 0)

  // Calculate monthly cash flow
  const monthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses

  // Calculate total assets
  const totalAssets = userData.assets.reduce((sum, asset) => sum + asset.value, 0)

  // Calculate total debts
  const totalDebts = userData.debts.reduce((sum, debt) => sum + debt.balance, 0)

  // Calculate net worth
  const netWorth = totalAssets - totalDebts

  // Calculate debt-to-income ratio
  const debtToIncomeRatio =
    totalMonthlyIncome > 0
      ? (userData.debts.reduce((sum, debt) => sum + debt.minimumPayment, 0) / totalMonthlyIncome) * 100
      : 0

  // Format pay frequency for display
  const formatPayFrequency = (frequency: string): string => {
    switch (frequency) {
      case "weekly":
        return "Weekly"
      case "biweekly":
        return "Bi-Weekly"
      case "semi-monthly":
        return "Semi-Monthly"
      case "monthly":
        return "Monthly"
      default:
        return frequency
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`rounded-lg p-4 ${monthlyCashFlow >= 0 ? "bg-green-50" : "bg-red-50"}`}>
            <p className="text-sm font-medium text-gray-500">Monthly Cash Flow</p>
            <p className={`text-2xl font-bold ${monthlyCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(monthlyCashFlow)}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Income:</span> {formatCurrency(totalMonthlyIncome)}
              </div>
              <div>
                <span className="text-gray-500">Expenses:</span> {formatCurrency(totalMonthlyExpenses)}
              </div>
            </div>
          </div>

          <div className={`rounded-lg p-4 ${netWorth >= 0 ? "bg-green-50" : "bg-red-50"}`}>
            <p className="text-sm font-medium text-gray-500">Net Worth</p>
            <p className={`text-2xl font-bold ${netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(netWorth)}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Assets:</span> {formatCurrency(totalAssets)}
              </div>
              <div>
                <span className="text-gray-500">Debts:</span> {formatCurrency(totalDebts)}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-100 p-4">
            <p className="text-sm font-medium text-gray-500">Debt-to-Income Ratio</p>
            <p className="text-2xl font-bold">{debtToIncomeRatio.toFixed(2)}%</p>
            <p className="text-xs text-gray-500">
              {debtToIncomeRatio < 36
                ? "Healthy (under 36%)"
                : debtToIncomeRatio < 43
                  ? "Manageable (36-43%)"
                  : "High (over 43%)"}
            </p>
          </div>

          {userData.paycheck.grossAmount > 0 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-100 p-4">
                <p className="text-sm font-medium text-gray-500">401k Contribution</p>
                <p className="text-2xl font-bold">{userData.paycheck.contribution401kPercentage.toFixed(2)}%</p>
                <p className="text-xs text-gray-500">
                  Projected Year-End: {formatCurrency(userData.paycheck.projected401kContribution)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-100 p-4">
                <p className="text-sm font-medium text-gray-500">Pay Schedule</p>
                <p className="text-lg font-semibold">{formatPayFrequency(userData.paycheck.payFrequency)}</p>
                <p className="text-xs text-gray-500">
                  {userData.paycheck.payPeriodsRemaining} pay periods remaining this year
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
