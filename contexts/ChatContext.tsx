"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
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
  orderBy, 
  limit, 
  Timestamp,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from "@/lib/firebase";
import { geminiGenerate } from "@/lib/gemini";

// Define types
type Message = {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  createdAt: number;
  sessionId: string;
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
    size?: number;
  }[];
};

type ChatSession = {
  id: string;
  title: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  lastMessage?: string;
  messageCount: number;
  status: 'active' | 'archived';
  tags?: string[];
  context?: string;
};

interface ChatContextType {
  chatSessions: ChatSession[];
  currentSession: ChatSession | null;
  currentMessages: Message[];
  loadingSessions: boolean;
  loadingMessages: boolean;
  sendingMessage: boolean;
  error: string | null;
  
  // Session operations
  createChatSession: (title?: string) => Promise<ChatSession>;
  getChatSession: (sessionId: string) => Promise<ChatSession | null>;
  updateChatSession: (sessionId: string, updates: Partial<ChatSession>) => Promise<void>;
  archiveChatSession: (sessionId: string) => Promise<void>;
  deleteChatSession: (sessionId: string) => Promise<void>;
  
  // Message operations
  sendMessage: (content: string, attachments?: any[]) => Promise<Message | null>;
  loadMessages: (sessionId: string, limit?: number) => Promise<void>;
  
  // Active session management
  setActiveSession: (sessionId: string) => Promise<void>;
  clearActiveSession: () => void;
  
  // Real-time listeners
  listenToSession: (sessionId: string, callback: (session: ChatSession) => void) => () => void;
  listenToMessages: (sessionId: string, callback: (messages: Message[]) => void) => () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of listeners to clean up
  const sessionListeners = useRef<Array<() => void>>([]);
  const messageListeners = useRef<Array<() => void>>([]);
  
  // Clean up listeners when unmounting
  useEffect(() => {
    return () => {
      sessionListeners.current.forEach(unsubscribe => unsubscribe());
      messageListeners.current.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Fetch chat sessions when auth state changes
  useEffect(() => {
    if (user) {
      // Clear any existing listeners
      sessionListeners.current.forEach(unsubscribe => unsubscribe());
      sessionListeners.current = [];
      
      setupSessionsListener();
    } else {
      // Clean up and reset state
      sessionListeners.current.forEach(unsubscribe => unsubscribe());
      sessionListeners.current = [];
      setChatSessions([]);
      setCurrentSession(null);
      setCurrentMessages([]);
      setLoadingSessions(false);
    }
  }, [user]);

  // Set up real-time listener for chat sessions
  const setupSessionsListener = () => {
    if (!user) return;
    
    setLoadingSessions(true);
    
    try {
      // Query for the user's chat sessions
      const sessionsQuery = query(
        collection(db, 'chatSessions'),
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );
      
      // Set up the listener
      const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
        const sessions = snapshot.docs.map(doc => 
          ({ id: doc.id, ...doc.data() }) as ChatSession
        );
        
        setChatSessions(sessions);
        setLoadingSessions(false);
      }, (error) => {
        console.error('Error in chat sessions listener:', error);
        setError('Failed to load chat sessions');
        setLoadingSessions(false);
      });
      
      // Store the unsubscribe function
      sessionListeners.current.push(unsubscribe);
    } catch (error) {
      console.error('Error setting up chat sessions listener:', error);
      setError('Failed to set up chat sessions listener');
      setLoadingSessions(false);
    }
  };

  // Create a new chat session
  const createChatSession = async (title?: string): Promise<ChatSession> => {
    if (!user) throw new Error('User must be logged in to create a chat session');
    
    try {
      // Create a new session
      const newSession: Omit<ChatSession, 'id'> = {
        title: title || 'New Conversation',
        userId: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
        status: 'active'
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'chatSessions'), newSession);
      
      // Get the created session with ID
      const createdSession = { id: docRef.id, ...newSession };
      
      // Set as current session
      setCurrentSession(createdSession);
      
      return createdSession;
    } catch (error) {
      console.error('Error creating chat session:', error);
      setError('Failed to create chat session');
      throw new Error('Failed to create chat session');
    }
  };

