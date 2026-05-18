"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { login, register } from "@/lib/auth"

export default function LoginForm() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password)
      }

      // Add a small delay to ensure localStorage is properly updated
      await new Promise((resolve) => setTimeout(resolve, 100))

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || (isLogin ? "Invalid login credentials" : "Registration failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isLogin ? "Login" : "Create Account"}</CardTitle>
        <CardDescription>
          {isLogin ? "Enter your credentials to access your account" : "Create a new account to get started"}
        </CardDescription>
      </CardHeader>
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {isLogin && (
            <div className="text-sm">
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Forgot your password?
              </Link>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : isLogin ? "Login" : "Create Account"}
          </Button>
          <Button type="button" variant="link" className="w-full" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
