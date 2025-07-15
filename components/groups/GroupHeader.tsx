"use client";

import React from "react";
import { Calendar, Users } from "lucide-react";

interface GroupHeaderProps {
  group: {
    name: string;
    description?: string;
    createdAt: string;
    members: any[];
  };
}

export function GroupHeader({ group }: GroupHeaderProps) {
  const { name, description, createdAt, members } = group;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="flex items-start md:items-center flex-col md:flex-row justify-between">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold mb-1">{name}</h2>
          {description && <p className="text-gray-400">{description}</p>}
          
          <div className="flex items-center mt-3 text-sm text-gray-400">
            <div className="flex items-center mr-4">
              <Calendar size={14} className="mr-1" />
              <span>Dibuat {formatDate(createdAt)}</span>
            </div>
            
            <div className="flex items-center">
              <Users size={14} className="mr-1" />
              <span>{members.length} anggota</span>
            </div>
          </div>
        </div>
        
        {/* Members Avatars */}
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((member, index) => (
            <div
              key={member.id}
              className="w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium"
              title={member.displayName}
            >
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
          ))}
          
          {members.length > 4 && (
            <div 
              className="w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center bg-white/20 text-white font-medium"
            >
              +{members.length - 4}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
