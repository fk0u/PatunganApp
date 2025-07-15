"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Banknote, Smartphone, Check } from 'lucide-react'

type PaymentMethod = 'cash' | 'card' | 'mobile' | 'other'

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod
  onChange: (method: PaymentMethod) => void
}

interface PaymentMethodOption {
  id: PaymentMethod
  label: string
  icon: React.ReactNode
  description: string
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onChange
}) => {
  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'cash',
      label: 'Tunai',
      icon: <Banknote className="h-6 w-6" />,
      description: 'Pembayaran dengan uang tunai'
    },
    {
      id: 'card',
      label: 'Kartu',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Kartu debit atau kredit'
    },
    {
      id: 'mobile',
      label: 'E-Wallet',
      icon: <Smartphone className="h-6 w-6" />,
      description: 'GoPay, OVO, DANA, dll'
    },
    {
      id: 'other',
      label: 'Lainnya',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Metode pembayaran lainnya'
    }
  ]
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-400">Metode Pembayaran</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {paymentMethods.map((method) => (
          <motion.button
            key={method.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`
              relative p-4 rounded-lg border text-left
              ${selectedMethod === method.id 
                ? 'border-blue-500 bg-blue-500/20' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'}
            `}
            onClick={() => onChange(method.id)}
          >
            <div className="flex items-center mb-2">
              <div className={`
                p-2 rounded-full mr-3
                ${selectedMethod === method.id ? 'bg-blue-500' : 'bg-white/10'}
              `}>
                {method.icon}
              </div>
              
              <div>
                <div className="font-medium">{method.label}</div>
                <div className="text-xs text-gray-400">{method.description}</div>
              </div>
            </div>
            
            {selectedMethod === method.id && (
              <div className="absolute top-2 right-2">
                <div className="bg-blue-500 rounded-full p-1">
                  <Check className="h-3 w-3" />
                </div>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
