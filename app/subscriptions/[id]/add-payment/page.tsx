"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  CreditCard, 
  Calendar, 
  ArrowLeft,
  RefreshCw,
  User,
  Check,
  Clock
} from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscriptions } from "@/contexts/SubscriptionContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

// Helper function to get logo
const getSubscriptionLogo = (name: string): string | undefined => {
  const lowerName = name.toLowerCase()
  
  const SUBSCRIPTION_LOGOS: Record<string, string> = {
    'netflix': '/services/netflix.svg',
    'spotify': '/services/spotify.svg',
    'youtube': '/services/youtube.svg',
    'disney': '/services/disney-plus.svg',
    'apple': '/services/apple.svg',
    'prime': '/services/prime.svg',
    'hbo': '/services/hbo.svg',
    'gamepass': '/services/xbox.svg',
    'psplus': '/services/playstation.svg',
    'office': '/services/office365.svg',
    'adobe': '/services/adobe.svg',
  }
  
  for (const [key, logo] of Object.entries(SUBSCRIPTION_LOGOS)) {
    if (lowerName.includes(key)) {
      return logo
    }
  }
  
  return undefined
}

interface AddPaymentPageProps {
  params: {
    id: string
  }
}

export default function AddPaymentPage({ params }: AddPaymentPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { getSubscriptionById, recordPayment, refreshSubscriptions } = useSubscriptions()
  
  const subscriptionId = params.id
  
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [amount, setAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [selectedParticipants, setSelectedParticipants] = useState<Record<string, boolean>>({})
  
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    fetchSubscriptionData()
  }, [user, router, subscriptionId])
  
  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)
      const data = await getSubscriptionById(subscriptionId)
      if (!data) {
        toast.error("Langganan tidak ditemukan")
        router.push('/subscriptions')
        return
      }
      
      // Check if user is primary payer
      if (data.primaryPayerId !== user?.uid && data.createdBy !== user?.uid) {
        toast.error("Hanya pembayar utama yang dapat mencatat pembayaran")
        router.push(`/subscriptions/${subscriptionId}`)
        return
      }
      
      setSubscription(data)
      
      // Pre-select all active participants
      const initialSelectedParticipants: Record<string, boolean> = {}
      data.participants
        .filter((p: any) => p.status === 'active' && p.userId !== data.primaryPayerId)
        .forEach((p: any) => {
          initialSelectedParticipants[p.userId] = true
        })
      
      setSelectedParticipants(initialSelectedParticipants)
      
      // Set default amount from subscription
      setAmount(data.amount.toString())
    } catch (error) {
      console.error("Error fetching subscription:", error)
      toast.error("Gagal memuat data langganan")
    } finally {
      setLoading(false)
    }
  }
  
  const handleAmountInput = (value: string) => {
    // Remove non-numeric characters and convert to number
    const numericValue = value.replace(/[^0-9]/g, '')
    setAmount(numericValue)
  }
  
  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !subscription) return
    
    if (!amount || !paymentDate) {
      toast.error("Isi semua field yang diperlukan")
      return
    }
    
    const selectedParticipantIds = Object.entries(selectedParticipants)
      .filter(([_, isSelected]) => isSelected)
      .map(([userId]) => userId)
    
    // Check if at least one participant is selected
    if (selectedParticipantIds.length === 0) {
      toast.error("Pilih minimal satu peserta untuk pembayaran ini")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Prepare payment data
      const numericAmount = parseFloat(amount)
      const paymentTimestamp = new Date(paymentDate).getTime()
      
      // Calculate share for each participant
      const participantShares = subscription.participants
        .filter((p: any) => p.userId !== subscription.primaryPayerId && selectedParticipants[p.userId])
        .map((participant: any) => ({
          userId: participant.userId,
          share: participant.share || Math.floor(numericAmount / (selectedParticipantIds.length + 1)),
          status: 'pending'
        }))
      
      // Create payment data
      const paymentData = {
        amount: numericAmount,
        date: paymentTimestamp,
        paidBy: user.uid,
        participants: participantShares
      }
      
      await recordPayment(subscriptionId, paymentData)
      await refreshSubscriptions()
      
      toast.success("Pembayaran berhasil dicatat!")
      router.push(`/subscriptions/${subscriptionId}?tab=payments`)
    } catch (error) {
      console.error("Error recording payment:", error)
      toast.error("Gagal mencatat pembayaran")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
            <div className="h-8 w-48 bg-white/10 animate-pulse rounded"></div>
          </div>
          
          <div className="h-[200px] w-full rounded-xl bg-white/5 animate-pulse"></div>
        </div>
      </div>
    )
  }
  
  if (!subscription) return null
  
  const logo = getSubscriptionLogo(subscription.name)
  const formattedNextBilling = format(
    new Date(subscription.nextBillingDate),
    "d MMMM yyyy",
    { locale: idLocale }
  )
  
  const activeParticipants = subscription.participants.filter(
    (p: any) => p.status === 'active' && p.userId !== subscription.primaryPayerId
  )
  
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
              onClick={() => router.push(`/subscriptions/${subscriptionId}`)}
              className="rounded-full bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                {logo ? (
                  <img
                    src={logo}
                    alt={subscription.name}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <CreditCard className="h-5 w-5 text-black" />
                )}
              </div>
              <h1 className="text-2xl font-bold">Catat Pembayaran</h1>
            </div>
          </motion.div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subscription Info Card */}
            <Card className="bg-black/30 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle>Informasi Langganan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400">Layanan</p>
                    <p className="font-medium">{subscription.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Tagihan Berikutnya</p>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-500 mr-1" />
                      <p>{formattedNextBilling}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Payment Details Card */}
            <Card className="bg-black/30 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle>Detail Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Amount */}
                <div>
                  <Label htmlFor="amount" className="text-gray-300 mb-2 block">
                    Jumlah Pembayaran
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      Rp
                    </span>
                    <Input
                      id="amount"
                      value={amount}
                      onChange={(e) => handleAmountInput(e.target.value)}
                      placeholder="0"
                      className="bg-black/30 border-white/10 pl-10"
                      required
                    />
                  </div>
                </div>
                
                {/* Payment Date */}
                <div>
                  <Label htmlFor="paymentDate" className="text-gray-300 mb-2 block">
                    Tanggal Pembayaran
                  </Label>
                  <div className="relative">
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="bg-black/30 border-white/10"
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Participants Card */}
            <Card className="bg-black/30 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle>Peserta yang Membayar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Payer Info */}
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                        {user?.displayName?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        Anda
                        <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded-full">
                          Pembayar Utama
                        </span>
                      </p>
                      <p className="text-sm text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                </div>
                
                {/* Participants List */}
                <div className="space-y-2">
                  <Label className="text-gray-300 mb-2 block">
                    Pilih peserta yang terlibat dalam pembayaran ini
                  </Label>
                  
                  {activeParticipants.length === 0 ? (
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <p className="text-gray-400">Belum ada peserta aktif</p>
                    </div>
                  ) : (
                    activeParticipants.map((participant: any) => (
                      <div 
                        key={participant.userId} 
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedParticipants[participant.userId] 
                            ? 'bg-blue-500/20 border border-blue-500/30' 
                            : 'bg-white/5 border border-white/10'
                        }`}
                        onClick={() => toggleParticipant(participant.userId)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-gray-700 text-gray-200">
                              {participant.displayName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{participant.displayName}</p>
                            <p className="text-sm text-gray-400">
                              {new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }).format(participant.share || 0)}
                            </p>
                          </div>
                        </div>
                        
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          selectedParticipants[participant.userId] 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white/10'
                        }`}>
                          {selectedParticipants[participant.userId] && (
                            <Check className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !amount || !paymentDate || activeParticipants.length === 0}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-6 rounded-xl text-lg font-medium"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    Catat Pembayaran
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
