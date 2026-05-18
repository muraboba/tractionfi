// Cloudflare Worker for Financial Assistant App

// Helper function to generate a random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

// Helper function to create a session token
function createSessionToken(userId) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  return btoa(JSON.stringify({ userId, expiresAt }))
}

// Helper function to validate a session token
function validateSessionToken(token) {
  try {
    const session = JSON.parse(atob(token))
    if (new Date(session.expiresAt) < new Date()) {
      return null
    }
    return session
  } catch (error) {
    return null
  }
}

// Helper function to handle CORS
function handleCors(request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  return corsHeaders
}

// Password hashing function using SHA-256
async function hashPassword(password, salt) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}

// Generate a random salt
function generateSalt() {
  return crypto.randomUUID()
}

// Verify password
async function verifyPassword(password, hashedPassword, salt) {
  const passwordHash = await hashPassword(password, salt)
  return passwordHash === hashedPassword
}

// Email validation function
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate a secure random token for password reset
function generateResetToken() {
  const buffer = new Uint8Array(32)
  crypto.getRandomValues(buffer)
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Email template for password reset
function getPasswordResetEmailTemplate(resetLink) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
    }
    .button {
      display: inline-block;
      background-color:rgb(195, 233, 255);
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <a href="${resetLink}" class="button">Reset Password</a>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    <p>This link will expire in 1 hour for security reasons.</p>
    <div class="footer">
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
  `
}

// Function to send password reset email using Resend
async function sendPasswordResetEmail(email, resetLink, env) {
  try {
    // Check if RESEND_API_KEY is available
    if (!env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not defined in environment variables")
      return {
        success: false,
        error: "Email service configuration error",
        details: "Missing API key",
      }
    }

    // Generate email content
    const htmlContent = getPasswordResetEmailTemplate(resetLink)

    console.log("Sending email to:", email)
    console.log("Reset link:", resetLink)

    // IMPORTANT: Use a more reliable from address
    const requestBody = {
      from: "reset@tractionfi.com",
      to: email,
      subject: "Reset Your Password",
      html: htmlContent,
    }

    console.log("Request body:", JSON.stringify(requestBody))

    // Send email using Resend API with timeout
    console.log("Sending request to Resend API...")
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Log the raw response for debugging
      const responseText = await response.text()
      console.log("Resend API response status:", response.status)
      console.log("Resend API response body:", responseText)

      // Parse the response if it's JSON
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse response as JSON:", e)
        responseData = { error: "Invalid JSON response" }
      }

      if (!response.ok) {
        console.error("Resend API error:", responseData)
        return {
          success: false,
          error: "Failed to send email",
          details: responseData,
          status: response.status,
        }
      }

      return { success: true, messageId: responseData.id }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === "AbortError") {
        console.error("Request timed out")
        return {
          success: false,
          error: "Request to email service timed out",
          details: "The request to Resend API timed out after 10 seconds",
        }
      }
      throw fetchError
    }
  } catch (error) {
    console.error("Error sending email:", error.message)
    console.error("Error stack:", error.stack)
    return { success: false, error: "Failed to send email", details: error.message }
  }
}

// API Routes
async function handleRequest(request, env) {
  const url = new URL(request.url)
  const path = url.pathname
  const corsHeaders = handleCors(request)

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  // API Routes
  if (path.startsWith("/api")) {
    // Authentication endpoints
    if (path === "/api/auth/login") {
      return handleLogin(request, env, corsHeaders)
    } else if (path === "/api/auth/register") {
      return handleRegister(request, env, corsHeaders)
    } else if (path === "/api/auth/logout") {
      return handleLogout(request, env, corsHeaders)
    } else if (path === "/api/auth/forgot-password") {
      return handleForgotPassword(request, env, corsHeaders)
    } else if (path === "/api/auth/reset-password") {
      return handleResetPassword(request, env, corsHeaders)
    } else if (path === "/api/auth/validate-reset-token") {
      return handleValidateResetToken(request, env, corsHeaders)
    }

    // User data endpoints
    if (path === "/api/user/data") {
      return handleUserData(request, env, corsHeaders)
    }

    // If no route matches
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  }

  // Serve static assets from the site
  if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
    let assetPath = path
    if (assetPath === "/" || assetPath.endsWith("/")) {
      assetPath += "index.html"
    }
    const assetURL = new URL(assetPath, request.url)
    const assetRequest = new Request(assetURL.toString(), request)
    return env.ASSETS.fetch(assetRequest)
  }

  // Fallback 404
  return new Response("Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain" },
  })
}

// Handle login requests
async function handleLogin(request, env, corsHeaders) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Get users from KV
    const usersJson = await env.USER_DATA.get("users")
    const users = usersJson ? JSON.parse(usersJson) : {}

    // Find user by email
    const user = Object.values(users).find((u) => u.email === email)

    // If user doesn't exist
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    let isAuthenticated = false
    const userId = user.id

    // Check if this is a legacy user with plain text password
    if (user.password && !user.passwordHash) {
      // Verify using plain text comparison (legacy)
      isAuthenticated = user.password === password

      // If authenticated, upgrade to secure password storage
      if (isAuthenticated) {
        const salt = generateSalt()
        const passwordHash = await hashPassword(password, salt)

        // Update user with secure password
        users[userId] = {
          ...user,
          passwordHash,
          salt,
          // Keep the password field for backward compatibility but mark it as deprecated
          password: "DEPRECATED - USING SECURE HASH",
        }

        // Save updated users
        await env.USER_DATA.put("users", JSON.stringify(users))
      }
    } else if (user.passwordHash && user.salt) {
      // Verify using secure method
      isAuthenticated = await verifyPassword(password, user.passwordHash, user.salt)
    }

    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Create session token
    const token = createSessionToken(userId)

    return new Response(JSON.stringify({ success: true, token, userId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  }
}

// Handle register requests
async function handleRegister(request, env, corsHeaders) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Get users from KV
    const usersJson = await env.USER_DATA.get("users")
    const users = usersJson ? JSON.parse(usersJson) : {}

    // Check if user already exists
    const existingUser = Object.values(users).find((u) => u.email === email)

    if (existingUser) {
      return new Response(JSON.stringify({ error: "User already exists" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Generate salt and hash password
    const salt = generateSalt()
    const passwordHash = await hashPassword(password, salt)

    // Create new user
    const userId = generateId()
    users[userId] = {
      id: userId,
      email,
      passwordHash,
      salt,
    }

    await env.USER_DATA.put("users", JSON.stringify(users))

    // Create session token
    const token = createSessionToken(userId)

    return new Response(JSON.stringify({ success: true, token, userId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  }
}

// Handle forgot password requests
async function handleForgotPassword(request, env, corsHeaders) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Get users from KV
    const usersJson = await env.USER_DATA.get("users")
    const users = usersJson ? JSON.parse(usersJson) : {}

    // Find user by email
    const user = Object.values(users).find((u) => u.email === email)

    // Log whether user was found
    console.log("User found for email reset:", !!user)

    // If user doesn't exist, inform the client
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          emailNotFound: true,
          message: "No account was found with this email address.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      )
    }

    // Generate a reset token
    const token = generateResetToken()
    const now = Date.now()
    const expiresAt = now + 60 * 60 * 1000 // 1 hour expiration

    // Store the token in KV
    const resetTokensJson = await env.USER_DATA.get("reset_tokens")
    console.log("Current reset tokens:", resetTokensJson)

    const resetTokens = resetTokensJson ? JSON.parse(resetTokensJson) : {}

    // Clean up expired tokens
    Object.keys(resetTokens).forEach((key) => {
      if (resetTokens[key].expiresAt < now) {
        delete resetTokens[key]
      }
    })

    // Add new token
    resetTokens[token] = {
      email,
      createdAt: now,
      expiresAt,
    }

    console.log("Storing new token:", token)
    console.log("Updated reset tokens:", JSON.stringify(resetTokens))

    // Save tokens to KV
    await env.USER_DATA.put("reset_tokens", JSON.stringify(resetTokens))

    // Verify token was stored correctly
    const verifyTokensJson = await env.USER_DATA.get("reset_tokens")
    console.log("Verification of stored tokens:", verifyTokensJson)

    // Generate reset link
    const baseUrl = new URL(request.url).origin
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    // Send email using Resend
    const emailResult = await sendPasswordResetEmail(email, resetLink, env)
    console.log("Email sending result:", emailResult)

    // IMPORTANT: Return detailed error information if email sending fails
    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send password reset email",
          details: emailResult,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset link sent to your email",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    )
  } catch (error) {
    console.error("Error in forgot password:", error)
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request", details: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    )
  }
}

// Handle validate reset token requests
async function handleValidateResetToken(request, env, corsHeaders) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  }

  try {
    const { token } = await request.json()

    if (!token) {
      return new Response(JSON.stringify({ valid: false, error: "Token is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Get reset tokens from KV
    const resetTokensJson = await env.USER_DATA.get("reset_tokens")

    // Log for debugging
    console.log("Reset tokens from KV:", resetTokensJson)

    const resetTokens = resetTokensJson ? JSON.parse(resetTokensJson) : {}

    // Check if token exists and is valid
    const tokenData = resetTokens[token]

    // Log token validation attempt
    console.log("Validating token:", token)
    console.log("Token data found:", tokenData)

    if (!tokenData) {
      return new Response(JSON.stringify({ valid: false, error: "Invalid or expired token" }), {
        status: 200, // Changed from 400 to 200 to ensure client receives the response
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Check if token is expired
    if (tokenData.expiresAt < Date.now()) {
      // Remove expired token
      delete resetTokens[token]
      await env.USER_DATA.put("reset_tokens", JSON.stringify(resetTokens))

      return new Response(JSON.stringify({ valid: false, error: "Token has expired" }), {
        status: 200, // Changed from 400 to 200
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    return new Response(JSON.stringify({ valid: true, email: tokenData.email }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error("Error validating reset token:", error)
    return new Response(JSON.stringify({ valid: false, error: "An error occurred processing your request" }), {
      status: 200, // Changed from 500 to 200
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  }
}

// Handle reset password requests
async function handleResetPassword(request, env, corsHeaders) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  }

  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return new Response(JSON.stringify({ error: "Token and new password are required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // No password complexity validation is performed as per requirements
    // NOTE: This is not recommended for production environments

    // Get reset tokens from KV
    const resetTokensJson = await env.USER_DATA.get("reset_tokens")
    const resetTokens = resetTokensJson ? JSON.parse(resetTokensJson) : {}

    // Check if token exists and is valid
    const tokenData = resetTokens[token]

    if (!tokenData) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Check if token is expired
    if (tokenData.expiresAt < Date.now()) {
      // Remove expired token
      delete resetTokens[token]
      await env.USER_DATA.put("reset_tokens", JSON.stringify(resetTokens))

      return new Response(JSON.stringify({ error: "Token has expired" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Get users from KV
    const usersJson = await env.USER_DATA.get("users")
    const users = usersJson ? JSON.parse(usersJson) : {}

    // Find user by email
    const user = Object.values(users).find((u) => u.email === tokenData.email)

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }

    // Update user's password
    const salt = generateSalt()
    const passwordHash = await hashPassword(newPassword, salt)

    users[user.id] = {
      ...user,
      passwordHash,
      salt,
      password: "DEPRECATED - USING SECURE HASH",
    }

    // Save updated users
    await env.USER_DATA.put("users", JSON.stringify(users))

    // Remove used token
    delete resetTokens[token]
    await env.USER_DATA.put("reset_tokens", JSON.stringify(resetTokens))

    return new Response(JSON.stringify({ success: true, message: "Password has been reset successfully" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error("Error resetting password:", error)
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  }
}

// Handle logout requests
async function handleLogout(request, env, corsHeaders) {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  })
}

// Handle user data requests
async function handleUserData(request, env, corsHeaders) {
  // Validate session token
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  }

  const token = authHeader.split(" ")[1]
  const session = validateSessionToken(token)

  if (!session) {
    return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  }

  const userId = session.userId

  // GET request - retrieve user data
  if (request.method === "GET") {
    const userDataKey = `user_data_${userId}`

    try {
      const userData = await env.USER_DATA.get(userDataKey)

      // If no data found, return default empty object
      if (!userData) {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        })
      }

      // Try parsing the data to ensure it's valid JSON
      try {
        JSON.parse(userData)
      } catch (e) {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        })
      }

      return new Response(userData, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    } catch (error) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }
  }

  // POST request - save user data
  if (request.method === "POST") {
    try {
      // Get the raw request body as text first
      const rawBody = await request.text()

      let data
      try {
        data = JSON.parse(rawBody)
      } catch (parseError) {
        return new Response(JSON.stringify({ error: "Invalid JSON in request" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        })
      }

      const userDataKey = `user_data_${userId}`

      // Validate that data is an object
      if (typeof data !== "object" || data === null) {
        return new Response(JSON.stringify({ error: "Invalid data format" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        })
      }

      // Convert data to string and save
      const dataString = JSON.stringify(data)
      await env.USER_DATA.put(userDataKey, dataString)

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to save data" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  })
}

// Export the event handler
export default {
  async fetch(request, env, ctx) {
    console.log("☑️ Worker invoked:", request.method, new URL(request.url).pathname)
    return handleRequest(request, env)
  },
}
