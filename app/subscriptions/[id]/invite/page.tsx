"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  CreditCard, 
  ArrowLeft,
  RefreshCw,
  Copy,
  Share2,
  Mail,
  SendHorizonal,
  UserPlus
} from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscriptions } from "@/contexts/SubscriptionContext"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface InvitePageProps {
  params: {
    id: string
  }
}

export default function InvitePage({ params }: InvitePageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { getSubscriptionById } = useSubscriptions()
  
  const subscriptionId = params.id
  
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  
  // Form state
  const [inviteEmail, setInviteEmail] = useState("")
  const [activeTab, setActiveTab] = useState("link")
  
  // Share link
  const [shareLink, setShareLink] = useState("")
  
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    fetchSubscriptionData()
  }, [user, router, subscriptionId])
  
  useEffect(() => {
    // Set share link
    setShareLink(`${window.location.origin}/subscriptions/join/${subscriptionId}`)
  }, [subscriptionId])
  
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
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    toast.success("Link undangan disalin ke clipboard!")
  }
  
  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Undangan Langganan ${subscription?.name}`,
          text: `Gabung langganan ${subscription?.name} bersama saya di Patungan!`,
          url: shareLink
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      handleCopyLink()
    }
  }
  
  const handleSendInvite = async () => {
    if (!inviteEmail) {
      toast.error("Masukkan alamat email")
      return
    }
    
    // Simple email validation
    if (!inviteEmail.includes('@')) {
      toast.error("Masukkan alamat email yang valid")
      return
    }
    
    setIsSending(true)
    
    try {
      // In a real app, this would send an email invitation
      // For now, just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(`Undangan terkirim ke ${inviteEmail}`)
      setInviteEmail("")
    } catch (error) {
      console.error("Error sending invite:", error)
      toast.error("Gagal mengirim undangan")
    } finally {
      setIsSending(false)
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
              <h1 className="text-2xl font-bold">Undang Peserta</h1>
            </div>
          </motion.div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-0">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-black/30 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle>Undang Peserta ke {subscription.name}</CardTitle>
              <CardDescription>
                Tambahkan peserta baru untuk berbagi biaya langganan ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-black/30 border border-white/10 rounded-xl p-1 mb-6">
                  <TabsTrigger value="link" className="rounded-lg">
                    <Copy className="h-4 w-4 mr-2" />
                    Link Undangan
                  </TabsTrigger>
                  <TabsTrigger value="email" className="rounded-lg">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="link" className="space-y-4">
                  <div className="p-4 bg-blue-500/5 border border-blue-200/20 rounded-2xl">
                    <div className="flex items-start space-x-3">
                      <UserPlus className="h-6 w-6 text-blue-400 mt-1" />
                      <div>
                        <h3 className="font-bold mb-2">Cara Mudah Mengundang Peserta</h3>
                        <p className="text-sm text-gray-300">
                          Bagikan link undangan di bawah ini kepada teman atau keluarga yang ingin bergabung dengan langganan ini. Mereka hanya perlu mengklik link dan mengikuti instruksi untuk bergabung.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-gray-300 mb-2 block">
                      Link Undangan
                    </Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          value={shareLink}
                          readOnly
                          className="bg-black/30 border-white/10 pr-10"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleCopyLink}
                        className="border-white/10 hover:bg-white/5"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Salin
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShareLink}
                        className="border-white/10 hover:bg-white/5"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Bagikan
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-center text-sm text-gray-400">
                      Link ini dapat digunakan oleh siapa saja yang memilikinya. Bagikan hanya kepada orang yang Anda inginkan untuk bergabung dengan langganan ini.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="email" className="space-y-4">
                  <div className="p-4 bg-blue-500/5 border border-blue-200/20 rounded-2xl">
                    <div className="flex items-start space-x-3">
                      <Mail className="h-6 w-6 text-blue-400 mt-1" />
                      <div>
                        <h3 className="font-bold mb-2">Kirim Undangan via Email</h3>
                        <p className="text-sm text-gray-300">
                          Masukkan alamat email teman atau keluarga yang ingin Anda undang untuk bergabung dengan langganan ini.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="inviteEmail" className="text-gray-300 mb-2 block">
                      Alamat Email
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="inviteEmail"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="bg-black/30 border-white/10 flex-1"
                      />
                      <Button
                        onClick={handleSendInvite}
                        disabled={isSending || !inviteEmail}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                      >
                        {isSending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <SendHorizonal className="h-4 w-4 mr-2" />
                            Kirim
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-center text-sm text-gray-400">
                      Penerima akan mendapatkan email berisi link undangan dan informasi tentang langganan ini.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="pt-6 border-t border-white/10 text-center">
                <Button
                  onClick={() => router.push(`/subscriptions/${subscriptionId}`)}
                  variant="outline"
                  className="border-white/10 hover:bg-white/5"
                >
                  Kembali ke Detail Langganan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
