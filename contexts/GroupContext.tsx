"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

// Define types
type Member = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  role: string;
  joinedAt?: string;
};

type Balance = {
  fromUser: {
    id: string;
    displayName: string;
  };
  toUser: {
    id: string;
    displayName: string;
  };
  amount: number;
};

type Session = {
  id: string;
  name: string;
  date: string;
  totalAmount: number;
  participants: number | string[];
  status?: string;
};

type Subscription = {
  id: string;
  name: string;
  amount: number;
  cycle: string;
  nextBillingDate: string;
  primaryPayer: {
    id: string;
    displayName: string;
  };
  participants?: Record<string, number>;
};

type Group = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  members: Member[];
  sessions?: Session[];
  balances?: Balance[];
  subscriptions?: Subscription[];
  memberCount?: number;
  avatarUrl?: string | null;
  recentActivity?: string;
};

interface GroupContextType {
  userGroups: Group[];
  currentGroup: Group | null;
  loadingGroups: boolean;
  loadingCurrentGroup: boolean;
  fetchUserGroups: () => Promise<void>;
  fetchGroupDetails: (groupId: string) => Promise<void>;
  createGroup: (groupData: any) => Promise<string | null>;
  createGroupSession: (groupId: string, sessionData: any) => Promise<string | null>;
  createSubscription: (groupId: string, subscriptionData: any) => Promise<string | null>;
  calculateGroupBalances: (groupId: string) => Promise<Balance[]>;
  markBalanceAsSettled: (groupId: string, balanceId: string) => Promise<void>;
  inviteToGroup: (groupId: string, emails: string[]) => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [loadingCurrentGroup, setLoadingCurrentGroup] = useState<boolean>(true);

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
      // TODO: Replace with actual Firebase fetch
      // This is placeholder data for UI development
      setTimeout(() => {
        const mockGroups: Group[] = [
          {
            id: "group1",
            name: "Anak Kostan",
            description: "Grup untuk patungan anak-anak kost",
            memberCount: 5,
            createdAt: new Date("2025-06-01").toISOString(),
            createdBy: "user123",
            members: [],
            avatarUrl: null,
            recentActivity: "2 hari yang lalu"
          },
          {
            id: "group2",
            name: "Tim Futsal",
            description: "Patungan bayar lapangan dan minum",
            memberCount: 8,
            createdAt: new Date("2025-05-15").toISOString(),
            createdBy: "user123",
            members: [],
            avatarUrl: null,
            recentActivity: "1 minggu yang lalu"
          }
        ];
        setUserGroups(mockGroups);
        setLoadingGroups(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      setLoadingGroups(false);
    }
  };

  const fetchGroupDetails = async (groupId: string) => {
    if (!user) return;
    
    setLoadingCurrentGroup(true);
    try {
      // TODO: Replace with actual Firebase fetch
      // This is placeholder data for UI development
      setTimeout(() => {
        const group = {
          id: groupId,
          name: groupId === "group1" ? "Anak Kostan" : "Tim Futsal",
          description: "Grup untuk patungan bersama",
          createdAt: new Date("2025-06-01").toISOString(),
          createdBy: "user123",
          members: [
            { id: "user123", displayName: "Al-Ghani", avatarUrl: null, role: "owner" },
            { id: "user456", displayName: "Budi", avatarUrl: null, role: "member" },
            { id: "user789", displayName: "Cahya", avatarUrl: null, role: "member" },
          ],
          sessions: [
            { 
              id: "session1", 
              name: "Makan di Warteg", 
              date: new Date("2025-07-10").toISOString(),
              totalAmount: 150000,
              participants: 3
            },
            { 
              id: "session2", 
              name: "Belanja Bulanan", 
              date: new Date("2025-07-05").toISOString(),
              totalAmount: 420000,
              participants: 2
            }
          ],
          balances: [
            { fromUser: { id: "user456", displayName: "Budi" }, toUser: { id: "user123", displayName: "Al-Ghani" }, amount: 75000 },
            { fromUser: { id: "user789", displayName: "Cahya" }, toUser: { id: "user123", displayName: "Al-Ghani" }, amount: 45000 },
          ],
          subscriptions: [
            {
              id: "sub1",
              name: "Netflix",
              amount: 169000,
              cycle: "monthly",
              nextBillingDate: new Date("2025-07-20").toISOString(),
              primaryPayer: { id: "user123", displayName: "Al-Ghani" }
            }
          ]
        };
        
        setCurrentGroup(group);
        setLoadingCurrentGroup(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching group details:", error);
      setLoadingCurrentGroup(false);
    }
  };

  const createGroup = async (groupData: any): Promise<string | null> => {
    if (!user) return null;
    
    try {
      // TODO: Replace with actual Firebase implementation
      console.log("Creating group with data:", groupData);
      
      // Mock implementation
      const newGroupId = "group" + (userGroups.length + 1);
      const newGroup = {
        id: newGroupId,
        name: groupData.name,
        description: groupData.description || "",
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        memberCount: 1,
        members: [
          { id: user.uid, displayName: user.displayName || user.email || "User", role: "owner" }
        ],
        avatarUrl: null,
        recentActivity: "Baru saja"
      };
      
      setUserGroups(prev => [...prev, newGroup]);
      return newGroupId;
    } catch (error) {
      console.error("Error creating group:", error);
      return null;
    }
  };

  const createGroupSession = async (groupId: string, sessionData: any): Promise<string | null> => {
    if (!user || !currentGroup) return null;
    
    try {
      // TODO: Replace with actual Firebase implementation
      console.log("Creating session with data:", { groupId, ...sessionData });
      
      // Mock implementation
      const newSessionId = `session${Date.now()}`;
      const newSession = {
        id: newSessionId,
        name: sessionData.name,
        date: sessionData.date,
        totalAmount: 0, // Will be updated as transactions are added
        participants: sessionData.participants.length,
        status: "active"
      };
      
      // Update the current group with the new session
      setCurrentGroup(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          sessions: [...(prev.sessions || []), newSession]
        };
      });
      
      return newSessionId;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  };

  const createSubscription = async (groupId: string, subscriptionData: any): Promise<string | null> => {
    if (!user || !currentGroup) return null;
    
    try {
      // TODO: Replace with actual Firebase implementation
      console.log("Creating subscription with data:", { groupId, ...subscriptionData });
      
      // Mock implementation
      const newSubscriptionId = `sub${Date.now()}`;
      const primaryPayer = currentGroup.members.find(m => m.id === subscriptionData.primaryPayerId);
      
      if (!primaryPayer) return null;
      
      const newSubscription = {
        id: newSubscriptionId,
        name: subscriptionData.name,
        amount: parseInt(subscriptionData.amount),
        cycle: subscriptionData.cycle,
        nextBillingDate: new Date(subscriptionData.startDate).toISOString(),
        primaryPayer: {
          id: primaryPayer.id,
          displayName: primaryPayer.displayName
        },
        participants: subscriptionData.participants
      };
      
      // Update the current group with the new subscription
      setCurrentGroup(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          subscriptions: [...(prev.subscriptions || []), newSubscription]
        };
      });
      
      return newSubscriptionId;
    } catch (error) {
      console.error("Error creating subscription:", error);
      return null;
    }
  };

  const calculateGroupBalances = async (groupId: string): Promise<Balance[]> => {
    if (!user || !currentGroup) return [];
    
    try {
      // TODO: Replace with actual Firebase implementation
      console.log("Calculating balances for group:", groupId);
      
      // For now, return the mock balances from the currentGroup
      return currentGroup.balances || [];
    } catch (error) {
      console.error("Error calculating group balances:", error);
      return [];
    }
  };

  const markBalanceAsSettled = async (groupId: string, balanceId: string): Promise<void> => {
    if (!user || !currentGroup) return;
    
    try {
      // TODO: Replace with actual Firebase implementation
      console.log("Marking balance as settled:", { groupId, balanceId });
      
      // For now, just remove the balance from the currentGroup
      setCurrentGroup(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          balances: prev.balances?.filter(b => 
            `${b.fromUser.id}-${b.toUser.id}` !== balanceId
          ) || []
        };
      });
    } catch (error) {
      console.error("Error marking balance as settled:", error);
    }
  };

  const inviteToGroup = async (groupId: string, emails: string[]): Promise<void> => {
    if (!user || !currentGroup) return;
    
    try {
      // TODO: Replace with actual Firebase implementation
      console.log("Inviting users to group:", { groupId, emails });
      
      // Mock implementation - just log the action
      console.log(`Invited ${emails.length} users to group ${groupId}`);
    } catch (error) {
      console.error("Error inviting users to group:", error);
    }
  };

  const value = {
    userGroups,
    currentGroup,
    loadingGroups,
    loadingCurrentGroup,
    fetchUserGroups,
    fetchGroupDetails,
    createGroup,
    createGroupSession,
    createSubscription,
    calculateGroupBalances,
    markBalanceAsSettled,
    inviteToGroup
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
