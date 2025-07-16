"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  CreditCard, 
  Calendar, 
  Users, 
  Tag,
  ArrowLeft,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  User
} from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscriptions } from "@/contexts/SubscriptionContext"
import { toast } from "sonner"

// Available subscription cycles
const SUBSCRIPTION_CYCLES = [
  { id: 'monthly', label: 'Bulanan' },
  { id: 'yearly', label: 'Tahunan' },
  { id: 'quarterly', label: 'Triwulan' },
  { id: 'weekly', label: 'Mingguan' }
]

// Popular subscription services
const POPULAR_SERVICES = [
  { name: 'Netflix', price: 169000, cycle: 'monthly' },
  { name: 'Spotify', price: 59000, cycle: 'monthly' },
  { name: 'YouTube Premium', price: 89000, cycle: 'monthly' },
  { name: 'Disney+ Hotstar', price: 39000, cycle: 'monthly' },
  { name: 'Office 365', price: 119000, cycle: 'monthly' },
  { name: 'iCloud+', price: 49000, cycle: 'monthly' },
  { name: 'Amazon Prime', price: 59000, cycle: 'monthly' },
  { name: 'HBO GO', price: 60000, cycle: 'monthly' }
]

interface Participant {
  userId: string
  email: string
  displayName: string
  share: number | null
  status: 'active' | 'invited' | 'removed'
}

