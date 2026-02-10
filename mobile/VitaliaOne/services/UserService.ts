/**
 * User Service - User authentication and data management
 */

export interface UserData {
  userId: string;
  phoneNumber: string;
  vidaBalance: number;
  nVidaBalance: number;
  isRegistered: boolean;
  truthBundleHash?: string;
}

// Mock user database (in production, use backend API)
const users = new Map<string, UserData>();

/**
 * Check if user exists
 */
export async function checkUserExists(phoneNumber: string): Promise<boolean> {
  // In production, call backend API
  return users.has(phoneNumber);
}

/**
 * Get user data
 */
export async function getUserData(phoneNumber: string): Promise<UserData | null> {
  // In production, call backend API
  return users.get(phoneNumber) || null;
}

/**
 * Save user data
 */
export async function saveUserData(userData: UserData): Promise<boolean> {
  // In production, call backend API
  users.set(userData.phoneNumber, userData);
  return true;
}

