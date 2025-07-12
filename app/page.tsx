"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CreditCard,
  MapPin,
  Clock,
} from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { processReceiptWithGemini } from "@/lib/gemini"
import { useRouter } from "next/navigation"

export default function ScanPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const [currentTime, setCurrentTime] = useState<string>("")
  const [currentLocation, setCurrentLocation] = useState<string>("Mencari lokasi...")
  const [greeting, setGreeting] = useState<string>("")

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
            // Using OpenStreetMap Nominatim for reverse geocoding
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      processReceipt(file)
    }
  }

  const processReceipt = async (file: File) => {
    setIsScanning(true)
    setProgress(0)
    setError(null)

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

      // Process with Gemini AI
      const result = await processReceiptWithGemini(file)

      clearInterval(progressInterval)
      setProgress(100)

      setScanResult(result)
      setIsScanning(false)
    } catch (error) {
      console.error("Error processing receipt:", error)
      setError("Gagal memproses struk. Pastikan foto jelas dan coba lagi.")
      setIsScanning(false)
      setProgress(0)
    }
  }

  const createLocalSession = () => {
    if (!scanResult) return
    sessionStorage.setItem("localReceiptData", JSON.stringify(scanResult))
    router.push("/local-session")
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "main_course":
        return "🍽️"
      case "drink":
        return "🥤"
      case "appetizer":
        return "🥗"
      case "dessert":
        return "🍰"
      default:
        return "🍴"
    }
  }

  const resetScan = () => {
    setSelectedFile(null)
    setScanResult(null)
    setError(null)
    setProgress(0)
    setIsScanning(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Greeting, Location, Time */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start justify-between mb-6"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{greeting}, Pengguna!</h1>
        <div className="flex items-center text-gray-600 text-sm md:text-base mb-1">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{currentLocation}</span>
        </div>
        <div className="flex items-center text-gray-600 text-sm md:text-base">
          <Clock className="h-4 w-4 mr-1" />
          <span>{currentTime}</span>
        </div>

        {scanResult && (
          <motion.button
            onClick={resetScan}
            className="glass-medium rounded-xl px-4 py-2 text-sm font-medium text-gray-700 mt-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Scan Lagi
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {!scanResult && !isScanning && !error && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Upload Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassCard className="p-6 text-center cursor-pointer" hover onClick={() => fileInputRef.current?.click()}>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-800">Upload Foto</h3>
                    <p className="text-sm text-gray-600">Pilih foto struk dari galeri</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard
                className="p-6 text-center cursor-pointer"
                hover
                onClick={() => cameraInputRef.current?.click()}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-800">Ambil Foto</h3>
                    <p className="text-sm text-gray-600">Gunakan kamera langsung</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Tips */}
            <GlassCard className="p-6 bg-blue-500/5 border-blue-200/50">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-800">💡 Tips untuk hasil terbaik:</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Pastikan struk terlihat jelas dan tidak buram</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Hindari bayangan atau pantulan cahaya</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Foto seluruh struk dari atas ke bawah</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Pastikan pencahayaan cukup terang</span>
                    </li>
                  </ul>
                </div>
              </div>
            </GlassCard>
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
            <GlassCard className="p-6 bg-red-500/5 border-red-200/50">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-700 mb-1">Terjadi Kesalahan</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
              <motion.button
                onClick={resetScan}
                className="mt-4 btn-primary w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Coba Lagi
              </motion.button>
            </GlassCard>
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
              <GlassCard className="p-4">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Receipt preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </GlassCard>
            )}

            <GlassCard className="p-8 text-center">
              <div className="space-y-6">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Loader2 className="h-10 w-10 text-white" />
                </motion.div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-800">Memproses Struk...</h3>
                  <p className="text-gray-600">AI Gemini sedang membaca dan menganalisis struk Anda</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-sm text-gray-500">{progress}% selesai</p>

                <p className="text-xs text-gray-500">Proses ini biasanya memakan waktu 5-10 detik</p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Success Header */}
            <GlassCard className="p-6 bg-green-500/5 border-green-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-700">Struk Berhasil Diproses!</h3>
                  <p className="text-green-600 text-sm">
                    AI telah mengidentifikasi {scanResult.items?.length || 0} item dari{" "}
                    {scanResult.restaurant_info?.name || "restoran"}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Receipt Preview */}
            <GlassCard className="p-6">
              <div className="space-y-6">
                {/* Restaurant Info */}
                <div className="text-center space-y-2 pb-4 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800">
                    {scanResult.restaurant_info?.name || "Unknown Restaurant"}
                  </h3>
                  {scanResult.restaurant_info?.address && (
                    <p className="text-gray-600 text-sm">{scanResult.restaurant_info.address}</p>
                  )}
                  <div className="flex justify-center space-x-4 text-xs text-gray-500">
                    {scanResult.restaurant_info?.date && <span>{scanResult.restaurant_info.date}</span>}
                    {scanResult.restaurant_info?.time && <span>{scanResult.restaurant_info.time}</span>}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {scanResult.items?.map((item: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-between items-center py-3 border-b border-gray-50 last:border-b-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{getCategoryIcon(item.category_guess)}</span>
                          <span className="font-semibold text-gray-800">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>
                            {item.quantity}x @ Rp {item.unit_price?.toLocaleString("id-ID")}
                          </span>
                          {item.sharing_potential > 0.5 && (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                              Bisa Dibagi
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-gray-800">Rp {item.total_price?.toLocaleString("id-ID")}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Summary */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  {scanResult.summary?.subtotal && (
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Subtotal</span>
                      <span>Rp {scanResult.summary.subtotal.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {scanResult.summary?.discount && scanResult.summary.discount > 0 && (
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Diskon</span>
                      <span>- Rp {scanResult.summary.discount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {scanResult.summary?.tax > 0 && (
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Pajak</span>
                      <span>Rp {scanResult.summary.tax.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {scanResult.summary?.ppn > 0 && (
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>PPN</span>
                      <span>Rp {scanResult.summary.ppn.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {scanResult.summary?.service_charge > 0 && (
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Service Charge</span>
                      <span>Rp {scanResult.summary.service_charge.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {scanResult.summary?.points_redeemed > 0 && (
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Poin Ditebus</span>
                      <span>- Rp {scanResult.summary.points_redeemed.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg text-gray-800 border-t pt-3">
                    <span>Total</span>
                    <span>Rp {scanResult.summary?.total?.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {/* Payment Info */}
                {scanResult.payment_info?.method && (
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <CreditCard className="h-4 w-4" />
                      <span className="font-semibold">Informasi Pembayaran:</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Metode: {scanResult.payment_info.method}
                      {scanResult.payment_info.card_last_digits &&
                        ` (**** ${scanResult.payment_info.card_last_digits})`}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Action Button */}
            <div className="flex flex-col gap-4">
              <motion.button
                onClick={createLocalSession}
                className="btn-primary w-full flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Hitung Lokal</span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attribution */}
      <div className="text-center text-xs text-gray-500 mt-8">
        <p>
          Powered by <span className="font-semibold">IBM Granite</span>,{" "}
          <span className="font-semibold">Google Gemini</span>, and <span className="font-semibold">v0 by Vercel</span>.
        </p>
        <p className="mt-1">
          Created by <span className="font-semibold">Al-Ghani Desta Setyawan</span> for Hacktiv8 Capstone Project.
        </p>
      </div>
    </div>
  )
}
