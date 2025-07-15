"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { 
  LinkIcon, 
  Copy, 
  Check, 
  Share as ShareIcon,
  X,
  QrCode
} from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { useSessions } from "@/contexts/SessionContext"
import QRCode from "react-qr-code"

export default function ShareInvitePage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { getSessionById, listenToSession } = useSessions()
  
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [inviteLink, setInviteLink] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [existingInvites, setExistingInvites] = useState<any[]>([])
  
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    if (!params.id) return
    
    const sessionId = Array.isArray(params.id) ? params.id[0] : params.id
    
    // Initial load
    loadSession(sessionId)
    
    // Set up real-time listener
    const unsubscribe = listenToSession(sessionId, (sessionData) => {
      setSession(sessionData)
      
      // Update invitations when session changes
      if (sessionData.invitations && sessionData.invitations.length > 0) {
        // Sort by creation date, newest first
        const sortedInvites = [...sessionData.invitations].sort((a, b) => b.createdAt - a.createdAt)
        
        // Find latest valid invitation
        const now = Date.now()
        const validInvite = sortedInvites.find(invite => !invite.used && invite.expiresAt > now)
        
        if (validInvite) {
          setInviteLink(`${window.location.origin}/invite/${validInvite.code}`)
        }
        
        setExistingInvites(sortedInvites)
      }
    })
    
    // Clean up listener
    return () => {
      unsubscribe()
    }
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
      
      // Check if there are existing invites
      if (sessionData.invitations && sessionData.invitations.length > 0) {
        // Sort by creation date, newest first
        const sortedInvites = [...sessionData.invitations].sort((a, b) => b.createdAt - a.createdAt)
        
        // Find latest valid invitation
        const now = Date.now()
        const validInvite = sortedInvites.find(invite => !invite.used && invite.expiresAt > now)
        
        if (validInvite) {
          setInviteLink(`${window.location.origin}/invite/${validInvite.code}`)
        }
        
        setExistingInvites(sortedInvites)
      }
    } catch (error) {
      console.error("Error loading session:", error)
      toast.error("Gagal memuat sesi")
    } finally {
      setLoading(false)
    }
  }
  
  const generateInviteLink = async () => {
    if (!session || !user) return
    
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/sessions/create-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: session.id,
          creatorId: user.uid
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setInviteLink(data.invitation.url)
        toast.success("Tautan undangan berhasil dibuat!")
        
        // Add to existing invites
        setExistingInvites([
          {
            code: data.invitation.code,
            createdAt: Date.now(),
            expiresAt: data.invitation.expiresAt,
            used: false
          },
          ...existingInvites
        ])
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error) {
      console.error("Error generating invite link:", error)
      toast.error("Gagal membuat tautan undangan")
    } finally {
      setIsGenerating(false)
    }
  }
  
  const copyInviteLink = () => {
    if (!inviteLink) return
    
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setCopied(true)
        toast.success("Tautan berhasil disalin!")
        
        // Reset copied status after 3 seconds
        setTimeout(() => setCopied(false), 3000)
      })
      .catch(() => {
        toast.error("Gagal menyalin tautan")
      })
  }
  
  const shareInviteLink = () => {
    if (!inviteLink) return
    
    if (navigator.share) {
      navigator.share({
        title: `Undangan Patungan: ${session.name}`,
        text: `Bergabunglah dengan sesi patungan "${session.name}" di aplikasi Patungan!`,
        url: inviteLink
      })
      .catch((error) => {
        console.error('Error sharing:', error)
      })
    } else {
      copyInviteLink()
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin w-10 h-10 border-t-2 border-pink-500 rounded-full"></div>
      </div>
    )
  }
  
  if (!session) return null
  
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
              onClick={() => router.push(`/sessions/${session.id}`)}
              className="rounded-full bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Undang Teman</h1>
            </div>
          </motion.div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-0">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-black/30 border-white/10">
            <CardHeader>
              <CardTitle>Bagikan Undangan</CardTitle>
              <CardDescription>
                Undang teman untuk bergabung di sesi patungan "{session.name}"
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {inviteLink ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-xl">
                      <QRCode
                        size={200}
                        value={inviteLink}
                        viewBox={`0 0 256 256`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input 
                      value={inviteLink}
                      readOnly
                      className="bg-black/30 border-white/10"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyInviteLink}
                      className="border-white/10 bg-white/5"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button
                      onClick={shareInviteLink}
                      className="bg-gradient-to-r from-pink-500 to-orange-500"
                    >
                      <ShareIcon className="h-4 w-4 mr-2" />
                      Bagikan Tautan
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-400 text-center">
                    Tautan undangan ini berlaku selama 7 hari dan hanya dapat digunakan sekali
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LinkIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Belum Ada Tautan Undangan</h3>
                  <p className="text-gray-400 mb-6">
                    Buat tautan undangan untuk berbagi dengan teman Anda
                  </p>
                  <Button
                    onClick={generateInviteLink}
                    className="bg-gradient-to-r from-pink-500 to-orange-500"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-t-2 border-white rounded-full mr-2"></div>
                        Membuat...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Buat Tautan Undangan
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {existingInvites.length > 0 && (
                <div className="pt-4 mt-4 border-t border-white/10">
                  <h3 className="text-sm font-medium mb-3">Undangan Terdahulu</h3>
                  <div className="space-y-2">
                    {existingInvites.slice(0, 5).map((invite, index) => {
                      const isValid = !invite.used && invite.expiresAt > Date.now()
                      const expiryDate = new Date(invite.expiresAt)
                      
                      return (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 rounded-lg bg-white/5"
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <div className="text-sm">
                              <div className="font-medium">
                                {invite.code.substring(0, 6)}...
                              </div>
                              <div className="text-xs text-gray-400">
                                {isValid
                                  ? `Berlaku sampai ${expiryDate.toLocaleDateString()}`
                                  : invite.used
                                    ? 'Sudah digunakan'
                                    : 'Kadaluarsa'
                                }
                              </div>
                            </div>
                          </div>
                          
                          {isValid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setInviteLink(`${window.location.origin}/invite/${invite.code}`)
                              }}
                              className="text-xs h-7"
                            >
                              Gunakan
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
