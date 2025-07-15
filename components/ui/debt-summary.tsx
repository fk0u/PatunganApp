"use client"

import React from 'react'
import { DebtCalculation } from '@/types'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DebtSummaryProps {
  debts: DebtCalculation[]
  onMarkPaid?: (debtId: string) => void
}

export const DebtSummary: React.FC<DebtSummaryProps> = ({ 
  debts,
  onMarkPaid
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  if (debts.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400">Tidak ada hutang yang perlu dibayar.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {debts.map((debt, index) => (
        <motion.div
          key={`${debt.from}-${debt.to}-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-red-500/30 text-red-200">
                  {debt.fromName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex items-center">
                <span className="font-medium">{debt.fromName}</span>
                <div className="flex items-center mx-3">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <Avatar>
                  <AvatarFallback className="bg-green-500/30 text-green-200">
                    {debt.toName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="ml-2 font-medium">{debt.toName}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold">{formatCurrency(debt.amount)}</div>
              
              {debt.status === 'paid' ? (
                <Badge className="bg-green-500/20 text-green-300 border-0">
                  Sudah Dibayar
                </Badge>
              ) : onMarkPaid ? (
                <Button 
                  size="sm" 
                  className="mt-2 bg-gradient-to-r from-green-600 to-green-500"
                  onClick={() => onMarkPaid(`${debt.from}-${debt.to}`)}
                >
                  Tandai Dibayar
                </Button>
              ) : null}
            </div>
          </div>
        </motion.div>
      ))}
      
      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h3 className="font-medium text-blue-300 mb-2">Tentang Perhitungan Hutang</h3>
        <p className="text-sm text-gray-300">
          Sistem secara otomatis menyederhanakan hutang agar jumlah transfer antar peserta minimal.
          Ini membantu mengurangi jumlah transaksi yang perlu dilakukan.
        </p>
      </div>
    </div>
  )
}
