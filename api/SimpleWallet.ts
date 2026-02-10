/**
 * Simple Wallet API - Non-Crypto Friendly Interface
 * 
 * Simplified API for users who don't understand crypto.
 * 
 * Features:
 * - viewNairaValue(): See balance in Naira, not VIDA
 * - easySell(): One-tap sell with instant settlement
 * - sendToPhone(): Send money using phone number
 * 
 * NO mention of: Gas, Slippage, Public Keys, Private Keys, Blockchain
 * 
 * "Your money. Your phone. That's it."
 * 
 * Born in Lagos, Nigeria. Built for Everyone.
 */

import { createAndMatchSellOrder } from '../logic/P2PEngine';

// ============ TYPES ============

export interface WalletBalance {
  nairaValue: number; // Total value in Naira
  vidaAmount: number; // VIDA balance (hidden from UI)
  lastUpdated: string; // Human-readable timestamp
}

export interface SellResult {
  success: boolean;
  amountReceived: number; // Naira received
  message: string; // User-friendly message
  estimatedArrival: string; // "Instant" or "Within 1 minute"
}

export interface SendResult {
  success: boolean;
  amountSent: number; // Naira sent
  recipientPhone: string;
  message: string;
  confirmationCode: string;
}

export interface TransactionHistory {
  date: string;
  description: string;
  amount: number; // Naira
  type: 'RECEIVED' | 'SENT' | 'SOLD';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

// ============ CONSTANTS ============

const CURRENT_VIDA_PRICE = 1000; // ₦1000 per VIDA (from oracle)

// ============ MOCK USER DATABASE ============

interface UserAccount {
  userId: string;
  phoneNumber: string;
  vidaBalance: number;
  nVidaBalance: number;
  transactions: TransactionHistory[];
}

const userAccounts = new Map<string, UserAccount>();

// ============ CORE WALLET FUNCTIONS ============

/**
 * View Naira Value (NO crypto jargon)
 * @param phoneNumber User's phone number
 * @returns Wallet balance in Naira
 */
export async function viewNairaValue(phoneNumber: string): Promise<WalletBalance> {
  const user = getUserByPhone(phoneNumber);
  
  if (!user) {
    return {
      nairaValue: 0,
      vidaAmount: 0,
      lastUpdated: new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }),
    };
  }
  
  // Calculate total Naira value
  const vidaNairaValue = user.vidaBalance * CURRENT_VIDA_PRICE;
  const totalNairaValue = vidaNairaValue + user.nVidaBalance;
  
  return {
    nairaValue: totalNairaValue,
    vidaAmount: user.vidaBalance, // Hidden from UI
    lastUpdated: new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }),
  };
}

/**
 * Easy Sell (ONE-TAP, NO complexity)
 * @param phoneNumber User's phone number
 * @param nairaAmount Amount in Naira to sell (NOT VIDA)
 * @returns Sell result
 */
export async function easySell(phoneNumber: string, nairaAmount: number): Promise<SellResult> {
  const user = getUserByPhone(phoneNumber);
  
  if (!user) {
    return {
      success: false,
      amountReceived: 0,
      message: 'Account not found. Please register first.',
      estimatedArrival: '',
    };
  }
  
  // Convert Naira to VIDA
  const vidaToSell = nairaAmount / CURRENT_VIDA_PRICE;
  
  // Check if user has enough VIDA
  if (vidaToSell > user.vidaBalance) {
    return {
      success: false,
      amountReceived: 0,
      message: `Insufficient balance. You have ₦${(user.vidaBalance * CURRENT_VIDA_PRICE).toLocaleString()}.`,
      estimatedArrival: '',
    };
  }
  
  try {
    // Execute P2P trade (instant matching)
    const matchResult = await createAndMatchSellOrder(user.userId, vidaToSell, CURRENT_VIDA_PRICE);
    
    if (matchResult.success) {
      // Update user balance
      user.vidaBalance -= vidaToSell;
      user.nVidaBalance += matchResult.nairaAmount;
      
      // Add transaction to history
      user.transactions.push({
        date: new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }),
        description: 'Sold VIDA',
        amount: matchResult.nairaAmount,
        type: 'SOLD',
        status: 'COMPLETED',
      });
      
      return {
        success: true,
        amountReceived: matchResult.nairaAmount,
        message: `Success! ₦${matchResult.nairaAmount.toLocaleString()} added to your wallet.`,
        estimatedArrival: 'Instant',
      };
    } else {
      return {
        success: false,
        amountReceived: 0,
        message: 'Sale failed. Please try again.',
        estimatedArrival: '',
      };
    }
  } catch (error) {
    console.error('[SimpleWallet] easySell error:', error);
    
    return {
      success: false,
      amountReceived: 0,
      message: 'Something went wrong. Please try again later.',
      estimatedArrival: '',
    };
  }
}

