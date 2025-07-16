"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  CreditCard, 
  Calendar, 
  Users, 
  ArrowLeft,
  RefreshCw,
  User,
  Check,
  Clock
} from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscriptions } from "@/contexts/SubscriptionContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
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

interface JoinSubscriptionPageProps {
  params: {
    id: string
  }
}

export default function JoinSubscriptionPage({ params }: JoinSubscriptionPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { getSubscriptionById, acceptSubscriptionInvitation } = useSubscriptions()
  
  const subscriptionId = params.id
  
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [acceptShare, setAcceptShare] = useState<'yes' | 'no'>('yes')
  const [isAlreadyMember, setIsAlreadyMember] = useState(false)
  
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
      
      setSubscription(data)
      
      // Check if user is already a member
      const isMember = data.participants.some(
        (p: any) => p.userId === user?.uid && p.status === 'active'
      )
      
      if (isMember) {
        setIsAlreadyMember(true)
      }
      
      // Log participant status for debugging
      console.log("Current user:", user?.uid);
      console.log("Participants:", data.participants);
      console.log("Is member:", isMember);
    } catch (error) {
      console.error("Error fetching subscription:", error)
      toast.error("Gagal memuat data langganan")
    } finally {
      setLoading(false)
    }
  }
  
  const handleJoinSubscription = async () => {
    if (!user || !subscription) return
    
    setIsSubmitting(true)
    
    try {
      // Calculate default share (equal distribution or custom)
      const numericAmount = subscription.amount
      const activeParticipants = subscription.participants.filter(
        (p: any) => p.status === 'active'
      ).length
      
      const equalShare = Math.floor(numericAmount / (activeParticipants + 1))
      
      // Use the new acceptSubscriptionInvitation function
      await acceptSubscriptionInvitation(subscriptionId, equalShare)
      
      toast.success("Berhasil bergabung dengan langganan!")
      router.push(`/subscriptions/${subscriptionId}`)
    } catch (error) {
      console.error("Error joining subscription:", error)
      toast.error("Gagal bergabung dengan langganan")
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
  
  // Calculate per-participant cost
  const activeParticipants = subscription.participants.filter(
    (p: any) => p.status === 'active'
  )
  
  const perParticipantCost = Math.floor(subscription.amount / (activeParticipants.length + 1))
  
  const primaryPayer = subscription.participants.find(
    (p: any) => p.userId === subscription.primaryPayerId
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
              onClick={() => router.push('/subscriptions')}
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
              <h1 className="text-2xl font-bold">Undangan Langganan</h1>
            </div>
          </motion.div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-0">
        <div className="max-w-3xl mx-auto">
          {isAlreadyMember ? (
            <Card className="bg-black/30 border-white/10">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Anda Sudah Bergabung</h2>
                <p className="text-gray-400 mb-6">
                  Anda sudah menjadi peserta aktif dalam langganan ini.
                </p>
                <Button
                  onClick={() => router.push(`/subscriptions/${subscriptionId}`)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                >
                  Lihat Detail Langganan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Subscription Info Card */}
              <Card className="bg-black/30 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle>Undangan Langganan Bareng</CardTitle>
                  <CardDescription>
                    Anda diundang untuk bergabung dalam langganan bersama
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
                        {logo ? (
                          <img
                            src={logo}
                            alt={subscription.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <CreditCard className="h-6 w-6 text-black" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{subscription.name}</h3>
                        {subscription.description && (
                          <p className="text-gray-400 text-sm">{subscription.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Biaya Langganan</p>
                        <p className="text-xl font-bold">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(subscription.amount)}
                          <span className="text-sm text-gray-400 ml-1">
                            / {subscription.cycle === 'monthly' ? 'bulan' : 
                              subscription.cycle === 'yearly' ? 'tahun' : 
                              subscription.cycle === 'quarterly' ? 'triwulan' : 
                              'minggu'}
                          </span>
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Pembayar Utama</p>
                        <div className="flex items-center">
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs">
                              {primaryPayer?.displayName?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <p>{primaryPayer?.displayName || 'Unknown'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Tagihan Berikutnya</p>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-500 mr-2" />
                          <p>{formattedNextBilling}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Jumlah Peserta</p>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-500 mr-2" />
                          <p>{activeParticipants.length} orang</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h3 className="font-bold mb-2">Biaya untuk Anda</h3>
                    <div className="flex justify-between items-center">
                      <p>Perkiraan biaya per periode</p>
                      <p className="text-xl font-bold">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(perParticipantCost)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Biaya ini berdasarkan pembagian rata antar peserta. Jumlah sebenarnya dapat berbeda jika pembagian kustom diterapkan.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-gray-300">
                      Apakah Anda setuju dengan bagian pembayaran ini?
                    </Label>
                    <RadioGroup
                      value={acceptShare}
                      onValueChange={(value) => setAcceptShare(value as 'yes' | 'no')}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="yes" 
                          id="accept-yes"
                          className="border-white/30"
                        />
                        <Label htmlFor="accept-yes" className="cursor-pointer">
                          Ya, saya setuju
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="no" 
                          id="accept-no"
                          className="border-white/30"
                        />
                        <Label htmlFor="accept-no" className="cursor-pointer">
                          Tidak, saya ingin mendiskusikan dengan pembayar utama
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                {acceptShare === 'yes' ? (
                  <Button
                    onClick={handleJoinSubscription}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-6 rounded-xl text-lg font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Bergabung...
                      </>
                    ) : (
                      <>
                        Gabung Langganan
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push('/subscriptions')}
                    className="bg-white/10 text-white px-8 py-6 rounded-xl text-lg font-medium"
                  >
                    Kembali ke Daftar Langganan
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
