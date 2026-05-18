"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Trash2, Pencil, Check, X } from "lucide-react"
import type { AssetEntry } from "@/lib/types"
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils"

interface AssetsTabProps {
  assets: AssetEntry[]
  onUpdate: (assets: AssetEntry[]) => void
}

export default function AssetsTab({ assets, onUpdate }: AssetsTabProps) {
  const [name, setName] = useState("")
  const [value, setValue] = useState("")
  const [category, setCategory] = useState("cash")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<{
    name: string;
    value: string;
    category: string;
  }>({
    name: "",
    value: "",
    category: "cash",
  })

  const handleAddAsset = () => {
    if (!name || !value) return

    const newAsset: AssetEntry = {
      id: Date.now().toString(),
      name,
      value: parseCurrencyInput(value),
      category,
    }

    onUpdate([...assets, newAsset])

    // Reset form
    setName("")
    setValue("")
    setCategory("cash")
  }

  const handleDeleteAsset = (id: string) => {
    onUpdate(assets.filter((asset) => asset.id !== id))
  }

  const handleEditClick = (asset: AssetEntry) => {
    setEditingId(asset.id)
    setEditFormData({
      name: asset.name,
      value: formatCurrencyInput(asset.value),
      category: asset.category,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const handleSaveEdit = (id: string) => {
    const updatedAssets = assets.map((asset) => {
      if (asset.id === id) {
        return {
          ...asset,
          name: editFormData.name,
          value: parseCurrencyInput(editFormData.value),
          category: editFormData.category,
        }
      }
      return asset
    })

    onUpdate(updatedAssets)
    setEditingId(null)
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData({
      ...editFormData,
      [field]: value,
    })
  }

  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.value, 0)

  const assetsByCategory = assets.reduce(
    (acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + asset.value
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="assetName">Asset Name</Label>
              <Input
                id="assetName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Savings Account, Car, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetValue">Value</Label>
              <Input
                id="assetValue"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={(e) => {
                  // Format the value when the input loses focus
                  if (e.target.value) {
                    setValue(formatCurrencyInput(parseCurrencyInput(e.target.value)))
                  }
                }}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetCategory">Category</Label>
              <select
                id="assetCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="cash">Cash & Equivalents</option>
                <option value="investments">Investments</option>
                <option value="retirement">Retirement Accounts</option>
                <option value="property">Property</option>
                <option value="vehicle">Vehicles</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <Button onClick={handleAddAsset} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Asset
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <p className="text-center text-muted-foreground">No assets added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    {editingId === asset.id ? (
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
                            value={editFormData.value}
                            onChange={(e) => handleEditFormChange("value", e.target.value)}
                            onBlur={(e) => {
                              if (e.target.value) {
                                handleEditFormChange(
                                  "value",
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
                            <option value="cash">Cash & Equivalents</option>
                            <option value="investments">Investments</option>
                            <option value="retirement">Retirement Accounts</option>
                            <option value="property">Property</option>
                            <option value="vehicle">Vehicles</option>
                            <option value="other">Other</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveEdit(asset.id)}
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
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>{formatCurrency(asset.value)}</TableCell>
                        <TableCell className="capitalize">{asset.category}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(asset)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAsset(asset.id)}
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

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-100 p-4">
              <p className="text-sm font-medium text-gray-500">Total Assets</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAssetValue)}</p>
            </div>
            <div className="rounded-lg bg-gray-100 p-4">
              <p className="text-sm font-medium text-gray-500">Asset Breakdown</p>
              <div className="mt-2 space-y-1">
                {Object.entries(assetsByCategory).map(([category, value]) => (
                  <div key={category} className="flex justify-between">
                    <span className="capitalize">{category}</span>
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
