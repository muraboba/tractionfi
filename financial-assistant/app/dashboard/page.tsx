"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Dashboard from "@/components/dashboard"
import { getSession } from "@/lib/session"
import { getUserId } from "@/lib/api"

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for user ID from API helper first (more reliable)
    const currentUserId = getUserId()

    if (!currentUserId) {
      // Fall back to session check
      const session = getSession()
      if (!session) {
        // Redirect to login page immediately with a hard navigation
        window.location.href = "/"
        return
      }
      setUserId(session.userId)
    } else {
      setUserId(currentUserId)
    }

    setLoading(false)
  }, [router])

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false)
        if (!userId) {
          // Use hard navigation instead of router.push
          window.location.href = "/"
        }
      }
    }, 2000) // 2 seconds timeout

    return () => clearTimeout(timer)
  }, [loading, userId, router])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!userId) {
    // Redirect to login page if no userId is found
    // Use hard navigation instead of showing an error
    window.location.href = "/"
    return <div className="flex h-screen items-center justify-center">Redirecting to login...</div>
  }

  return <Dashboard userId={userId} />
}
