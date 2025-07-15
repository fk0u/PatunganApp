"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CreditCard, 
  Search, 
  PlusCircle,
  Calendar,
  Clock,
  ChevronsUpDown,
  MoreVertical,
  Users,
  Tag,
  ArrowLeft,
  Sparkles
} from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscriptions } from "@/contexts/SubscriptionContext"
import { HoverGlowCard } from "@/components/ui/hover-glow-card"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

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

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { userSubscriptions, loading } = useSubscriptions()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])
  
  // Filter and sort subscriptions
  const filteredSubscriptions = userSubscriptions
    .filter(sub => 
      searchQuery === "" || 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.description && sub.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      let compareResult = 0
      
      // Apply sorting
      if (sortBy === 'date') {
        compareResult = a.nextBillingDate - b.nextBillingDate
      } else if (sortBy === 'amount') {
        compareResult = a.amount - b.amount
      } else if (sortBy === 'name') {
        compareResult = a.name.localeCompare(b.name)
      }
      
      // Apply sort order
      return sortOrder === 'asc' ? compareResult : -compareResult
    })

  // Toggle sort order
  const toggleSort = (field: 'date' | 'amount' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }
  
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <BackgroundBeams />
      
      {/* Header */}
      <header className="relative z-10 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center"
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
                className="rounded-full bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Langganan Bareng</h1>
              </div>
            </div>
            
            <Button
              onClick={() => router.push('/subscriptions/new')}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Tambah Langganan
            </Button>
          </motion.div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-0">
        <div className="max-w-7xl mx-auto">
          {/* Search and Sort */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari langganan berdasarkan nama atau deskripsi..."
                  className="pl-10 bg-black/30 border-white/10 rounded-xl focus:border-purple-500"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={`bg-black/30 border-white/10 rounded-xl hover:bg-white/5 ${sortBy === 'date' ? 'border-purple-500 text-purple-400' : ''}`}
                  onClick={() => toggleSort('date')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Tanggal
                  <ChevronsUpDown className={`h-4 w-4 ml-2 transition-transform ${sortBy === 'date' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </Button>
                
                <Button
                  variant="outline"
                  className={`bg-black/30 border-white/10 rounded-xl hover:bg-white/5 ${sortBy === 'amount' ? 'border-purple-500 text-purple-400' : ''}`}
                  onClick={() => toggleSort('amount')}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Jumlah
                  <ChevronsUpDown className={`h-4 w-4 ml-2 transition-transform ${sortBy === 'amount' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </Button>
                
                <Button
                  variant="outline"
                  className={`bg-black/30 border-white/10 rounded-xl hover:bg-white/5 ${sortBy === 'name' ? 'border-purple-500 text-purple-400' : ''}`}
                  onClick={() => toggleSort('name')}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Nama
                  <ChevronsUpDown className={`h-4 w-4 ml-2 transition-transform ${sortBy === 'name' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
          </motion.div>
          
          {/* Subscriptions List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-t-transparent border-purple-500 animate-spin mb-4"></div>
                <p className="text-gray-400">Memuat langganan...</p>
              </div>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="bg-black/30 border border-white/10 rounded-xl p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Belum Ada Langganan Bareng</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery 
                  ? `Tidak ada langganan yang cocok dengan pencarian "${searchQuery}"`
                  : "Anda belum memiliki langganan bersama"}
              </p>
              <div className="relative p-6 bg-blue-500/5 border border-blue-200/20 rounded-2xl mb-8 max-w-lg mx-auto">
                <div className="flex items-start space-x-3">
                  <Sparkles className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold mb-2">Mengapa Langganan Bareng?</h3>
                    <ul className="space-y-2 text-gray-300 text-sm text-left">
                      <li>🔹 Hemat biaya dengan berbagi langganan</li>
                      <li>🔹 Kelola pembayaran secara otomatis</li>
                      <li>🔹 Pembagian biaya yang transparan</li>
                      <li>🔹 Notifikasi pembayaran tepat waktu</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  router.push('/subscriptions/new')
                }}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Tambah Langganan Baru
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubscriptions.map((subscription) => {
                const logo = getSubscriptionLogo(subscription.name)
                const isPrimaryPayer = subscription.primaryPayerId === user.uid
                const formattedNextBilling = format(
                  new Date(subscription.nextBillingDate),
                  "d MMMM yyyy",
                  { locale: idLocale }
                )
                const participantCount = subscription.participants.filter(
                  p => p.status === 'active'
                ).length
                
                return (
                  <motion.div
                    key={subscription.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HoverGlowCard
                      onClick={() => router.push(`/subscriptions/${subscription.id}`)}
                      className="cursor-pointer h-full"
                      beamColor1="#a855f7"
                      beamColor2="#3b82f6"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
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
                          <div className="text-right">
                            <div className="text-lg font-bold">{formatCurrency(subscription.amount)}</div>
                            <div className="text-xs text-gray-400">{subscription.cycle}</div>
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-1">{subscription.name}</h3>
                        
                        {subscription.description && (
                          <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                            {subscription.description}
                          </p>
                        )}
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            <span>Tagihan berikutnya: {formattedNextBilling}</span>
                          </div>
                          
                          <div className="flex items-center text-sm">
                            <Users className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{participantCount} peserta</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-auto pt-3 border-t border-white/10">
                          {isPrimaryPayer ? (
                            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                              Anda Pembayar Utama
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                              Anda Peserta
                            </span>
                          )}
                        </div>
                      </div>
                    </HoverGlowCard>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
