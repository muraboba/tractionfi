"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { validateResetToken, resetPassword } from "@/lib/auth"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState("")

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setTokenError("Missing reset token")
        setValidatingToken(false)
        return
      }

      try {
        const result = await validateResetToken(token)
        console.log("Token validation result:", result)

        if (result.valid) {
          setTokenValid(true)
        } else {
          setTokenError(result.error || "Invalid or expired token")
        }
      } catch (err) {
        console.error("Token validation error:", err)
        setTokenError("Failed to validate token. Please try requesting a new reset link.")
      } finally {
        setValidatingToken(false)
      }
    }

    checkToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Only validate that passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      if (!token) {
        throw new Error("Missing reset token")
      }

      const result = await resetPassword(token, password)

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || "Failed to reset password")
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (validatingToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-md text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Validating your reset token...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Traction FI</h1>
          <p className="text-gray-600 mt-2">Reset your password</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {tokenValid
                ? "Create a new password for your account. There are no password requirements."
                : "There was a problem with your reset link."}
            </CardDescription>
          </CardHeader>
          {!tokenValid ? (
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <p>{tokenError || "Invalid or expired token"}</p>
              </div>
              <Button asChild className="w-full mt-4">
                <Link href="/forgot-password">Request a new reset link</Link>
              </Button>
            </CardContent>
          ) : success ? (
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-md">
                <CheckCircle className="h-5 w-5" />
                <p>Your password has been reset successfully.</p>
              </div>
              <Button asChild className="w-full mt-4">
                <Link href="/">Login with your new password</Link>
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-md">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Processing..." : "Reset Password"}
                </Button>
                <Button asChild variant="link" className="w-full">
                  <Link href="/">Back to Login</Link>
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
