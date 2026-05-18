"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { PaycheckData } from "@/lib/types"

interface PaycheckTabProps {
  paycheck: PaycheckData
  onUpdate: (paycheck: PaycheckData) => void
}

// Standard work day in hours (8 hours = 1 day)
const HOURS_PER_WORKDAY = 8

export default function PaycheckTab({ paycheck, onUpdate }: PaycheckTabProps) {
  const [localPaycheck, setLocalPaycheck] = useState<PaycheckData>(paycheck)

  // Calculate projections based on current data
  const calculateProjections = (data: PaycheckData): PaycheckData => {
    // Calculate remaining pay periods in the year based on pay frequency and last pay date
    const now = new Date()
    const lastPayDate = new Date(data.lastPayDate)

    let payPeriodsRemaining = 0

    switch (data.payFrequency) {
      case "weekly":
        // 52 weeks per year
        const weeksInYear = 52
        const weekOfYear = Math.ceil(
          (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
        )
        payPeriodsRemaining = weeksInYear - weekOfYear
        break
      case "biweekly":
        // 26 pay periods per year
        const biweeksInYear = 26
        const biweekOfYear = Math.ceil(
          (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (14 * 24 * 60 * 60 * 1000),
        )
        payPeriodsRemaining = biweeksInYear - biweekOfYear
        break
      case "semi-monthly":
        // 24 pay periods per year (twice a month)
        const currentMonth = now.getMonth()
        const monthsRemaining = 11 - currentMonth // 0-based months
        payPeriodsRemaining = monthsRemaining * 2
        // Add remaining pay periods in the current month
        if (now.getDate() < 15) payPeriodsRemaining += 2
        else if (now.getDate() < 30) payPeriodsRemaining += 1
        break
      case "monthly":
        // 12 pay periods per year
        const monthsInYear = 12
        payPeriodsRemaining = monthsInYear - (now.getMonth() + 1)
        break
      default:
        payPeriodsRemaining = 0
    }

    // Ensure we don't have negative pay periods
    payPeriodsRemaining = Math.max(0, payPeriodsRemaining)

    // Calculate 401k projections
    const projected401kContribution = data.ytdContribution401k + data.contribution401k * payPeriodsRemaining
    const contribution401kPercentage = data.grossAmount > 0 ? (data.contribution401k / data.grossAmount) * 100 : 0

    // Calculate PTO and Sick hour projections
    const projectedPtoBalance = data.ptoBalance + data.ptoAdded * payPeriodsRemaining
    const projectedSickBalance = data.sickBalance + data.sickAdded * payPeriodsRemaining

    return {
      ...data,
      projected401kContribution,
      contribution401kPercentage,
      projectedPtoBalance,
      projectedSickBalance,
      payPeriodsRemaining,
    }
  }

  const handleInputChange = (field: keyof PaycheckData, value: string) => {
    const updatedPaycheck = {
      ...localPaycheck,
      [field]: field === "lastPayDate" ? value : Number.parseFloat(value) || 0,
    }

    // Calculate projections and update
    const calculatedPaycheck = calculateProjections(updatedPaycheck)
    setLocalPaycheck(calculatedPaycheck)
    onUpdate(calculatedPaycheck)
  }

  const handleFrequencyChange = (value: string) => {
    const updatedPaycheck = {
      ...localPaycheck,
      payFrequency: value as PaycheckData["payFrequency"],
    }

    const calculatedPaycheck = calculateProjections(updatedPaycheck)
    setLocalPaycheck(calculatedPaycheck)
    onUpdate(calculatedPaycheck)
  }

  const handleSwitchChange = (field: keyof PaycheckData, checked: boolean) => {
    const updatedPaycheck = {
      ...localPaycheck,
      [field]: checked,
    }

    const calculatedPaycheck = calculateProjections(updatedPaycheck)
    setLocalPaycheck(calculatedPaycheck)
    onUpdate(calculatedPaycheck)
  }

  // Convert hours to days
  const hoursToDays = (hours: number): number => {
    return hours / HOURS_PER_WORKDAY
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Paycheck Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="grossAmount">Gross Amount</Label>
              <Input
                id="grossAmount"
                type="number"
                value={localPaycheck.grossAmount || ""}
                onChange={(e) => handleInputChange("grossAmount", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="netAmount">Net Amount</Label>
              <Input
                id="netAmount"
                type="number"
                value={localPaycheck.netAmount || ""}
                onChange={(e) => handleInputChange("netAmount", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payFrequency">Pay Frequency</Label>
              <Select value={localPaycheck.payFrequency} onValueChange={handleFrequencyChange}>
                <SelectTrigger id="payFrequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                  <SelectItem value="semi-monthly">Semi-Monthly (Twice a Month)</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastPayDate">Last Pay Date</Label>
            <Input
              id="lastPayDate"
              type="date"
              value={localPaycheck.lastPayDate}
              onChange={(e) => handleInputChange("lastPayDate", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>401k Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contribution401k">Current 401k Contribution</Label>
              <Input
                id="contribution401k"
                type="number"
                value={localPaycheck.contribution401k || ""}
                onChange={(e) => handleInputChange("contribution401k", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ytdContribution401k">YTD 401k Contribution</Label>
              <Input
                id="ytdContribution401k"
                type="number"
                value={localPaycheck.ytdContribution401k || ""}
                onChange={(e) => handleInputChange("ytdContribution401k", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-4 border rounded-md p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <Label htmlFor="employerOffers401kMatch" className="cursor-pointer">
                Employer Offers 401k Match
              </Label>
              <Switch
                id="employerOffers401kMatch"
                checked={localPaycheck.employerOffers401kMatch}
                onCheckedChange={(checked) => handleSwitchChange("employerOffers401kMatch", checked)}
              />
            </div>

            {localPaycheck.employerOffers401kMatch && (
              <div className="space-y-2">
                <Label htmlFor="employerMatchPercentage">Employer Match Percentage</Label>
                <div className="flex items-center">
                  <Input
                    id="employerMatchPercentage"
                    type="number"
                    value={localPaycheck.employerMatchPercentage || ""}
                    onChange={(e) => handleInputChange("employerMatchPercentage", e.target.value)}
                    placeholder="0.00"
                    step="0.5"
                    min="0"
                    max="100"
                  />
                  <span className="ml-2">%</span>
                </div>
                <p className="text-xs text-gray-500">
                  Enter the maximum percentage of your salary that your employer will match.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-100 p-4">
              <p className="text-sm font-medium text-gray-500">Projected Year-End 401k</p>
              <p className="text-2xl font-bold">${localPaycheck.projected401kContribution.toFixed(2)}</p>
              <p className="text-xs text-gray-500">
                Based on {localPaycheck.payPeriodsRemaining} remaining pay periods
              </p>
            </div>
            <div className="rounded-lg bg-gray-100 p-4">
              <p className="text-sm font-medium text-gray-500">401k Contribution %</p>
              <p className="text-2xl font-bold">{localPaycheck.contribution401kPercentage.toFixed(2)}%</p>
              <p className="text-xs text-gray-500">Of gross paycheck amount</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PTO & Sick Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ptoAdded">PTO Hours Added</Label>
              <Input
                id="ptoAdded"
                type="number"
                value={localPaycheck.ptoAdded || ""}
                onChange={(e) => handleInputChange("ptoAdded", e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptoBalance">Current PTO Balance</Label>
              <Input
                id="ptoBalance"
                type="number"
                value={localPaycheck.ptoBalance || ""}
                onChange={(e) => handleInputChange("ptoBalance", e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sickAdded">Sick Hours Added</Label>
              <Input
                id="sickAdded"
                type="number"
                value={localPaycheck.sickAdded || ""}
                onChange={(e) => handleInputChange("sickAdded", e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sickBalance">Current Sick Balance</Label>
              <Input
                id="sickBalance"
                type="number"
                value={localPaycheck.sickBalance || ""}
                onChange={(e) => handleInputChange("sickBalance", e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-100 p-4">
              <p className="text-sm font-medium text-gray-500">Projected Year-End PTO</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold">{localPaycheck.projectedPtoBalance.toFixed(2)} hours</p>
                <p className="text-lg font-semibold text-gray-600">
                  {hoursToDays(localPaycheck.projectedPtoBalance).toFixed(1)} days
                </p>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Based on {localPaycheck.payPeriodsRemaining} remaining pay periods</span>
                <span>(8-hour workday)</span>
              </div>
            </div>
            <div className="rounded-lg bg-gray-100 p-4">
              <p className="text-sm font-medium text-gray-500">Projected Year-End Sick</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold">{localPaycheck.projectedSickBalance.toFixed(2)} hours</p>
                <p className="text-lg font-semibold text-gray-600">
                  {hoursToDays(localPaycheck.projectedSickBalance).toFixed(1)} days
                </p>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Based on {localPaycheck.payPeriodsRemaining} remaining pay periods</span>
                <span>(8-hour workday)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
