// Client-side session management using localStorage
import { getUserId } from "./api"

export function encrypt(data: any): string {
  return JSON.stringify(data)
}

export function decrypt(data: string | null): any {
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch (error) {
    return null
  }
}

export function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const session = encrypt({ userId, expiresAt })

  localStorage.setItem("session", session)
}

export function getSession() {
  const userId = getUserId()

  if (!userId) {
    return null
  }

  return { userId }
}

// Ensure deleteSession properly clears all session data
export function deleteSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem("session")
  localStorage.removeItem("auth_token")
  localStorage.removeItem("user_id")
}
