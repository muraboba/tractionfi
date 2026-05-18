// API client for communicating with Cloudflare Worker

// Base URL for API requests
const API_BASE_URL = "/api"

// Helper function to get the API URL
function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`
}

// Helper function to get the auth token
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

// Helper function to set the auth token
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("auth_token", token)
}

// Helper function to clear the auth token
export function clearAuthToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("auth_token")
}

// Helper function to get the user ID
export function getUserId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("user_id")
}

// Helper function to set the user ID
export function setUserId(userId: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("user_id", userId)
}

// Helper function to clear the user ID
export function clearUserId(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("user_id")
}

// Login API
export async function apiLogin(email: string, password: string): Promise<{ token: string; userId: string }> {
  const response = await fetch(getApiUrl("/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Login failed")
  }

  const data = await response.json()

  // Store token and user ID
  setAuthToken(data.token)
  setUserId(data.userId)

  return data
}

// Register API
export async function apiRegister(email: string, password: string): Promise<{ token: string; userId: string }> {
  const response = await fetch(getApiUrl("/auth/register"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Registration failed")
  }

  const data = await response.json()

  // Store token and user ID
  setAuthToken(data.token)
  setUserId(data.userId)

  return data
}

// Logout API
export async function apiLogout(): Promise<void> {
  try {
    await fetch(getApiUrl("/auth/logout"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })
  } catch (error) {
    // Continue with logout even if the API call fails
    console.error("API logout error:", error)
  } finally {
    // Always clear tokens regardless of API response
    clearAuthToken()
    clearUserId()
  }
}

// Get user data API
export async function apiGetUserData<T>(defaultData: T): Promise<T> {
  const token = getAuthToken()

  if (!token) {
    throw new Error("Not authenticated")
  }

  try {
    const response = await fetch(getApiUrl("/user/data"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Clear token and user ID if unauthorized
        clearAuthToken()
        clearUserId()
        throw new Error("Session expired")
      }

      throw new Error(`Failed to get user data: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // If the response is an empty object, return the default data
    return Object.keys(data).length === 0 ? defaultData : (data as T)
  } catch (error) {
    throw error
  }
}

// Save user data API
export async function apiSaveUserData<T>(data: T): Promise<void> {
  const token = getAuthToken()

  if (!token) {
    throw new Error("Not authenticated")
  }

  try {
    const response = await fetch(getApiUrl("/user/data"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Clear token and user ID if unauthorized
        clearAuthToken()
        clearUserId()
        throw new Error("Session expired")
      }

      const errorText = await response.text()
      throw new Error(`Failed to save user data: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    throw error
  }
}
