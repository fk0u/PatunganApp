"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
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
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Types
interface Participant {
  userId: string
  displayName: string
  share: number | null
  status: 'active' | 'invited' | 'removed'
}

interface Subscription {
  id: string
  name: string
  description?: string
  amount: number
  cycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly'
  startDate: number
  nextBillingDate: number
  primaryPayerId: string
  participants: Participant[]
  groupId?: string
  createdBy: string
  createdAt: number
  updatedAt: number
  status: 'active' | 'paused' | 'cancelled'
  logo?: string
}

interface SubscriptionPayment {
  id: string
  subscriptionId: string
  amount: number
  date: number
  paidBy: string
  status: 'pending' | 'completed'
  participants: {
    userId: string
    share: number
    status: 'pending' | 'paid'
  }[]
}

interface SubscriptionContextType {
  userSubscriptions: Subscription[]
  loading: boolean
  error: string | null
  
  // Subscription operations
  createSubscription: (subscriptionData: Omit<Subscription, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<Subscription>
  getSubscriptionById: (subscriptionId: string) => Promise<Subscription | null>
  updateSubscription: (subscriptionId: string, updates: Partial<Omit<Subscription, 'id' | 'createdBy' | 'createdAt'>>) => Promise<void>
  cancelSubscription: (subscriptionId: string) => Promise<void>
  
  // Participant management
  addParticipant: (subscriptionId: string, userId: string, share?: number) => Promise<void>
  removeParticipant: (subscriptionId: string, userId: string) => Promise<void>
  updateParticipantShare: (subscriptionId: string, userId: string, share: number) => Promise<void>
  
  // Invitation management
  acceptSubscriptionInvitation: (subscriptionId: string, share?: number) => Promise<void>
  
  // Payment management
  recordPayment: (subscriptionId: string, paymentData: Omit<SubscriptionPayment, 'id' | 'subscriptionId' | 'status'>) => Promise<SubscriptionPayment>
  
  // Real-time listeners
  listenToSubscription: (subscriptionId: string, callback: (subscription: Subscription) => void) => () => void
  
  // Helper
  refreshSubscriptions: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function useSubscriptions() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider')
  }
  return context
}

