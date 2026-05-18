import { type UserData, defaultUserData } from "./types"
import { apiGetUserData, apiSaveUserData } from "./api"

export async function getUserData(userId: string): Promise<UserData> {
  try {
    const data = await apiGetUserData<UserData>(defaultUserData)

    // Validate the data structure
    const isValidData =
      data &&
      typeof data === "object" &&
      "paycheck" in data &&
      "incomes" in data &&
      "expenses" in data &&
      "assets" in data &&
      "debts" in data

    if (!isValidData) {
      return defaultUserData
    }

    // Ensure arrays are properly initialized
    const sanitizedData = {
      ...data,
      incomes: Array.isArray(data.incomes) ? data.incomes : [],
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      assets: Array.isArray(data.assets) ? data.assets : [],
      debts: Array.isArray(data.debts) ? data.debts : [],
    }

    return sanitizedData
  } catch (error) {
    // Check if this is an authentication error
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") || error.message.includes("Session expired"))
    ) {
      throw error // Rethrow auth errors to trigger redirect
    }

    return defaultUserData
  }
}

export async function saveUserData(userId: string, data: UserData): Promise<void> {
  try {
    // Validate data before saving
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data format")
    }

    await apiSaveUserData<UserData>(data)
  } catch (error) {
    throw error
  }
}