  // Get a chat session by ID
  const getChatSession = async (sessionId: string): Promise<ChatSession | null> => {
    if (!user) return null;
    
    try {
      // Check if it's in our local state first
      const localSession = chatSessions.find(session => session.id === sessionId);
      if (localSession) return localSession;
      
      // If not, fetch from Firestore
      const sessionRef = doc(db, 'chatSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        return null;
      }
      
      const session = { id: sessionDoc.id, ...sessionDoc.data() } as ChatSession;
      
      // Make sure this session belongs to the current user
      if (session.userId !== user.uid) {
        throw new Error('Not authorized to access this chat session');
      }
      
      return session;
    } catch (error) {
      console.error('Error getting chat session:', error);
      setError('Failed to get chat session');
      return null;
    }
  };

  // Update a chat session
  const updateChatSession = async (sessionId: string, updates: Partial<ChatSession>): Promise<void> => {
    if (!user) throw new Error('User must be logged in to update a chat session');
    
    try {
      // Get the current session
      const sessionRef = doc(db, 'chatSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        throw new Error('Chat session not found');
      }
      
      const session = sessionDoc.data() as ChatSession;
      
      // Make sure this session belongs to the current user
      if (session.userId !== user.uid) {
        throw new Error('Not authorized to update this chat session');
      }
      
      // Update the session
      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: Date.now()
      });
      
