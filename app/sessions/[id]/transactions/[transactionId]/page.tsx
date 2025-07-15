"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Receipt, 
  Calendar, 
  Clock,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle,
  Calendar as CalendarIcon,
  Search,
  RefreshCw,
  XCircle
} from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useAuth } from "@/contexts/AuthContext"
import { useSessions } from "@/contexts/SessionContext"
import { toast } from "sonner"

export default function TransactionDetailPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { getSessionById, getTransactionById } = useSessions()
  
  const [session, setSession] = useState<any>(null)
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState<any[]>([])
  
  // This function would need to be added to the SessionContext
  const getTransactionById = async (sessionId: string, transactionId: string) => {
    try {
      const sessionData = await getSessionById(sessionId)
      if (!sessionData) return null
      
      const transaction = sessionData.transactions.find(t => t.id === transactionId)
      return transaction || null
    } catch (error) {
      console.error("Error getting transaction:", error)
      return null
    }
  }
  
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    const fetchData = async () => {
      setLoading(true)
      
      // Get URL params - in a real implementation, you would use useParams()
      const urlParams = new URLSearchParams(window.location.search)
      const sessionId = urlParams.get('sessionId')
      const transactionId = urlParams.get('transactionId')
      
      if (!sessionId || !transactionId) {
        toast.error("ID sesi atau transaksi tidak ditemukan")
        router.push('/sessions')
        return
      }
      
      try {
        // Get session data
        const sessionData = await getSessionById(sessionId)
        if (!sessionData) {
          toast.error("Sesi tidak ditemukan")
          router.push('/sessions')
          return
        }
        setSession(sessionData)
        
        // Get transaction data
        const transactionData = await getTransactionById(sessionId, transactionId)
        if (!transactionData) {
          toast.error("Transaksi tidak ditemukan")
          router.push(`/sessions/${sessionId}`)
          return
        }
        setTransaction(transactionData)
        
        // Get active participants
        const activeParticipants = sessionData.participants.filter(p => p.status === 'active')
        setParticipants(activeParticipants)
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Gagal memuat data")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, router])
  
  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <RefreshCw className="h-8 w-8 text-white animate-spin" />
      </div>
    )
  }
  
  if (!session || !transaction) return null
  
  const formattedDate = format(new Date(transaction.date), "d MMMM yyyy", { locale: idLocale })
  const formattedAmount = new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(transaction.amount)
  
  return (
    <div className="min-h-screen bg-black text-white">
      <BackgroundBeams />
      
      {/* Header */}
      <header className="relative z-10 p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-4"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/sessions/${session.id}`)}
              className="rounded-full bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{transaction.name}</h1>
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {/* Transaction Info Card */}
            <Card className="bg-black/30 border-white/10">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">Detail Transaksi</h2>
                    {transaction.description && (
                      <p className="text-gray-400 mt-1">{transaction.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formattedAmount}</div>
                    <div className="text-sm text-gray-400">Total</div>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="h-px bg-white/10 my-4"></div>
                
                {/* Payers */}
                <div className="space-y-3">
                  <h3 className="font-medium">Dibayar oleh:</h3>
                  
                  {transaction.payments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500">
                            {payment.payerName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{payment.payerName}</div>
                          <div className="text-xs text-gray-400">
                            {payment.timestamp ? format(new Date(payment.timestamp), "d MMM yyyy, HH:mm", { locale: idLocale }) : 'Tidak ada timestamp'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium">
                          {new Intl.NumberFormat('id-ID', { 
                            style: 'currency', 
                            currency: 'IDR',
                            minimumFractionDigits: 0
                          }).format(payment.amount)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {Math.round((payment.amount / transaction.amount) * 100)}% dari total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Receipt Items if available */}
                {transaction.receiptItems && transaction.receiptItems.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="font-medium">Item pada Struk:</h3>
                    
                    <div className="space-y-2">
                      {transaction.receiptItems.map((item, index) => (
                        <div key={index} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-right">
                              <div className="font-medium">
                                {new Intl.NumberFormat('id-ID', { 
                                  style: 'currency', 
                                  currency: 'IDR',
                                  minimumFractionDigits: 0
                                }).format(item.price * item.quantity)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {item.quantity} x {new Intl.NumberFormat('id-ID', { 
                                  style: 'currency', 
                                  currency: 'IDR',
                                  minimumFractionDigits: 0
                                }).format(item.price)}
                              </div>
                            </div>
                          </div>
                          
                          {item.assignedTo && item.assignedTo.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-400 mb-1">Dibagikan kepada:</div>
                              <div className="flex flex-wrap gap-1">
                                {item.assignedTo.map((userId, i) => {
                                  const participant = participants.find(p => p.userId === userId)
                                  return participant ? (
                                    <Badge key={i} className="bg-blue-500/20 text-blue-300 border-0">
                                      {participant.displayName.split(' ')[0]}
                                    </Badge>
                                  ) : null
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Receipt Image if available */}
                {transaction.receiptImageUrl && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Gambar Struk:</h3>
                    <div className="rounded-lg overflow-hidden border border-white/10">
                      <img 
                        src={transaction.receiptImageUrl} 
                        alt="Receipt" 
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>
                )}
                
                {/* Participants */}
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Peserta dalam Transaksi ini:</h3>
                  <div className="flex flex-wrap gap-2">
                    {transaction.participants.map((userId, index) => {
                      const participant = participants.find(p => p.userId === userId)
                      return participant ? (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {participant.displayName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{participant.displayName}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Actions Card */}
            <Card className="bg-black/30 border-white/10">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Tindakan</h3>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 flex-1"
                    onClick={() => {
                      // Implement edit functionality
                    }}
                  >
                    Edit Transaksi
                  </Button>
                  
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      // Implement delete functionality
                    }}
                  >
                    Hapus Transaksi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
