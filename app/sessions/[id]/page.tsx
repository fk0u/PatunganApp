"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Receipt, 
  CalendarDays, 
  Users, 
  Clock,
  ArrowLeft,
  Plus,
  Share,
  RefreshCw,
  BanknoteIcon,
  User,
  Clock as ClockIcon,
  MoreVertical,
  CalendarIcon,
  Trash2,
  Check,
  Edit,
  Info,
  Camera
} from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useAuth } from "@/contexts/AuthContext"
import { useSessions } from "@/contexts/SessionContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

export default function SessionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { getSessionById, updateSession, addTransaction, calculateDebts } = useSessions()
  
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [debts, setDebts] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("transactions")
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  
  // New transaction state
  const [newTransaction, setNewTransaction] = useState({
    name: "",
    amount: 0,
    date: format(new Date(), "yyyy-MM-dd"),
    payers: [{ userId: "", name: "", amount: 0 }],
    participants: []
  })
  
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    if (!params.id) return
    
    const sessionId = Array.isArray(params.id) ? params.id[0] : params.id
    loadSession(sessionId)
  }, [user, params.id])
  
  const loadSession = async (sessionId: string) => {
    setLoading(true)
    try {
      const sessionData = await getSessionById(sessionId)
      if (!sessionData) {
        toast.error("Sesi tidak ditemukan")
        router.push('/sessions')
        return
      }
      
      setSession(sessionData)
      
      // Calculate debts
      const debtsData = await calculateDebts(sessionId)
      setDebts(debtsData)
    } catch (error) {
      console.error("Error loading session:", error)
      toast.error("Gagal memuat sesi")
    } finally {
      setLoading(false)
    }
  }
  
  const handleAddTransaction = async () => {
    if (!session || !user) return
    
    try {
      // Validate input
      if (!newTransaction.name || newTransaction.amount <= 0 || !newTransaction.date) {
        toast.error("Isi semua field yang diperlukan")
        return
      }
      
      // Format the transaction data
      const transactionData = {
        name: newTransaction.name,
        amount: newTransaction.amount,
        date: new Date(newTransaction.date).getTime(),
        payments: newTransaction.payers.map(payer => ({
          payerId: payer.userId || user.uid,
          payerName: payer.name || user.displayName || user.email,
          amount: payer.amount || newTransaction.amount
        })),
        participants: session.participants
          .filter(p => p.status === 'active')
          .map(p => p.userId)
      }
      
      await addTransaction(session.id, transactionData)
      
      // Reload session data
      await loadSession(session.id)
      
      // Reset form and close dialog
      setNewTransaction({
        name: "",
        amount: 0,
        date: format(new Date(), "yyyy-MM-dd"),
        payers: [{ userId: "", name: "", amount: 0 }],
        participants: []
      })
      
      setIsAddTransactionOpen(false)
      toast.success("Transaksi berhasil ditambahkan")
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast.error("Gagal menambahkan transaksi")
    }
  }
  
  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <RefreshCw className="h-8 w-8 text-white animate-spin" />
      </div>
    )
  }
  
  if (!session) return null
  
  return (
    <div className="min-h-screen bg-black text-white">
      <BackgroundBeams />
      
      {/* Header */}
      <header className="relative z-10 p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/sessions')}
                className="rounded-full bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{session.name}</h1>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>
                      {format(new Date(session.startDate), "d MMMM yyyy", { locale: idLocale })}
                    </span>
                    <span>•</span>
                    <Badge variant="secondary" className="bg-white/10 text-gray-300">
                      {session.status === 'active' ? 'Aktif' : 
                       session.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-white/10"
                  onClick={() => {
                    // Handle edit session
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Sesi
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-white/10"
                  onClick={() => router.push(`/sessions/${session.id}/invite`)}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Undang Teman
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-500 hover:bg-red-500/10"
                  onClick={() => {
                    // Handle delete/cancel
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Batalkan Sesi
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>
      </header>
      
      {/* Session Info */}
      <div className="relative z-10 px-6 md:px-8 mt-2">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-black/30 border-white/10">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <BanknoteIcon className="h-6 w-6 text-pink-500 mb-2" />
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-xl font-bold">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0
                  }).format(session.totalAmount)}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-black/30 border-white/10">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Receipt className="h-6 w-6 text-orange-500 mb-2" />
                <p className="text-sm text-gray-400">Transaksi</p>
                <p className="text-xl font-bold">{session.transactions.length}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-black/30 border-white/10">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Users className="h-6 w-6 text-blue-500 mb-2" />
                <p className="text-sm text-gray-400">Peserta</p>
                <p className="text-xl font-bold">
                  {session.participants.filter(p => p.status === 'active').length}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-black/30 border-white/10">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <ClockIcon className="h-6 w-6 text-green-500 mb-2" />
                <p className="text-sm text-gray-400">Terakhir Diperbarui</p>
                <p className="text-sm font-medium">
                  {format(new Date(session.updatedAt), "d MMM, HH:mm", { locale: idLocale })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 bg-black/30 border border-white/10 rounded-lg p-1">
              <TabsTrigger value="transactions" className="data-[state=active]:bg-white/10">
                Transaksi
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-white/10">
                Pembayaran
              </TabsTrigger>
              <TabsTrigger value="participants" className="data-[state=active]:bg-white/10">
                Peserta
              </TabsTrigger>
            </TabsList>
            
            {/* Transactions Tab */}
            <TabsContent value="transactions" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Daftar Transaksi</h2>
                
                <div className="flex space-x-2">
                  <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-pink-500 to-orange-500">
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Transaksi
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="bg-black/95 border border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle>Tambah Transaksi Baru</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Nama Transaksi</label>
                        <input
                          type="text"
                          value={newTransaction.name}
                          onChange={(e) => setNewTransaction({...newTransaction, name: e.target.value})}
                          placeholder="Contoh: Makan Siang"
                          className="w-full p-2 rounded-md bg-black/30 border border-white/10 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Jumlah</label>
                        <input
                          type="number"
                          value={newTransaction.amount}
                          onChange={(e) => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})}
                          placeholder="0"
                          className="w-full p-2 rounded-md bg-black/30 border border-white/10 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Tanggal</label>
                        <input
                          type="date"
                          value={newTransaction.date}
                          onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                          className="w-full p-2 rounded-md bg-black/30 border border-white/10 text-white"
                          aria-label="Tanggal transaksi"
                          placeholder="Pilih tanggal"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Pembayar</label>
                        <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
                                {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : "U"}
                              </AvatarFallback>
                              <AvatarImage src={user.photoURL || ""} />
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.displayName || user.email}</p>
                              <p className="text-sm text-gray-400">Pembayar Utama</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsAddTransactionOpen(false)}>
                        Batal
                      </Button>
                      <Button 
                        onClick={handleAddTransaction}
                        className="bg-gradient-to-r from-pink-500 to-orange-500"
                      >
                        Tambah Transaksi
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              {session.transactions.length === 0 ? (
                <Card className="bg-black/30 border-white/10 p-8 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                      <Receipt className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium">Belum Ada Transaksi</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Tambahkan transaksi pertama untuk sesi ini dengan mengklik tombol "Tambah Transaksi"
                    </p>
                    <Button 
                      onClick={() => setIsAddTransactionOpen(true)}
                      className="bg-gradient-to-r from-pink-500 to-orange-500 mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Transaksi Pertama
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {session.transactions.map((transaction, index) => (
                    <Card key={index} className="bg-black/30 border-white/10 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="flex-1 p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-lg">{transaction.name}</h3>
                                <p className="text-sm text-gray-400">
                                  {format(new Date(transaction.date), "d MMMM yyyy", { locale: idLocale })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">
                                  {new Intl.NumberFormat('id-ID', { 
                                    style: 'currency', 
                                    currency: 'IDR',
                                    minimumFractionDigits: 0
                                  }).format(transaction.amount)}
                                </p>
                                <div className="flex items-center space-x-1 text-xs text-gray-400">
                                  <Users className="h-3 w-3" />
                                  <span>{transaction.participants.length} peserta</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex items-center space-x-2">
                              <p className="text-xs text-gray-400">Dibayar oleh:</p>
                              <div className="flex -space-x-2">
                                {transaction.payments.map((payment, i) => (
                                  <Avatar key={i} className="h-6 w-6 border border-black">
                                    <AvatarFallback className="text-xs bg-gradient-to-r from-pink-500 to-orange-500">
                                      {payment.payerName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex divide-x divide-white/10 border-t md:border-t-0 md:border-l border-white/10">
                            <Button variant="ghost" className="flex-1 rounded-none h-auto py-3 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button variant="ghost" className="flex-1 rounded-none h-auto py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Payments Tab */}
            <TabsContent value="payments" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Pembayaran & Utang</h2>
              </div>
              
              {debts.length === 0 ? (
                <Card className="bg-black/30 border-white/10 p-8 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                      <BanknoteIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium">Tidak Ada Utang</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Semua pembayaran sudah seimbang atau belum ada transaksi yang tercatat
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {debts.map((debt, index) => (
                    <Card key={index} className="bg-black/30 border-white/10">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback className="bg-red-500/30 text-red-200">
                                {debt.fromName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center">
                              <p className="font-medium">{debt.fromName}</p>
                              <ArrowLeft className="h-4 w-4 mx-2 text-gray-400" />
                              <p className="font-medium">{debt.toName}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {new Intl.NumberFormat('id-ID', { 
                                style: 'currency', 
                                currency: 'IDR',
                                minimumFractionDigits: 0
                              }).format(debt.amount)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex justify-end">
                          <Button variant="outline" size="sm" className="border-green-500/30 text-green-400 hover:bg-green-500/10">
                            <Check className="h-3 w-3 mr-1" />
                            Tandai Sudah Dibayar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Participants Tab */}
            <TabsContent value="participants" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Peserta</h2>
                
                <Button className="bg-gradient-to-r from-pink-500 to-orange-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Peserta
                </Button>
              </div>
              
              <div className="space-y-4">
                {session.participants.map((participant, index) => (
                  <Card 
                    key={index} 
                    className={cn(
                      "bg-black/30 border-white/10",
                      participant.status !== 'active' && "opacity-50"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className={cn(
                              "bg-gradient-to-r from-pink-500 to-orange-500 text-white",
                              participant.userId === session.createdBy && "bg-gradient-to-r from-blue-500 to-purple-500"
                            )}>
                              {participant.displayName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                            <AvatarImage src={participant.avatarUrl || ""} />
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center">
                              <p className="font-medium">{participant.displayName}</p>
                              {participant.userId === session.createdBy && (
                                <Badge className="ml-2 bg-blue-500/20 text-blue-300 border-0">
                                  Pembuat
                                </Badge>
                              )}
                              {participant.status === 'invited' && (
                                <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-0">
                                  Diundang
                                </Badge>
                              )}
                              {participant.status === 'removed' && (
                                <Badge className="ml-2 bg-red-500/20 text-red-300 border-0">
                                  Dikeluarkan
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {participant.userId !== session.createdBy && participant.status === 'active' && (
                          <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Keluarkan
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