interface SubscriptionProviderProps {
  children: ReactNode
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user } = useAuth()
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const listeners = useRef<Array<() => void>>([])
  
  // Clean up listeners when component unmounts
  useEffect(() => {
    return () => {
      listeners.current.forEach(unsubscribe => unsubscribe())
    }
  }, [])

  // Set up real-time listeners when user changes
  useEffect(() => {
    if (user) {
      // Clear any existing listeners
      listeners.current.forEach(unsubscribe => unsubscribe())
      listeners.current = []
      
      setupSubscriptionListeners()
    } else {
      // Clear listeners and reset state
      listeners.current.forEach(unsubscribe => unsubscribe())
      listeners.current = []
      setUserSubscriptions([])
      setLoading(false)
    }
  }, [user])

  // Set up real-time listeners for subscriptions
  const setupSubscriptionListeners = () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Query subscriptions where user is a participant
      const participantQuery = query(
        collection(db, 'subscriptions'),
        where('participants', 'array-contains', {
          userId: user.uid,
          status: 'active'
        })
      )
      
      // Query subscriptions where user is the primary payer
      const payerQuery = query(
        collection(db, 'subscriptions'),
        where('primaryPayerId', '==', user.uid)
      )
      
      // Set up real-time listeners
      const participantUnsubscribe = onSnapshot(participantQuery, (snapshot) => {
        const participantSubs = snapshot.docs.map(doc => 
          ({ id: doc.id, ...doc.data() }) as Subscription
        )
        
        updateSubscriptionsState(participantSubs, [])
        setLoading(false)
      }, (err) => {
        console.error('Error in participant subscription listener:', err)
        setError('Failed to listen to participant subscriptions')
        setLoading(false)
      })
      
      const payerUnsubscribe = onSnapshot(payerQuery, (snapshot) => {
        const payerSubs = snapshot.docs.map(doc => 
          ({ id: doc.id, ...doc.data() }) as Subscription
        )
        
        updateSubscriptionsState([], payerSubs)
        setLoading(false)
      }, (err) => {
        console.error('Error in primary payer subscription listener:', err)
        setError('Failed to listen to primary payer subscriptions')
        setLoading(false)
      })
      
      // Store unsubscribe functions
      listeners.current.push(participantUnsubscribe, payerUnsubscribe)
      
    } catch (err) {
      console.error('Error setting up subscription listeners:', err)
      setError('Failed to set up subscription listeners')
      setLoading(false)
    }
  }
  
  // Helper function to update subscriptions state with new data
  const updateSubscriptionsState = (participantSubs: Subscription[], payerSubs: Subscription[]) => {
    setUserSubscriptions(prevSubs => {
      // Start with participant subscriptions
      const allSubs = [...participantSubs]
      
      // Add payer subscriptions that aren't already included
      payerSubs.forEach(sub => {
        if (!allSubs.some(s => s.id === sub.id)) {
          allSubs.push(sub)
        }
      })
      
      // Keep existing subscriptions that haven't been updated
      prevSubs.forEach(prevSub => {
        if (!allSubs.some(s => s.id === prevSub.id) && 
            !participantSubs.some(s => s.id === prevSub.id) && 
            !payerSubs.some(s => s.id === prevSub.id)) {
          allSubs.push(prevSub)
        }
      })
      
      return allSubs
    })
  }

  const fetchUserSubscriptions = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Query subscriptions where user is a participant (including as primary payer)
      const subscriptionsQuery = query(
        collection(db, 'subscriptions'),
        where('participants', 'array-contains', {
          userId: user.uid,
          status: 'active'
        })
      )
      
      const primaryPayerQuery = query(
        collection(db, 'subscriptions'),
        where('primaryPayerId', '==', user.uid)
      )
      
      const [participantSnapshot, payerSnapshot] = await Promise.all([
        getDocs(subscriptionsQuery),
        getDocs(primaryPayerQuery)
      ])
      
      const subscriptionsAsParticipant = participantSnapshot.docs.map(doc => 
        ({ id: doc.id, ...doc.data() }) as Subscription
      )
      
      const subscriptionsAsPayer = payerSnapshot.docs.map(doc => 
        ({ id: doc.id, ...doc.data() }) as Subscription
      )
      
      // Combine and deduplicate
      const allSubscriptions = [...subscriptionsAsParticipant]
      
      // Add subscriptions where user is primary payer but not in participants list
      subscriptionsAsPayer.forEach(sub => {
        if (!allSubscriptions.some(s => s.id === sub.id)) {
          allSubscriptions.push(sub)
        }
      })
      
      setUserSubscriptions(allSubscriptions)
    } catch (err) {
      console.error('Error fetching subscriptions:', err)
      setError('Failed to fetch subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const refreshSubscriptions = async () => {
    await fetchUserSubscriptions()
  }

  const createSubscription = async (
    subscriptionData: Omit<Subscription, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<Subscription> => {
    if (!user) throw new Error('User must be logged in to create a subscription')
    
    try {
      // Ensure the current user is one of the participants (as primary payer)
      const primaryPayerParticipant: Participant = {
        userId: user.uid,
        displayName: user.displayName || user.email || 'User',
        share: null, // Will be calculated based on other participants
        status: 'active'
      }
      
      // Create the subscription object
      const newSubscription: Omit<Subscription, 'id'> = {
        ...subscriptionData,
        createdBy: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active',
        participants: [
          ...subscriptionData.participants,
          primaryPayerParticipant
        ],
        // Calculate next billing date based on cycle and start date
        nextBillingDate: calculateNextBillingDate(
          subscriptionData.startDate, 
          subscriptionData.cycle
        )
      }
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'subscriptions'), newSubscription)
      
      // Get the created subscription with ID
      const createdSubscription = { id: docRef.id, ...newSubscription }
      
      // Update local state is now handled by real-time listeners
      
      return createdSubscription
    } catch (err) {
      console.error('Error creating subscription:', err)
      setError('Failed to create subscription')
      throw new Error('Failed to create subscription')
    }
  }

  const getSubscriptionById = async (subscriptionId: string): Promise<Subscription | null> => {
    try {
      // First check if it's in our local state
      const localSub = userSubscriptions.find(sub => sub.id === subscriptionId)
      if (localSub) return localSub
      
      // If not in local state, fetch from Firestore
      const subRef = doc(db, 'subscriptions', subscriptionId)
      const subDoc = await getDoc(subRef)
      
      if (subDoc.exists()) {
        return { id: subDoc.id, ...subDoc.data() } as Subscription
      }
      
      return null
    } catch (err) {
      console.error('Error getting subscription:', err)
      setError('Failed to fetch subscription')
      return null
    }
  }

  const updateSubscription = async (
    subscriptionId: string, 
    updates: Partial<Omit<Subscription, 'id' | 'createdBy' | 'createdAt'>>
  ) => {
    if (!user) throw new Error('User must be logged in to update a subscription')
    
    try {
      // Get the current subscription
      const subRef = doc(db, 'subscriptions', subscriptionId)
      const subDoc = await getDoc(subRef)
      
      if (!subDoc.exists()) {
        throw new Error('Subscription not found')
      }
      
      const subscription = subDoc.data() as Subscription
      
      // Check if user is authorized (primary payer or creator)
      if (subscription.primaryPayerId !== user.uid && subscription.createdBy !== user.uid) {
        throw new Error('Not authorized to update this subscription')
      }
      
      // If cycle or start date is updated, recalculate nextBillingDate
      let nextBillingDate = subscription.nextBillingDate
      if (updates.cycle || updates.startDate) {
        nextBillingDate = calculateNextBillingDate(
          updates.startDate || subscription.startDate,
          updates.cycle || subscription.cycle
        )
      }
      
      // Update the subscription
      await updateDoc(subRef, {
        ...updates,
        nextBillingDate,
        updatedAt: Date.now()
      })
      
      // Local state update is now handled by real-time listeners
    } catch (err) {
      console.error('Error updating subscription:', err)
      setError('Failed to update subscription')
      throw err
    }
  }

  const cancelSubscription = async (subscriptionId: string) => {
    if (!user) throw new Error('User must be logged in to cancel a subscription')
    
    try {
      // Get the current subscription
      const subRef = doc(db, 'subscriptions', subscriptionId)
      const subDoc = await getDoc(subRef)
      
      if (!subDoc.exists()) {
        throw new Error('Subscription not found')
      }
      
      const subscription = subDoc.data() as Subscription
      
      // Check if user is authorized (primary payer or creator)
      if (subscription.primaryPayerId !== user.uid && subscription.createdBy !== user.uid) {
        throw new Error('Not authorized to cancel this subscription')
      }
      
      // Update the subscription status to cancelled
      await updateDoc(subRef, {
        status: 'cancelled',
        updatedAt: Date.now()
      })
      
      // Local state update is now handled by real-time listeners
    } catch (err) {
      console.error('Error cancelling subscription:', err)
      setError('Failed to cancel subscription')
      throw err
    }
  }

  const addParticipant = async (subscriptionId: string, userId: string, share?: number) => {
    if (!user) throw new Error('User must be logged in to add participants')
    
    try {
      // Get the current subscription
      const subRef = doc(db, 'subscriptions', subscriptionId)
      const subDoc = await getDoc(subRef)
      
      if (!subDoc.exists()) {
        throw new Error('Subscription not found')
      }
      
      const subscription = subDoc.data() as Subscription
      
      // Check if user is authorized (primary payer or creator)
      if (subscription.primaryPayerId !== user.uid && subscription.createdBy !== user.uid) {
        throw new Error('Not authorized to add participants')
      }
      
      // Check if user is already a participant
      if (subscription.participants.some(p => p.userId === userId)) {
        throw new Error('User is already a participant')
      }
      
      // Get user info
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }
      
      const userData = userDoc.data()
      
      // Add the new participant
      const newParticipant: Participant = {
        userId,
        displayName: userData.displayName || 'User',
        share: share || null,
        status: 'invited' // Initially invited, needs to accept
      }
      
      // Update subscription participants
      await updateDoc(subRef, {
        participants: arrayUnion(newParticipant),
        updatedAt: Date.now()
      })
      
      // Local state update is now handled by real-time listeners
    } catch (err) {
      console.error('Error adding participant:', err)
      setError('Failed to add participant')
      throw err
    }
  }

  const removeParticipant = async (subscriptionId: string, userId: string) => {
    if (!user) throw new Error('User must be logged in to remove participants')
    
    try {
      // Get the current subscription
      const subRef = doc(db, 'subscriptions', subscriptionId)
      const subDoc = await getDoc(subRef)
      
      if (!subDoc.exists()) {
        throw new Error('Subscription not found')
      }
      
      const subscription = subDoc.data() as Subscription
      
      // Check if user is authorized (primary payer, creator, or removing self)
      if (
        subscription.primaryPayerId !== user.uid && 
        subscription.createdBy !== user.uid &&
        userId !== user.uid
      ) {
        throw new Error('Not authorized to remove this participant')
      }
      
      // Check if trying to remove primary payer
      if (userId === subscription.primaryPayerId) {
        throw new Error('Cannot remove the primary payer')
      }
      
      // Find the participant
      const participantToRemove = subscription.participants.find(p => p.userId === userId)
      
      if (!participantToRemove) {
        throw new Error('Participant not found')
      }
      
      // Update the participant status to removed
      const updatedParticipants = subscription.participants.map(p => 
        p.userId === userId 
          ? { ...p, status: 'removed' as const } 
          : p
      )
      
      // Update subscription
      await updateDoc(subRef, {
        participants: updatedParticipants,
        updatedAt: Date.now()
      })
      
      // Local state update is now handled by real-time listeners
    } catch (err) {
      console.error('Error removing participant:', err)
      setError('Failed to remove participant')
      throw err
    }
  }

  const updateParticipantShare = async (subscriptionId: string, userId: string, share: number) => {
    if (!user) throw new Error('User must be logged in to update participant shares')
    
    try {
      // Get the current subscription
      const subRef = doc(db, 'subscriptions', subscriptionId)
      const subDoc = await getDoc(subRef)
      
      if (!subDoc.exists()) {
        throw new Error('Subscription not found')
      }
      
      const subscription = subDoc.data() as Subscription
      
      // Check if user is authorized (primary payer, creator, or updating self)
      if (
        subscription.primaryPayerId !== user.uid && 
        subscription.createdBy !== user.uid &&
        userId !== user.uid
      ) {
        throw new Error('Not authorized to update this participant')
      }
      
      // Update the participant's share
      const updatedParticipants = subscription.participants.map(p => 
        p.userId === userId 
          ? { ...p, share } 
          : p
      )
      
      // Update subscription
      await updateDoc(subRef, {
        participants: updatedParticipants,
        updatedAt: Date.now()
      })
      
      // Local state update is now handled by real-time listeners
    } catch (err) {
      console.error('Error updating participant share:', err)
      setError('Failed to update participant share')
      throw err
    }
  }

  const recordPayment = async (
    subscriptionId: string, 
    paymentData: Omit<SubscriptionPayment, 'id' | 'subscriptionId' | 'status'>
  ): Promise<SubscriptionPayment> => {
    if (!user) throw new Error('User must be logged in to record payments')
    
    try {
      // Get the current subscription
      const subRef = doc(db, 'subscriptions', subscriptionId)
      const subDoc = await getDoc(subRef)
      
      if (!subDoc.exists()) {
        throw new Error('Subscription not found')
      }
      
      const subscription = subDoc.data() as Subscription
      
      // Check if user is authorized (primary payer or creator)
      if (subscription.primaryPayerId !== user.uid && subscription.createdBy !== user.uid) {
        throw new Error('Not authorized to record payments')
      }
      
      // Create the payment object
      const newPayment: Omit<SubscriptionPayment, 'id'> = {
        subscriptionId,
        ...paymentData,
        status: 'pending'
      }
      
      // Add to Firestore
      const paymentRef = await addDoc(collection(db, 'subscriptionPayments'), newPayment)
      
      // Update the subscription's nextBillingDate
      const nextBillingDate = calculateNextBillingDate(
        subscription.startDate,
        subscription.cycle,
        subscription.nextBillingDate
      )
      
      await updateDoc(subRef, {
        nextBillingDate,
        updatedAt: Date.now()
      })
      
      // Local state update is now handled by real-time listeners
      
      return { id: paymentRef.id, ...newPayment }
    } catch (err) {
      console.error('Error recording payment:', err)
      setError('Failed to record payment')
      throw new Error('Failed to record payment')
    }
  }
  
  // Function to listen to a specific subscription in real-time
  const listenToSubscription = (
    subscriptionId: string, 
    callback: (subscription: Subscription) => void
  ) => {
    const subscriptionRef = doc(db, 'subscriptions', subscriptionId)
    
    const unsubscribe = onSnapshot(subscriptionRef, (doc) => {
      if (doc.exists()) {
        const subscriptionData = { id: doc.id, ...doc.data() } as Subscription
        callback(subscriptionData)
      }
    }, (error) => {
      console.error('Error listening to subscription:', error)
    })
    
    // Return the unsubscribe function so the caller can stop listening when needed
    return unsubscribe
  }

  // Utility function to calculate next billing date
  const calculateNextBillingDate = (
    startDate: number,
    cycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly',
    previousBillingDate?: number
  ): number => {
    const baseDate = previousBillingDate || startDate
    const date = new Date(baseDate)
    
    switch (cycle) {
      case 'weekly':
        date.setDate(date.getDate() + 7)
        break
      case 'monthly':
        date.setMonth(date.getMonth() + 1)
        break
      case 'quarterly':
        date.setMonth(date.getMonth() + 3)
        break
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    
    return date.getTime()
  }

  // Accept a subscription invitation as the current user
  const acceptSubscriptionInvitation = async (subscriptionId: string, share?: number) => {
    if (!user) throw new Error('User must be logged in to accept a subscription invitation')
    
    try {
      // Get the current subscription
      const subRef = doc(db, 'subscriptions', subscriptionId)
      const subDoc = await getDoc(subRef)
      
      if (!subDoc.exists()) {
        throw new Error('Subscription not found')
      }
      
      const subscription = subDoc.data() as Subscription
      
      // Check if user is already a participant
      const existingParticipant = subscription.participants.find(p => p.userId === user.uid)
      
      if (existingParticipant) {
        if (existingParticipant.status === 'active') {
          // User is already an active participant
          return
        }
        
        // Update participant status from invited/removed to active
        const updatedParticipants = subscription.participants.map(p => 
          p.userId === user.uid 
            ? { ...p, status: 'active' as const, share: share || p.share } 
            : p
        )
        
        // Update subscription
        await updateDoc(subRef, {
          participants: updatedParticipants,
          updatedAt: Date.now()
        })
      } else {
        // Add user as new participant
        const newParticipant: Participant = {
          userId: user.uid,
          displayName: user.displayName || user.email || 'User',
          share: share || null,
          status: 'active'
        }
        
        // Update subscription participants
        await updateDoc(subRef, {
          participants: arrayUnion(newParticipant),
          updatedAt: Date.now()
        })
      }
      
      // Local state update is now handled by real-time listeners
    } catch (err) {
      console.error('Error accepting subscription invitation:', err)
      setError('Failed to accept subscription invitation')
      throw err
    }
  }

  const value = {
    userSubscriptions,
    loading,
    error,
    createSubscription,
    getSubscriptionById,
    updateSubscription,
    cancelSubscription,
    addParticipant,
    removeParticipant,
    updateParticipantShare,
    acceptSubscriptionInvitation,
    recordPayment,
    listenToSubscription,
    refreshSubscriptions
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}
