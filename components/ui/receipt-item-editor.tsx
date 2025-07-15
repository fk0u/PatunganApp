"use client"

import React, { useState } from 'react'
import { ReceiptItem } from '@/types'
import { motion } from 'framer-motion'
import { Trash, DollarSign, ShoppingBag, Users } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Participant } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ReceiptItemEditorProps {
  item: ReceiptItem
  onUpdate: (updatedItem: ReceiptItem) => void
  onRemove: () => void
  onAssignParticipants: () => void
  participants: Participant[]
}

export const ReceiptItemEditor: React.FC<ReceiptItemEditorProps> = ({
  item,
  onUpdate,
  onRemove,
  onAssignParticipants,
  participants
}) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...item,
      name: e.target.value
    })
  }
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value)
    if (!isNaN(price)) {
      onUpdate({
        ...item,
        price
      })
    }
  }
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value)
    if (!isNaN(quantity) && quantity > 0) {
      onUpdate({
        ...item,
        quantity
      })
    }
  }
  
  const incrementQuantity = () => {
    onUpdate({
      ...item,
      quantity: item.quantity + 1
    })
  }
  
  const decrementQuantity = () => {
    if (item.quantity > 1) {
      onUpdate({
        ...item,
        quantity: item.quantity - 1
      })
    }
  }
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  return (
    <div>
      <div className="grid grid-cols-12 gap-2 mb-2">
        <div className="col-span-6">
          <Input
            value={item.name}
            onChange={handleNameChange}
            placeholder="Nama item"
            className="bg-black/30 border-white/10"
          />
        </div>
        
        <div className="col-span-3">
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="number"
              value={item.price}
              onChange={handlePriceChange}
              placeholder="Harga"
              className="pl-8 bg-black/30 border-white/10"
            />
          </div>
        </div>
        
        <div className="col-span-3">
          <div className="flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={decrementQuantity}
              disabled={item.quantity <= 1}
              className="h-10 w-10 rounded-r-none bg-black/30 border-white/10"
            >
              -
            </Button>
            <Input
              type="number"
              value={item.quantity}
              onChange={handleQuantityChange}
              className="rounded-none text-center bg-black/30 border-white/10 w-10"
              min={1}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={incrementQuantity}
              className="h-10 w-10 rounded-l-none bg-black/30 border-white/10"
            >
              +
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-medium">
            {formatCurrency(item.price * item.quantity)}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAssignParticipants}
            className="h-8 bg-black/30 border-white/10"
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {item.assignedTo.length === 0 
              ? "Pilih Peserta" 
              : `${item.assignedTo.length} Peserta`}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="h-8 text-red-400 bg-black/30 border-white/10 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30"
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {item.assignedTo.length > 0 && (
        <div className="mt-2">
          <div className="flex -space-x-2">
            {item.assignedTo.slice(0, 5).map((userId, index) => {
              const participant = participants.find(p => p.userId === userId)
              if (!participant) return null
              
              return (
                <Avatar key={userId} className="h-6 w-6 border border-black">
                  {participant.avatarUrl ? (
                    <AvatarImage src={participant.avatarUrl} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs">
                      {participant.displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              )
            })}
            
            {item.assignedTo.length > 5 && (
              <Avatar className="h-6 w-6 border border-black">
                <AvatarFallback className="bg-gray-700 text-white text-xs">
                  +{item.assignedTo.length - 5}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
