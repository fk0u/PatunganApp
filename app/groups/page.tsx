"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Plus, Users, ArrowLeft, PlusCircle } from "lucide-react";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { GroupCard } from "@/components/groups/GroupCard";

export default function GroupsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  interface GroupType {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    avatarUrl: string | null;
    recentActivity: string;
  }
  
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/");
    } else {
      // Load user's groups
      fetchUserGroups();
    }
  }, [user, router]);

  const fetchUserGroups = async () => {
    setLoading(true);
    try {
      // Get the group context
      const groupContext = useGroup();
      
      // Fetch groups from Firebase
      await groupContext.fetchUserGroups();
      
      // Update the local state with groups from context
      setGroups(groupContext.userGroups.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description || "",
        memberCount: group.members?.filter(m => m.status === 'active').length || 0,
        avatarUrl: group.avatarUrl || null,
        recentActivity: calculateRecentActivity(group.updatedAt)
      })));
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setLoading(false);
    }
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

  interface GroupDataType {
    name: string;
    description: string;
    invites?: string[];
  }

  const handleCreateGroup = async (groupData: GroupDataType) => {
    try {
      const { createGroup } = useGroup();
      
      // Create the new group in Firebase
      const groupId = await createGroup({
        name: groupData.name,
        description: groupData.description,
        invites: groupData.invites || []
      });
      
      if (groupId) {
        // Group created successfully, refresh the list
        await fetchUserGroups();
        
        // Navigate to the group detail page
        router.push(`/groups/${groupId}`);
      }
      
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <BackgroundBeams />

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Return to dashboard"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold">Grup Patungan</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2 rounded-full font-medium"
            >
              <Plus size={18} />
              <span>Buat Grup Baru</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-t-purple-500 border-white/20 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">Memuat grup...</p>
          </div>
        ) : groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} onClick={() => router.push(`/groups/${group.id}`)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
              <Users size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Belum Ada Grup</h2>
            <p className="text-gray-400 max-w-md mb-8">
              Buat grup untuk memulai patungan dengan teman-teman, keluarga, atau kolega Anda.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-cyan-500 px-6 py-3 rounded-full font-medium"
            >
              <Plus size={20} />
              <span>Buat Grup Baru</span>
            </motion.button>
          </div>
        )}
      </main>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGroup}
      />
    </div>
  );
}
