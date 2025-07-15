"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  Camera,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Receipt,
  ArrowRight,
  Loader2,
  MapPin,
  Clock,
  CreditCard,
  Scan,
  LogOut,
  User,
  MessageSquare,
  BarChart3,
  Users,
  Share,
  Mail,
  X,
} from "lucide-react"
import QRCode from "react-qr-code"
import { useAuth } from "@/contexts/AuthContext"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { BorderBeam } from "@/components/ui/border-beam"
import { HoverGlowCard } from "@/components/ui/hover-glow-card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { processReceiptWithGemini } from "@/lib/gemini"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState<string>("")
  const [currentLocation, setCurrentLocation] = useState<string>("Mencari lokasi...")
  const [greeting, setGreeting] = useState<string>("")
  const [showModeSelector, setShowModeSelector] = useState<boolean>(false)
  const [selectedMode, setSelectedMode] = useState<"local" | "online" | null>(null)
  const [showScanOptions, setShowScanOptions] = useState<boolean>(false)
  const [sessionLink, setSessionLink] = useState<string>("")
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes().toString().padStart(2, "0")
      const seconds = now.getSeconds().toString().padStart(2, "0")
      setCurrentTime(`${hours}:${minutes}:${seconds}`)

      if (hours >= 5 && hours < 12) {
        setGreeting("Selamat Pagi")
      } else if (hours >= 12 && hours < 17) {
        setGreeting("Selamat Siang")
      } else if (hours >= 17 && hours < 20) {
        setGreeting("Selamat Sore")
      } else {
        setGreeting("Selamat Malam")
      }
    }, 1000)

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            )
            const data = await response.json()
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village || ""
              const country = data.address.country || ""
              setCurrentLocation(`${city}, ${country}`)
            } else {
              setCurrentLocation("Lokasi tidak ditemukan")
            }
          } catch (geoError) {
            console.error("Error fetching location name:", geoError)
            setCurrentLocation("Gagal mendapatkan nama lokasi")
          }
        },
        (geoError) => {
          console.error("Error getting geolocation:", geoError)
          setCurrentLocation("Lokasi tidak tersedia")
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )
    } else {
      setCurrentLocation("Geolocation tidak didukung")
    }

    return () => clearInterval(timer)
  }, [])

  const processImage = async (file: File) => {
    setIsScanning(true)
    setError(null)
    setProgress(10)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 400)

      const result = await processReceiptWithGemini(file)
      
      clearInterval(progressInterval)
      setProgress(100)
      setScanResult(result)
      
      // Store receipt data in sessionStorage for local session
      sessionStorage.setItem("localReceiptData", JSON.stringify(result))
      
      // For online mode, generate a session link
      if (selectedMode === "online") {
        // Simulate creating an online session
        setTimeout(() => {
          const sessionId = generateRandomId();
          // Use the actual URL of the current site rather than hardcoded domain
          const baseUrl = window.location.origin;
          const link = `${baseUrl}/s/${sessionId}`;
          setSessionLink(link);
          setShowShareDialog(true);
        }, 1000);
      }
    } catch (error) {
      console.error("Error processing receipt:", error)
      setError(error instanceof Error ? error.message : "Terjadi kesalahan saat memproses struk")
    } finally {
      setIsScanning(false)
    }
  }
  
  // Helper function to generate random session ID
  const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      processImage(file)
    }
  }

  const resetScan = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setScanResult(null)
    setError(null)
    setProgress(0)
    setIsScanning(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  const handleProceedToLocal = () => {
    if (selectedMode === "local") {
      router.push("/local-session")
    } else if (selectedMode === "online") {
      // Show share dialog again if it was closed
      setShowShareDialog(true)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // Don't render if no user
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <BackgroundBeams />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Scan className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">Dashboard</span>
        </motion.div>

        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium">{user.displayName || user.email}</span>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/20 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Logout</span>
          </motion.button>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 py-8">
        {/* Header with Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {greeting}, {user.displayName?.split(' ')[0] || 'User'}!
          </h1>
          <div className="flex items-center space-x-4 text-gray-400 text-sm">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{currentLocation}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{currentTime}</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <HoverGlowCard
            onClick={() => router.push('/groups')}
            beamColor1="#8b5cf6"
            beamColor2="#06b6d4"
            animationDelay={0.1}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Grup Patungan</h3>
            <p className="text-gray-400">Kelola grup patungan bersama</p>
          </HoverGlowCard>

          <HoverGlowCard
            onClick={() => router.push('/subscriptions')}
            beamColor1="#a855f7"
            beamColor2="#3b82f6"
            animationDelay={0.15}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Langganan Bareng</h3>
            <p className="text-gray-400">Kelola langganan bersama teman</p>
          </HoverGlowCard>

          <HoverGlowCard
            onClick={() => router.push('/chat')}
            beamColor1="#8b5cf6"
            beamColor2="#06b6d4"
            animationDelay={0.2}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Chat</h3>
            <p className="text-gray-400">Tanya AI tentang keuangan</p>
          </HoverGlowCard>

          <HoverGlowCard
            onClick={() => setShowModeSelector(true)}
            beamColor1="#8b5cf6"
            beamColor2="#06b6d4"
            animationDelay={0.3}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center text-white">
                <Scan className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Scan Struk</h3>
            <p className="text-gray-400">Scan struk untuk split bill</p>
          </HoverGlowCard>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Scan Again Button (when result is shown) */}
          {scanResult && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex justify-center"
            >
              <motion.button
                onClick={resetScan}
                className="flex items-center space-x-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/20 hover:border-white/30 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Scan className="h-5 w-5" />
                <span>Scan Lagi</span>
              </motion.button>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!scanResult && !isScanning && !error && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Input fields are hidden but still accessible via references */}
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  aria-label="Upload struk dari galeri"
                  title="Upload struk dari galeri"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Ambil foto struk dengan kamera"
                  title="Ambil foto struk dengan kamera"
                />
                
                {/* Tips */}
                <div className="relative p-6 bg-blue-500/5 border border-blue-200/20 rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold mb-2">Tips untuk Hasil Terbaik</h3>
                      <ul className="space-y-2 text-gray-300 text-sm">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>Pastikan seluruh struk terlihat jelas</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>Hindari bayangan atau pantulan cahaya</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>Ambil foto dari atas dengan sudut tegak lurus</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>Pastikan pencahayaan cukup terang</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="relative p-6 bg-red-500/5 border border-red-200/20 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                    <div className="flex-1">
                      <h3 className="font-bold text-red-300 mb-1">Terjadi Kesalahan</h3>
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={resetScan}
                    className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full font-semibold hover:from-purple-600 hover:to-cyan-600 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Coba Lagi
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Processing State */}
            {isScanning && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                {/* Preview Image */}
                {previewUrl && (
                  <div className="relative p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                      <img
                        src={previewUrl}
                        alt="Receipt preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="relative p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-center">
                  <div className="space-y-6">
                    <motion.div
                      className="w-20 h-20 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Loader2 className="h-10 w-10 text-white" />
                    </motion.div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Memproses Struk...</h3>
                      <p className="text-gray-400">AI Gemini sedang membaca dan menganalisis struk Anda</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Success State */}
            {scanResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                {/* Success Header */}
                <div className="relative p-6 bg-green-500/5 border border-green-200/20 rounded-2xl text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-green-500 rounded-3xl flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-green-300 mb-2">Struk Berhasil Diproses!</h3>
                  <p className="text-green-400 text-sm">AI telah berhasil membaca dan menganalisis struk Anda</p>
                </div>

                {/* Receipt Summary */}
                <div className="relative p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    <Receipt className="h-5 w-5 mr-2 text-purple-400" />
                    Ringkasan Struk
                  </h3>

                  <div className="space-y-4">
                    {/* Restaurant Info */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-300 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        {scanResult.restaurant_info?.name || "Nama Restoran Tidak Terdeteksi"}
                      </h4>
                      {scanResult.restaurant_info?.address && (
                        <p className="text-gray-400 text-sm ml-6">{scanResult.restaurant_info.address}</p>
                      )}
                      {scanResult.restaurant_info?.date && (
                        <p className="text-gray-400 text-sm ml-6 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {scanResult.restaurant_info.date}
                          {scanResult.restaurant_info?.time && ` • ${scanResult.restaurant_info.time}`}
                        </p>
                      )}
                    </div>

                    {/* Items Summary */}
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-gray-400 text-sm mb-2">
                        <strong>{scanResult.items?.length || 0} item</strong> terdeteksi
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {scanResult.items?.slice(0, 5).map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-300">
                              {item.name} {item.quantity > 1 && `(${item.quantity}x)`}
                            </span>
                            <span className="text-gray-400">
                              Rp {item.total_price?.toLocaleString("id-ID") || "0"}
                            </span>
                          </div>
                        ))}
                        {scanResult.items?.length > 5 && (
                          <p className="text-gray-500 text-xs text-center pt-2">
                            +{scanResult.items.length - 5} item lainnya
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Total</span>
                        <span className="font-bold text-lg text-purple-400">
                          Rp {scanResult.summary?.total?.toLocaleString("id-ID") || "0"}
                        </span>
                      </div>
                    </div>

                    {/* Payment Info */}
                    {scanResult.payment_info?.method && (
                      <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center text-gray-400 text-sm">
                          <CreditCard className="h-4 w-4 mr-2" />
                          <span>
                            Metode: {scanResult.payment_info.method}
                            {scanResult.payment_info.card_last_digits && ` (**** ${scanResult.payment_info.card_last_digits})`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <motion.button
                    onClick={handleProceedToLocal}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full font-semibold text-lg flex items-center justify-center space-x-2 hover:from-purple-600 hover:to-cyan-600 transition-colors hover:shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {selectedMode === "local" ? (
                      <>
                        <span>Hitung Lokal</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    ) : (
                      <>
                        <span>Bagikan Link</span>
                        <Share className="h-5 w-5" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mode Selector Dialog */}
        <Dialog open={showModeSelector} onOpenChange={setShowModeSelector}>
          <DialogContent className="bg-black/95 border border-white/10 text-white sm:max-w-lg">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-center">Pilih Mode Split Bill</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSelectedMode("local")
                    setShowModeSelector(false)
                    setShowScanOptions(true)
                  }}
                  className="relative p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all"
                >
                  <div className="w-12 h-12 mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Mode Lokal</h3>
                  <p className="text-gray-400 text-sm">
                    Hitung split bill di perangkat ini saja. Cocok untuk patungan langsung bersama teman.
                  </p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSelectedMode("online")
                    setShowModeSelector(false)
                    setShowScanOptions(true)
                  }}
                  className="relative p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all"
                >
                  <div className="w-12 h-12 mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Share className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Mode Online</h3>
                  <p className="text-gray-400 text-sm">
                    Bagikan link untuk split bill bersama. Teman tidak perlu membuat akun.
                  </p>
                </motion.div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Scan Options Dialog */}
        <Dialog open={showScanOptions} onOpenChange={setShowScanOptions}>
          <DialogContent className="bg-black/95 border border-white/10 text-white sm:max-w-lg">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-center">
                Scan Struk {selectedMode === "local" ? "Lokal" : "Online"}
              </h2>
              <p className="text-gray-400 text-sm text-center mb-6">
                {selectedMode === "local" 
                  ? "Split bill akan dihitung dan disimpan di perangkat ini saja" 
                  : "Struk akan dapat diakses oleh teman melalui link"}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowScanOptions(false)
                    fileInputRef.current?.click()
                  }}
                  className="relative p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all text-center"
                >
                  <div className="w-16 h-16 mb-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">Upload dari Galeri</h3>
                  <p className="text-gray-400 text-sm">
                    Pilih foto struk dari galeri perangkat Anda
                  </p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowScanOptions(false)
                    cameraInputRef.current?.click()
                  }}
                  className="relative p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all text-center"
                >
                  <div className="w-16 h-16 mb-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">Ambil Foto</h3>
                  <p className="text-gray-400 text-sm">
                    Foto struk langsung dengan kamera perangkat
                  </p>
                </motion.div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Share Link Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="bg-black/95 border border-white/10 text-white sm:max-w-lg">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-center">Bagikan Split Bill</h2>
              <p className="text-gray-400 text-sm text-center mb-6">
                Bagikan link ini kepada teman-teman untuk split bill bersama
              </p>
              
              <div className="space-y-6">
                {/* QR Code */}
                <div className="flex flex-col items-center mb-4">
                  <div className="mb-2 text-sm text-gray-400 font-medium">Pindai untuk membuka sesi</div>
                  <div className="w-48 h-48 bg-white p-4 rounded-lg shadow-md border border-purple-100">
                    {sessionLink ? (
                      <div className="relative">
                        <QRCode
                          size={160}
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                          value={sessionLink}
                          viewBox={`0 0 256 256`}
                          fgColor="#8B5CF6"
                          bgColor="#FFFFFF"
                        />
                        <div className="absolute bottom-1 right-1 bg-white p-1 rounded-sm">
                          <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-sm"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-black/10 rounded grid place-items-center">
                        <p className="text-gray-500 text-xs text-center px-4">QR Code akan ditampilkan di sini</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center max-w-xs">
                    Teman dapat bergabung dengan memindai QR code atau menggunakan tautan
                  </div>
                </div>
                
                {/* Link Copy */}
                <div className="flex">
                  <input
                    type="text"
                    value={sessionLink || `${window.location.origin}/s/EXAMPLE`}
                    readOnly
                    aria-label="Link share"
                    title="Link share"
                    className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-l-lg text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sessionLink || `${window.location.origin}/s/EXAMPLE`);
                      toast.success("Link disalin ke clipboard!");
                    }}
                    className="py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-r-lg"
                  >
                    Salin
                  </button>
                </div>
                
                {/* Share Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button 
                    className="flex items-center justify-center p-3 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-all"
                    onClick={() => {
                      if (sessionLink) {
                        window.open(`https://wa.me/?text=${encodeURIComponent(`Yuk ikut patungan di ${sessionLink}`)}`, "_blank");
                      }
                    }}
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-2">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs text-white">WhatsApp</span>
                  </button>
                  <button 
                    className="flex items-center justify-center p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all"
                    onClick={() => {
                      if (sessionLink) {
                        window.open(`https://t.me/share/url?url=${encodeURIComponent(sessionLink)}&text=${encodeURIComponent('Yuk ikut patungan!')}`, "_blank");
                      }
                    }}
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                      <span className="text-white font-bold">t</span>
                    </div>
                    <span className="text-xs text-white">Telegram</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    className="flex items-center justify-center p-3 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg transition-all"
                    onClick={() => {
                      if (sessionLink) {
                        window.open(`mailto:?subject=Undangan Patungan&body=Yuk ikut patungan di ${sessionLink}`, "_blank");
                      }
                    }}
                  >
                    <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mb-2">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs text-white">Email</span>
                  </button>
                </div>
                
                {/* Skip Button */}
                <button 
                  onClick={() => setShowShareDialog(false)}
                  className="w-full mt-6 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center space-x-2 transition-all"
                >
                  <X className="h-4 w-4 mr-2" />
                  <span>Lewati</span>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Attribution */}
        <div className="text-center text-xs text-gray-500 mt-12">
          <p>
            Powered by <span className="font-semibold">IBM Granite</span>,{" "}
            <span className="font-semibold">Google Gemini</span>, and <span className="font-semibold">v0 by Vercel</span>.
          </p>
          <p className="mt-1">
            Created by <span className="font-semibold">Al-Ghani Desta Setyawan</span> for Hacktiv8 Capstone Project.
          </p>
        </div>
      </div>
    </div>
  )
}
