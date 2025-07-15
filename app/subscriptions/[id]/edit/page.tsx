"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  CreditCard, 
  Calendar, 
  ArrowLeft,
  RefreshCw,
  User
} from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscriptions } from "@/contexts/SubscriptionContext"
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

// Available subscription cycles
const SUBSCRIPTION_CYCLES = [
  { id: 'monthly', label: 'Bulanan' },
  { id: 'yearly', label: 'Tahunan' },
  { id: 'quarterly', label: 'Triwulan' },
  { id: 'weekly', label: 'Mingguan' }
]

interface EditSubscriptionPageProps {
  params: {
    id: string
  }
}

export default function EditSubscriptionPage({ params }: EditSubscriptionPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { getSubscriptionById, updateSubscription } = useSubscriptions()
  
  const subscriptionId = params.id
  
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [cycle, setCycle] = useState<'monthly' | 'yearly' | 'quarterly' | 'weekly'>('monthly')
  
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
      
      // Check if user is authorized to edit
      if (data.primaryPayerId !== user?.uid && data.createdBy !== user?.uid) {
        toast.error("Anda tidak memiliki izin untuk mengedit langganan ini")
        router.push(`/subscriptions/${subscriptionId}`)
        return
      }
      
      setSubscription(data)
      
      // Set form data
      setName(data.name)
      setDescription(data.description || "")
      setAmount(data.amount.toString())
      setCycle(data.cycle)
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !subscription) return
    
    if (!name || !amount) {
      toast.error("Isi semua field yang diperlukan")
      return
    }
    
    setIsUpdating(true)
    
    try {
      // Convert string values to appropriate types
      const numericAmount = parseFloat(amount)
      
      // Prepare update data
      const updateData = {
        name,
        description,
        amount: numericAmount,
        cycle,
        updatedAt: Date.now()
      }
      
      await updateSubscription(subscriptionId, updateData)
      
      toast.success("Langganan berhasil diperbarui!")
      router.push(`/subscriptions/${subscriptionId}`)
    } catch (error) {
      console.error("Error updating subscription:", error)
      toast.error("Gagal memperbarui langganan")
    } finally {
      setIsUpdating(false)
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
              <h1 className="text-2xl font-bold">Edit Langganan</h1>
            </div>
          </motion.div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subscription Details Card */}
            <Card className="bg-black/30 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle>Informasi Langganan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service Name */}
                <div>
                  <Label htmlFor="name" className="text-gray-300 mb-2 block">
                    Nama Layanan
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Netflix, Spotify, dll."
                    className="bg-black/30 border-white/10"
                    required
                  />
                </div>
                
                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-gray-300 mb-2 block">
                    Deskripsi (opsional)
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Deskripsi singkat tentang langganan ini"
                    className="bg-black/30 border-white/10 h-20"
                  />
                </div>
                
                {/* Amount and Cycle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount" className="text-gray-300 mb-2 block">
                      Biaya Langganan
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
                  
                  <div>
                    <Label className="text-gray-300 mb-2 block">
                      Periode Langganan
                    </Label>
                    <RadioGroup
                      value={cycle}
                      onValueChange={(value) => setCycle(value as any)}
                      className="grid grid-cols-2 gap-2"
                    >
                      {SUBSCRIPTION_CYCLES.map((cycleOption) => (
                        <div key={cycleOption.id} className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={cycleOption.id} 
                            id={`cycle-${cycleOption.id}`}
                            className="border-white/30"
                          />
                          <Label htmlFor={`cycle-${cycleOption.id}`} className="text-sm cursor-pointer">
                            {cycleOption.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
                
                <div className="pt-4 text-sm text-gray-400">
                  <p>
                    <strong>Catatan:</strong> Mengubah jumlah atau periode langganan akan memengaruhi perhitungan pembagian biaya.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/subscriptions/${subscriptionId}`)}
                className="border-white/10 hover:bg-white/5"
              >
                Batal
              </Button>
              
              <Button
                type="submit"
                disabled={isUpdating || !name || !amount}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    Simpan Perubahan
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