export default function NewSubscriptionPage() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const { createSubscription } = useSubscriptions()
  
  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [cycle, setCycle] = useState<'monthly' | 'yearly' | 'quarterly' | 'weekly'>('monthly')
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [showPopularServices, setShowPopularServices] = useState(false)
  
  // Participants
  const [participants, setParticipants] = useState<Participant[]>([])
  const [newParticipantEmail, setNewParticipantEmail] = useState("")
  const [distributionMethod, setDistributionMethod] = useState<'equal' | 'custom'>('equal')
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])
  
  const handleAmountInput = (value: string) => {
    // Remove non-numeric characters and convert to number
    const numericValue = value.replace(/[^0-9]/g, '')
    setAmount(numericValue)
  }
  
  const handleSelectPopularService = (service: typeof POPULAR_SERVICES[0]) => {
    setName(service.name)
    setAmount(service.price.toString())
    setCycle(service.cycle as 'monthly')
    setShowPopularServices(false)
  }
  
  const handleAddParticipant = () => {
    // Simple email validation
    if (!newParticipantEmail.includes('@')) {
      toast.error("Masukkan alamat email yang valid")
      return
    }
    
    // Check if email already exists in participants
    if (participants.some(p => p.email === newParticipantEmail)) {
      toast.error("Peserta dengan email ini sudah ditambahkan")
      return
    }
    
    // Add new participant
    const newParticipant: Participant = {
      userId: '', // Will be fetched from Firebase later
      email: newParticipantEmail,
      displayName: newParticipantEmail.split('@')[0],
      share: null, // Will be calculated based on distribution method
      status: 'invited'
    }
    
    setParticipants([...participants, newParticipant])
    setNewParticipantEmail('')
  }
  
  const handleRemoveParticipant = (index: number) => {
    const newParticipants = [...participants]
    newParticipants.splice(index, 1)
    setParticipants(newParticipants)
  }
  
  const handleUpdateParticipantShare = (index: number, share: number) => {
    const newParticipants = [...participants]
    newParticipants[index].share = share
    setParticipants(newParticipants)
  }
  
  const calculateShares = () => {
    if (distributionMethod === 'equal') {
      // Calculate equal shares for all participants
      const numericAmount = parseFloat(amount)
      if (isNaN(numericAmount)) return
      
      const totalParticipants = participants.length + 1 // +1 for the primary payer
      const equalShare = Math.floor(numericAmount / totalParticipants)
      
      const newParticipants = participants.map(p => ({
        ...p,
        share: equalShare
      }))
      
      setParticipants(newParticipants)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !userData) {
      toast.error("Anda harus login untuk membuat langganan")
      return
    }
    
    if (!name || !amount || !startDate) {
      toast.error("Isi semua field yang diperlukan")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Calculate shares based on distribution method
      calculateShares()
      
      // Convert string values to appropriate types
      const numericAmount = parseFloat(amount)
      const startTimestamp = new Date(startDate).getTime()
      
      // Create subscription data
      const subscriptionData = {
        name,
        description,
        amount: numericAmount,
        cycle,
        startDate: startTimestamp,
        nextBillingDate: startTimestamp, // Initial value, will be recalculated in the context
        primaryPayerId: user.uid,
        participants: participants.map(p => ({
          userId: p.userId || '',
          displayName: p.displayName,
          email: p.email, // Make sure we store the email for better identification
          share: p.share,
          status: 'invited'
        }))
      }
      
      await createSubscription(subscriptionData)
      
      toast.success("Langganan berhasil dibuat!")
      router.push('/subscriptions')
    } catch (error) {
      console.error("Error creating subscription:", error)
      toast.error("Gagal membuat langganan")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!user) return null
  
  const totalShares = participants.reduce((sum, p) => sum + (p.share || 0), 0)
  const remainingShare = parseFloat(amount) - totalShares
  
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
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Tambah Langganan Baru</h1>
            </div>
          </motion.div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Subscription Details Card */}
            <Card className="bg-black/30 border-white/10">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Informasi Langganan</h2>
                
                <div className="space-y-4">
                  {/* Service Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="name" className="text-gray-300">Nama Layanan</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-purple-400 hover:text-purple-300"
                        onClick={() => setShowPopularServices(!showPopularServices)}
                      >
                        {showPopularServices ? 'Sembunyikan' : 'Lihat layanan populer'}
                      </Button>
                    </div>
                    
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Netflix, Spotify, dll."
                      className="bg-black/30 border-white/10"
                      required
                    />
                    
                    {showPopularServices && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {POPULAR_SERVICES.map((service) => (
                          <div
                            key={service.name}
                            onClick={() => handleSelectPopularService(service)}
                            className="p-2 text-sm bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                          >
                            <div className="font-medium">{service.name}</div>
                            <div className="text-xs text-gray-400">
                              Rp {service.price.toLocaleString()} / {service.cycle}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                  
                  {/* Start Date */}
                  <div>
                    <Label htmlFor="startDate" className="text-gray-300 mb-2 block">
                      Tanggal Mulai
                    </Label>
                    <div className="relative">
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-black/30 border-white/10"
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Participants Card */}
            <Card className="bg-black/30 border-white/10">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Peserta</h2>
                
                <div className="space-y-4">
                  {/* Primary Payer Info */}
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {userData?.displayName || user.email}
                          <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded-full">
                            Pembayar Utama
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Add Participants */}
                  <div>
                    <Label className="text-gray-300 mb-2 block">
                      Tambah Peserta Lain
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                        placeholder="Email peserta"
                        className="bg-black/30 border-white/10 flex-1"
                        type="email"
                      />
                      <Button
                        type="button"
                        onClick={handleAddParticipant}
                        disabled={!newParticipantEmail}
                        variant="outline"
                        className="border-white/10 hover:bg-white/5"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Tambah
                      </Button>
                    </div>
                  </div>
                  
                  {/* Distribution Method */}
                  <div>
                    <Label className="text-gray-300 mb-2 block">
                      Metode Pembagian Biaya
                    </Label>
                    <RadioGroup
                      value={distributionMethod}
                      onValueChange={(value) => {
                        setDistributionMethod(value as 'equal' | 'custom')
                        if (value === 'equal') calculateShares()
                      }}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="equal" 
                          id="distribution-equal"
                          className="border-white/30"
                        />
                        <Label htmlFor="distribution-equal" className="cursor-pointer">
                          Pembagian Rata
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="custom" 
                          id="distribution-custom"
                          className="border-white/30"
                        />
                        <Label htmlFor="distribution-custom" className="cursor-pointer">
                          Pembagian Kustom
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Participants List */}
                  {participants.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label className="text-gray-300">
                          Daftar Peserta ({participants.length})
                        </Label>
                        {distributionMethod === 'equal' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={calculateShares}
                            className="text-xs text-purple-400 hover:text-purple-300"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Hitung Ulang
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {participants.map((participant, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center space-x-3 flex-1 mr-4">
                              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-300" />
                              </div>
                              <div className="overflow-hidden">
                                <div className="font-medium truncate">{participant.displayName}</div>
                                <div className="text-xs text-gray-400 truncate">{participant.email}</div>
                              </div>
                            </div>
                            
                            {distributionMethod === 'custom' ? (
                              <div className="relative min-w-[120px]">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
                                  Rp
                                </span>
                                <Input
                                  value={participant.share || ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '')
                                    handleUpdateParticipantShare(index, parseInt(value) || 0)
                                  }}
                                  className="bg-black/30 border-white/10 pl-8 py-1 h-8 text-sm"
                                />
                              </div>
                            ) : (
                              <div className="text-sm">
                                Rp {participant.share?.toLocaleString() || 0}
                              </div>
                            )}
                            
                            <Button
                              type="button"
                              onClick={() => handleRemoveParticipant(index)}
                              variant="ghost"
                              size="icon"
                              className="ml-2 text-gray-400 hover:text-red-400"
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Summary */}
                      {amount && (
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span>Total Dibagi:</span>
                            <span>Rp {totalShares.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span>Sisa untuk Pembayar Utama:</span>
                            <span className={remainingShare < 0 ? 'text-red-400' : 'text-green-400'}>
                              Rp {remainingShare.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !name || !amount || !startDate}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-6 rounded-xl text-lg font-medium"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Membuat...
                  </>
                ) : (
                  <>
                    Buat Langganan
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
