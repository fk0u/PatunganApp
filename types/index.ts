// Basic user and profile types
export interface User {
  id: string
  name: string
  email: string
  photoURL?: string
  createdAt: string
}

export interface UserProfile extends User {
  phoneNumber?: string
  preferredPaymentMethods?: PaymentMethod[]
}

// Session management types
export interface Session {
  id: string
  title: string
  description?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  participants: Participant[]
  transactions: Transaction[]
  isActive: boolean
  inviteCode?: string
}

export interface Participant {
  id: string
  name: string
  email?: string
  photoURL?: string
  isCreator?: boolean
  joinedAt: string
}

// Transaction related types
export interface Transaction {
  id: string
  sessionId: string
  title: string
  description?: string
  amount: number
  paidBy: string
  paidByName: string
  date: string
  category?: string
  receiptImageUrl?: string
  receiptItems?: ReceiptItem[]
  createdAt: string
  updatedAt: string
}

export interface ReceiptItem {
  id: string
  name: string
  price: number
  quantity: number
  participants: string[] // IDs of participants who share this item
}

// Payment and debt related types
export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'other'

export interface Payment {
  id: string
  sessionId: string
  transactionId?: string
  fromUserId: string
  toUserId: string
  amount: number
  method: PaymentMethod
  status: 'pending' | 'completed' | 'cancelled'
  date: string
  notes?: string
}

export interface DebtCalculation {
  from: string
  to: string
  fromName: string
  toName: string
  amount: number
  status: 'pending' | 'paid'
}

// Receipt scanning types
export interface ScannedReceipt {
  items: ScannedReceiptItem[]
  merchantName?: string
  date?: string
  totalAmount?: number
  taxAmount?: number
  rawText?: string
}

export interface ScannedReceiptItem {
  id: string
  name: string
  price: number
  quantity: number
}

// Invitation types
export interface SessionInvite {
  code: string
  sessionId: string
  createdBy: string
  createdAt: string
  expiresAt?: string
  usageLimit?: number
  usageCount: number
  isActive: boolean
}
