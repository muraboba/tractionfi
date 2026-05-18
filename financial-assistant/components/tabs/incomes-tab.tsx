"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Trash2, Lock, Pencil, Check, X } from "lucide-react"
import type { IncomeEntry } from "@/lib/types"
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils"

interface IncomesTabProps {
  incomes: IncomeEntry[]
  onUpdate: (incomes: IncomeEntry[]) => void
}

export default function IncomesTab({ incomes, onUpdate }: IncomesTabProps) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [frequency, setFrequency] = useState("monthly")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<{
    name: string;
    amount: string;
    frequency: string;
  }>({
    name: "",
    amount: "",
    frequency: "monthly",
  })

  const handleAddIncome = () => {
    if (!name || !amount) return

    const newIncome: IncomeEntry = {
      id: Date.now().toString(),
      name,
      amount: parseCurrencyInput(amount),
      frequency,
    }

    onUpdate([...incomes, newIncome])

    // Reset form
    setName("")
    setAmount("")
    setFrequency("monthly")
  }

  const handleDeleteIncome = (id: string) => {
    // Don't allow deletion of the paycheck entry
    const incomeToDelete = incomes.find((income) => income.id === id)

    if (incomeToDelete?.isPaycheckEntry) {
      return
    }

    onUpdate(incomes.filter((income) => income.id !== id))
  }

  const handleEditClick = (income: IncomeEntry) => {
    setEditingId(income.id)
    setEditFormData({
      name: income.name,
      amount: formatCurrencyInput(income.amount),
      frequency: income.frequency,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const handleSaveEdit = (id: string) => {
    const updatedIncomes = incomes.map((income) => {
      if (income.id === id) {
        return {
          ...income,
          name: editFormData.name,
          amount: parseCurrencyInput(editFormData.amount),
          frequency: editFormData.frequency,
        }
      }
      return income
    })

    onUpdate(updatedIncomes)
    setEditingId(null)
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData({
      ...editFormData,
      [field]: value,
    })
  }

  const calculateMonthlyAmount = (income: IncomeEntry): number => {
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

  const totalMonthlyIncome = incomes.reduce((sum, income) => sum + calculateMonthlyAmount(income), 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="incomeName">Income Source</Label>
              <Input
                id="incomeName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Salary, Dividends, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incomeAmount">Amount</Label>
              <Input
                id="incomeAmount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={(e) => {
                  // Format the value when the input loses focus
                  if (e.target.value) {
                    setAmount(formatCurrencyInput(parseCurrencyInput(e.target.value)))
                  }
                }}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incomeFrequency">Frequency</Label>
              <select
                id="incomeFrequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>
          <Button onClick={handleAddIncome} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Income
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <p className="text-center text-muted-foreground">No income sources added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Monthly Equivalent</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((income) => (
                  <TableRow key={income.id} className={income.isPaycheckEntry ? "bg-gray-50" : ""}>
                    {editingId === income.id ? (
                      // Edit mode
                      <>
                        <TableCell>
                          <Input
                            value={editFormData.name}
                            onChange={(e) => handleEditFormChange("name", e.target.value)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={editFormData.amount}
                            onChange={(e) => handleEditFormChange("amount", e.target.value)}
                            onBlur={(e) => {
                              if (e.target.value) {
                                handleEditFormChange(
                                  "amount",
                                  formatCurrencyInput(parseCurrencyInput(e.target.value))
                                )
                              }
                            }}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            value={editFormData.frequency}
                            onChange={(e) => handleEditFormChange("frequency", e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annually">Annually</option>
                          </select>
                        </TableCell>
                        <TableCell>{formatCurrency(calculateMonthlyAmount({
                          ...income,
                          amount: parseCurrencyInput(editFormData.amount),
                          frequency: editFormData.frequency
                        }))}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveEdit(income.id)}
                              className="h-8 w-8"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCancelEdit}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      // View mode
                      <>
                        <TableCell className="font-medium">
                          {income.name}
                          {income.isPaycheckEntry && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              <Lock className="mr-1 h-3 w-3" />
                              Auto-synced
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(income.amount)}</TableCell>
                        <TableCell className="capitalize">{income.frequency}</TableCell>
                        <TableCell>{formatCurrency(calculateMonthlyAmount(income))}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {!income.isPaycheckEntry && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(income)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteIncome(income.id)}
                              disabled={income.isPaycheckEntry}
                              className={income.isPaycheckEntry ? "opacity-30 cursor-not-allowed" : "h-8 w-8"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 rounded-lg bg-gray-100 p-4">
            <p className="text-sm font-medium text-gray-500">Total Monthly Income</p>
            <p className="text-2xl font-bold">{formatCurrency(totalMonthlyIncome)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
