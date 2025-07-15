"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  arrayUnion, 
  arrayRemove, 
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Types
interface Participant {
  userId: string
  displayName: string
  avatarUrl?: string
  share?: number
  status: 'active' | 'invited' | 'removed'
}

interface Payment {
  payerId: string
  payerName: string
  amount: number
  timestamp: number
}

interface Transaction {
  id: string
  name: string
  description?: string
  amount: number
  date: number
  category?: string
  payments: Payment[]
  participants: string[] // userIds of participants involved in this transaction
  receiptImageUrl?: string
  receiptItems?: {
    name: string
    price: number
    quantity: number
    assignedTo: string[]
  }[]
  createdBy: string
  createdAt: number
  updatedAt: number
}

interface Session {
  id: string
  name: string
  description?: string
  startDate: number
  endDate?: number
  participants: Participant[]
  transactions: Transaction[]
  status: 'active' | 'completed' | 'cancelled'
  totalAmount: number
  createdBy: string
  createdAt: number
  updatedAt: number
  groupId?: string
}

interface DebtCalculation {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
}

interface SessionContextType {
  userSessions: Session[]
  loading: boolean
  error: string | null
  
  // Session operations
  createSession: (sessionData: Omit<Session, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'status' | 'transactions' | 'totalAmount'>) => Promise<Session>
  getSessionById: (sessionId: string) => Promise<Session | null>
  updateSession: (sessionId: string, updates: Partial<Omit<Session, 'id' | 'createdBy' | 'createdAt'>>) => Promise<void>
  completeSession: (sessionId: string) => Promise<void>
  cancelSession: (sessionId: string) => Promise<void>
  