      // Update current session if it's the active one
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => 
          prev ? { ...prev, ...updates, updatedAt: Date.now() } : null
        );
      }
    } catch (error) {
      console.error('Error updating chat session:', error);
      setError('Failed to update chat session');
      throw error;
    }
  };

  // Archive a chat session
  const archiveChatSession = async (sessionId: string): Promise<void> => {
    await updateChatSession(sessionId, { status: 'archived' });
  };

  // Delete a chat session
  const deleteChatSession = async (sessionId: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in to delete a chat session');
    
    try {
      // Get the current session
      const sessionRef = doc(db, 'chatSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        throw new Error('Chat session not found');
      }
      
      const session = sessionDoc.data() as ChatSession;
      
      // Make sure this session belongs to the current user
      if (session.userId !== user.uid) {
        throw new Error('Not authorized to delete this chat session');
      }
      
      // TODO: Consider whether to actually delete or just mark as deleted
      // For now, we'll update status to archived which effectively hides it
      await updateDoc(sessionRef, {
        status: 'archived',
        updatedAt: Date.now()
      });
      
      // If this was the current session, clear it
      if (currentSession?.id === sessionId) {
        clearActiveSession();
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
      setError('Failed to delete chat session');
      throw error;
    }
  };

  // Send a message in the current session
  const sendMessage = async (content: string, attachments?: any[]): Promise<Message | null> => {
    if (!user || !currentSession) return null;
    
    setSendingMessage(true);
    
    try {
      // Create the user message
      const userMessage: Omit<Message, 'id'> = {
        content,
        sender: 'user',
        createdAt: Date.now(),
        sessionId: currentSession.id,
        attachments: attachments ? attachments.map(a => ({
          type: a.type,
          url: a.url,
          name: a.name,
          size: a.size
        })) : undefined
      };
      
      // Add to Firestore
      const userMsgRef = await addDoc(collection(db, 'chatMessages'), userMessage);
      
      // Update session metadata
      await updateDoc(doc(db, 'chatSessions', currentSession.id), {
        lastMessage: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        messageCount: currentSession.messageCount + 1,
        updatedAt: Date.now()
      });
      
      // Update the current session
      setCurrentSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          lastMessage: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          messageCount: prev.messageCount + 1,
          updatedAt: Date.now()
        };
      });
      
      // Generate AI response
      const aiResponse = await geminiGenerate(content, currentMessages);
      
      // Create the AI message
      const aiMessage: Omit<Message, 'id'> = {
        content: aiResponse,
        sender: 'assistant',
        createdAt: Date.now(),
        sessionId: currentSession.id
      };
      
      // Add to Firestore
      const aiMsgRef = await addDoc(collection(db, 'chatMessages'), aiMessage);
      
      // Update session metadata again
      await updateDoc(doc(db, 'chatSessions', currentSession.id), {
        messageCount: currentSession.messageCount + 2,
        updatedAt: Date.now()
      });
      
      // Update the current session
      setCurrentSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messageCount: prev.messageCount + 2,
          updatedAt: Date.now()
        };
      });
      
      setSendingMessage(false);
      
      // Return the user message
      return { id: userMsgRef.id, ...userMessage };
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      setSendingMessage(false);
      return null;
    }
  };

  // Load messages for a session
  const loadMessages = async (sessionId: string, messageLimit: number = 50): Promise<void> => {
    if (!user) return;
    
    setLoadingMessages(true);
    
    try {
      // Clear any existing message listeners
      messageListeners.current.forEach(unsubscribe => unsubscribe());
      messageListeners.current = [];
      
      // Set up real-time listener for messages
      const messagesQuery = query(
        collection(db, 'chatMessages'),
        where('sessionId', '==', sessionId),
        orderBy('createdAt', 'asc'),
        limit(messageLimit)
      );
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => 
          ({ id: doc.id, ...doc.data() }) as Message
        );
        
        setCurrentMessages(messages);
        setLoadingMessages(false);
      }, (error) => {
        console.error('Error in chat messages listener:', error);
        setError('Failed to load chat messages');
        setLoadingMessages(false);
      });
      
      // Store the unsubscribe function
      messageListeners.current.push(unsubscribe);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
      setLoadingMessages(false);
    }
  };

  // Set the active chat session
  const setActiveSession = async (sessionId: string): Promise<void> => {
    try {
      // Get the session
      const session = await getChatSession(sessionId);
      
      if (!session) {
        throw new Error('Chat session not found');
      }
      
      // Set as current session
      setCurrentSession(session);
      
      // Load messages for this session
      await loadMessages(sessionId);
    } catch (error) {
      console.error('Error setting active session:', error);
      setError('Failed to set active session');
    }
  };

  // Clear the active chat session
  const clearActiveSession = (): void => {
    setCurrentSession(null);
    setCurrentMessages([]);
    
    // Clear message listeners
    messageListeners.current.forEach(unsubscribe => unsubscribe());
    messageListeners.current = [];
  };
  
  // Listen to a specific session in real-time
  const listenToSession = (sessionId: string, callback: (session: ChatSession) => void) => {
    const sessionRef = doc(db, 'chatSessions', sessionId);
    
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const sessionData = { id: doc.id, ...doc.data() } as ChatSession;
        callback(sessionData);
      }
    }, (error) => {
      console.error('Error listening to session:', error);
    });
    
    // Return the unsubscribe function
    return unsubscribe;
  };
  
  // Listen to messages for a specific session in real-time
  const listenToMessages = (sessionId: string, callback: (messages: Message[]) => void) => {
    const messagesQuery = query(
      collection(db, 'chatMessages'),
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => 
        ({ id: doc.id, ...doc.data() }) as Message
      );
      
      callback(messages);
    }, (error) => {
      console.error('Error listening to messages:', error);
    });
    
    // Return the unsubscribe function
    return unsubscribe;
  };

  const value = {
    chatSessions,
    currentSession,
    currentMessages,
    loadingSessions,
    loadingMessages,
    sendingMessage,
    error,
    createChatSession,
    getChatSession,
    updateChatSession,
    archiveChatSession,
    deleteChatSession,
    sendMessage,
    loadMessages,
    setActiveSession,
    clearActiveSession,
    listenToSession,
    listenToMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
