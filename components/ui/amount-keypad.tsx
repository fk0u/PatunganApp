"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Backspace, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AmountKeypadProps {
  initialValue?: number
  onChange: (amount: number) => void
  onConfirm?: () => void
  currency?: string
  maxDigits?: number
}

export const AmountKeypad: React.FC<AmountKeypadProps> = ({
  initialValue = 0,
  onChange,
  onConfirm,
  currency = 'IDR',
  maxDigits = 10
}) => {
  const [inputValue, setInputValue] = useState(initialValue.toString())
  
  useEffect(() => {
    // Update parent component when value changes
    const numericValue = parseInt(inputValue) || 0
    onChange(numericValue)
  }, [inputValue, onChange])
  
  // Format display value
  const getDisplayValue = () => {
    const value = parseInt(inputValue) || 0
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  
  // Handle digit press
  const handleDigitPress = (digit: string) => {
    if (inputValue.length >= maxDigits) return
    
    // If current value is 0, replace it
    if (inputValue === '0') {
      setInputValue(digit)
    } else {
      setInputValue(inputValue + digit)
    }
  }
  
  // Handle backspace
  const handleBackspace = () => {
    if (inputValue.length <= 1) {
      setInputValue('0')
    } else {
      setInputValue(inputValue.slice(0, -1))
    }
  }
  
  // Handle clear
  const handleClear = () => {
    setInputValue('0')
  }
  
  // The keypad keys
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '000', '0', 'backspace'
  ]
  
  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-white/5 rounded-lg">
        <p className="text-sm text-gray-400 mb-1">Jumlah</p>
        <h2 className="text-3xl font-bold">{getDisplayValue()}</h2>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              py-4 rounded-lg text-xl font-medium
              ${key === 'backspace' 
                ? 'bg-red-500/20 text-red-300' 
                : 'bg-white/10 hover:bg-white/20'}
            `}
            onClick={() => {
              if (key === 'backspace') {
                handleBackspace()
              } else {
                handleDigitPress(key)
              }
            }}
          >
            {key === 'backspace' ? (
              <Backspace className="h-6 w-6 mx-auto" />
            ) : (
              key
            )}
          </motion.button>
        ))}
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant="outline"
          className="flex-1 border-red-500/50 text-red-300 hover:bg-red-500/20"
          onClick={handleClear}
        >
          <X className="h-5 w-5 mr-1" />
          Reset
        </Button>
        
        {onConfirm && (
          <Button
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500"
            onClick={onConfirm}
          >
            Konfirmasi
          </Button>
        )}
      </div>
    </div>
  )
}
