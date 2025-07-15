"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Clock } from "lucide-react";
import { HoverGlowCard } from "@/components/ui/hover-glow-card";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    avatarUrl?: string | null;
    recentActivity?: string;
  };
  onClick: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const { name, description, memberCount, avatarUrl, recentActivity } = group;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <HoverGlowCard onClick={onClick} beamColor1="#8b5cf6" beamColor2="#06b6d4" animate={false}>
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg bg-gradient-to-r from-purple-500 to-cyan-500">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full rounded-xl object-cover" />
          ) : (
            getInitials(name)
          )}
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-1">{name}</h3>
      {description && (
        <p className="text-gray-400 mb-4 line-clamp-2 text-sm">{description}</p>
      )}
      
      <div className="flex justify-between mt-auto">
        <div className="flex items-center text-gray-400 text-sm">
          <Users size={14} className="mr-1" />
          <span>{memberCount} anggota</span>
        </div>
        
        {recentActivity && (
          <div className="flex items-center text-gray-400 text-sm">
            <Clock size={14} className="mr-1" />
            <span>{recentActivity}</span>
          </div>
        )}
      </div>
    </HoverGlowCard>
  );
}
