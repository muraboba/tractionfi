"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import PaycheckTab from "@/components/tabs/paycheck-tab"
import IncomesTab from "@/components/tabs/incomes-tab"
import ExpensesTab from "@/components/tabs/expenses-tab"
import AssetsTab from "@/components/tabs/assets-tab"
import DebtsTab from "@/components/tabs/debts-tab"
import SummarySection from "@/components/summary-section"
import { getUserData, saveUserData } from "@/lib/data"
import { type UserData, defaultUserData, type IncomeEntry } from "@/lib/types"
import { getUserId, clearAuthToken, clearUserId } from "@/lib/api"
import { deleteSession } from "@/lib/session"
import RecommendationsTab from "@/components/tabs/recommendations-tab"

// Special ID for the paycheck income entry
const PAYCHECK_INCOME_ID = "paycheck-income"

export default function Dashboard({ userId }: { userId: string }) {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData>(defaultUserData)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("paycheck")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  // Calculate monthly equivalent of paycheck based on frequency
  const calculateMonthlyPaycheck = (paycheck: UserData["paycheck"]): number => {
    const { netAmount, payFrequency } = paycheck

    switch (payFrequency) {
      case "weekly":
        return (netAmount * 52) / 12 // 52 weeks per year / 12 months
      case "biweekly":
        return (netAmount * 26) / 12 // 26 pay periods per year / 12 months
      case "semi-monthly":
        return netAmount * 2 // 24 pay periods per year / 12 months = 2 per month
      case "monthly":
        return netAmount // Already monthly
      default:
        return netAmount
    }
  }

  // Ensure paycheck is included in incomes
  const syncPaycheckToIncomes = (data: UserData): UserData => {
    const monthlyPaycheck = calculateMonthlyPaycheck(data.paycheck)

    // Skip if paycheck amount is zero
    if (data.paycheck.netAmount === 0) {
      return data
    }

    // Check if paycheck income already exists
    const paycheckIncomeIndex = data.incomes.findIndex((income) => income.id === PAYCHECK_INCOME_ID)

    if (paycheckIncomeIndex >= 0) {
      // Update existing paycheck income
      const updatedIncomes = [...data.incomes]
      updatedIncomes[paycheckIncomeIndex] = {
        ...updatedIncomes[paycheckIncomeIndex],
        amount: monthlyPaycheck,
        frequency: "monthly", // Ensure frequency is set correctly
        isPaycheckEntry: true, // Ensure flag is set
      }

      return {
        ...data,
        incomes: updatedIncomes,
      }
    } else {
      // Add paycheck income as first entry
      const paycheckIncome: IncomeEntry = {
        id: PAYCHECK_INCOME_ID,
        name: "Paycheck",
        amount: monthlyPaycheck,
        frequency: "monthly",
        isPaycheckEntry: true, // Special flag to identify this entry
      }

      return {
        ...data,
        incomes: [paycheckIncome, ...data.incomes],
      }
    }
  }

  // Save data to Cloudflare KV
  const saveData = async (data: UserData) => {
    setSaveStatus("saving")
    try {
      await saveUserData(userId, data)
      setSaveStatus("saved")

      // Reset status after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle")
      }, 2000)
    } catch (error) {
      console.error("Failed to save data:", error)
      setSaveStatus("error")

      // Reset status after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle")
      }, 2000)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setLoadError(null)

      try {
        // Double-check that we have a userId
        const currentUserId = userId || getUserId()

        if (!currentUserId) {
          // Use hard navigation for redirect
          window.location.href = "/"
          return
        }

        // Add a small delay to ensure localStorage is properly initialized
        await new Promise((resolve) => setTimeout(resolve, 100))

        const data = await getUserData(currentUserId)

        // Check if we got default data or actual user data
        const isDefaultData =
          data.paycheck.grossAmount === 0 &&
          data.incomes.length === 0 &&
          data.expenses.length === 0 &&
          data.assets.length === 0 &&
          data.debts.length === 0

        // Ensure paycheck is included in incomes when loading data
        const syncedData = syncPaycheckToIncomes(data)
        setUserData(syncedData)

        // If we loaded default data, try to save it immediately to test KV write access
        if (isDefaultData) {
          try {
            await saveData(syncedData)
          } catch (saveError) {
            console.error("Failed to save default data:", saveError)
          }
        }
      } catch (error) {
        console.error("Failed to load user data:", error)

        let errorMessage = "Failed to load your data. Please try refreshing the page."

        if (error instanceof Error) {
          if (error.message.includes("Not authenticated") || error.message.includes("Session expired")) {
            errorMessage = "Your session has expired. Please log in again."
            // Use hard navigation for redirect
            window.location.href = "/"
            return
          } else {
            errorMessage = `Error: ${error.message}`
          }
        }

        setLoadError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, router])

  const handlePaycheckUpdate = async (paycheck: UserData["paycheck"]) => {
    // Update paycheck and sync to incomes
    const updatedData = syncPaycheckToIncomes({
      ...userData,
      paycheck,
    })

    setUserData(updatedData)
    await saveData(updatedData)
  }

  const handleLogout = async () => {
    try {
      // Manual cleanup of all auth data
      clearAuthToken()
      clearUserId()
      deleteSession()

      // Use hard navigation to the login page
      window.location.href = "/"
    } catch (error) {
      console.error("Logout failed:", error)
      // Fallback redirect in case the logout function fails
      window.location.href = "/"
    }
  }

  const handleSaveData = async () => {
    await saveData(userData)
  }

  const handleDeleteData = async () => {
    if (confirm("Are you sure you want to delete all your data? This cannot be undone.")) {
      try {
        await saveData(defaultUserData)
        setUserData(defaultUserData)
        alert("Data deleted successfully!")
      } catch (error) {
        console.error("Failed to delete data:", error)
        alert("Failed to delete data. Please try again.")
      }
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading your financial data...</div>
  }

  if (loadError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="mb-4 text-red-600">{loadError}</div>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        <Button variant="outline" className="mt-2" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Personal FI Dashboard</h1>
        <div className="flex gap-2 items-center">
          <div className="text-sm mr-2">
            {saveStatus === "saving" && <span className="text-yellow-600">Saving...</span>}
            {saveStatus === "saved" && <span className="text-green-600">Saved!</span>}
            {saveStatus === "error" && <span className="text-red-600">Save failed!</span>}
          </div>
          <Button onClick={handleSaveData} disabled={saveStatus === "saving"}>
            Save Data
          </Button>
          <Button variant="outline" onClick={handleDeleteData} disabled={saveStatus === "saving"}>
            Delete Data
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="paycheck">Paycheck</TabsTrigger>
              <TabsTrigger value="incomes">Incomes</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="debts">Debts</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>
            {activeTab === "paycheck" && (
              <TabsContent value="paycheck">
                <PaycheckTab paycheck={userData.paycheck} onUpdate={handlePaycheckUpdate} />
              </TabsContent>
            )}
            {activeTab === "incomes" && (
              <TabsContent value="incomes">
                <IncomesTab
                  incomes={userData.incomes}
                  onUpdate={async (incomes) => {
                    const updatedData = { ...userData, incomes }
                    setUserData(updatedData)
                    await saveData(updatedData)
                  }}
                />
              </TabsContent>
            )}
            {activeTab === "expenses" && (
              <TabsContent value="expenses">
                <ExpensesTab
                  expenses={userData.expenses}
                  onUpdate={async (expenses) => {
                    const updatedData = { ...userData, expenses }
                    setUserData(updatedData)
                    await saveData(updatedData)
                  }}
                />
              </TabsContent>
            )}
            {activeTab === "assets" && (
              <TabsContent value="assets">
                <AssetsTab
                  assets={userData.assets}
                  onUpdate={async (assets) => {
                    const updatedData = { ...userData, assets }
                    setUserData(updatedData)
                    await saveData(updatedData)
                  }}
                />
              </TabsContent>
            )}
            {activeTab === "debts" && (
              <TabsContent value="debts">
                <DebtsTab
                  debts={userData.debts}
                  onUpdate={async (debts) => {
                    const updatedData = { ...userData, debts }
                    setUserData(updatedData)
                    await saveData(updatedData)
                  }}
                />
              </TabsContent>
            )}
            {activeTab === "recommendations" && (
              <TabsContent value="recommendations">
                <RecommendationsTab userData={userData} />
              </TabsContent>
            )}
          </Tabs>
        </div>
        <div>
          <SummarySection userData={userData} />
        </div>
      </div>
    </div>
  )
}
