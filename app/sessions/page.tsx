"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Receipt, 
  Search, 
  PlusCircle,
  Calendar,
  Clock,
  ChevronsUpDown,
  Users,
  Tag,
  ArrowLeft,
  Sparkles
} from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useSessions } from "@/contexts/SessionContext"
import { HoverGlowCard } from "@/components/ui/hover-glow-card"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export default function SessionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { userSessions, loading } = useSessions()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])
  
  // Filter and sort sessions
  const filteredSessions = userSessions
    .filter(session => 
      searchQuery === "" || 
      session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.description && session.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      let compareResult = 0
      
      // Apply sorting
      if (sortBy === 'date') {
        compareResult = a.startDate - b.startDate
      } else if (sortBy === 'amount') {
        compareResult = a.totalAmount - b.totalAmount
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
      setSortOrder('desc')
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
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Sesi Patungan</h1>
              </div>
            </div>
            
            <Button
              onClick={() => router.push('/sessions/new')}
              className="bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-full"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Buat Sesi Baru
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
                  placeholder="Cari sesi berdasarkan nama atau deskripsi..."
                  className="pl-10 bg-black/30 border-white/10 rounded-xl focus:border-pink-500"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={`bg-black/30 border-white/10 rounded-xl hover:bg-white/5 ${sortBy === 'date' ? 'border-pink-500 text-pink-400' : ''}`}
                  onClick={() => toggleSort('date')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Tanggal
                  <ChevronsUpDown className={`h-4 w-4 ml-2 transition-transform ${sortBy === 'date' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </Button>
                
                <Button
                  variant="outline"
                  className={`bg-black/30 border-white/10 rounded-xl hover:bg-white/5 ${sortBy === 'amount' ? 'border-pink-500 text-pink-400' : ''}`}
                  onClick={() => toggleSort('amount')}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Jumlah
                  <ChevronsUpDown className={`h-4 w-4 ml-2 transition-transform ${sortBy === 'amount' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </Button>
                
                <Button
                  variant="outline"
                  className={`bg-black/30 border-white/10 rounded-xl hover:bg-white/5 ${sortBy === 'name' ? 'border-pink-500 text-pink-400' : ''}`}
                  onClick={() => toggleSort('name')}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Nama
                  <ChevronsUpDown className={`h-4 w-4 ml-2 transition-transform ${sortBy === 'name' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
          </motion.div>
          
          {/* Sessions List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-t-transparent border-pink-500 animate-spin mb-4"></div>
                <p className="text-gray-400">Memuat sesi...</p>
              </div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-black/30 border border-white/10 rounded-xl p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Belum Ada Sesi Patungan</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery 
                  ? `Tidak ada sesi yang cocok dengan pencarian "${searchQuery}"`
                  : "Anda belum memiliki sesi patungan"}
              </p>
              <div className="relative p-6 bg-pink-500/5 border border-pink-200/20 rounded-2xl mb-8 max-w-lg mx-auto">
                <div className="flex items-start space-x-3">
                  <Sparkles className="h-6 w-6 text-pink-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold mb-2">Fitur Baru: Sesi Multi-Transaksi</h3>
                    <ul className="space-y-2 text-gray-300 text-sm text-left">
                      <li>🔹 Tambahkan banyak transaksi dalam satu sesi</li>
                      <li>🔹 Dukung pembayaran dari beberapa orang</li>
                      <li>🔹 Perhitungan utang yang otomatis dan optimal</li>
                      <li>🔹 Kelola keuangan acara dengan mudah</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  router.push('/sessions/new')
                }}
                className="bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Buat Sesi Patungan Baru
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session) => {
                const isCreator = session.createdBy === user.uid
                const formattedDate = format(
                  new Date(session.startDate),
                  "d MMMM yyyy",
                  { locale: idLocale }
                )
                const participantCount = session.participants.filter(
                  p => p.status === 'active'
                ).length
                
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HoverGlowCard
                      onClick={() => router.push(`/sessions/${session.id}`)}
                      className="cursor-pointer h-full"
                      beamColor1="#ec4899"
                      beamColor2="#f97316"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
                              <Receipt className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-xl font-bold">{session.name}</h3>
                              {session.description && (
                                <p className="text-gray-400 text-sm line-clamp-1">
                                  {session.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              session.status === 'active' ? 'bg-green-500/20 text-green-300' :
                              session.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {session.status === 'active' ? 'Aktif' :
                               session.status === 'completed' ? 'Selesai' :
                               'Dibatalkan'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="text-xl font-bold">{formatCurrency(session.totalAmount)}</div>
                          <div className="text-xs text-gray-400">Total pengeluaran</div>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            <span>Tanggal: {formattedDate}</span>
                          </div>
                          
                          <div className="flex items-center text-sm">
                            <Users className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{participantCount} peserta</span>
                          </div>
                          
                          <div className="flex items-center text-sm">
                            <Receipt className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{session.transactions.length} transaksi</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-4 pt-3 border-t border-white/10">
                          {isCreator ? (
                            <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-300 rounded-full">
                              Anda Pembuat
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">
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
