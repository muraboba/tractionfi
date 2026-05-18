"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { requestPasswordReset } from "@/lib/auth"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await requestPasswordReset(email)
      console.log("Password reset result:", result)

      if (result.emailNotFound) {
        setError("No account was found with this email address.")
      } else if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || "Failed to request password reset. Please try again later.")
      }
    } catch (err: any) {
      console.error("Password reset error:", err)
      setError(err.message || "Failed to request password reset. Please try again later.")
    } finally {
      setLoading(false)
    }
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
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          {success ? (
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-md">
                <CheckCircle className="h-5 w-5" />
                <p>
                  A password reset link has been sent to your email address. Please check your inbox and follow the
                  instructions to reset your password.
                </p>
              </div>
              <Button asChild className="w-full mt-4">
                <Link href="/">Return to Login</Link>
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
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
