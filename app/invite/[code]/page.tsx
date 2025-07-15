"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Users, 
  CheckCircle,
  XCircle,
  LinkIcon,
  ArrowRight,
  RefreshCw 
} from 'lucide-react'
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  
  const [inviteState, setInviteState] = useState<'loading' | 'valid' | 'invalid' | 'processing'>('loading')
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  
  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      // Store invite code in localStorage to redirect back after login
      if (params.code) {
        localStorage.setItem('pendingInviteCode', params.code as string)
      }
      
      router.push('/auth')
      return
    }
    
    if (params.code) {
      validateInvite(params.code as string)
    } else {
      setInviteState('invalid')
    }
  }, [user, authLoading, params])
  
  const validateInvite = async (inviteCode: string) => {
    try {
      // Check if invite code is valid by making a request to backend
      // Here we just check if it exists, without joining yet
      const response = await fetch(`/api/sessions/validate-invite?code=${inviteCode}`)
      const data = await response.json()
      
      if (data.success) {
        setSessionInfo(data.session)
        setInviteState('valid')
      } else {
        setInviteState('invalid')
      }
    } catch (error) {
      console.error('Error validating invite:', error)
      setInviteState('invalid')
    }
  }
  
  const joinSession = async () => {
    if (!user || !params.code) return
    
    setInviteState('processing')
    
    try {
      const response = await fetch('/api/sessions/join-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inviteCode: params.code,
          userId: user.uid,
          displayName: user.displayName || user.email,
          avatarUrl: user.photoURL
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Berhasil bergabung dengan sesi patungan!')
        
        // Navigate to the session page
        router.push(`/sessions/${data.sessionId}`)
      } else {
        toast.error(data.error || 'Gagal bergabung dengan sesi')
        setInviteState('invalid')
      }
    } catch (error) {
      console.error('Error joining session:', error)
      toast.error('Terjadi kesalahan saat mencoba bergabung')
      setInviteState('invalid')
    }
  }
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <RefreshCw className="h-8 w-8 text-white animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <BackgroundBeams />
      
      <main className="relative z-10 p-6 md:p-8 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md bg-black/30 border-white/10">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-pink-400" />
            </div>
            <CardTitle className="text-2xl">Undangan Patungan</CardTitle>
            <CardDescription>
              {inviteState === 'loading' && 'Memeriksa undangan...'}
              {inviteState === 'valid' && 'Anda diundang untuk bergabung dengan sesi patungan'}
              {inviteState === 'invalid' && 'Undangan tidak valid atau telah kadaluarsa'}
              {inviteState === 'processing' && 'Memproses permintaan...'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {inviteState === 'loading' && (
              <div className="py-8 flex justify-center">
                <RefreshCw className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
            
            {inviteState === 'valid' && sessionInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="text-xl font-bold mb-2">{sessionInfo.name}</h3>
                  
                  {sessionInfo.description && (
                    <p className="text-gray-400 mb-4">{sessionInfo.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Users className="h-4 w-4" />
                    <span>{sessionInfo.participantCount} orang sudah bergabung</span>
                  </div>
                </div>
                
                <div className="py-2 text-center text-gray-300">
                  Dengan bergabung, Anda akan menjadi peserta dalam sesi patungan ini
                </div>
              </motion.div>
            )}
            
            {inviteState === 'invalid' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 text-center space-y-4"
              >
                <XCircle className="h-16 w-16 text-red-400 mx-auto" />
                <p className="text-gray-300">
                  Tautan undangan ini tidak valid, telah digunakan, atau sudah kadaluarsa.
                </p>
              </motion.div>
            )}
            
            {inviteState === 'processing' && (
              <div className="py-8 flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="h-12 w-12 text-white animate-spin" />
                <p className="text-gray-300">Memproses permintaan bergabung...</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center">
            {inviteState === 'valid' && (
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-orange-500"
                onClick={joinSession}
              >
                Bergabung Sekarang
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {inviteState === 'invalid' && (
              <Button
                variant="outline"
                className="border-white/10"
                onClick={() => router.push('/sessions')}
              >
                Kembali ke Sesi Patungan
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