/**
 * Send to Phone (NO wallet addresses)
 * @param senderPhone Sender's phone number
 * @param recipientPhone Recipient's phone number
 * @param nairaAmount Amount in Naira to send
 * @returns Send result
 */
export async function sendToPhone(
  senderPhone: string,
  recipientPhone: string,
  nairaAmount: number
): Promise<SendResult> {
  const sender = getUserByPhone(senderPhone);
  
  if (!sender) {
    return {
      success: false,
      amountSent: 0,
      recipientPhone,
      message: 'Your account not found.',
      confirmationCode: '',
    };
  }
  
  // Check if sender has enough nVIDA
  if (nairaAmount > sender.nVidaBalance) {
    return {
      success: false,
      amountSent: 0,
      recipientPhone,
      message: `Insufficient balance. You have ₦${sender.nVidaBalance.toLocaleString()}.`,
      confirmationCode: '',
    };
  }
  
  // Get or create recipient account
  let recipient = getUserByPhone(recipientPhone);
  
  if (!recipient) {
    // Create new account for recipient
    recipient = createUserAccount(recipientPhone);
  }
  
  try {
    // Transfer nVIDA
    sender.nVidaBalance -= nairaAmount;
    recipient.nVidaBalance += nairaAmount;
    
    // Generate confirmation code
    const confirmationCode = `VIT${Date.now().toString().slice(-6)}`;
    
    // Add transactions to history
    sender.transactions.push({
      date: new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }),
      description: `Sent to ${recipientPhone}`,
      amount: -nairaAmount,
      type: 'SENT',
      status: 'COMPLETED',
    });
    
    recipient.transactions.push({
      date: new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }),
      description: `Received from ${senderPhone}`,
      amount: nairaAmount,
      type: 'RECEIVED',
      status: 'COMPLETED',
    });
    
    return {
      success: true,
      amountSent: nairaAmount,
      recipientPhone,
      message: `₦${nairaAmount.toLocaleString()} sent to ${recipientPhone}`,
      confirmationCode,
    };
  } catch (error) {
    console.error('[SimpleWallet] sendToPhone error:', error);
    
    return {
      success: false,
      amountSent: 0,
      recipientPhone,
      message: 'Transfer failed. Please try again.',
      confirmationCode: '',
    };
  }
}

// ============ TRANSACTION HISTORY ============

/**
 * Get transaction history (user-friendly)
 * @param phoneNumber User's phone number
 * @param limit Number of transactions to return
 * @returns Transaction history
 */
export async function getTransactionHistory(
  phoneNumber: string,
  limit: number = 20
): Promise<TransactionHistory[]> {
  const user = getUserByPhone(phoneNumber);

  if (!user) {
    return [];
  }

  return user.transactions.slice(-limit).reverse();
}

// ============ ACCOUNT MANAGEMENT ============

/**
 * Create user account
 */
function createUserAccount(phoneNumber: string): UserAccount {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const account: UserAccount = {
    userId,
    phoneNumber,
    vidaBalance: 0,
    nVidaBalance: 0,
    transactions: [],
  };

  userAccounts.set(phoneNumber, account);

  console.log(`[SimpleWallet] 📱 New account created: ${phoneNumber}`);

  return account;
}

/**
 * Get user by phone number
 */
function getUserByPhone(phoneNumber: string): UserAccount | undefined {
  return userAccounts.get(phoneNumber);
}

