"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Trash2, Pencil, Check, X } from "lucide-react"
import type { ExpenseEntry } from "@/lib/types"
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils"

interface ExpensesTabProps {
  expenses: ExpenseEntry[]
  onUpdate: (expenses: ExpenseEntry[]) => void
}

export default function ExpensesTab({ expenses, onUpdate }: ExpensesTabProps) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [frequency, setFrequency] = useState("monthly")
  const [category, setCategory] = useState("essential")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<{
    name: string;
    amount: string;
    frequency: string;
    category: string;
  }>({
    name: "",
    amount: "",
    frequency: "monthly",
    category: "essential",
  })

  const handleAddExpense = () => {
    if (!name || !amount) return

    const newExpense: ExpenseEntry = {
      id: Date.now().toString(),
      name,
      amount: parseCurrencyInput(amount),
      frequency,
      category,
    }

    onUpdate([...expenses, newExpense])

    // Reset form
    setName("")
    setAmount("")
    setFrequency("monthly")
    setCategory("essential")
  }

  const handleDeleteExpense = (id: string) => {
    onUpdate(expenses.filter((expense) => expense.id !== id))
  }

  const handleEditClick = (expense: ExpenseEntry) => {
    setEditingId(expense.id)
    setEditFormData({
      name: expense.name,
      amount: formatCurrencyInput(expense.amount),
      frequency: expense.frequency,
      category: expense.category,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const handleSaveEdit = (id: string) => {
    const updatedExpenses = expenses.map((expense) => {
      if (expense.id === id) {
        return {
          ...expense,
          name: editFormData.name,
          amount: parseCurrencyInput(editFormData.amount),
          frequency: editFormData.frequency,
          category: editFormData.category,
        }
      }
      return expense
    })

    onUpdate(updatedExpenses)
    setEditingId(null)
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData({
      ...editFormData,
      [field]: value,
    })
  }

  const calculateMonthlyAmount = (expense: ExpenseEntry): number => {
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

  const totalMonthlyExpense = expenses.reduce((sum, expense) => sum + calculateMonthlyAmount(expense), 0)

  const essentialExpenses = expenses
    .filter((expense) => expense.category === "essential")
    .reduce((sum, expense) => sum + calculateMonthlyAmount(expense), 0)

  const discretionaryExpenses = expenses
    .filter((expense) => expense.category === "discretionary")
    .reduce((sum, expense) => sum + calculateMonthlyAmount(expense), 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="expenseName">Expense Name</Label>
              <Input
                id="expenseName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rent, Groceries, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseAmount">Amount</Label>
              <Input
                id="expenseAmount"
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
              <Label htmlFor="expenseFrequency">Frequency</Label>
              <select
                id="expenseFrequency"
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
            <div className="space-y-2">
              <Label htmlFor="expenseCategory">Category</Label>
              <select
                id="expenseCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="essential">Essential</option>
                <option value="discretionary">Discretionary</option>
              </select>
            </div>
          </div>
          <Button onClick={handleAddExpense} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center text-muted-foreground">No expenses added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Monthly Equivalent</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    {editingId === expense.id ? (
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
                        <TableCell>
                          <select
                            value={editFormData.category}
                            onChange={(e) => handleEditFormChange("category", e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="essential">Essential</option>
                            <option value="discretionary">Discretionary</option>
                          </select>
                        </TableCell>
                        <TableCell>{formatCurrency(calculateMonthlyAmount({
                          ...expense,
                          amount: parseCurrencyInput(editFormData.amount),
                          frequency: editFormData.frequency
                        }))}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveEdit(expense.id)}
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
                        <TableCell>{expense.name}</TableCell>
                        <TableCell>{formatCurrency(expense.amount)}</TableCell>
                        <TableCell className="capitalize">{expense.frequency}</TableCell>
                        <TableCell className="capitalize">{expense.category}</TableCell>
                        <TableCell>{formatCurrency(calculateMonthlyAmount(expense))}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(expense)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="h-8 w-8"
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

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-gray-100 p-4">
              <p className="text-sm font-medium text-gray-500">Total Monthly Expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(totalMonthlyExpense)}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm font-medium text-gray-500">Essential Expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(essentialExpenses)}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-4">
              <p className="text-sm font-medium text-gray-500">Discretionary Expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(discretionaryExpenses)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
