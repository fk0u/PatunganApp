"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BadgeInfo, PieChart, Receipt, Users } from 'lucide-react'
import { AvatarGroup, Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

interface SessionSummaryProps {
  title: string
  description?: string
  totalAmount: number
  participants: {
    id: string
    name: string
    avatar?: string
  }[]
  transactionCount: number
  startDate: string
  settledPercentage: number
  onViewDetails?: () => void
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  title,
  description,
  totalAmount,
  participants,
  transactionCount,
  startDate,
  settledPercentage,
  onViewDetails
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
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }
    return new Date(dateString).toLocaleDateString('id-ID', options)
  }
  
  return (
    <Card className="overflow-hidden bg-white/5 border-white/10">
      <CardHeader className="bg-gradient-to-r from-blue-900/30 to-purple-900/30">
        <CardTitle className="flex justify-between items-start">
          <span>{title}</span>
          <span className="text-xl font-bold">
            {formatCurrency(totalAmount)}
          </span>
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-400">{description}</p>
        )}
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-300">Peserta</span>
            </div>
            
            <div className="flex items-center">
              <AvatarGroup>
                {participants.slice(0, 3).map((participant) => (
                  <Avatar key={participant.id} className="border-2 border-background">
                    {participant.avatar ? (
                      <AvatarImage src={participant.avatar} alt={participant.name} />
                    ) : (
                      <AvatarFallback className="bg-blue-500/30 text-blue-200">
                        {participant.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ))}
              </AvatarGroup>
              
              {participants.length > 3 && (
                <span className="ml-2 text-sm text-gray-400">
                  +{participants.length - 3} lainnya
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-300">Transaksi</span>
            </div>
            <span className="font-medium">{transactionCount}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BadgeInfo className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-300">Dimulai pada</span>
            </div>
            <span className="font-medium">{formatDate(startDate)}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Status Penyelesaian</span>
              </div>
              <span className="font-medium">{settledPercentage}%</span>
            </div>
            <Progress value={settledPercentage} className="h-2 bg-white/10" />
          </div>
          
          {onViewDetails && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 mt-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-sm font-medium"
              onClick={onViewDetails}
            >
              Lihat Detail
            </motion.button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
