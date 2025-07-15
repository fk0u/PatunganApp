"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

interface Balance {
  fromUser: {
    id: string;
    displayName: string;
  };
  toUser: {
    id: string;
    displayName: string;
  };
  amount: number;
}

interface GroupBalancesSummaryProps {
  balances: Balance[];
}

export function GroupBalancesSummary({ balances }: GroupBalancesSummaryProps) {
  if (balances.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-400">Tidak ada saldo yang perlu diselesaikan.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
      <div className="divide-y divide-white/10">
        {balances.map((balance, index) => (
          <motion.div
            key={`${balance.fromUser.id}-${balance.toUser.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 hover:bg-white/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-1 items-center">
                <div className="flex flex-col items-center justify-center mr-3">
                  <span className="text-sm text-gray-400">Dari</span>
                  <span className="font-medium">{balance.fromUser.displayName}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center mx-3">
                  <ArrowDown className="rotate-270 text-purple-400 mb-1" size={20} />
                  <span className="font-bold text-purple-400">
                    Rp {balance.amount.toLocaleString("id-ID")}
                  </span>
                </div>
                
                <div className="flex flex-col items-center justify-center ml-3">
                  <span className="text-sm text-gray-400">Ke</span>
                  <span className="font-medium">{balance.toUser.displayName}</span>
                </div>
              </div>
              
              <button className="ml-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                Selesaikan
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
