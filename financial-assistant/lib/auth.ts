import { apiLogin, apiLogout, apiRegister, clearAuthToken, clearUserId } from "./api"
import { deleteSession } from "./session"

export async function login(email: string, password: string): Promise<void> {
  try {
    await apiLogin(email, password)
  } catch (error) {
    throw error
  }
}

export async function register(email: string, password: string): Promise<void> {
  try {
    await apiRegister(email, password)
  } catch (error) {
    throw error
  }
}

// Update the logout function to ensure proper cleanup
export async function logout(): Promise<void> {
  try {
    await apiLogout()

    // Clear all authentication data
    clearAuthToken()
    clearUserId()
    deleteSession()

    // Force a page reload to clear any in-memory state
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  } catch (error) {
    console.error("Logout failed:", error)

    // Even if the API call fails, clear local data and redirect
    clearAuthToken()
    clearUserId()
    deleteSession()

    if (typeof window !== "undefined") {
      window.location.href = "/"
    }

    throw error
  }
}

// Helper function to get the auth token
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

// Password reset functions
export async function requestPasswordReset(email: string): Promise<{
  success: boolean
  message?: string
  error?: string
  emailNotFound?: boolean
}> {
  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Password reset request failed:", data)
      throw new Error(data.error || "Failed to request password reset")
    }

    if (data.error) {
      throw new Error(data.error)
    }

    return data
  } catch (error) {
    console.error("Error in requestPasswordReset:", error)
    throw error
  }
}

// Update the validateResetToken function to handle errors better
export async function validateResetToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
  try {
    const response = await fetch("/api/auth/validate-reset-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })

    // Handle non-OK responses
    if (!response.ok) {
      console.error("Token validation response not OK:", response.status, response.statusText)
      return { valid: false, error: "Failed to validate token" }
    }

    const data = await response.json()
    console.log("Token validation response:", data)
    return data
  } catch (error) {
    console.error("Error in validateResetToken:", error)
    return { valid: false, error: "Failed to validate token" }
  }
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, newPassword }),
  })

  return await response.json()
}
