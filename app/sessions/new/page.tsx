"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Receipt, 
  Calendar, 
  Users, 
  Tag,
  ArrowLeft,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  User,
  Calendar as CalendarIcon
} from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useAuth } from "@/contexts/AuthContext"
import { useSessions } from "@/contexts/SessionContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

// Session categories for quick selection
const SESSION_CATEGORIES = [
  { id: 'meal', label: 'Makan Bareng', icon: '🍽️' },
  { id: 'travel', label: 'Perjalanan', icon: '✈️' },
  { id: 'entertainment', label: 'Hiburan', icon: '🎬' },
  { id: 'shopping', label: 'Belanja', icon: '🛍️' },
  { id: 'event', label: 'Acara', icon: '🎉' },
  { id: 'other', label: 'Lainnya', icon: '📝' }
]

interface Participant {
  userId: string
  email: string
  displayName: string
  avatarUrl?: string
  status: 'active' | 'invited' | 'removed'
}

export default function NewSessionPage() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const { createSession } = useSessions()
  
  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // Participants
  const [participants, setParticipants] = useState<Participant[]>([])
  const [newParticipantEmail, setNewParticipantEmail] = useState("")
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])
  
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId)
    
    // Set suggested name based on category
    if (categoryId !== selectedCategory) {
      const category = SESSION_CATEGORIES.find(c => c.id === categoryId)
      if (category) {
        setName(category.label)
      }
    }
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !userData) {
      toast.error("Anda harus login untuk membuat sesi")
      return
    }
    
    if (!name || !startDate) {
      toast.error("Isi semua field yang diperlukan")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Convert string values to appropriate types
      const startTimestamp = new Date(startDate).getTime()
      
      // Create session data
      const sessionData = {
        name,
        description,
        startDate: startTimestamp,
        participants
      }
      
      const createdSession = await createSession(sessionData)
      
      toast.success("Sesi patungan berhasil dibuat!")
      router.push(`/sessions/${createdSession.id}`)
    } catch (error) {
      console.error("Error creating session:", error)
      toast.error("Gagal membuat sesi patungan")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!user) return null
  
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
              onClick={() => router.push('/sessions')}
              className="rounded-full bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Buat Sesi Patungan Baru</h1>
            </div>
          </motion.div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Session Details Card */}
            <Card className="bg-black/30 border-white/10">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Informasi Sesi</h2>
                
                <div className="space-y-4">
                  {/* Category Selection */}
                  <div>
                    <Label className="text-gray-300 mb-2 block">
                      Pilih Kategori
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {SESSION_CATEGORIES.map((category) => (
                        <div
                          key={category.id}
                          onClick={() => handleSelectCategory(category.id)}
                          className={`p-3 text-center rounded-lg cursor-pointer transition-colors ${
                            selectedCategory === category.id 
                              ? 'bg-gradient-to-r from-pink-500/30 to-orange-500/30 border border-pink-500/50' 
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-2xl mb-1">{category.icon}</div>
                          <div className="text-sm font-medium">{category.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Session Name */}
                  <div>
                    <Label htmlFor="name" className="text-gray-300 mb-2 block">
                      Nama Sesi
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Makan Bareng di Resto X"
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
                      placeholder="Deskripsi singkat tentang sesi ini"
                      className="bg-black/30 border-white/10 h-20"
                    />
                  </div>
                  
                  {/* Start Date */}
                  <div>
                    <Label htmlFor="startDate" className="text-gray-300 mb-2 block">
                      Tanggal
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
                      <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                  {/* Primary Participant Info (Creator) */}
                  <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {userData?.displayName || user.email}
                          <span className="ml-2 text-xs px-2 py-0.5 bg-pink-500/30 text-pink-300 rounded-full">
                            Pembuat
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
                  
                  {/* Participants List */}
                  {participants.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-gray-300">
                        Daftar Peserta ({participants.length})
                      </Label>
                      
                      <div className="space-y-2">
                        {participants.map((participant, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center space-x-3 flex-1 mr-4">
                              <Avatar>
                                <AvatarFallback className="bg-gray-700 text-gray-300">
                                  {participant.displayName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="overflow-hidden">
                                <div className="font-medium truncate">{participant.displayName}</div>
                                <div className="text-xs text-gray-400 truncate">{participant.email}</div>
                              </div>
                            </div>
                            
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
                    </div>
                  )}
                  
                  <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-400">
                    <p className="flex items-center">
                      <Info className="h-4 w-4 mr-2 text-orange-400" />
                      Anda bisa menambahkan peserta nanti setelah sesi dibuat.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !name || !startDate}
                className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-8 py-6 rounded-xl text-lg font-medium"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Membuat...
                  </>
                ) : (
                  <>
                    Buat Sesi Patungan
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