  // Transaction operations
  addTransaction: (sessionId: string, transaction: Omit<Transaction, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>
  updateTransaction: (sessionId: string, transactionId: string, updates: Partial<Omit<Transaction, 'id' | 'createdBy' | 'createdAt'>>) => Promise<void>
  removeTransaction: (sessionId: string, transactionId: string) => Promise<void>
  
  // Participant operations
  addParticipant: (sessionId: string, userId: string, displayName: string, avatarUrl?: string) => Promise<void>
  removeParticipant: (sessionId: string, userId: string) => Promise<void>
  
  // Payment operations
  recordPayment: (sessionId: string, transactionId: string, payment: Omit<Payment, 'timestamp'>) => Promise<void>
  
  // Debt calculation
  calculateDebts: (sessionId: string) => Promise<DebtCalculation[]>
  
  // Helper
  refreshSessions: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function useSessions() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSessions must be used within a SessionProvider')
  }
  return context
}

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { user } = useAuth()
  const [userSessions, setUserSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's sessions on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchUserSessions()
    } else {
      setUserSessions([])
      setLoading(false)
    }
  }, [user])

  // Fetch all sessions where the user is a participant
  const fetchUserSessions = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Query sessions where user is a participant
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('participants', 'array-contains', {
          userId: user.uid,
          status: 'active'
        })
      )
      
      // Query sessions created by the user
      const createdSessionsQuery = query(
        collection(db, 'sessions'),
        where('createdBy', '==', user.uid)
      )
      
      const [participantSnapshot, creatorSnapshot] = await Promise.all([
        getDocs(sessionsQuery),
        getDocs(createdSessionsQuery)
      ])
      
      const sessionsAsParticipant = participantSnapshot.docs.map(doc => 
        ({ id: doc.id, ...doc.data() }) as Session
      )
      
      const sessionsAsCreator = creatorSnapshot.docs.map(doc => 
        ({ id: doc.id, ...doc.data() }) as Session
      )
      
      // Combine and deduplicate
      const allSessions = [...sessionsAsParticipant]
      
      // Add sessions where user is creator but not in participants list
      sessionsAsCreator.forEach(session => {
        if (!allSessions.some(s => s.id === session.id)) {
          allSessions.push(session)
        }
      })
      
      setUserSessions(allSessions)
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError('Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }

  const refreshSessions = async () => {
    await fetchUserSessions()
  }

  const createSession = async (
    sessionData: Omit<Session, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'status' | 'transactions' | 'totalAmount'>
  ): Promise<Session> => {
    if (!user) throw new Error('User must be logged in to create a session')
    
    try {
      // Ensure the current user is one of the participants (as creator)
      const creatorParticipant: Participant = {
        userId: user.uid,
        displayName: user.displayName || user.email || 'User',
        avatarUrl: user.photoURL || undefined,
        status: 'active'
      }
      
      // Create the session object with empty transactions array
      const newSession: Omit<Session, 'id'> = {
        ...sessionData,
        transactions: [],
        totalAmount: 0,
        createdBy: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active',
        participants: [
          ...sessionData.participants,
          creatorParticipant
        ].filter((p, i, self) => 
          // Remove duplicates based on userId
          self.findIndex(p2 => p2.userId === p.userId) === i
        )
      }
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'sessions'), newSession)
      
      // Get the created session with ID
      const createdSession = { id: docRef.id, ...newSession }
      
      // Update local state
      setUserSessions(prevSessions => [...prevSessions, createdSession])
      
      return createdSession
    } catch (err) {
      console.error('Error creating session:', err)
      setError('Failed to create session')
      throw new Error('Failed to create session')
    }
  }

  const getSessionById = async (sessionId: string): Promise<Session | null> => {
    try {
      const sessionRef = doc(db, 'sessions', sessionId)
      const sessionDoc = await getDoc(sessionRef)
      
      if (sessionDoc.exists()) {
        return { id: sessionDoc.id, ...sessionDoc.data() } as Session
      }
      
      return null
    } catch (err) {
      console.error('Error getting session:', err)
      setError('Failed to fetch session')
      return null
    }
  }

  const updateSession = async (
    sessionId: string, 
    updates: Partial<Omit<Session, 'id' | 'createdBy' | 'createdAt'>>
  ) => {
    if (!user) throw new Error('User must be logged in to update a session')
    
    try {
      // Get the current session
      const sessionRef = doc(db, 'sessions', sessionId)
      const sessionDoc = await getDoc(sessionRef)
      
      if (!sessionDoc.exists()) {
        throw new Error('Session not found')
      }
      
      const session = sessionDoc.data() as Session
      
      // Check if user is authorized (creator or participant)
      const isParticipant = session.participants.some(p => p.userId === user.uid && p.status === 'active')
      if (session.createdBy !== user.uid && !isParticipant) {
        throw new Error('Not authorized to update this session')
      }
      
      // Update the session
      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: Date.now()
      })
      
      // Update local state
      setUserSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === sessionId 
            ? { 
                ...session, 
                ...updates, 
                updatedAt: Date.now() 
              } 
            : session
        )
      )
    } catch (err) {
      console.error('Error updating session:', err)
      setError('Failed to update session')
      throw err
    }
  }

  const completeSession = async (sessionId: string) => {
    await updateSession(sessionId, { status: 'completed' })
  }

  const cancelSession = async (sessionId: string) => {
    await updateSession(sessionId, { status: 'cancelled' })
  }

  const addTransaction = async (
    sessionId: string, 
    transaction: Omit<Transaction, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>
  ): Promise<Transaction> => {
    if (!user) throw new Error('User must be logged in to add a transaction')
    
    try {
      // Get the current session
      const sessionRef = doc(db, 'sessions', sessionId)
      const sessionDoc = await getDoc(sessionRef)
      
      if (!sessionDoc.exists()) {
        throw new Error('Session not found')
      }
      
      const session = sessionDoc.data() as Session
      
      // Check if user is authorized (creator or participant)
      const isParticipant = session.participants.some(p => p.userId === user.uid && p.status === 'active')
      if (session.createdBy !== user.uid && !isParticipant) {
        throw new Error('Not authorized to add transactions to this session')
      }
      
      // Create the transaction object
      const newTransaction: Transaction = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate a unique ID
        ...transaction,
        createdBy: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      
      // Add transaction to session
      await updateDoc(sessionRef, {
        transactions: arrayUnion(newTransaction),
        totalAmount: session.totalAmount + transaction.amount,
        updatedAt: Date.now()
      })
      
      // Update local state
      setUserSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              transactions: [...session.transactions, newTransaction],
              totalAmount: session.totalAmount + transaction.amount,
              updatedAt: Date.now()
            }
          }
          return session
        })
      )
      
      return newTransaction
    } catch (err) {
      console.error('Error adding transaction:', err)
      setError('Failed to add transaction')
      throw new Error('Failed to add transaction')
    }
  }

  const updateTransaction = async (
    sessionId: string, 
    transactionId: string, 
    updates: Partial<Omit<Transaction, 'id' | 'createdBy' | 'createdAt'>>
  ) => {
    if (!user) throw new Error('User must be logged in to update a transaction')
    
    try {
      // Get the current session
      const sessionRef = doc(db, 'sessions', sessionId)
      const sessionDoc = await getDoc(sessionRef)
      
      if (!sessionDoc.exists()) {
        throw new Error('Session not found')
      }
      
      const session = sessionDoc.data() as Session
      
      // Check if user is authorized (creator or participant)
      const isParticipant = session.participants.some(p => p.userId === user.uid && p.status === 'active')
      if (session.createdBy !== user.uid && !isParticipant) {
        throw new Error('Not authorized to update transactions in this session')
      }
      
      // Find the transaction
      const transactionIndex = session.transactions.findIndex(t => t.id === transactionId)
      
      if (transactionIndex === -1) {
        throw new Error('Transaction not found')
      }
      
      const oldTransaction = session.transactions[transactionIndex]
      const amountDifference = (updates.amount !== undefined) ? updates.amount - oldTransaction.amount : 0
      
      // Update the transaction
      const updatedTransactions = [...session.transactions]
      updatedTransactions[transactionIndex] = {
        ...oldTransaction,
        ...updates,
        updatedAt: Date.now()
      }
      
      // Update session with new transactions array and adjusted total amount
      await updateDoc(sessionRef, {
        transactions: updatedTransactions,
        totalAmount: session.totalAmount + amountDifference,
        updatedAt: Date.now()
      })
      
      // Update local state
      setUserSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              transactions: updatedTransactions,
              totalAmount: session.totalAmount + amountDifference,
              updatedAt: Date.now()
            }
          }
          return session
        })
      )
    } catch (err) {
      console.error('Error updating transaction:', err)
      setError('Failed to update transaction')
      throw err
    }
  }

  const removeTransaction = async (sessionId: string, transactionId: string) => {
    if (!user) throw new Error('User must be logged in to remove a transaction')
    
    try {
      // Get the current session
      const sessionRef = doc(db, 'sessions', sessionId)
      const sessionDoc = await getDoc(sessionRef)
      
      if (!sessionDoc.exists()) {
        throw new Error('Session not found')
      }
      
      const session = sessionDoc.data() as Session
      
      // Check if user is authorized (creator)
      if (session.createdBy !== user.uid) {
        throw new Error('Not authorized to remove transactions from this session')
      }
      
      // Find the transaction to remove
      const transaction = session.transactions.find(t => t.id === transactionId)
      
      if (!transaction) {
        throw new Error('Transaction not found')
      }
      
      // Remove the transaction
      const updatedTransactions = session.transactions.filter(t => t.id !== transactionId)
      
      // Update session with new transactions array and adjusted total amount
      await updateDoc(sessionRef, {
        transactions: updatedTransactions,
        totalAmount: session.totalAmount - transaction.amount,
        updatedAt: Date.now()
      })
      
      // Update local state
      setUserSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              transactions: updatedTransactions,
              totalAmount: session.totalAmount - transaction.amount,
              updatedAt: Date.now()
            }
          }
          return session
        })
      )
    } catch (err) {
      console.error('Error removing transaction:', err)
      setError('Failed to remove transaction')
      throw err
    }
  }

  const addParticipant = async (
    sessionId: string, 
    userId: string, 
    displayName: string,
    avatarUrl?: string
  ) => {
    if (!user) throw new Error('User must be logged in to add participants')
    
    try {
      // Get the current session
      const sessionRef = doc(db, 'sessions', sessionId)
      const sessionDoc = await getDoc(sessionRef)
      
      if (!sessionDoc.exists()) {
        throw new Error('Session not found')
      }
      
      const session = sessionDoc.data() as Session
      
      // Check if user is authorized (creator)
      if (session.createdBy !== user.uid) {
        throw new Error('Not authorized to add participants')
      }
      
      // Check if user is already a participant
      if (session.participants.some(p => p.userId === userId)) {
        throw new Error('User is already a participant')
      }
      
      // Add the new participant
      const newParticipant: Participant = {
        userId,
        displayName,
        avatarUrl,
        status: 'invited' // Initially invited, needs to accept
      }
      
      // Update session participants
      await updateDoc(sessionRef, {
        participants: arrayUnion(newParticipant),
        updatedAt: Date.now()
      })
      
      // Update local state
      setUserSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              participants: [...session.participants, newParticipant],
              updatedAt: Date.now()
            }
          }
          return session
        })
      )
    } catch (err) {
      console.error('Error adding participant:', err)
      setError('Failed to add participant')
      throw err
    }
  }

  const removeParticipant = async (sessionId: string, userId: string) => {
    if (!user) throw new Error('User must be logged in to remove participants')
    
    try {
      // Get the current session
      const sessionRef = doc(db, 'sessions', sessionId)
      const sessionDoc = await getDoc(sessionRef)
      
      if (!sessionDoc.exists()) {
        throw new Error('Session not found')
      }
      
      const session = sessionDoc.data() as Session
      
      // Check if user is authorized (creator, or removing self)
      if (session.createdBy !== user.uid && userId !== user.uid) {
        throw new Error('Not authorized to remove this participant')
      }
      
      // Check if trying to remove creator
      if (userId === session.createdBy) {
        throw new Error('Cannot remove the session creator')
      }
      
      // Find the participant
      const participantToRemove = session.participants.find(p => p.userId === userId)
      
      if (!participantToRemove) {
        throw new Error('Participant not found')
      }
      
      // Update the participant status to removed
      const updatedParticipants = session.participants.map(p => 
        p.userId === userId 
          ? { ...p, status: 'removed' as const } 
          : p
      )
      
      // Update session
      await updateDoc(sessionRef, {
        participants: updatedParticipants,
        updatedAt: Date.now()
      })
      
      // Update local state
      setUserSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              participants: updatedParticipants,
              updatedAt: Date.now()
            }
          }
          return session
        })
      )
    } catch (err) {
      console.error('Error removing participant:', err)
      setError('Failed to remove participant')
      throw err
    }
  }

  const recordPayment = async (
    sessionId: string,
    transactionId: string,
    payment: Omit<Payment, 'timestamp'>
  ) => {
    if (!user) throw new Error('User must be logged in to record payments')
    
    try {
      // Get the current session
      const sessionRef = doc(db, 'sessions', sessionId)
      const sessionDoc = await getDoc(sessionRef)
      
      if (!sessionDoc.exists()) {
        throw new Error('Session not found')
      }
      
      const session = sessionDoc.data() as Session
      
      // Check if user is authorized (creator or participant)
      const isParticipant = session.participants.some(p => p.userId === user.uid && p.status === 'active')
      if (session.createdBy !== user.uid && !isParticipant) {
        throw new Error('Not authorized to record payments in this session')
      }
      
      // Find the transaction
      const transactionIndex = session.transactions.findIndex(t => t.id === transactionId)
      
      if (transactionIndex === -1) {
        throw new Error('Transaction not found')
      }
      
      // Create the payment object
      const newPayment: Payment = {
        ...payment,
        timestamp: Date.now()
      }
      
      // Add payment to transaction
      const updatedTransactions = [...session.transactions]
      updatedTransactions[transactionIndex] = {
        ...updatedTransactions[transactionIndex],
        payments: [...updatedTransactions[transactionIndex].payments, newPayment],
        updatedAt: Date.now()
      }
      
      // Update session
      await updateDoc(sessionRef, {
        transactions: updatedTransactions,
        updatedAt: Date.now()
      })
      
      // Update local state
      setUserSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              transactions: updatedTransactions,
              updatedAt: Date.now()
            }
          }
          return session
        })
      )
    } catch (err) {
      console.error('Error recording payment:', err)
      setError('Failed to record payment')
      throw new Error('Failed to record payment')
    }
  }

  const calculateDebts = async (sessionId: string): Promise<DebtCalculation[]> => {
    try {
      // Get the current session
      const session = userSessions.find(s => s.id === sessionId)
      
      if (!session) {
        throw new Error('Session not found')
      }
      
      // Calculate how much each person has paid
      const paymentsByUser: Record<string, { paid: number, name: string }> = {}
      
      // Initialize all participants
      session.participants
        .filter(p => p.status === 'active')
        .forEach(p => {
          paymentsByUser[p.userId] = {
            paid: 0,
            name: p.displayName
          }
        })
      
      // Sum up all payments for each user
      session.transactions.forEach(transaction => {
        transaction.payments.forEach(payment => {
          if (paymentsByUser[payment.payerId]) {
            paymentsByUser[payment.payerId].paid += payment.amount
          } else {
            // If payer is not in participants list (unlikely but just in case)
            paymentsByUser[payment.payerId] = {
              paid: payment.amount,
              name: payment.payerName
            }
          }
        })
      })
      
      // Calculate fair share for each participant
      const activeParticipants = session.participants.filter(p => p.status === 'active')
      const fairShare = session.totalAmount / activeParticipants.length
      
      // Calculate net amounts (positive means owed, negative means owes)
      const netAmounts: Record<string, { amount: number, name: string }> = {}
      
      Object.entries(paymentsByUser).forEach(([userId, data]) => {
        netAmounts[userId] = {
          amount: fairShare - data.paid,
          name: data.name
        }
      })
      
      // Implement the debt simplification algorithm
      const debts: DebtCalculation[] = []
      
      // Sort users by amount (ascending)
      const sortedUsers = Object.entries(netAmounts).sort((a, b) => a[1].amount - b[1].amount)
      
      // First users owe money, last users are owed money
      let i = 0 // index of person who owes money
      let j = sortedUsers.length - 1 // index of person who is owed money
      
      while (i < j) {
        const debtor = sortedUsers[i]
        const creditor = sortedUsers[j]
        
        // Skip users who are settled
        if (Math.abs(debtor[1].amount) < 0.01) {
          i++
          continue
        }
        
        if (Math.abs(creditor[1].amount) < 0.01) {
          j--
          continue
        }
        
        // If debtor owes more than creditor is owed
        if (debtor[1].amount > Math.abs(creditor[1].amount)) {
          // Create a debt from debtor to creditor for the full amount creditor is owed
          debts.push({
            from: debtor[0],
            fromName: debtor[1].name,
            to: creditor[0],
            toName: creditor[1].name,
            amount: Math.abs(creditor[1].amount)
          })
          
          // Update debtor's amount
          debtor[1].amount += creditor[1].amount // creditor's amount is negative
          
          // Creditor is now settled
          j--
        } 
        // If creditor is owed more than debtor owes
        else if (debtor[1].amount < Math.abs(creditor[1].amount)) {
          // Create a debt from debtor to creditor for the full amount debtor owes
          debts.push({
            from: debtor[0],
            fromName: debtor[1].name,
            to: creditor[0],
            toName: creditor[1].name,
            amount: debtor[1].amount
          })
          
          // Update creditor's amount
          creditor[1].amount += debtor[1].amount // add the amount paid (reduces debt)
          
          // Debtor is now settled
          i++
        } 
        // If amounts are equal
        else {
          // Create a debt from debtor to creditor
          debts.push({
            from: debtor[0],
            fromName: debtor[1].name,
            to: creditor[0],
            toName: creditor[1].name,
            amount: debtor[1].amount
          })
          
          // Both are settled
          i++
          j--
        }
      }
      
      // Round the amounts to two decimal places
      debts.forEach(debt => {
        debt.amount = Math.round(debt.amount * 100) / 100
      })
      
      // Remove any debts with 0 amount
      return debts.filter(debt => debt.amount > 0)
    } catch (err) {
      console.error('Error calculating debts:', err)
      throw new Error('Failed to calculate debts')
    }
  }

  const value = {
    userSessions,
    loading,
    error,
    createSession,
    getSessionById,
    updateSession,
    completeSession,
    cancelSession,
    addTransaction,
    updateTransaction,
    removeTransaction,
    addParticipant,
    removeParticipant,
    recordPayment,
    calculateDebts,
    refreshSessions
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}
