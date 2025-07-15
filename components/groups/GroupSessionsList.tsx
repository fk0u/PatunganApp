"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, Users, ArrowRight, Receipt } from "lucide-react";
import { HoverGlowCard } from "@/components/ui/hover-glow-card";
import { useRouter } from "next/navigation";

interface Session {
  id: string;
  name: string;
  date: string;
  totalAmount: number;
  participants: number;
}

interface GroupSessionsListProps {
  sessions: Session[];
  groupId: string;
}

export function GroupSessionsList({ sessions, groupId }: GroupSessionsListProps) {
  const router = useRouter();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };
  
  const handleSessionClick = (sessionId: string) => {
    router.push(`/groups/${groupId}/sessions/${sessionId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sessions.map((session, index) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <HoverGlowCard
            onClick={() => handleSessionClick(session.id)}
            beamColor1="#8b5cf6"
            beamColor2="#06b6d4"
            animate={false}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-purple-500 to-cyan-500 text-white">
                <Receipt size={24} />
              </div>
              <div className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-300 text-xs">
                {formatDate(session.date)}
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-1">{session.name}</h3>
            <p className="text-2xl font-bold text-purple-400 mb-3">
              Rp {session.totalAmount.toLocaleString("id-ID")}
            </p>
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center text-gray-400 text-sm">
                <Users size={16} className="mr-1" />
                <span>{session.participants} orang</span>
              </div>
              
              <div className="flex items-center text-cyan-400 text-sm font-medium">
                <span>Detail</span>
                <ArrowRight size={14} className="ml-1" />
              </div>
            </div>
          </HoverGlowCard>
        </motion.div>
      ))}
    </div>
  );
}
