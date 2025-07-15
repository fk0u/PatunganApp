import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { createUser, getCurrentUser } from '@/lib/firestore';
import { User } from '@/lib/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userDoc = await getCurrentUser();
          setUserData(userDoc);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signup(email: string, password: string, displayName: string) {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(user, { displayName });
      
      await createUser({
        email: user.email || email,
        displayName: displayName
      });
      
      // Refresh the user data
      const userDoc = await getCurrentUser();
      setUserData(userDoc);
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Refresh the user data
      const userDoc = await getCurrentUser();
      setUserData(userDoc);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if the user already exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user document if it doesn't exist
        await createUser({
          email: user.email || '',
          displayName: user.displayName || 'Google User',
          photoURL: user.photoURL || undefined
        });
      }
      
      // Refresh user data
      const updatedUserDoc = await getCurrentUser();
      setUserData(updatedUserDoc);
      
    } catch (error) {
      console.error('Error during Google login:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  async function updateUserProfile(displayName: string, photoURL?: string) {
    try {
      if (!currentUser) {
        throw new Error('No user is signed in');
      }
      
      await updateProfile(currentUser, { displayName, photoURL });
      
      // Refresh the user data
      const userDoc = await getCurrentUser();
      setUserData(userDoc);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  const value = {
    currentUser,
    userData,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
