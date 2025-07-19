"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
  arrayUnion, 
  arrayRemove, 
  Timestamp,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, storage } from "@/lib/firebase";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";

// Define types
type Member = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
  status: 'active' | 'invited' | 'removed';
};

type Balance = {
  id: string;
  fromUser: {
    id: string;
    displayName: string;
  };
  toUser: {
    id: string;
    displayName: string;
  };
  amount: number;
  status: 'pending' | 'settled';
  createdAt: number;
  settledAt?: number;
};

type Session = {
  id: string;
  name: string;
  date: number;
  totalAmount: number;
  participants: string[] | { id: string; displayName: string }[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
};

type Subscription = {
  id: string;
  name: string;
  amount: number;
  cycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  nextBillingDate: number;
  primaryPayer: {
    id: string;
    displayName: string;
  };
  participants?: Record<string, number>;
  status: 'active' | 'paused' | 'cancelled';
  createdAt: number;
  updatedAt: number;
};

type Invitation = {
  email: string;
  invitedBy: string;
  invitedAt: number;
  status: 'pending' | 'accepted' | 'declined';
  expiresAt: number;
  code: string;
};

type Group = {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  members: Member[];
  sessions?: Session[];
  balances?: Balance[];
  subscriptions?: Subscription[];
  pendingInvitations?: Invitation[];
  avatarUrl?: string | null;
  status: 'active' | 'archived';
  memberCount?: number;
  recentActivity?: string;
};

interface GroupContextType {
  userGroups: Group[];
  currentGroup: Group | null;
  loadingGroups: boolean;
  loadingCurrentGroup: boolean;
  fetchUserGroups: () => Promise<void>;
  fetchGroupDetails: (groupId: string) => Promise<Group | null>;
  listenToGroup: (groupId: string, callback: (group: Group) => void) => () => void;
  createGroup: (groupData: any) => Promise<string | null>;
  updateGroup: (groupId: string, updates: Partial<Group>) => Promise<void>;
  archiveGroup: (groupId: string) => Promise<void>;
  createGroupSession: (groupId: string, sessionData: any) => Promise<string | null>;
  createSubscription: (groupId: string, subscriptionData: any) => Promise<string | null>;
  calculateGroupBalances: (groupId: string) => Promise<Balance[]>;
  markBalanceAsSettled: (groupId: string, balanceId: string) => Promise<void>;
  inviteToGroup: (groupId: string, emails: string[]) => Promise<void>;
  acceptInvitation: (invitationCode: string) => Promise<Group | null>;
  declineInvitation: (invitationCode: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  updateMemberRole: (groupId: string, memberId: string, newRole: 'owner' | 'admin' | 'member') => Promise<void>;
  removeMember: (groupId: string, memberId: string) => Promise<void>;
  uploadGroupAvatar: (groupId: string, file: File) => Promise<string>;
  saveReceiptSplit: (groupId: string, receiptData: any) => Promise<string | null>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [loadingCurrentGroup, setLoadingCurrentGroup] = useState<boolean>(true);
  const groupListeners = React.useRef<Array<() => void>>([]);
  
  // Clean up listeners when unmounting
  useEffect(() => {
    return () => {
      groupListeners.current.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Fetch user's groups when auth state changes
  useEffect(() => {
    if (user) {
      fetchUserGroups();
    } else {
      setUserGroups([]);
      setCurrentGroup(null);
    }
  }, [user]);

  const fetchUserGroups = async () => {
    if (!user) return;
    
    setLoadingGroups(true);
    try {
      // Query groups where user is a member
      const memberGroupsQuery = query(
        collection(db, 'groups'),
        where('members', 'array-contains', {
          id: user.uid,
          status: 'active'
        })
      );
      
      // Query groups created by the user
      const createdGroupsQuery = query(
        collection(db, 'groups'),
        where('createdBy', '==', user.uid)
      );
      
      // Set up real-time listeners
      const unsubscribeMember = onSnapshot(memberGroupsQuery, (memberSnapshot) => {
        const groupsAsMember = memberSnapshot.docs.map(doc => 
          ({ id: doc.id, ...doc.data() }) as Group
        );
        
        updateGroupsState(groupsAsMember, []);
      }, (error) => {
        console.error('Error in member groups listener:', error);
        setLoadingGroups(false);
      });
      
      const unsubscribeCreator = onSnapshot(createdGroupsQuery, (creatorSnapshot) => {
        const groupsAsCreator = creatorSnapshot.docs.map(doc => 
          ({ id: doc.id, ...doc.data() }) as Group
        );
        
        updateGroupsState([], groupsAsCreator);
      }, (error) => {
        console.error('Error in creator groups listener:', error);
        setLoadingGroups(false);
      });
      
      // Store the unsubscribe functions
      groupListeners.current = [unsubscribeMember, unsubscribeCreator];
      
      // Fetch initial data once
      const [memberSnapshot, creatorSnapshot] = await Promise.all([
        getDocs(memberGroupsQuery),
        getDocs(createdGroupsQuery)
      ]);
      
      const groupsAsMember = memberSnapshot.docs.map(doc => 
        ({ id: doc.id, ...doc.data() }) as Group
      );
      
      const groupsAsCreator = creatorSnapshot.docs.map(doc => 
        ({ id: doc.id, ...doc.data() }) as Group
      );
      
      updateGroupsState(groupsAsMember, groupsAsCreator);
      setLoadingGroups(false);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      setLoadingGroups(false);
    }
  };
  
  // Helper function to merge and deduplicate groups
  const updateGroupsState = (memberGroups: Group[], creatorGroups: Group[]) => {
    setUserGroups(prevGroups => {
      // Start with member groups
      const allGroups = [...memberGroups];
      
      // Add creator groups that aren't already included
      creatorGroups.forEach(group => {
        if (!allGroups.some(g => g.id === group.id)) {
          allGroups.push(group);
        }
      });
      
      // Add additional info for UI
      return allGroups.map(group => ({
        ...group,
        memberCount: group.members?.filter(m => m.status === 'active').length || 0,
        recentActivity: calculateRecentActivity(group.updatedAt)
      }));
    });
  };
  
  // Helper function to calculate relative time for display
  const calculateRecentActivity = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to days/hours/minutes
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (days > 0) {
      return `${days} hari yang lalu`;
    } else if (hours > 0) {
      return `${hours} jam yang lalu`;
    } else if (minutes > 0) {
      return `${minutes} menit yang lalu`;
    } else {
      return 'Baru saja';
    }
  };

  const fetchGroupDetails = async (groupId: string): Promise<Group | null> => {
    if (!user) return null;
    
    setLoadingCurrentGroup(true);
    try {
      // Get the group document
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;
      
      // Check if user is a member
      const isMember = groupData.members.some(m => 
        m.id === user.uid && m.status === 'active'
      );
      
      if (!isMember && groupData.createdBy !== user.uid) {
        throw new Error('Not authorized to view this group');
      }
      
      // Set current group
      setCurrentGroup(groupData);
      setLoadingCurrentGroup(false);
      
      // Set up real-time listener for this group
      const unsubscribe = onSnapshot(groupRef, (doc) => {
        if (doc.exists()) {
          const updatedData = { id: doc.id, ...doc.data() } as Group;
          setCurrentGroup(updatedData);
        }
      }, (error) => {
        console.error('Error in group listener:', error);
      });
      
      // Add to listeners
      groupListeners.current.push(unsubscribe);
      
      return groupData;
    } catch (error) {
      console.error("Error fetching group details:", error);
      setLoadingCurrentGroup(false);
      return null;
    }
  };
  
  // Function to listen to a specific group in real-time
  const listenToGroup = (groupId: string, callback: (group: Group) => void) => {
    const groupRef = doc(db, 'groups', groupId);
    
    const unsubscribe = onSnapshot(groupRef, (doc) => {
      if (doc.exists()) {
        const groupData = { id: doc.id, ...doc.data() } as Group;
        callback(groupData);
      }
    }, (error) => {
      console.error('Error listening to group:', error);
    });
    
    // Return the unsubscribe function so the caller can stop listening when needed
    return unsubscribe;
  };

  const createGroup = async (groupData: any): Promise<string | null> => {
    if (!user) return null;
    
    try {
      // Get user display info based on authentication type
      let userDisplayName = "User";
      if (user.displayName) {
        userDisplayName = user.displayName;
      } else if (user.email) {
        userDisplayName = user.email;
      } else if (user.phoneNumber) {
        userDisplayName = user.phoneNumber;
      } else if (user.isAnonymous) {
        userDisplayName = "Anonymous User";
      }
      
      // Create the owner member object
      const ownerMember: Member = {
        id: user.uid,
        displayName: userDisplayName,
        role: 'owner',
        status: 'active',
        joinedAt: Date.now(),
        avatarUrl: user.photoURL || null
      };
      
      // Create the group object
      const newGroup: Omit<Group, 'id'> = {
        name: groupData.name,
        description: groupData.description || "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: user.uid,
        members: [ownerMember],
        status: 'active',
        sessions: [],
        balances: [],
        subscriptions: [],
        pendingInvitations: []
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'groups'), newGroup);
      
      // Add avatar if provided
      let avatarUrl: string | null = null;
      if (groupData.avatar) {
        avatarUrl = await uploadGroupAvatar(docRef.id, groupData.avatar);
        
        // Update the group with avatar URL
        await updateDoc(doc(db, 'groups', docRef.id), {
          avatarUrl,
          updatedAt: serverTimestamp()
        });
      }
      
      // Process invites if provided
      if (groupData.invites && groupData.invites.length > 0) {
        // Create invitations
        await inviteToGroup(docRef.id, groupData.invites);
      }
      
      // Get the created group with ID
      const createdGroup: Group = { 
        id: docRef.id, 
        ...newGroup,
        avatarUrl,
        memberCount: 1,
        recentActivity: 'Baru saja'
      };
      
      // Update local state
      setUserGroups(prev => [...prev, createdGroup]);
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating group:", error);
      return null;
    }
  };
  
  const updateGroup = async (groupId: string, updates: Partial<Group>) => {
    if (!user) throw new Error('User must be logged in to update a group');
    
    try {
      // Get the current group
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const group = groupDoc.data() as Group;
      
      // Check if user is authorized (owner or admin)
      const currentMember = group.members.find(m => m.id === user.uid);
      if (!currentMember || 
          (currentMember.role !== 'owner' && currentMember.role !== 'admin') ||
          currentMember.status !== 'active') {
        throw new Error('Not authorized to update this group');
      }
      
      // Update the group
      await updateDoc(groupRef, {
        ...updates,
        updatedAt: Date.now()
      });
      
      // Update local state if needed
      setUserGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId 
            ? { 
                ...group, 
                ...updates, 
                updatedAt: Date.now(),
                recentActivity: 'Baru saja'
              } 
            : group
        )
      );
      
      if (currentGroup?.id === groupId) {
        setCurrentGroup(prev => 
          prev ? { ...prev, ...updates, updatedAt: Date.now() } : prev
        );
      }
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  };
  
  const archiveGroup = async (groupId: string) => {
    await updateGroup(groupId, { status: 'archived' });
  };

  const createGroupSession = async (groupId: string, sessionData: any): Promise<string | null> => {
    if (!user || !currentGroup) return null;
    
    try {
      // Get the current group
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const group = groupDoc.data() as Group;
      
      // Check if user is a member
      const isMember = group.members.some(m => 
        m.id === user.uid && m.status === 'active'
      );
      
      if (!isMember) {
        throw new Error('Not authorized to create sessions in this group');
      }
      
      // Create the session object
      const newSession: Session = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: sessionData.name,
        date: sessionData.date || Date.now(),
        totalAmount: 0, // Will be updated as transactions are added
        participants: sessionData.participants || [],
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Add session to group
      await updateDoc(groupRef, {
        sessions: arrayUnion(newSession),
        updatedAt: Date.now()
      });
      
      // Update local state
      if (currentGroup && currentGroup.id === groupId) {
        setCurrentGroup(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            sessions: [...(prev.sessions || []), newSession],
            updatedAt: Date.now()
          };
        });
      }
      
      return newSession.id;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  };

  const createSubscription = async (groupId: string, subscriptionData: any): Promise<string | null> => {
    if (!user || !currentGroup) return null;
    
    try {
      // Get the current group
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const group = groupDoc.data() as Group;
      
      // Check if user is a member
      const isMember = group.members.some(m => 
        m.id === user.uid && m.status === 'active'
      );
      
      if (!isMember) {
        throw new Error('Not authorized to create subscriptions in this group');
      }
      
      // Find the primary payer
      const primaryPayerId = subscriptionData.primaryPayerId || user.uid;
      const primaryPayerMember = group.members.find(m => m.id === primaryPayerId);
      
      if (!primaryPayerMember) {
        throw new Error('Primary payer must be a group member');
      }
      
      // Create the subscription object
      const newSubscription: Subscription = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: subscriptionData.name,
        amount: parseInt(subscriptionData.amount),
        cycle: subscriptionData.cycle,
        nextBillingDate: new Date(subscriptionData.startDate).getTime(),
        primaryPayer: {
          id: primaryPayerMember.id,
          displayName: primaryPayerMember.displayName
        },
        participants: subscriptionData.participants || {},
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Add subscription to group
      await updateDoc(groupRef, {
        subscriptions: arrayUnion(newSubscription),
        updatedAt: Date.now()
      });
      
      // Update local state
      if (currentGroup && currentGroup.id === groupId) {
        setCurrentGroup(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            subscriptions: [...(prev.subscriptions || []), newSubscription],
            updatedAt: Date.now()
          };
        });
      }
      
      return newSubscription.id;
    } catch (error) {
      console.error("Error creating subscription:", error);
      return null;
    }
  };

  const calculateGroupBalances = async (groupId: string): Promise<Balance[]> => {
    if (!user) return [];
    
    try {
      // Get the current group
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const group = groupDoc.data() as Group;
      
      // Check if user is a member
      const isMember = group.members.some(m => 
        m.id === user.uid && m.status === 'active'
      );
      
      if (!isMember && group.createdBy !== user.uid) {
        throw new Error('Not authorized to view balances in this group');
      }
      
      // Calculate balances from sessions and subscriptions
      // This is a placeholder implementation - actual logic would calculate
      // based on transactions and payments in the group
      
      // For now, just return existing balances
      return group.balances || [];
    } catch (error) {
      console.error("Error calculating group balances:", error);
      return [];
    }
  };

  const markBalanceAsSettled = async (groupId: string, balanceId: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in to settle balances');
    
    try {
      // Get the current group
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const group = groupDoc.data() as Group;
      
      // Check if user is a member
      const isMember = group.members.some(m => 
        m.id === user.uid && m.status === 'active'
      );
      
      if (!isMember && group.createdBy !== user.uid) {
        throw new Error('Not authorized to settle balances in this group');
      }
      
      // Find the balance
      const balanceIndex = group.balances?.findIndex(b => b.id === balanceId) ?? -1;
      
      if (balanceIndex === -1 || !group.balances) {
        throw new Error('Balance not found');
      }
      
      // Update the balance
      const updatedBalances = [...group.balances];
      updatedBalances[balanceIndex] = {
        ...updatedBalances[balanceIndex],
        status: 'settled',
        settledAt: Date.now()
      };
      
      // Update the group
      await updateDoc(groupRef, {
        balances: updatedBalances,
        updatedAt: Date.now()
      });
      
      // Update local state
      if (currentGroup && currentGroup.id === groupId) {
        setCurrentGroup(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            balances: updatedBalances,
            updatedAt: Date.now()
          };
        });
      }
    } catch (error) {
      console.error("Error marking balance as settled:", error);
      throw error;
    }
  };

  const inviteToGroup = async (groupId: string, emails: string[]): Promise<void> => {
    if (!user) throw new Error('User must be logged in to invite users');
    
    try {
      // Get the current group
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const group = groupDoc.data() as Group;
      
      // Check if user is authorized (owner or admin)
      const currentMember = group.members.find(m => m.id === user.uid);
      if (!currentMember || 
          (currentMember.role !== 'owner' && currentMember.role !== 'admin') ||
          currentMember.status !== 'active') {
        throw new Error('Not authorized to invite users to this group');
      }
      
      // Create new invitations
      const newInvitations: Invitation[] = emails.map(email => ({
        email,
        invitedBy: user.uid,
        invitedAt: Date.now(),
        status: 'pending',
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days expiry
        code: `${groupId}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      }));
      
      // Add invitations to group
      await updateDoc(groupRef, {
        pendingInvitations: arrayUnion(...newInvitations),
        updatedAt: Date.now()
      });
      
      // Update local state
      if (currentGroup && currentGroup.id === groupId) {
        setCurrentGroup(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            pendingInvitations: [...(prev.pendingInvitations || []), ...newInvitations],
            updatedAt: Date.now()
          };
        });
      }
      
      // TODO: Send invitation emails using a backend service
      console.log(`Invitations sent to ${emails.join(', ')}`);
    } catch (error) {
      console.error("Error inviting users to group:", error);
      throw error;
    }
  };

  const acceptInvitation = async (invitationCode: string): Promise<Group | null> => {
    if (!user) throw new Error('User must be logged in to accept invitations');
    
    try {
      // Query for groups with this invitation code
      const groupsQuery = query(
        collection(db, 'groups'),
        where('pendingInvitations', 'array-contains', {
          code: invitationCode,
          status: 'pending'
        })
      );
      
      const querySnapshot = await getDocs(groupsQuery);
      
      if (querySnapshot.empty) {
        throw new Error('Invitation not found or has expired');
      }
      
      // Get the group and invitation
      const groupDoc = querySnapshot.docs[0];
      const group = groupDoc.data() as Group;
      
      // Find the invitation
      const invitationIndex = group.pendingInvitations?.findIndex(
        inv => inv.code === invitationCode && inv.status === 'pending'
      ) ?? -1;
      
      if (invitationIndex === -1 || !group.pendingInvitations) {
        throw new Error('Invitation not found');
      }
      
      const invitation = group.pendingInvitations[invitationIndex];
      
      // Check if invitation has expired
      if (invitation.expiresAt < Date.now()) {
        throw new Error('Invitation has expired');
      }
      
      // Check if user is already a member
      const existingMemberIndex = group.members.findIndex(m => m.id === user.uid);
      
      if (existingMemberIndex !== -1) {
        // If user was removed, reactivate them
        if (group.members[existingMemberIndex].status === 'removed') {
          const updatedMembers = [...group.members];
          updatedMembers[existingMemberIndex].status = 'active';
          
          await updateDoc(doc(db, 'groups', groupDoc.id), {
            members: updatedMembers,
            updatedAt: Date.now()
          });
          
          // Return the updated group
          const updatedGroup = { ...group, members: updatedMembers };
          return { ...updatedGroup, id: groupDoc.id };
        }
        
        // User is already an active member
        return { ...group, id: groupDoc.id };
      }
      
      // Get user display info based on authentication type
      let userDisplayName = "User";
      if (user.displayName) {
        userDisplayName = user.displayName;
      } else if (user.email) {
        userDisplayName = user.email;
      } else if (user.phoneNumber) {
        userDisplayName = user.phoneNumber;
      } else if (user.isAnonymous) {
        userDisplayName = "Anonymous User";
      }
      
      // Create new member object
      const newMember: Member = {
        id: user.uid,
        displayName: userDisplayName,
        avatarUrl: user.photoURL || null,
        role: 'member',
        status: 'active',
        joinedAt: Date.now()
      };
      
      // Update invitation status
      const updatedInvitations = [...group.pendingInvitations];
      updatedInvitations[invitationIndex].status = 'accepted';
      
      // Update group with new member and updated invitation
      await updateDoc(doc(db, 'groups', groupDoc.id), {
        members: arrayUnion(newMember),
        pendingInvitations: updatedInvitations,
        updatedAt: Date.now()
      });
      
      // Return the updated group
      const updatedGroup = {
        ...group,
        members: [...group.members, newMember],
        pendingInvitations: updatedInvitations
      };
      return { id: groupDoc.id, ...updatedGroup };
    } catch (error) {
      console.error("Error accepting invitation:", error);
      return null;
    }
  };

  const declineInvitation = async (invitationCode: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in to decline invitations');
    
    try {
      // Query for groups with this invitation code
      const groupsQuery = query(
        collection(db, 'groups'),
        where('pendingInvitations', 'array-contains', {
          code: invitationCode,
          status: 'pending'
        })
      );
      
      const querySnapshot = await getDocs(groupsQuery);
      
      if (querySnapshot.empty) {
        throw new Error('Invitation not found or has expired');
      }
      
      // Get the group and invitation
      const groupDoc = querySnapshot.docs[0];
      const group = groupDoc.data() as Group;
      
      // Find the invitation
      const invitationIndex = group.pendingInvitations?.findIndex(
        inv => inv.code === invitationCode && inv.status === 'pending'
      ) ?? -1;
      
      if (invitationIndex === -1 || !group.pendingInvitations) {
        throw new Error('Invitation not found');
      }
      
      // Update invitation status
      const updatedInvitations = [...group.pendingInvitations];
      updatedInvitations[invitationIndex].status = 'declined';
      
      // Update group with updated invitation
      await updateDoc(doc(db, 'groups', groupDoc.id), {
        pendingInvitations: updatedInvitations,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error declining invitation:", error);
      throw error;
    }
  };

  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in to leave a group');
    
    try {
      // Get the current group
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const group = groupDoc.data() as Group;
      
      // Check if user is a member
      const memberIndex = group.members.findIndex(m => m.id === user.uid);
      
      if (memberIndex === -1) {
        throw new Error('You are not a member of this group');
      }
      
      // Check if user is the owner
      if (group.members[memberIndex].role === 'owner') {
        // Find another admin to promote to owner
        const adminMember = group.members.find(m => 
          m.role === 'admin' && m.status === 'active' && m.id !== user.uid
        );
        
        if (!adminMember) {
          throw new Error('Cannot leave group as owner. Transfer ownership first or delete the group.');
        }
        
        // Promote admin to owner
        const updatedMembers = group.members.map(m => 
          m.id === adminMember.id 
            ? { ...m, role: 'owner' as const } 
            : m
        );
        
        // Mark current user as removed
        updatedMembers[memberIndex].status = 'removed';
        
        // Update group
        await updateDoc(groupRef, {
          members: updatedMembers,
          updatedAt: Date.now()
        });
      } else {
        // Mark user as removed
        const updatedMembers = [...group.members];
        updatedMembers[memberIndex].status = 'removed';
        
        // Update group
        await updateDoc(groupRef, {
          members: updatedMembers,
          updatedAt: Date.now()
        });
      }
      
      // Update local state
      setUserGroups(prevGroups => 
        prevGroups.filter(g => g.id !== groupId)
      );
      
      if (currentGroup?.id === groupId) {
        setCurrentGroup(null);
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      throw error;
    }
  };

  const updateMemberRole = async (groupId: string, memberId: string, newRole: 'owner' | 'admin' | 'member'): Promise<void> => {
    if (!user) throw new Error('User must be logged in to update member roles');
    
    try {
      // Get the current group
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const group = groupDoc.data() as Group;
      
      // Check if user is authorized (owner only)
      const currentMember = group.members.find(m => m.id === user.uid);
      if (!currentMember || currentMember.role !== 'owner' || currentMember.status !== 'active') {
        throw new Error('Only the group owner can update member roles');
      }
      
      // Find the member to update
      const memberIndex = group.members.findIndex(m => m.id === memberId);
      
      if (memberIndex === -1) {
        throw new Error('Member not found');
      }
      
      // If trying to change owner role
      if (group.members[memberIndex].role === 'owner' && newRole !== 'owner') {
        // Must assign a new owner first
        throw new Error('Cannot demote the owner without assigning a new owner');
      }
      
      // If assigning owner role, current user will lose owner status
      let updatedMembers = [...group.members];
      
      if (newRole === 'owner') {
        // Find current owner and demote to admin
        const currentOwnerIndex = updatedMembers.findIndex(m => m.role === 'owner');
        if (currentOwnerIndex !== -1) {
          updatedMembers[currentOwnerIndex].role = 'admin';
        }
      }
      
      // Update the member's role
      updatedMembers[memberIndex].role = newRole;
      
      // Update group
      await updateDoc(groupRef, {
        members: updatedMembers,
        updatedAt: Date.now()
      });
      
      // Update local state
      if (currentGroup?.id === groupId) {
        setCurrentGroup(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            members: updatedMembers,
            updatedAt: Date.now()
          };
        });
      }
    } catch (error) {
      console.error("Error updating member role:", error);
      throw error;
    }
  };

  const removeMember = async (groupId: string, memberId: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in to remove members');
    
    try {
      // Get the current group
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const group = groupDoc.data() as Group;
      
      // Check if user is authorized (owner or admin)
      const currentMember = group.members.find(m => m.id === user.uid);
      if (!currentMember || 
          (currentMember.role !== 'owner' && currentMember.role !== 'admin') ||
          currentMember.status !== 'active') {
        throw new Error('Not authorized to remove members');
      }
      
      // Find the member to remove
      const memberIndex = group.members.findIndex(m => m.id === memberId);
      
      if (memberIndex === -1) {
        throw new Error('Member not found');
      }
      
      // Check if trying to remove owner
      if (group.members[memberIndex].role === 'owner') {
        throw new Error('Cannot remove the group owner');
      }
      
      // Check if admin trying to remove another admin
      if (currentMember.role === 'admin' && group.members[memberIndex].role === 'admin') {
        throw new Error('Admins cannot remove other admins');
      }
      
      // Mark member as removed
      const updatedMembers = [...group.members];
      updatedMembers[memberIndex].status = 'removed';
      
      // Update group
      await updateDoc(groupRef, {
        members: updatedMembers,
        updatedAt: Date.now()
      });
      
      // Update local state
      if (currentGroup?.id === groupId) {
        setCurrentGroup(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            members: updatedMembers,
            updatedAt: Date.now()
          };
        });
      }
    } catch (error) {
      console.error("Error removing member:", error);
      throw error;
    }
  };

  const uploadGroupAvatar = async (groupId: string, file: File): Promise<string> => {
    if (!user) throw new Error('User must be logged in to upload avatars');
    
    try {
      // Create storage reference
      const storageRef = ref(storage, `groups/${groupId}/avatar-${Date.now()}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update group with new avatar URL
      await updateDoc(doc(db, 'groups', groupId), {
        avatarUrl: downloadURL,
        updatedAt: Date.now()
      });
      
      // Update local state
      if (currentGroup?.id === groupId) {
        setCurrentGroup(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            avatarUrl: downloadURL,
            updatedAt: Date.now()
          };
        });
      }
      
      setUserGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId 
            ? { ...group, avatarUrl: downloadURL, updatedAt: Date.now() } 
            : group
        )
      );
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading group avatar:", error);
      throw error;
    }
  };

  const saveReceiptSplit = async (groupId: string, receiptData: any): Promise<string | null> => {
    if (!user) return null;
    
    try {
      // Get the current group
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const group = groupDoc.data() as Group;
      
      // Check if user is a member
      const isMember = group.members.some(m => 
        m.id === user.uid && m.status === 'active'
      );
      
      if (!isMember) {
        throw new Error('Not authorized to create sessions in this group');
      }
      
      // Create the session object with receipt data
      const newSession: Session = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${receiptData.merchant} - ${receiptData.date}`,
        date: Date.now(),
        totalAmount: receiptData.total,
        participants: receiptData.participants || [],
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Calculate balances from the receipt data
      const newBalances: Balance[] = receiptData.balances.map((balance: any) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fromUser: {
          id: balance.fromId,
          displayName: group.members.find(m => m.id === balance.fromId)?.displayName || 'Unknown'
        },
        toUser: {
          id: balance.toId,
          displayName: group.members.find(m => m.id === balance.toId)?.displayName || 'Unknown'
        },
        amount: balance.amount,
        status: 'pending',
        createdAt: Date.now()
      }));
      
      // Add session and balances to group
      await updateDoc(groupRef, {
        sessions: arrayUnion(newSession),
        balances: arrayUnion(...newBalances),
        updatedAt: Date.now()
      });
      
      // Update local state
      if (currentGroup && currentGroup.id === groupId) {
        setCurrentGroup(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            sessions: [...(prev.sessions || []), newSession],
            balances: [...(prev.balances || []), ...newBalances],
            updatedAt: Date.now()
          };
        });
      }
      
      return newSession.id;
    } catch (error) {
      console.error("Error saving receipt split:", error);
      return null;
    }
  };

  const value = {
    userGroups,
    currentGroup,
    loadingGroups,
    loadingCurrentGroup,
    fetchUserGroups,
    fetchGroupDetails,
    listenToGroup,
    createGroup,
    updateGroup,
    archiveGroup,
    createGroupSession,
    createSubscription,
    calculateGroupBalances,
    markBalanceAsSettled,
    inviteToGroup,
    acceptInvitation,
    declineInvitation,
    leaveGroup,
    updateMemberRole,
    removeMember,
    uploadGroupAvatar,
    saveReceiptSplit
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  return context;
}
