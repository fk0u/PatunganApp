"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  CreditCard, 
  Calendar, 
  Users, 
  ArrowLeft,
  Bell,
  Clock,
  CreditCard as CreditCardIcon,
  User,
  UserPlus,
  Settings,
  ExternalLink,
  Share2,
  Copy
} from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format, formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscriptions } from "@/contexts/SubscriptionContext"
import { toast } from "sonner"

// Subscription service logos
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

// Helper function to get logo
const getSubscriptionLogo = (name: string): string | undefined => {
  const lowerName = name.toLowerCase()
  
  for (const [key, logo] of Object.entries(SUBSCRIPTION_LOGOS)) {
    if (lowerName.includes(key)) {
      return logo
    }
  }
  
  return undefined
}

interface SubscriptionPageProps {
  params: {
    id: string
  }
}

export default function SubscriptionPage({ params }: SubscriptionPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { getSubscriptionById, updateSubscription, cancelSubscription } = useSubscriptions()
  
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isUpdating, setIsUpdating] = useState(false)
  
  const subscriptionId = params.id
  
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
    } catch (error) {
      console.error("Error fetching subscription:", error)
      toast.error("Gagal memuat data langganan")
    } finally {
      setLoading(false)
    }
  }
  
  const handleCancelSubscription = async () => {
    if (!subscription) return
    
    if (!confirm("Apakah Anda yakin ingin membatalkan langganan ini?")) {
      return
    }
    
    try {
      setIsUpdating(true)
      await cancelSubscription(subscriptionId)
      toast.success("Langganan berhasil dibatalkan")
      fetchSubscriptionData()
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      toast.error("Gagal membatalkan langganan")
    } finally {
      setIsUpdating(false)
    }
  }
  
  const copyShareLink = () => {
    const link = `${window.location.origin}/subscriptions/join/${subscriptionId}`
    navigator.clipboard.writeText(link)
    toast.success("Link berbagi disalin ke clipboard!")
  }
  
  if (!user) return null
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    )
  }
  
  if (!subscription) return null
  
  const logo = getSubscriptionLogo(subscription.name)
  const isPrimaryPayer = subscription.primaryPayerId === user.uid
  const isCreator = subscription.createdBy === user.uid
  const canManage = isPrimaryPayer || isCreator
  
  const formattedNextBilling = format(
    new Date(subscription.nextBillingDate),
    "d MMMM yyyy",
    { locale: idLocale }
  )
  
  const formattedStartDate = format(
    new Date(subscription.startDate),
    "d MMMM yyyy",
    { locale: idLocale }
  )
  
  const activeParticipants = subscription.participants.filter(
    (p: any) => p.status === 'active'
  )
  
  // Calculate each participant's percentage of the total
  const totalAmount = subscription.amount
  activeParticipants.forEach((participant: any) => {
    if (participant.share) {
      participant.percentage = Math.round((participant.share / totalAmount) * 100)
    } else {
      participant.percentage = 0
    }
  })
  
  return (
    <div className="min-h-screen bg-black text-white">
      <BackgroundBeams />
      
      {/* Header */}
      <header className="relative z-10 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
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
              <h1 className="text-2xl font-bold">{subscription.name}</h1>
            </div>
            
            <Badge className={`ml-2 ${
              subscription.status === 'active' ? 'bg-green-500/20 text-green-300' :
              subscription.status === 'paused' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            }`}>
              {subscription.status === 'active' ? 'Aktif' :
               subscription.status === 'paused' ? 'Dijeda' :
               'Dibatalkan'}
            </Badge>
          </motion.div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-0">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-black/30 border border-white/10 rounded-xl p-1 mb-6">
              <TabsTrigger value="overview" className="rounded-lg">
                <CreditCardIcon className="h-4 w-4 mr-2" />
                Ringkasan
              </TabsTrigger>
              <TabsTrigger value="participants" className="rounded-lg">
                <Users className="h-4 w-4 mr-2" />
                Peserta
              </TabsTrigger>
              <TabsTrigger value="payments" className="rounded-lg">
                <Calendar className="h-4 w-4 mr-2" />
                Pembayaran
              </TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Subscription Details Card */}
              <Card className="bg-black/30 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle>Detail Langganan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscription.description && (
                    <p className="text-gray-300">{subscription.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-400">Biaya Langganan</p>
                        <p className="text-2xl font-bold">
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
                        <p className="text-sm text-gray-400">Tanggal Mulai</p>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                          <p>{formattedStartDate}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Pembayar Utama</p>
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <p>
                            {isPrimaryPayer ? 'Anda' : 
                              subscription.participants.find((p: any) => p.userId === subscription.primaryPayerId)?.displayName || 
                              'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-400">Tagihan Berikutnya</p>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-500 mr-2" />
                          <p>{formattedNextBilling}</p>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(subscription.nextBillingDate), {
                            addSuffix: true,
                            locale: idLocale
                          })}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Jumlah Peserta</p>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-500 mr-2" />
                          <p>{activeParticipants.length} orang</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Berbagi Tautan</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyShareLink}
                          className="mt-1 text-xs bg-black/20 border-white/10 hover:bg-white/5"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Salin Link Undangan
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Actions Card */}
              <Card className="bg-black/30 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle>Aksi Cepat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center justify-center h-24 bg-black/20 border-white/10 hover:bg-white/5"
                      onClick={() => router.push(`/subscriptions/${subscriptionId}/add-payment`)}
                    >
                      <CreditCardIcon className="h-6 w-6 mb-2" />
                      <span>Catat Pembayaran</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex flex-col items-center justify-center h-24 bg-black/20 border-white/10 hover:bg-white/5"
                      onClick={() => router.push(`/subscriptions/${subscriptionId}/invite`)}
                    >
                      <UserPlus className="h-6 w-6 mb-2" />
                      <span>Undang Peserta</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex flex-col items-center justify-center h-24 bg-black/20 border-white/10 hover:bg-white/5"
                      onClick={() => router.push(`/subscriptions/${subscriptionId}/edit`)}
                      disabled={!canManage}
                    >
                      <Settings className="h-6 w-6 mb-2" />
                      <span>Edit Langganan</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex flex-col items-center justify-center h-24 bg-black/20 border-white/10 hover:bg-white/5"
                      onClick={() => window.open(
                        subscription.name.toLowerCase().includes('netflix') ? 'https://netflix.com' :
                        subscription.name.toLowerCase().includes('spotify') ? 'https://spotify.com' :
                        subscription.name.toLowerCase().includes('youtube') ? 'https://youtube.com' :
                        subscription.name.toLowerCase().includes('disney') ? 'https://disneyplus.com' :
                        '#'
                      )}
                    >
                      <ExternalLink className="h-6 w-6 mb-2" />
                      <span>Buka Layanan</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Cancel Subscription (only for admins) */}
              {canManage && subscription.status === 'active' && (
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={isUpdating}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300"
                  >
                    {isUpdating ? 'Membatalkan...' : 'Batalkan Langganan'}
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Participants Tab */}
            <TabsContent value="participants" className="space-y-6">
              <Card className="bg-black/30 border-white/10">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle>Peserta Langganan</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/subscriptions/${subscriptionId}/invite`)}
                    className="bg-black/20 border-white/10 hover:bg-white/5"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Undang
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Primary Payer */}
                    <div className="p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
                      {activeParticipants
                        .filter((p: any) => p.userId === subscription.primaryPayerId)
                        .map((participant: any) => (
                          <div key={participant.userId} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                                  {participant.displayName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {participant.userId === user.uid ? 'Anda' : participant.displayName}
                                  <Badge className="ml-2 bg-purple-500/20 text-purple-300">Pembayar Utama</Badge>
                                </p>
                                <p className="text-sm text-gray-400">
                                  Membayar tagihan penuh di muka
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {new Intl.NumberFormat('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(subscription.amount)}
                              </p>
                              <p className="text-xs text-gray-400">100%</p>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {/* Regular Participants */}
                    <div className="space-y-2">
                      {activeParticipants
                        .filter((p: any) => p.userId !== subscription.primaryPayerId)
                        .map((participant: any) => (
                          <div key={participant.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback className="bg-gray-700 text-gray-200">
                                  {participant.displayName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {participant.userId === user.uid ? 'Anda' : participant.displayName}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Membayar bagian ke pembayar utama
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {new Intl.NumberFormat('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(participant.share || 0)}
                              </p>
                              <p className="text-xs text-gray-400">{participant.percentage || 0}%</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Contribution Chart */}
              <Card className="bg-black/30 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle>Visualisasi Kontribusi</CardTitle>
                  <CardDescription>
                    Pembagian biaya antara semua peserta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-60 flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      {/* Simple circular representation of percentages */}
                      <div className="absolute inset-0 rounded-full overflow-hidden bg-gray-800">
                        {activeParticipants.map((participant: any, index: number) => {
                          // Calculate the percentage for display
                          let percentage = participant.percentage || 0
                          if (participant.userId === subscription.primaryPayerId) {
                            // Calculate remaining percentage for primary payer
                            const otherPercentages = activeParticipants
                              .filter((p: any) => p.userId !== subscription.primaryPayerId)
                              .reduce((sum: number, p: any) => sum + (p.percentage || 0), 0)
                            percentage = 100 - otherPercentages
                          }
                          
                          // Generate a color based on index
                          const colors = [
                            'bg-purple-500',
                            'bg-blue-500',
                            'bg-green-500',
                            'bg-yellow-500',
                            'bg-red-500',
                            'bg-pink-500',
                            'bg-indigo-500',
                            'bg-cyan-500'
                          ]
                          const color = colors[index % colors.length]
                          
                          return (
                            <div
                              key={participant.userId}
                              className={`absolute left-0 bottom-0 ${color}`}
                              style={{
                                width: '100%',
                                height: `${percentage}%`,
                                transform: `rotate(${index * 360 / activeParticipants.length}deg)`,
                                transformOrigin: 'center',
                                clipPath: `polygon(50% 50%, 100% 0%, 100% 100%)`
                              }}
                            />
                          )
                        })}
                      </div>
                      
                      {/* Center circle overlay */}
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-black/80 rounded-full flex items-center justify-center text-sm font-medium">
                        {activeParticipants.length} peserta
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {activeParticipants.map((participant: any, index: number) => {
                      // Generate a color based on index
                      const colors = [
                        'bg-purple-500',
                        'bg-blue-500',
                        'bg-green-500',
                        'bg-yellow-500',
                        'bg-red-500',
                        'bg-pink-500',
                        'bg-indigo-500',
                        'bg-cyan-500'
                      ]
                      const color = colors[index % colors.length]
                      
                      return (
                        <div key={participant.userId} className="flex items-center space-x-1">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <span className="text-xs">
                            {participant.userId === subscription.primaryPayerId ? 
                              (participant.userId === user.uid ? 'Anda (Utama)' : `${participant.displayName} (Utama)`) : 
                              (participant.userId === user.uid ? 'Anda' : participant.displayName)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <Card className="bg-black/30 border-white/10">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle>Riwayat Pembayaran</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/subscriptions/${subscriptionId}/add-payment`)}
                    className="bg-black/20 border-white/10 hover:bg-white/5"
                    disabled={!canManage}
                  >
                    <CreditCardIcon className="h-4 w-4 mr-1" />
                    Catat Pembayaran
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* No Payments Yet */}
                    <div className="text-center p-6">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-3">
                        <Calendar className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-1">Belum Ada Pembayaran</h3>
                      <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
                        Pembayaran akan dicatat di sini saat pembayar utama mendaftarkan 
                        pembayaran baru untuk langganan ini.
                      </p>
                      
                      {canManage && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/subscriptions/${subscriptionId}/add-payment`)}
                          className="bg-black/20 border-white/10 hover:bg-white/5"
                        >
                          <CreditCardIcon className="h-4 w-4 mr-2" />
                          Catat Pembayaran Pertama
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Upcoming Payments */}
              <Card className="bg-black/30 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle>Pembayaran Mendatang</CardTitle>
                  <CardDescription>
                    Jadwal pembayaran yang akan datang
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Bell className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">Tagihan Berikutnya</p>
                          <p className="text-sm text-gray-400">{formattedNextBilling}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                        <span className="text-sm text-gray-400">
                          {formatDistanceToNow(new Date(subscription.nextBillingDate), {
                            addSuffix: true,
                            locale: idLocale
                          })}
                        </span>
                        <span className="font-bold">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(subscription.amount)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Future payment dates */}
                    {[1, 2].map((i) => {
                      const nextDate = new Date(subscription.nextBillingDate)
                      
                      // Calculate future date based on cycle
                      if (subscription.cycle === 'monthly') {
                        nextDate.setMonth(nextDate.getMonth() + i)
                      } else if (subscription.cycle === 'yearly') {
                        nextDate.setFullYear(nextDate.getFullYear() + i)
                      } else if (subscription.cycle === 'quarterly') {
                        nextDate.setMonth(nextDate.getMonth() + (i * 3))
                      } else {
                        nextDate.setDate(nextDate.getDate() + (i * 7))
                      }
                      
                      return (
                        <div key={i} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {format(nextDate, "d MMMM yyyy", { locale: idLocale })}
                              </p>
                              <p className="text-sm text-gray-400">
                                {formatDistanceToNow(nextDate, {
                                  addSuffix: true,
                                  locale: idLocale
                                })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex justify-end mt-2">
                            <span className="font-medium text-gray-300">
                              {new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }).format(subscription.amount)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
