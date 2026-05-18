"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/login-form"
import { getSession, deleteSession } from "@/lib/session"
import { getUserId, clearAuthToken, clearUserId } from "@/lib/api"

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Clear any stale authentication data on initial load
    const path = window.location.pathname
    if (path === "/") {
      // Only clear auth data if we're on the home page and not coming from a redirect
      const fromRedirect = sessionStorage.getItem("fromRedirect")
      if (!fromRedirect) {
        clearAuthToken()
        clearUserId()
        deleteSession()
      }
      sessionStorage.removeItem("fromRedirect")
    }

    // Check both methods of authentication
    const userId = getUserId()
    const session = getSession()

    if (userId || session) {
      // Set a flag to indicate we're redirecting
      sessionStorage.setItem("fromRedirect", "true")
      router.push("/dashboard")
    } else {
      // No authentication found, show login form
      setLoading(false)
    }
  }, [router])

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000) // 1 second timeout

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Traction FI</h1>
          <p className="text-gray-600 mt-2">Accelerate Your Path to Financial Independence</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
