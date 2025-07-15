"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Receipt, 
  Share, 
  Users, 
  ArrowLeft, 
  RefreshCw,
  User,
  Check,
  X,
  CreditCard,
  ChevronDown,
  ChevronUp,
  MessageSquareText,
  Mail
} from 'lucide-react'
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

export default function SharedSessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [session, setSession] = useState<any>(null)
  const [participantName, setParticipantName] = useState('')
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [joiningSession, setJoiningSession] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  
  // Toggle item expand/collapse
  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }
  
  useEffect(() => {
    if (!sessionId) return
    
    const fetchSession = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/sessions/validate-session?id=${sessionId}`)
        const data = await response.json()
        
        if (data.success && data.session) {
          setSession(data.session)
          
          // Check local storage for participant info
          const storedParticipantId = localStorage.getItem(`session_${sessionId}_participantId`)
          const storedParticipantName = localStorage.getItem(`session_${sessionId}_participantName`)
          
          if (storedParticipantId && storedParticipantName) {
            // Already joined
            console.log('Already joined as', storedParticipantName)
          } else {
            // Show join dialog after a short delay
            setTimeout(() => {
              setShowJoinDialog(true)
            }, 500)
          }
        } else {
          setError(data.error || 'Failed to load session')
        }
      } catch (error) {
        console.error('Error fetching session:', error)
        setError('Failed to load session. Please check your connection.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSession()
  }, [sessionId])
  
  const handleJoinSession = async () => {
    if (!participantName.trim()) {
      toast.error('Mohon masukkan nama Anda')
      return
    }
    
    setJoiningSession(true)
    
    try {
      const response = await fetch('/api/sessions/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          participantName: participantName.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Store participant info in local storage
        localStorage.setItem(`session_${sessionId}_participantId`, data.participantId)
        localStorage.setItem(`session_${sessionId}_participantName`, participantName.trim())
        
        toast.success('Berhasil bergabung dengan sesi')
        setShowJoinDialog(false)
        
        // Update the session with the new participant
        setSession(prev => ({
          ...prev,
          participants: [
            ...prev.participants,
            { id: data.participantId, name: participantName.trim(), joined: true }
          ]
        }))
      } else {
        toast.error(data.error || 'Failed to join session')
      }
    } catch (error) {
      console.error('Error joining session:', error)
      toast.error('Failed to join session. Please try again.')
    } finally {
      setJoiningSession(false)
    }
  }
  
  const handleShare = () => {
    setShowShareDialog(true)
  }
  
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link disalin ke clipboard')
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <RefreshCw className="h-8 w-8 text-white animate-spin" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
              <X className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Sesi Tidak Ditemukan</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button 
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-purple-500 to-cyan-500"
            >
              Kembali ke Beranda
            </Button>
          </div>
        </div>
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
                onClick={() => router.push('/')}
                className="rounded-full bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{session.title}</h1>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-0">
                      Split Bill Online
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="rounded-full bg-white/10"
            >
              <Share className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-2">
        <div className="max-w-3xl mx-auto">
          {/* Session Info Card */}
          <Card className="bg-black/30 border-white/10 mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold">{session.merchantName}</h2>
                  <p className="text-gray-400 text-sm">{new Date(session.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(session.totalAmount)}</div>
                  <p className="text-gray-400 text-sm">{session.items.length} items</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {session.participants
                    .filter((p: any) => p.joined)
                    .slice(0, 5)
                    .map((participant: any, i: number) => (
                      <Avatar key={i} className="border-2 border-black">
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500">
                          {participant.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  {session.participants.filter((p: any) => p.joined).length > 5 && (
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 border-2 border-black">
                      <span className="text-xs font-medium">
                        +{session.participants.filter((p: any) => p.joined).length - 5}
                      </span>
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-white/10 bg-white/5"
                  onClick={() => setShowJoinDialog(true)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Ubah Nama
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Receipt Items */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Daftar Item</h2>
            
            <div className="space-y-3">
              {session.items.map((item: any) => (
                <Card 
                  key={item.id} 
                  className="bg-black/30 border-white/10 overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => toggleItemExpand(item.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="font-medium">{item.name}</div>
                          <Badge className="bg-white/10 text-gray-300">
                            {item.quantity}×
                          </Badge>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="font-bold mr-3">{formatCurrency(item.price * item.quantity)}</div>
                          {expandedItems.includes(item.id) ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {expandedItems.includes(item.id) && (
                      <div className="p-4 bg-white/5 border-t border-white/10">
                        <div className="text-sm text-gray-400 mb-3">Dibagikan ke:</div>
                        <div className="flex flex-wrap gap-2">
                          {session.participants
                            .filter((p: any) => item.participants.includes(p.id))
                            .map((participant: any) => (
                              <div 
                                key={participant.id}
                                className="py-1 px-3 bg-blue-500/20 text-blue-300 rounded-full text-sm flex items-center"
                              >
                                <span className="mr-1">{participant.name}</span>
                                <Check className="h-3 w-3" />
                              </div>
                            ))}
                            
                          {session.participants
                            .filter((p: any) => !item.participants.includes(p.id))
                            .map((participant: any) => (
                              <div 
                                key={participant.id}
                                className="py-1 px-3 bg-gray-700/50 text-gray-400 rounded-full text-sm flex items-center"
                              >
                                <span>{participant.name}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Payment Summary */}
          <Card className="bg-black/30 border-white/10 mb-6">
            <CardHeader>
              <CardTitle>Ringkasan Pembayaran</CardTitle>
              <CardDescription>Berikut adalah pembagian biaya untuk setiap orang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {session.participants.map((participant: any) => {
                // Calculate what this participant owes
                const participantItems = session.items.filter((item: any) => 
                  item.participants.includes(participant.id)
                )
                
                const total = participantItems.reduce((sum: number, item: any) => {
                  const perPersonCost = (item.price * item.quantity) / item.participants.length
                  return sum + perPersonCost
                }, 0)
                
                return (
                  <div key={participant.id} className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className={`
                          ${participant.joined 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                            : 'bg-gray-700'}
                        `}>
                          {participant.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{participant.name}</div>
                        <div className="text-sm text-gray-400">{participantItems.length} items</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(total)}</div>
                      <div className="text-xs text-gray-400">
                        {Math.round((total / session.totalAmount) * 100)}% dari total
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
          
          {/* Payment Options */}
          <Card className="bg-black/30 border-white/10">
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
              <CardDescription>Beberapa opsi metode pembayaran yang dapat digunakan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Transfer Bank</div>
                    <div className="text-sm text-gray-400">BCA, Mandiri, BNI, BRI</div>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5">
                  Detail
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <div className="font-bold text-white">G</div>
                  </div>
                  <div>
                    <div className="font-medium">GoPay</div>
                    <div className="text-sm text-gray-400">E-wallet</div>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5">
                  Detail
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <div className="font-bold text-white">O</div>
                  </div>
                  <div>
                    <div className="font-medium">OVO</div>
                    <div className="text-sm text-gray-400">E-wallet</div>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5">
                  Detail
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Join Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="bg-black/95 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Bergabung dengan Split Bill</DialogTitle>
            <DialogDescription className="text-gray-400">
              Masukkan nama Anda untuk bergabung dengan sesi split bill ini
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Nama Anda</label>
              <Input
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Contoh: Budi"
                className="bg-black/30 border-white/10"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              className="bg-gradient-to-r from-purple-500 to-blue-500 w-full"
              onClick={handleJoinSession}
              disabled={joiningSession}
            >
              {joiningSession ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Bergabung
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-black/95 border border-white/10 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bagikan Split Bill</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bagikan link ini kepada teman-teman untuk split bill bersama
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* QR Code Placeholder */}
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-white p-2 rounded-lg">
                {/* Placeholder for actual QR code */}
                <div className="w-full h-full bg-black rounded grid place-items-center">
                  <p className="text-white text-xs text-center px-4">QR Code akan ditampilkan di sini</p>
                </div>
              </div>
            </div>
            
            {/* Link Copy */}
            <div className="flex">
              <input
                type="text"
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
                aria-label="Share link"
                title="Share link"
                className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-l-lg text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-r-lg"
              >
                Salin
              </button>
            </div>
            
            {/* Share Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-lg">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-2">
                  <MessageSquareText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">WhatsApp</span>
              </button>
              <button className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold">t</span>
                </div>
                <span className="text-xs">Telegram</span>
              </button>
              <button className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-lg">
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mb-2">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs">Email</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
