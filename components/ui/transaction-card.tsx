"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'

interface ReceiptItem {
  id: string
  name: string
  price: number
  quantity: number
  participants: string[]
}

interface Transaction {
  id: string
  title: string
  amount: number
  paidBy: string
  paidByName: string
  date: string
  receiptItems?: ReceiptItem[]
  receiptImageUrl?: string
}

interface TransactionCardProps {
  transaction: Transaction
  participants: { id: string; name: string }[]
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transactionId: string) => void
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  participants,
  onEdit,
  onDelete
}) => {
  const [expanded, setExpanded] = useState(false)
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  // Get participant name by id
  const getParticipantName = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId)
    return participant ? participant.name : 'Unknown'
  }
  
  // Calculate how many people are splitting each item
  const getItemSplitText = (item: ReceiptItem) => {
    if (item.participants.length === participants.length) {
      return 'Semua orang'
    } else if (item.participants.length === 1) {
      return getParticipantName(item.participants[0])
    } else {
      return `${item.participants.length} orang`
    }
  }
  
  // Get total items price
  const getTotalItemsPrice = () => {
    if (!transaction.receiptItems || transaction.receiptItems.length === 0) {
      return transaction.amount
    }
    
    return transaction.receiptItems.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
  }
  
  const hasReceiptItems = transaction.receiptItems && transaction.receiptItems.length > 0
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            {transaction.receiptImageUrl ? (
              <div className="h-10 w-10 rounded-md bg-blue-500/20 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-300" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-md bg-purple-500/20 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-purple-300" />
              </div>
            )}
            
            <div>
              <h3 className="font-medium text-lg">{transaction.title}</h3>
              <div className="text-sm text-gray-400">
                {formatRelativeTime(new Date(transaction.date))}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xl font-bold">{formatCurrency(transaction.amount)}</div>
            <div className="flex items-center justify-end text-sm text-gray-400">
              <span>Dibayar oleh</span>
              <Avatar className="h-5 w-5 ml-1">
                <AvatarFallback className="text-xs bg-blue-500/30 text-blue-200">
                  {transaction.paidByName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
        
        {hasReceiptItems && (
          <div className="mt-4 flex justify-between items-center">
            <Badge className="bg-blue-500/20 text-blue-300 border-0">
              {transaction.receiptItems.length} item struk
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {expanded && hasReceiptItems && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {transaction.receiptItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-400">
                      {item.quantity} × {formatCurrency(item.price)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(item.price * item.quantity)}</div>
                    <div className="text-sm text-gray-400">
                      Dibagi ke {getItemSplitText(item)}
                    </div>
                  </div>
                </div>
              ))}
              
              {transaction.receiptImageUrl && (
                <div className="mt-4 border border-white/10 rounded-lg overflow-hidden">
                  <img 
                    src={transaction.receiptImageUrl} 
                    alt="Receipt" 
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="p-3 border-t border-white/10 flex justify-end space-x-2">
        {onEdit && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(transaction)}
            className="text-gray-400 hover:text-white"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(transaction.id)}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Hapus
          </Button>
        )}
      </div>
    </motion.div>
  )
}
