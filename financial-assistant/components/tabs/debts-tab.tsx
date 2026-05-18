"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Trash2, Pencil, Check, X } from "lucide-react"
import type { DebtEntry } from "@/lib/types"
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils"

interface DebtsTabProps {
  debts: DebtEntry[]
  onUpdate: (debts: DebtEntry[]) => void
}

export default function DebtsTab({ debts, onUpdate }: DebtsTabProps) {
  const [name, setName] = useState("")
  const [balance, setBalance] = useState("")
  const [interestRate, setInterestRate] = useState("")
  const [minimumPayment, setMinimumPayment] = useState("")
  const [category, setCategory] = useState("credit-card")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<{
    name: string;
    balance: string;
    interestRate: string;
    minimumPayment: string;
    category: string;
  }>({
    name: "",
    balance: "",
    interestRate: "",
    minimumPayment: "",
    category: "credit-card",
  })

  const handleAddDebt = () => {
    if (!name || !balance) return

    const newDebt: DebtEntry = {
      id: Date.now().toString(),
      name,
      balance: parseCurrencyInput(balance),
      interestRate: interestRate ? Number.parseFloat(interestRate) : 0,
      minimumPayment: minimumPayment ? parseCurrencyInput(minimumPayment) : 0,
      category,
    }

    onUpdate([...debts, newDebt])

    // Reset form
    setName("")
    setBalance("")
    setInterestRate("")
    setMinimumPayment("")
    setCategory("credit-card")
  }

  const handleDeleteDebt = (id: string) => {
    onUpdate(debts.filter((debt) => debt.id !== id))
  }

  const handleEditClick = (debt: DebtEntry) => {
    setEditingId(debt.id)
    setEditFormData({
      name: debt.name,
      balance: formatCurrencyInput(debt.balance),
      interestRate: debt.interestRate.toString(),
      minimumPayment: formatCurrencyInput(debt.minimumPayment),
      category: debt.category,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const handleSaveEdit = (id: string) => {
    const updatedDebts = debts.map((debt) => {
      if (debt.id === id) {
        return {
          ...debt,
          name: editFormData.name,
          balance: parseCurrencyInput(editFormData.balance),
          interestRate: editFormData.interestRate ? Number.parseFloat(editFormData.interestRate) : 0,
          minimumPayment: parseCurrencyInput(editFormData.minimumPayment),
          category: editFormData.category,
        }
      }
      return debt
    })

    onUpdate(updatedDebts)
    setEditingId(null)
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData({
      ...editFormData,
      [field]: value,
    })
  }

  const totalDebtBalance = debts.reduce((sum, debt) => sum + debt.balance, 0)
  const totalMinimumPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0)

  const debtsByCategory = debts.reduce(
    (acc, debt) => {
      acc[debt.category] = (acc[debt.category] || 0) + debt.balance
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Debt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="debtName">Debt Name</Label>
              <Input
                id="debtName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Credit Card, Mortgage, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debtBalance">Balance</Label>
              <Input
                id="debtBalance"
                type="text"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                onBlur={(e) => {
                  // Format the value when the input loses focus
                  if (e.target.value) {
                    setBalance(formatCurrencyInput(parseCurrencyInput(e.target.value)))
                  }
                }}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debtInterestRate">Interest Rate (%)</Label>
              <Input
                id="debtInterestRate"
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debtMinimumPayment">Minimum Payment</Label>
              <Input
                id="debtMinimumPayment"
                type="text"
                value={minimumPayment}
                onChange={(e) => setMinimumPayment(e.target.value)}
                onBlur={(e) => {
                  // Format the value when the input loses focus
                  if (e.target.value) {
                    setMinimumPayment(formatCurrencyInput(parseCurrencyInput(e.target.value)))
                  }
                }}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debtCategory">Category</Label>
              <select
                id="debtCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="credit-card">Credit Card</option>
                <option value="mortgage">Mortgage</option>
                <option value="auto-loan">Auto Loan</option>
                <option value="student-loan">Student Loan</option>
                <option value="personal-loan">Personal Loan</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <Button onClick={handleAddDebt} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Debt
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debts</CardTitle>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <p className="text-center text-muted-foreground">No debts added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Minimum Payment</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((debt) => (
                  <TableRow key={debt.id}>
                    {editingId === debt.id ? (
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
                            value={editFormData.balance}
                            onChange={(e) => handleEditFormChange("balance", e.target.value)}
                            onBlur={(e) => {
                              if (e.target.value) {
                                handleEditFormChange(
                                  "balance",
                                  formatCurrencyInput(parseCurrencyInput(e.target.value))
                                )
                              }
                            }}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editFormData.interestRate}
                            onChange={(e) => handleEditFormChange("interestRate", e.target.value)}
                            className="w-full"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={editFormData.minimumPayment}
                            onChange={(e) => handleEditFormChange("minimumPayment", e.target.value)}
                            onBlur={(e) => {
                              if (e.target.value) {
                                handleEditFormChange(
                                  "minimumPayment",
                                  formatCurrencyInput(parseCurrencyInput(e.target.value))
                                )
                              }
                            }}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            value={editFormData.category}
                            onChange={(e) => handleEditFormChange("category", e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="credit-card">Credit Card</option>
                            <option value="mortgage">Mortgage</option>
                            <option value="auto-loan">Auto Loan</option>
                            <option value="student-loan">Student Loan</option>
                            <option value="personal-loan">Personal Loan</option>
                            <option value="other">Other</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveEdit(debt.id)}
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
                        <TableCell>{debt.name}</TableCell>
                        <TableCell>{formatCurrency(debt.balance)}</TableCell>
                        <TableCell>{debt.interestRate}%</TableCell>
                        <TableCell>{formatCurrency(debt.minimumPayment)}</TableCell>
                        <TableCell className="capitalize">{debt.category.replace("-", " ")}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(debt)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDebt(debt.id)}
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
              <p className="text-sm font-medium text-gray-500">Total Debt</p>
              <p className="text-2xl font-bold">{formatCurrency(totalDebtBalance)}</p>
            </div>
            <div className="rounded-lg bg-gray-100 p-4">
              <p className="text-sm font-medium text-gray-500">Monthly Minimum Payments</p>
              <p className="text-2xl font-bold">{formatCurrency(totalMinimumPayments)}</p>
            </div>
            <div className="rounded-lg bg-gray-100 p-4">
              <p className="text-sm font-medium text-gray-500">Debt Breakdown</p>
              <div className="mt-2 space-y-1 text-sm">
                {Object.entries(debtsByCategory).map(([category, value]) => (
                  <div key={category} className="flex justify-between">
                    <span className="capitalize">{category.replace("-", " ")}</span>
                    <span>{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