/**
 * Register new user (simplified onboarding)
 * @param phoneNumber User's phone number
 * @param initialVida Initial VIDA allocation (20 VIDA: 10 to user, 10 to vault)
 * @returns Registration result
 */
export async function registerUser(
  phoneNumber: string,
  initialVida: number = 10
): Promise<{
  success: boolean;
  message: string;
  nairaValue: number;
}> {
  // Check if user already exists
  if (userAccounts.has(phoneNumber)) {
    return {
      success: false,
      message: 'Phone number already registered.',
      nairaValue: 0,
    };
  }

  // Create account
  const account = createUserAccount(phoneNumber);

  // Allocate initial VIDA (10 VIDA to user, 10 VIDA to vault)
  account.vidaBalance = initialVida;

  // Add welcome transaction
  account.transactions.push({
    date: new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }),
    description: 'Welcome bonus',
    amount: initialVida * CURRENT_VIDA_PRICE,
    type: 'RECEIVED',
    status: 'COMPLETED',
  });

  const nairaValue = initialVida * CURRENT_VIDA_PRICE;

  return {
    success: true,
    message: `Welcome! You received ₦${nairaValue.toLocaleString()}.`,
    nairaValue,
  };
}

// ============ HELPER FUNCTIONS ============

/**
 * Format Naira amount (user-friendly)
 */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get current exchange rate (hidden from user)
 */
export function getCurrentRate(): number {
  return CURRENT_VIDA_PRICE;
}

/**
 * Calculate VIDA from Naira (internal use only)
 */
export function nairaToVida(nairaAmount: number): number {
  return nairaAmount / CURRENT_VIDA_PRICE;
}

/**
 * Calculate Naira from VIDA (internal use only)
 */
export function vidaToNaira(vidaAmount: number): number {
  return vidaAmount * CURRENT_VIDA_PRICE;
}

// ============ SIMPLIFIED UI RESPONSES ============

/**
 * Get wallet summary (NO crypto terms)
 */
export async function getWalletSummary(phoneNumber: string): Promise<{
  totalBalance: string; // "₦10,000.00"
  canSell: boolean;
  canSend: boolean;
  recentActivity: string; // "You sold ₦5,000 today"
}> {
  const balance = await viewNairaValue(phoneNumber);
  const history = await getTransactionHistory(phoneNumber, 5);

  const canSell = balance.vidaAmount > 0;
  const canSend = balance.nairaValue > 0;

  // Generate recent activity message
  let recentActivity = 'No recent activity';
  if (history.length > 0) {
    const latest = history[0];
    const timeAgo = getTimeAgo(new Date(latest.date));
    recentActivity = `${latest.description} ${timeAgo}`;
  }

  return {
    totalBalance: formatNaira(balance.nairaValue),
    canSell,
    canSend,
    recentActivity,
  };
}

/**
 * Get time ago (user-friendly)
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-NG');
}

// ============ TESTING ============

/**
 * Create test accounts
 */
export function createTestAccounts(): void {
  // Create test user 1
  const user1 = createUserAccount('+234-800-111-1111');
  user1.vidaBalance = 100;
  user1.nVidaBalance = 50000;

  // Create test user 2
  const user2 = createUserAccount('+234-800-222-2222');
  user2.vidaBalance = 50;
  user2.nVidaBalance = 25000;

  console.log('[SimpleWallet] 🧪 Test accounts created');
}

/**
 * Get all accounts (admin only)
 */
export function getAllAccounts(): UserAccount[] {
  return Array.from(userAccounts.values());
}

/**
 * Get account statistics
 */
export function getAccountStats(): {
  totalUsers: number;
  totalVidaBalance: number;
  totalNVidaBalance: number;
  totalTransactions: number;
} {
  const accounts = Array.from(userAccounts.values());

  return {
    totalUsers: accounts.length,
    totalVidaBalance: accounts.reduce((sum, acc) => sum + acc.vidaBalance, 0),
    totalNVidaBalance: accounts.reduce((sum, acc) => sum + acc.nVidaBalance, 0),
    totalTransactions: accounts.reduce((sum, acc) => sum + acc.transactions.length, 0),
  };
}

