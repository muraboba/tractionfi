"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { InfoIcon, AlertCircle, DollarSign, TrendingUp, SkipForward, AlertTriangle } from "lucide-react"
import type { UserData, DebtEntry } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface RecommendationsTabProps {
  userData: UserData
}

// Define a type for tracking milestone status
type MilestoneStatus = "not_started" | "active" | "completed" | "skipped"

// Define a type for milestone IDs
type MilestoneId =
  | "emergency_fund"
  | "401k_match"
  | "high_interest_debt"
  | "full_emergency_fund"
  | "moderate_interest_debt"
  | "max_retirement"

export default function RecommendationsTab({ userData }: RecommendationsTabProps) {
  // State for emergency fund recommendation
  const [emergencyFundRecommendation, setEmergencyFundRecommendation] = useState<{
    currentAmount: number
    recommendedAmount: number
    monthlyExpenses: number
    progress: number
    hasEmergencyFund: boolean
    isSufficient: boolean
  }>({
    currentAmount: 0,
    recommendedAmount: 0,
    monthlyExpenses: 0,
    progress: 0,
    hasEmergencyFund: false,
    isSufficient: false,
  })

  // State for 401k match recommendation
  const [matchRecommendation, setMatchRecommendation] = useState<{
    currentContributionPercentage: number
    employerMatchPercentage: number
    isMaximizingMatch: boolean
    annualLostMatch: number
    perPaycheckIncrease: number
    isApplicable: boolean
  }>({
    currentContributionPercentage: 0,
    employerMatchPercentage: 0,
    isMaximizingMatch: false,
    annualLostMatch: 0,
    perPaycheckIncrease: 0,
    isApplicable: false,
  })

  // State for high-interest debt recommendation
  const [debtRecommendation, setDebtRecommendation] = useState<{
    hasHighInterestDebt: boolean
    highInterestDebts: DebtEntry[]
    totalHighInterestDebt: number
    highestInterestRate: number
    highestInterestDebt: DebtEntry | null
    isApplicable: boolean
  }>({
    hasHighInterestDebt: false,
    highInterestDebts: [],
    totalHighInterestDebt: 0,
    highestInterestRate: 0,
    highestInterestDebt: null,
    isApplicable: false,
  })

  // State for moderate-interest debt recommendation
  const [moderateDebtRecommendation, setModerateDebtRecommendation] = useState<{
    hasModerateInterestDebt: boolean
    moderateInterestDebts: DebtEntry[]
    totalModerateInterestDebt: number
    isApplicable: boolean
  }>({
    hasModerateInterestDebt: false,
    moderateInterestDebts: [],
    totalModerateInterestDebt: 0,
    isApplicable: false,
  })

  // State to track the current financial milestone
  const [currentMilestone, setCurrentMilestone] = useState<MilestoneId>("emergency_fund")

  // State to track skipped milestones
  const [skippedMilestones, setSkippedMilestones] = useState<MilestoneId[]>([])

  // State to track milestone statuses
  const [milestoneStatuses, setMilestoneStatuses] = useState<Record<MilestoneId, MilestoneStatus>>({
    emergency_fund: "active",
    "401k_match": "not_started",
    high_interest_debt: "not_started",
    full_emergency_fund: "not_started",
    moderate_interest_debt: "not_started",
    max_retirement: "not_started",
  })

  // State to track if the user is confirming a skip
  const [confirmingSkip, setConfirmingSkip] = useState(false)

  // Calculate monthly expenses
  const calculateMonthlyExpenses = (): number => {
    return userData.expenses.reduce((total, expense) => {
      switch (expense.frequency) {
        case "weekly":
          return total + (expense.amount * 52) / 12
        case "biweekly":
          return total + (expense.amount * 26) / 12
        case "monthly":
          return total + expense.amount
        case "quarterly":
          return total + expense.amount / 3
        case "annually":
          return total + expense.amount / 12
        default:
          return total + expense.amount
      }
    }, 0)
  }

  // Find emergency fund asset
  const findEmergencyFund = (): number => {
    // Look for assets with "emergency" in the name (case insensitive)
    const emergencyFundAssets = userData.assets.filter((asset) => asset.name.toLowerCase().includes("emergency"))

    // If found, return the total value
    if (emergencyFundAssets.length > 0) {
      return emergencyFundAssets.reduce((total, asset) => total + asset.value, 0)
    }

    // If no specific emergency fund, look for cash assets as a fallback
    const cashAssets = userData.assets.filter((asset) => asset.category === "cash")
    if (cashAssets.length > 0) {
      return cashAssets.reduce((total, asset) => total + asset.value, 0)
    }

    return 0
  }

  // Generate emergency fund recommendation
  useEffect(() => {
    const monthlyExpenses = calculateMonthlyExpenses()
    const currentEmergencyFund = findEmergencyFund()

    // Recommended amount is the greater of $1,000 or one month's expenses
    const recommendedAmount = Math.max(1000, monthlyExpenses)

    // Calculate progress percentage (cap at 100%)
    const progress = Math.min(100, (currentEmergencyFund / recommendedAmount) * 100)

    // Determine if the emergency fund is sufficient
    const isSufficient = currentEmergencyFund >= recommendedAmount

    setEmergencyFundRecommendation({
      currentAmount: currentEmergencyFund,
      recommendedAmount,
      monthlyExpenses,
      progress,
      hasEmergencyFund: currentEmergencyFund > 0,
      isSufficient,
    })
  }, [userData.assets, userData.expenses])

  // Generate 401k match recommendation
  useEffect(() => {
    const paycheck = userData.paycheck

    // Only generate recommendation if employer offers a match
    if (paycheck.employerOffers401kMatch && paycheck.employerMatchPercentage > 0) {
      const currentContributionPercentage = paycheck.contribution401kPercentage
      const employerMatchPercentage = paycheck.employerMatchPercentage

      // Check if user is maximizing the match
      const isMaximizingMatch = currentContributionPercentage >= employerMatchPercentage

      // Calculate the annual lost match if not maximizing
      let annualLostMatch = 0
      let perPaycheckIncrease = 0

      if (!isMaximizingMatch && paycheck.grossAmount > 0) {
        // Calculate how much match is being left on the table
        const matchPercentageDifference = employerMatchPercentage - currentContributionPercentage
        const annualSalary = calculateAnnualSalary(paycheck)

        // Calculate annual lost match
        annualLostMatch = (matchPercentageDifference / 100) * annualSalary

        // Calculate per-paycheck increase needed to maximize match
        perPaycheckIncrease = (matchPercentageDifference / 100) * paycheck.grossAmount
      }

      setMatchRecommendation({
        currentContributionPercentage,
        employerMatchPercentage,
        isMaximizingMatch,
        annualLostMatch,
        perPaycheckIncrease,
        isApplicable: true,
      })
    } else {
      setMatchRecommendation({
        ...matchRecommendation,
        isApplicable: false,
      })
    }
  }, [userData.paycheck])

  // Analyze user's debt for high-interest recommendations
  useEffect(() => {
    // Define what counts as "high interest" (typically above 6%)
    const HIGH_INTEREST_THRESHOLD = 6.0

    // Filter debts with interest rates above the threshold
    const highInterestDebts = userData.debts.filter((debt) => debt.interestRate > HIGH_INTEREST_THRESHOLD)

    // Check if there are any high-interest debts
    const hasHighInterestDebt = highInterestDebts.length > 0

    // Calculate total high-interest debt
    const totalHighInterestDebt = highInterestDebts.reduce((sum, debt) => sum + debt.balance, 0)

    // Find the debt with the highest interest rate
    let highestInterestRate = 0
    let highestInterestDebt: DebtEntry | null = null

    if (hasHighInterestDebt) {
      highInterestDebts.forEach((debt) => {
        if (debt.interestRate > highestInterestRate) {
          highestInterestRate = debt.interestRate
          highestInterestDebt = debt
        }
      })
    }

    // Update the debt recommendation state
    setDebtRecommendation({
      hasHighInterestDebt,
      highInterestDebts,
      totalHighInterestDebt,
      highestInterestRate,
      highestInterestDebt,
      isApplicable: true, // This recommendation is always applicable, but content changes
    })
  }, [userData.debts])

  // Analyze user's debt for moderate-interest recommendations
  useEffect(() => {
    // Define what counts as "moderate interest" (typically 4-5%)
    const MODERATE_INTEREST_MIN = 4.0
    const MODERATE_INTEREST_MAX = 5.0

    // Filter debts with interest rates in the moderate range, excluding mortgage
    const moderateInterestDebts = userData.debts.filter(
      (debt) =>
        debt.interestRate >= MODERATE_INTEREST_MIN &&
        debt.interestRate <= MODERATE_INTEREST_MAX &&
        debt.category !== "mortgage",
    )

    // Check if there are any moderate-interest debts
    const hasModerateInterestDebt = moderateInterestDebts.length > 0

    // Calculate total moderate-interest debt
    const totalModerateInterestDebt = moderateInterestDebts.reduce((sum, debt) => sum + debt.balance, 0)

    // Update the debt recommendation state
    setModerateDebtRecommendation({
      hasModerateInterestDebt,
      moderateInterestDebts,
      totalModerateInterestDebt,
      isApplicable: true, // This recommendation is always applicable, but content changes
    })
  }, [userData.debts])

  // Determine the current financial milestone based on user data and skipped milestones
  useEffect(() => {
    // Create a new statuses object to track milestone statuses
    const newStatuses: Record<MilestoneId, MilestoneStatus> = {
      emergency_fund: "not_started",
      "401k_match": "not_started",
      high_interest_debt: "not_started",
      full_emergency_fund: "not_started",
      moderate_interest_debt: "not_started",
      max_retirement: "not_started",
    }

    // Mark skipped milestones
    skippedMilestones.forEach((milestone) => {
      newStatuses[milestone] = "skipped"
    })

    // Check if emergency fund goal is met
    if (emergencyFundRecommendation.isSufficient) {
      newStatuses.emergency_fund = "completed"
    } else if (!skippedMilestones.includes("emergency_fund")) {
      newStatuses.emergency_fund = "active"
      setCurrentMilestone("emergency_fund")
      setMilestoneStatuses(newStatuses)
      return
    }

    // Check 401k match if emergency fund is completed or skipped
    if (matchRecommendation.isApplicable) {
      if (matchRecommendation.isMaximizingMatch) {
        newStatuses["401k_match"] = "completed"
      } else if (!skippedMilestones.includes("401k_match")) {
        newStatuses["401k_match"] = "active"
        setCurrentMilestone("401k_match")
        setMilestoneStatuses(newStatuses)
        return
      }
    } else {
      // If not applicable, mark as completed to move to next step
      newStatuses["401k_match"] = "completed"
    }

    // Check high interest debt if previous steps are completed or skipped
    if (debtRecommendation.hasHighInterestDebt) {
      if (!skippedMilestones.includes("high_interest_debt")) {
        newStatuses.high_interest_debt = "active"
        setCurrentMilestone("high_interest_debt")
        setMilestoneStatuses(newStatuses)
        return
      }
    } else {
      // If no high interest debt, mark as completed
      newStatuses.high_interest_debt = "completed"
    }

    // If all previous steps are completed or skipped, move to full emergency fund
    if (!skippedMilestones.includes("full_emergency_fund")) {
      newStatuses.full_emergency_fund = "active"
      setCurrentMilestone("full_emergency_fund")
      setMilestoneStatuses(newStatuses)
      return
    }

    // If full emergency fund is completed or skipped, check moderate interest debt
    if (moderateDebtRecommendation.hasModerateInterestDebt) {
      if (!skippedMilestones.includes("moderate_interest_debt")) {
        newStatuses.moderate_interest_debt = "active"
        setCurrentMilestone("moderate_interest_debt")
        setMilestoneStatuses(newStatuses)
        return
      }
    } else {
      // If no moderate interest debt, mark as completed
      newStatuses.moderate_interest_debt = "completed"
    }

    // If all previous steps are completed or skipped, move to max retirement
    newStatuses.max_retirement = "active"
    setCurrentMilestone("max_retirement")
    setMilestoneStatuses(newStatuses)
  }, [
    emergencyFundRecommendation.isSufficient,
    matchRecommendation.isApplicable,
    matchRecommendation.isMaximizingMatch,
    debtRecommendation.hasHighInterestDebt,
    moderateDebtRecommendation.hasModerateInterestDebt,
    skippedMilestones,
  ])

  // Helper function to calculate annual salary based on paycheck frequency
  const calculateAnnualSalary = (paycheck: UserData["paycheck"]): number => {
    const payPeriodsPerYear = getPayPeriodsPerYear(paycheck.payFrequency)
    return paycheck.grossAmount * payPeriodsPerYear
  }

  // Helper function to get pay periods per year
  const getPayPeriodsPerYear = (frequency: string): number => {
    switch (frequency) {
      case "weekly":
        return 52
      case "biweekly":
        return 26
      case "semi-monthly":
        return 24
      case "monthly":
        return 12
      default:
        return 26 // Default to biweekly
    }
  }

  // Function to handle skipping the current milestone
  const handleSkipMilestone = () => {
    if (confirmingSkip) {
      // Add current milestone to skipped milestones
      setSkippedMilestones([...skippedMilestones, currentMilestone])
      setConfirmingSkip(false)
    } else {
      // Show confirmation first
      setConfirmingSkip(true)
    }
  }

  // Function to cancel skip confirmation
  const handleCancelSkip = () => {
    setConfirmingSkip(false)
  }

  // Get the next milestone after the current one
  const getNextMilestone = (): string => {
    switch (currentMilestone) {
      case "emergency_fund":
        return matchRecommendation.isApplicable
          ? "401(k) match"
          : debtRecommendation.hasHighInterestDebt
            ? "high-interest debt"
            : "full emergency fund"
      case "401k_match":
        return debtRecommendation.hasHighInterestDebt ? "high-interest debt" : "full emergency fund"
      case "high_interest_debt":
        return "full emergency fund"
      case "full_emergency_fund":
        return moderateDebtRecommendation.hasModerateInterestDebt
          ? "moderate-interest debt"
          : "maximizing retirement accounts"
      case "moderate_interest_debt":
        return "maximizing retirement accounts"
      default:
        return "next step"
    }
  }

  // Render the Emergency Fund recommendation
  const renderEmergencyFundRecommendation = () => {
    return (
      <Card className="border-2 border-amber-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Build Your Emergency Fund</CardTitle>
              <CardDescription>
                Your first financial priority: Create a safety net for unexpected expenses
              </CardDescription>
            </div>
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
              Current Priority
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 space-y-4">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Build your emergency fund</h3>
                <p className="text-sm text-gray-600">
                  We recommend having at least {formatCurrency(emergencyFundRecommendation.recommendedAmount)} in your
                  emergency fund.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current: {formatCurrency(emergencyFundRecommendation.currentAmount)}</span>
                <span>Goal: {formatCurrency(emergencyFundRecommendation.recommendedAmount)}</span>
              </div>
              <Progress value={emergencyFundRecommendation.progress} className="h-2 bg-amber-100" />
              <p className="text-xs text-gray-500 text-right">
                {emergencyFundRecommendation.progress.toFixed(0)}% of goal
              </p>
            </div>
          </div>

          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Why is an emergency fund important?</AlertTitle>
            <AlertDescription>
              An emergency fund helps you handle unexpected expenses without going into debt. Financial experts
              recommend having 3-6 months of expenses saved, but starting with at least {formatCurrency(1000)} or one
              month of expenses ({formatCurrency(emergencyFundRecommendation.monthlyExpenses)}) is a great first step.
            </AlertDescription>
          </Alert>

          {!emergencyFundRecommendation.hasEmergencyFund && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No emergency fund detected</AlertTitle>
              <AlertDescription>
                We couldn't find an asset labeled as an emergency fund. Consider creating a dedicated emergency fund
                asset or labeling an existing cash asset as your emergency fund.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 pt-2">
            <h4 className="font-medium">Next steps:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                {emergencyFundRecommendation.hasEmergencyFund
                  ? `Continue building your emergency fund until you reach ${formatCurrency(emergencyFundRecommendation.recommendedAmount)}`
                  : "Create a dedicated emergency fund asset"}
              </li>
              <li>Set up automatic transfers to your emergency fund each month</li>
              <li>Keep your emergency fund in a high-yield savings account for easy access</li>
              <li>Focus on this goal before increasing retirement contributions beyond any employer match</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          {confirmingSkip ? (
            <>
              <Alert variant="destructive" className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Are you sure you want to skip this step?</AlertTitle>
                <AlertDescription>
                  An emergency fund is a critical financial safety net. Skipping this step may leave you vulnerable to
                  unexpected expenses.
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2 w-full">
                <Button variant="outline" onClick={handleCancelSkip} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleSkipMilestone} className="flex-1">
                  Yes, Skip Anyway
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" onClick={handleSkipMilestone} className="ml-auto">
              <SkipForward className="mr-2 h-4 w-4" />
              Skip to {getNextMilestone()}
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  // Render the 401k Match recommendation
  const render401kMatchRecommendation = () => {
    return (
      <Card className="border-2 border-amber-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Maximize Your 401(k) Match</CardTitle>
              <CardDescription>
                Your current priority: Take full advantage of your employer's retirement match
              </CardDescription>
            </div>
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
              Current Priority
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 space-y-4">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-amber-100">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Increase your 401(k) contribution</h3>
                <p className="text-sm text-gray-600">
                  You're currently contributing {matchRecommendation.currentContributionPercentage.toFixed(2)}% but your
                  employer matches up to {matchRecommendation.employerMatchPercentage.toFixed(2)}%.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current: {matchRecommendation.currentContributionPercentage.toFixed(2)}%</span>
                <span>Target: {matchRecommendation.employerMatchPercentage.toFixed(2)}%</span>
              </div>
              <Progress
                value={
                  (matchRecommendation.currentContributionPercentage / matchRecommendation.employerMatchPercentage) *
                  100
                }
                className="h-2"
              />
              <p className="text-xs text-gray-500 text-right">
                {(
                  (matchRecommendation.currentContributionPercentage / matchRecommendation.employerMatchPercentage) *
                  100
                ).toFixed(0)}
                % of potential match
              </p>
            </div>
          </div>

          <Alert variant="destructive">
            <TrendingUp className="h-4 w-4" />
            <AlertTitle>You're leaving money on the table</AlertTitle>
            <AlertDescription>
              By not contributing enough to get the full employer match, you're missing out on approximately{" "}
              {formatCurrency(matchRecommendation.annualLostMatch)} per year in free money for retirement.
            </AlertDescription>
          </Alert>

          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Why is the employer match important?</AlertTitle>
            <AlertDescription>
              Your employer's 401(k) match is essentially free money for retirement. For every dollar you contribute up
              to {matchRecommendation.employerMatchPercentage}% of your salary, your employer adds a matching
              contribution to your retirement account.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 pt-2">
            <h4 className="font-medium">Next steps:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                Increase your 401(k) contribution by{" "}
                {formatCurrency(matchRecommendation.perPaycheckIncrease, { showCents: true })} per paycheck to reach the
                full match
              </li>
              <li>
                Contact your HR department or visit your 401(k) provider's website to update your contribution
                percentage
              </li>
              <li>
                Aim to contribute at least {matchRecommendation.employerMatchPercentage.toFixed(2)}% to get the full
                employer match
              </li>
              <li>
                After maximizing your match, consider increasing contributions further toward the annual maximum
                ($23,000 in 2024, or $30,500 if over 50)
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          {confirmingSkip ? (
            <>
              <Alert variant="destructive" className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Are you sure you want to skip this step?</AlertTitle>
                <AlertDescription>
                  Your employer match is essentially free money. Skipping this step means you're leaving approximately{" "}
                  {formatCurrency(matchRecommendation.annualLostMatch)} per year on the table.
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2 w-full">
                <Button variant="outline" onClick={handleCancelSkip} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleSkipMilestone} className="flex-1">
                  Yes, Skip Anyway
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" onClick={handleSkipMilestone} className="ml-auto">
              <SkipForward className="mr-2 h-4 w-4" />
              Skip to {getNextMilestone()}
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  // Render the High Interest Debt recommendation
  const renderHighInterestDebtRecommendation = () => {
    return (
      <Card className="border-2 border-amber-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pay Off High-Interest Debt</CardTitle>
              <CardDescription>
                Your current priority: Eliminate expensive debt to improve your financial health
              </CardDescription>
            </div>
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
              Current Priority
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 space-y-4">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-amber-100">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Focus on high-interest debt</h3>
                {debtRecommendation.hasHighInterestDebt ? (
                  <p className="text-sm text-gray-600">
                    You have {formatCurrency(debtRecommendation.totalHighInterestDebt)} in high-interest debt with rates
                    above 6%.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Great news! You don't have any high-interest debt to address. You can move on to building your full
                    emergency fund.
                  </p>
                )}
              </div>
            </div>
          </div>

          {debtRecommendation.hasHighInterestDebt && (
            <>
              <div className="rounded-lg bg-amber-50 p-4">
                <h4 className="font-medium text-amber-800 mb-2">Your highest interest debt</h4>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{debtRecommendation.highestInterestDebt?.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(debtRecommendation.highestInterestDebt?.balance || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-amber-800">
                      {debtRecommendation.highestInterestRate.toFixed(2)}% APR
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(debtRecommendation.highestInterestDebt?.minimumPayment || 0)} minimum payment
                    </p>
                  </div>
                </div>
              </div>

              <Alert variant="destructive">
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>High-interest debt is expensive</AlertTitle>
                <AlertDescription>
                  At {debtRecommendation.highestInterestRate.toFixed(2)}% interest, every $1,000 of debt costs you
                  approximately ${(debtRecommendation.highestInterestRate * 10).toFixed(2)} per month in interest.
                </AlertDescription>
              </Alert>
            </>
          )}

          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Why focus on high-interest debt?</AlertTitle>
            <AlertDescription>
              High-interest debt (like credit cards) can cost you 15-25% or more in interest annually. Paying this off
              gives you an immediate, guaranteed return equal to the interest rate you're avoiding.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 pt-2">
            <h4 className="font-medium">Next steps:</h4>
            {debtRecommendation.hasHighInterestDebt ? (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>
                  Focus extra payments on {debtRecommendation.highestInterestDebt?.name} first (highest interest rate at{" "}
                  {debtRecommendation.highestInterestRate.toFixed(2)}%)
                </li>
                <li>Make minimum payments on all other debts</li>
                <li>Consider balance transfer offers or debt consolidation for lower interest rates</li>
                <li>Avoid adding new high-interest debt while paying off existing balances</li>
                <li>Once high-interest debt is paid off, build your emergency fund to cover 3-6 months of expenses</li>
              </ul>
            ) : (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Continue making regular payments on your existing low-interest debt</li>
                <li>Focus on building your full emergency fund to cover 3-6 months of expenses</li>
                <li>Avoid taking on new high-interest debt (above 6%)</li>
                <li>Consider increasing your retirement contributions</li>
              </ul>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          {confirmingSkip ? (
            <>
              <Alert variant="destructive" className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Are you sure you want to skip this step?</AlertTitle>
                <AlertDescription>
                  High-interest debt is very expensive. Skipping this step means you'll continue to pay high interest
                  rates that can significantly slow down your overall financial progress.
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2 w-full">
                <Button variant="outline" onClick={handleCancelSkip} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleSkipMilestone} className="flex-1">
                  Yes, Skip Anyway
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" onClick={handleSkipMilestone} className="ml-auto">
              <SkipForward className="mr-2 h-4 w-4" />
              Skip to {getNextMilestone()}
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  // Render the Full Emergency Fund recommendation
  const renderFullEmergencyFundRecommendation = () => {
    return (
      <Card className="border-2 border-amber-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Build Your Full Emergency Fund</CardTitle>
              <CardDescription>
                Your current priority: Expand your safety net to cover 3-6 months of expenses
              </CardDescription>
            </div>
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
              Current Priority
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 space-y-4">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Expand your emergency fund</h3>
                <p className="text-sm text-gray-600">
                  You've met your initial emergency fund goal of{" "}
                  {formatCurrency(emergencyFundRecommendation.recommendedAmount)}. Now it's time to build a full 3-6
                  month emergency fund of approximately{" "}
                  {formatCurrency(emergencyFundRecommendation.monthlyExpenses * 6)}.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current: {formatCurrency(emergencyFundRecommendation.currentAmount)}</span>
                <span>Full Goal: {formatCurrency(emergencyFundRecommendation.monthlyExpenses * 6)}</span>
              </div>
              <Progress
                value={
                  (emergencyFundRecommendation.currentAmount / (emergencyFundRecommendation.monthlyExpenses * 6)) * 100
                }
                className="h-2 bg-amber-100"
              />
              <p className="text-xs text-gray-500 text-right">
                {Math.min(
                  100,
                  (emergencyFundRecommendation.currentAmount / (emergencyFundRecommendation.monthlyExpenses * 6)) * 100,
                ).toFixed(0)}
                % of full goal
              </p>
            </div>
          </div>

          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Why build a larger emergency fund?</AlertTitle>
            <AlertDescription>
              While your starter emergency fund provides some protection, a full emergency fund covering 3-6 months of
              expenses offers security against major life events like job loss, medical emergencies, or unexpected home
              repairs.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 pt-2">
            <h4 className="font-medium">Next steps:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                Continue building your emergency fund until you reach{" "}
                {formatCurrency(emergencyFundRecommendation.monthlyExpenses * 6)}
              </li>
              <li>Keep your emergency fund in a high-yield savings account for easy access and to earn interest</li>
              <li>Review and adjust your emergency fund goal if your monthly expenses change</li>
              <li>Once your full emergency fund is complete, focus on maximizing retirement contributions</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          {confirmingSkip ? (
            <>
              <Alert variant="destructive" className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Are you sure you want to skip this step?</AlertTitle>
                <AlertDescription>
                  A full emergency fund is your best protection against major financial setbacks. Skipping this step
                  could leave you vulnerable to job loss or other significant expenses.
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2 w-full">
                <Button variant="outline" onClick={handleCancelSkip} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleSkipMilestone} className="flex-1">
                  Yes, Skip Anyway
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" onClick={handleSkipMilestone} className="ml-auto">
              <SkipForward className="mr-2 h-4 w-4" />
              Skip to {getNextMilestone()}
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  // Render the Moderate Interest Debt recommendation
  const renderModerateInterestDebtRecommendation = () => {
    return (
      <Card className="border-2 border-amber-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Address Moderate-Interest Debt</CardTitle>
              <CardDescription>
                Your current priority: Evaluate and pay down your moderate-interest debt
              </CardDescription>
            </div>
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
              Current Priority
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 space-y-4">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-amber-100">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Evaluate debt payoff strategies</h3>
                <p className="text-sm text-gray-600">
                  You have {formatCurrency(moderateDebtRecommendation.totalModerateInterestDebt)} in moderate-interest
                  debt (4-5% interest rate, excluding mortgage).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="font-medium text-blue-800 mb-2">Avalanche Method</h4>
              <p className="text-sm text-gray-700 mb-2">
                Pay minimum payments on all debts, then put extra money toward the debt with the highest interest rate
                first.
              </p>
              <div className="text-sm">
                <p className="font-medium">Advantages:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Mathematically optimal - saves the most money in interest</li>
                  <li>Reduces the highest-cost debt first</li>
                  <li>Best for those who are motivated by long-term savings</li>
                </ul>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <h4 className="font-medium text-green-800 mb-2">Snowball Method</h4>
              <p className="text-sm text-gray-700 mb-2">
                Pay minimum payments on all debts, then put extra money toward the debt with the smallest balance first.
              </p>
              <div className="text-sm">
                <p className="font-medium">Advantages:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Provides quick wins as smaller debts are paid off</li>
                  <li>Creates psychological momentum</li>
                  <li>Best for those who need motivation to stick with debt payoff</li>
                </ul>
              </div>
            </div>
          </div>

          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Why address moderate-interest debt?</AlertTitle>
            <AlertDescription>
              While moderate-interest debt isn't as urgent as high-interest debt, paying it off still provides a
              guaranteed return equal to the interest rate. This can be competitive with investment returns, especially
              in uncertain markets.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 pt-2">
            <h4 className="font-medium">Next steps:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                Evaluate which debt payoff method (Avalanche or Snowball) better suits your personality and financial
                situation
              </li>
              <li>Create a debt payoff plan with specific monthly payment amounts</li>
              <li>Consider refinancing options if you can qualify for lower interest rates</li>
              <li>Balance debt payoff with continuing to save for retirement</li>
              <li>Once moderate-interest debt is addressed, focus on maximizing retirement contributions</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          {confirmingSkip ? (
            <>
              <Alert variant="destructive" className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Are you sure you want to skip this step?</AlertTitle>
                <AlertDescription>
                  While moderate-interest debt isn't as urgent as high-interest debt, addressing it can still save you
                  money in the long run and improve your financial position.
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2 w-full">
                <Button variant="outline" onClick={handleCancelSkip} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleSkipMilestone} className="flex-1">
                  Yes, Skip Anyway
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" onClick={handleSkipMilestone} className="ml-auto">
              <SkipForward className="mr-2 h-4 w-4" />
              Skip to {getNextMilestone()}
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  // Render the Max Retirement recommendation
  const renderMaxRetirementRecommendation = () => {
    return (
      <Card className="border-2 border-amber-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Maximize Retirement Accounts</CardTitle>
              <CardDescription>
                Your current priority: Optimize tax-advantaged accounts for long-term growth
              </CardDescription>
            </div>
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
              Current Priority
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 space-y-4">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-amber-100">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Maximize tax-advantaged accounts</h3>
                <p className="text-sm text-gray-600">
                  Now that you've built a solid financial foundation, it's time to focus on maximizing your retirement
                  savings through tax-advantaged accounts.
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Why maximize retirement accounts?</AlertTitle>
            <AlertDescription>
              Tax-advantaged retirement accounts like 401(k)s, IRAs, and HSAs offer significant tax benefits that can
              help your investments grow faster. Maximizing these accounts can potentially save you thousands in taxes
              over your lifetime.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 pt-2">
            <h4 className="font-medium">Next steps:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Aim to contribute the maximum to your 401(k): $23,000 in 2024 ($30,500 if over 50)</li>
              <li>Consider opening and maxing out an IRA: $7,000 in 2024 ($8,000 if over 50)</li>
              <li>
                If eligible, maximize HSA contributions: $4,150 for individuals, $8,300 for families in 2024 (plus
                $1,000 catch-up if over 55)
              </li>
              <li>After maxing out tax-advantaged accounts, consider investing in taxable brokerage accounts</li>
              <li>Review your investment allocation to ensure it aligns with your risk tolerance and time horizon</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500 italic">
            This is the final step in our recommended financial journey. Congratulations on reaching this milestone!
          </p>
        </CardFooter>
      </Card>
    )
  }

  // Render the appropriate recommendation based on the current milestone
  const renderCurrentRecommendation = () => {
    switch (currentMilestone) {
      case "emergency_fund":
        return renderEmergencyFundRecommendation()
      case "401k_match":
        return render401kMatchRecommendation()
      case "high_interest_debt":
        return renderHighInterestDebtRecommendation()
      case "full_emergency_fund":
        return renderFullEmergencyFundRecommendation()
      case "moderate_interest_debt":
        return renderModerateInterestDebtRecommendation()
      case "max_retirement":
        return renderMaxRetirementRecommendation()
      default:
        return renderEmergencyFundRecommendation()
    }
  }

  // Helper function to get milestone status class
  const getMilestoneStatusClass = (milestone: MilestoneId) => {
    const status = milestoneStatuses[milestone]

    switch (status) {
      case "completed":
        return "bg-green-100 text-green-600"
      case "active":
        return "bg-amber-100 text-amber-600 ring-2 ring-amber-300"
      case "skipped":
        return "bg-orange-100 text-orange-600"
      default:
        return "bg-gray-100 text-gray-400"
    }
  }

  // Helper function to get milestone title class
  const getMilestoneTitleClass = (milestone: MilestoneId) => {
    const status = milestoneStatuses[milestone]

    switch (status) {
      case "completed":
        return "text-green-600"
      case "active":
        return "text-amber-600"
      case "skipped":
        return "text-orange-600"
      default:
        return "text-gray-400"
    }
  }

  // Helper function to get milestone description class
  const getMilestoneDescriptionClass = (milestone: MilestoneId) => {
    const status = milestoneStatuses[milestone]

    switch (status) {
      case "active":
        return "text-gray-600"
      case "skipped":
        return "text-orange-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Render only the current priority recommendation */}
      {renderCurrentRecommendation()}

      {/* Financial Journey Roadmap - Always visible */}
      <Card>
        <CardHeader>
          <CardTitle>Your Financial Journey</CardTitle>
          <CardDescription>Track your progress through these key financial milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Emergency Fund Milestone */}
            <div className="flex items-start space-x-3">
              <div
                className={`rounded-full h-6 w-6 flex items-center justify-center mt-0.5 ${getMilestoneStatusClass("emergency_fund")}`}
              >
                <span className="text-sm font-medium">1</span>
              </div>
              <div>
                <h3 className={`font-medium ${getMilestoneTitleClass("emergency_fund")}`}>
                  {milestoneStatuses.emergency_fund === "completed"
                    ? "✓ Build emergency fund"
                    : milestoneStatuses.emergency_fund === "skipped"
                      ? "⤻ Build emergency fund (Skipped)"
                      : "Build emergency fund"}
                  {currentMilestone === "emergency_fund" && " (Current Focus)"}
                </h3>
                <p className={getMilestoneDescriptionClass("emergency_fund")}>
                  Save at least {formatCurrency(emergencyFundRecommendation.recommendedAmount)} for unexpected expenses
                </p>
                {milestoneStatuses.emergency_fund === "completed" && (
                  <p className="text-xs text-green-600 mt-1">
                    Completed! You have {formatCurrency(emergencyFundRecommendation.currentAmount)} saved.
                  </p>
                )}
                {milestoneStatuses.emergency_fund === "skipped" && (
                  <p className="text-xs text-orange-600 mt-1">
                    You chose to skip this step. Consider revisiting it later.
                  </p>
                )}
              </div>
            </div>

            {/* 401k Match Milestone */}
            <div className="flex items-start space-x-3">
              <div
                className={`rounded-full h-6 w-6 flex items-center justify-center mt-0.5 ${getMilestoneStatusClass("401k_match")}`}
              >
                <span className="text-sm font-medium">2</span>
              </div>
              <div>
                <h3 className={`font-medium ${getMilestoneTitleClass("401k_match")}`}>
                  {!matchRecommendation.isApplicable
                    ? "Maximize 401(k) match (Not applicable)"
                    : milestoneStatuses["401k_match"] === "completed"
                      ? "✓ Maximize 401(k) match"
                      : milestoneStatuses["401k_match"] === "skipped"
                        ? "⤻ Maximize 401(k) match (Skipped)"
                        : "Maximize 401(k) match"}
                  {currentMilestone === "401k_match" && " (Current Focus)"}
                </h3>
                <p className={getMilestoneDescriptionClass("401k_match")}>
                  {!matchRecommendation.isApplicable
                    ? "Your employer doesn't offer a 401(k) match"
                    : `Contribute at least ${matchRecommendation.employerMatchPercentage.toFixed(2)}% to get your full employer match`}
                </p>
                {matchRecommendation.isApplicable && milestoneStatuses["401k_match"] === "completed" && (
                  <p className="text-xs text-green-600 mt-1">
                    Completed! You're contributing {matchRecommendation.currentContributionPercentage.toFixed(2)}%.
                  </p>
                )}
                {milestoneStatuses["401k_match"] === "skipped" && (
                  <p className="text-xs text-orange-600 mt-1">
                    You chose to skip this step. Consider revisiting it later.
                  </p>
                )}
              </div>
            </div>

            {/* High Interest Debt Milestone */}
            <div className="flex items-start space-x-3">
              <div
                className={`rounded-full h-6 w-6 flex items-center justify-center mt-0.5 ${getMilestoneStatusClass("high_interest_debt")}`}
              >
                <span className="text-sm font-medium">3</span>
              </div>
              <div>
                <h3 className={`font-medium ${getMilestoneTitleClass("high_interest_debt")}`}>
                  {!debtRecommendation.hasHighInterestDebt
                    ? "✓ No high-interest debt"
                    : milestoneStatuses.high_interest_debt === "skipped"
                      ? "⤻ Pay off high-interest debt (Skipped)"
                      : "Pay off high-interest debt"}
                  {currentMilestone === "high_interest_debt" && " (Current Focus)"}
                </h3>
                <p className={getMilestoneDescriptionClass("high_interest_debt")}>
                  {debtRecommendation.hasHighInterestDebt
                    ? `Focus on ${formatCurrency(debtRecommendation.totalHighInterestDebt)} of debt with rates above 6%`
                    : "You have no high-interest debt to address"}
                </p>
                {!debtRecommendation.hasHighInterestDebt && milestoneStatuses.high_interest_debt !== "skipped" && (
                  <p className="text-xs text-green-600 mt-1">
                    Completed! You have no debt with interest rates above 6%.
                  </p>
                )}
                {milestoneStatuses.high_interest_debt === "skipped" && (
                  <p className="text-xs text-orange-600 mt-1">
                    You chose to skip this step. Consider revisiting it later.
                  </p>
                )}
              </div>
            </div>

            {/* Full Emergency Fund Milestone */}
            <div className="flex items-start space-x-3">
              <div
                className={`rounded-full h-6 w-6 flex items-center justify-center mt-0.5 ${getMilestoneStatusClass("full_emergency_fund")}`}
              >
                <span className="text-sm font-medium">4</span>
              </div>
              <div>
                <h3 className={`font-medium ${getMilestoneTitleClass("full_emergency_fund")}`}>
                  {milestoneStatuses.full_emergency_fund === "completed"
                    ? "✓ Build full emergency fund"
                    : milestoneStatuses.full_emergency_fund === "skipped"
                      ? "⤻ Build full emergency fund (Skipped)"
                      : "Build full emergency fund"}
                  {currentMilestone === "full_emergency_fund" && " (Current Focus)"}
                </h3>
                <p className={getMilestoneDescriptionClass("full_emergency_fund")}>
                  Expand your emergency fund to cover 3-6 months of expenses
                </p>
                {milestoneStatuses.full_emergency_fund === "skipped" && (
                  <p className="text-xs text-orange-600 mt-1">
                    You chose to skip this step. Consider revisiting it later.
                  </p>
                )}
              </div>
            </div>

            {/* Moderate Interest Debt Milestone */}
            <div className="flex items-start space-x-3">
              <div
                className={`rounded-full h-6 w-6 flex items-center justify-center mt-0.5 ${getMilestoneStatusClass("moderate_interest_debt")}`}
              >
                <span className="text-sm font-medium">5</span>
              </div>
              <div>
                <h3 className={`font-medium ${getMilestoneTitleClass("moderate_interest_debt")}`}>
                  {!moderateDebtRecommendation.hasModerateInterestDebt
                    ? "✓ No moderate-interest debt"
                    : milestoneStatuses.moderate_interest_debt === "skipped"
                      ? "⤻ Address moderate-interest debt (Skipped)"
                      : "Address moderate-interest debt"}
                  {currentMilestone === "moderate_interest_debt" && " (Current Focus)"}
                </h3>
                <p className={getMilestoneDescriptionClass("moderate_interest_debt")}>
                  {moderateDebtRecommendation.hasModerateInterestDebt
                    ? `Evaluate and pay off ${formatCurrency(moderateDebtRecommendation.totalModerateInterestDebt)} of debt with 4-5% interest`
                    : "You have no moderate-interest debt to address"}
                </p>
                {!moderateDebtRecommendation.hasModerateInterestDebt &&
                  milestoneStatuses.moderate_interest_debt !== "skipped" && (
                    <p className="text-xs text-green-600 mt-1">
                      Completed! You have no debt with interest rates between 4-5%.
                    </p>
                  )}
                {milestoneStatuses.moderate_interest_debt === "skipped" && (
                  <p className="text-xs text-orange-600 mt-1">
                    You chose to skip this step. Consider revisiting it later.
                  </p>
                )}
              </div>
            </div>

            {/* Max Retirement Accounts Milestone */}
            <div className="flex items-start space-x-3">
              <div
                className={`rounded-full h-6 w-6 flex items-center justify-center mt-0.5 ${getMilestoneStatusClass("max_retirement")}`}
              >
                <span className="text-sm font-medium">6</span>
              </div>
              <div>
                <h3 className={`font-medium ${getMilestoneTitleClass("max_retirement")}`}>
                  Max out tax-advantaged accounts
                  {currentMilestone === "max_retirement" && " (Current Focus)"}
                </h3>
                <p className={getMilestoneDescriptionClass("max_retirement")}>
                  Contribute to IRAs, HSAs, and max out your 401(k)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
