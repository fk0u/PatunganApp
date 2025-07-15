"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { 
  doc, 
  getDoc 
} from 'firebase/firestore'
import { createUser, getCurrentUser } from '@/lib/firestore'
import { User } from '@/lib/types'

interface AuthContextType {
  // Current Firebase user
  currentUser: FirebaseUser | null
  userData: User | null
  loading: boolean
  
  // New interface for compatibility
  user: FirebaseUser | null
  
  // Methods with both interfaces
  signup: (email: string, password: string, displayName: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        try {
          // Try to get user data from Firestore
          const userDoc = await getCurrentUser()
          setUserData(userDoc)
        } catch (error) {
          console.error('Error fetching user data:', error)
          // If Firestore fails, create minimal user data
          setUserData({
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'User',
            photoURL: user.photoURL || undefined,
            createdAt: Date.now(),
            updatedAt: Date.now()
          })
        }
      } else {
        setUserData(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function signup(email: string, password: string, displayName: string) {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      
      await updateProfile(user, { displayName })
      
      try {
        await createUser({
          email: user.email || email,
          displayName: displayName
        })
        
        // Refresh the user data
        const userDoc = await getCurrentUser()
        setUserData(userDoc)
      } catch (firestoreError) {
        console.error('Error creating user in Firestore:', firestoreError)
        // Create minimal user data if Firestore fails
        setUserData({
          id: user.uid,
          email: user.email || email,
          displayName: displayName,
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      }
    } catch (error) {
      console.error('Error during signup:', error)
      throw error
    }
  }

  // Alias for compatibility
  async function register(email: string, password: string) {
    await signup(email, password, 'User')
  }

  async function login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Error during login:', error)
      throw error
    }
  }

  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')
      
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      
      try {
        // Check if the user already exists in Firestore
        const userRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userRef)
        
        if (!userDoc.exists()) {
          // Create new user document if it doesn't exist
          await createUser({
            email: user.email || '',
            displayName: user.displayName || 'Google User',
            photoURL: user.photoURL || undefined
          })
        }
        
        // Refresh user data
        const updatedUserDoc = await getCurrentUser()
        setUserData(updatedUserDoc)
      } catch (firestoreError) {
        console.error('Error with Firestore during Google login:', firestoreError)
        // Create minimal user data if Firestore fails
        setUserData({
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Google User',
          photoURL: user.photoURL || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      }
      
    } catch (error) {
      console.error('Error during Google login:', error)
      throw error
    }
  }

  async function logout() {
    try {
      await signOut(auth)
      setUserData(null)
    } catch (error) {
      console.error('Error during logout:', error)
      throw error
    }
  }

  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Error sending password reset email:', error)
      throw error
    }
  }

  async function updateUserProfile(displayName: string, photoURL?: string) {
    try {
      if (!currentUser) {
        throw new Error('No user is signed in')
      }
      
      await updateProfile(currentUser, { displayName, photoURL })
      
      try {
        // Refresh the user data
        const userDoc = await getCurrentUser()
        setUserData(userDoc)
      } catch (firestoreError) {
        console.error('Error updating user profile in Firestore:', firestoreError)
        // Update local state if Firestore fails
        if (userData) {
          setUserData({
            ...userData,
            displayName,
            photoURL,
            updatedAt: Date.now()
          })
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const value = {
    currentUser,
    userData,
    loading,
    user: currentUser, // Alias for compatibility
    signup,
    register, // Alias for compatibility  
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
