"use client";

import React from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";

interface Member {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  role: string;
}

interface GroupMembersListProps {
  members: Member[];
}

export function GroupMembersList({ members }: GroupMembersListProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const getRoleName = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Pemilik';
      case 'admin':
        return 'Admin';
      default:
        return 'Anggota';
    }
  };
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'admin':
        return 'bg-purple-500/20 text-purple-300';
      default:
        return 'bg-blue-500/20 text-blue-300';
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
      <div className="divide-y divide-white/10">
        {members.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-4 hover:bg-white/5"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium">
                {member.avatarUrl ? (
                  <img 
                    src={member.avatarUrl} 
                    alt={member.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(member.displayName)
                )}
              </div>
              
              <div>
                <div className="flex items-center">
                  <p className="font-medium">{member.displayName}</p>
                  {member.role === 'owner' && (
                    <Crown size={14} className="ml-1 text-yellow-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400">@{member.displayName.toLowerCase().replace(' ', '')}</p>
              </div>
            </div>
            
            <div className={`px-2 py-1 rounded-full text-xs ${getRoleColor(member.role)}`}>
              {getRoleName(member.role)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
