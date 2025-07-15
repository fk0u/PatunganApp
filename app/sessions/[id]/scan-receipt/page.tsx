"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Receipt, 
  Camera, 
  Upload, 
  Check, 
  X, 
  Trash, 
  Edit,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Plus,
  Minus,
  Save,
  HelpCircle
} from 'lucide-react'
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { useSessions } from "@/contexts/SessionContext"
import Image from "next/image"
import { format } from 'date-fns'
import { id as idLocale } from "date-fns/locale"

export default function ScanReceiptPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { getSessionById, addTransaction } = useSessions()
  
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [session, setSession] = useState<any>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [parsedReceipt, setParsedReceipt] = useState<any>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  
  // Edit state for parsed receipt
  const [merchantName, setMerchantName] = useState("")
  const [receiptDate, setReceiptDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [receiptTotal, setReceiptTotal] = useState(0)
  const [receiptItems, setReceiptItems] = useState<any[]>([])
  
  // Refs for camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
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
    setSessionLoading(true)
    try {
      const sessionData = await getSessionById(sessionId)
      if (!sessionData) {
        toast.error("Sesi tidak ditemukan")
        router.push('/sessions')
        return
      }
      
      setSession(sessionData)
    } catch (error) {
      console.error("Error loading session:", error)
      toast.error("Gagal memuat sesi")
    } finally {
      setSessionLoading(false)
    }
  }
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file type
    if (!file.type.includes('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB')
      return
    }
    
    setIsUploading(true)
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string)
      setIsUploading(false)
    }
    reader.onerror = () => {
      toast.error('Gagal membaca file')
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }
  
  const startCamera = async () => {
    setShowCamera(true)
    setCameraError("")
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setCameraError("Gagal mengakses kamera. Pastikan Anda mengizinkan akses kamera.")
    }
  }
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
  }
  
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert canvas to image
      const imageDataUrl = canvas.toDataURL('image/jpeg')
      setReceiptImage(imageDataUrl)
      
      // Stop camera
      stopCamera()
    }
  }
  
  const resetImage = () => {
    setReceiptImage(null)
    setParsedReceipt(null)
    setMerchantName("")
    setReceiptDate(format(new Date(), "yyyy-MM-dd"))
    setReceiptTotal(0)
    setReceiptItems([])
  }
  
  const processReceipt = async () => {
    if (!receiptImage || !session) return
    
    setIsProcessing(true)
    
    try {
      // Convert base64 to blob
      const base64Response = await fetch(receiptImage)
      const blob = await base64Response.blob()
      
      // Create file from blob
      const file = new File([blob], "receipt.jpg", { type: "image/jpeg" })
      
      // Create form data
      const formData = new FormData()
      formData.append('receipt', file)
      formData.append('sessionId', session.id)
      
      // Send to API
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to process receipt')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setParsedReceipt(data.receipt)
        setMerchantName(data.receipt.merchant)
        setReceiptDate(format(new Date(data.receipt.date), "yyyy-MM-dd"))
        setReceiptTotal(data.receipt.total)
        setReceiptItems(data.receipt.items.map(item => ({
          ...item,
          isAssigned: true,
          assignedTo: session.participants
            .filter(p => p.status === 'active')
            .map(p => p.userId)
        })))
        
        toast.success("Struk berhasil diproses!")
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error) {
      console.error("Error processing receipt:", error)
      toast.error("Gagal memproses struk. Silakan coba lagi.")
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleAddItem = () => {
    setReceiptItems([
      ...receiptItems,
      {
        name: "",
        price: 0,
        quantity: 1,
        isAssigned: true,
        assignedTo: session.participants
          .filter(p => p.status === 'active')
          .map(p => p.userId)
      }
    ])
  }
  
  const handleRemoveItem = (index: number) => {
    const newItems = [...receiptItems]
    newItems.splice(index, 1)
    setReceiptItems(newItems)
    
    // Recalculate total
    const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    setReceiptTotal(newTotal)
  }
  
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...receiptItems]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }
    setReceiptItems(newItems)
    
    // Recalculate total if price or quantity changes
    if (field === 'price' || field === 'quantity') {
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      setReceiptTotal(newTotal)
    }
  }
  
  const handleToggleAssignItem = (index: number) => {
    const newItems = [...receiptItems]
    newItems[index] = {
      ...newItems[index],
      isAssigned: !newItems[index].isAssigned,
      assignedTo: !newItems[index].isAssigned
        ? session.participants
            .filter(p => p.status === 'active')
            .map(p => p.userId)
        : []
    }
    setReceiptItems(newItems)
  }
  
  const handleToggleParticipantForItem = (itemIndex: number, userId: string) => {
    const newItems = [...receiptItems]
    const item = newItems[itemIndex]
    
    if (item.assignedTo.includes(userId)) {
      // Remove user if already assigned
      item.assignedTo = item.assignedTo.filter(id => id !== userId)
    } else {
      // Add user if not assigned
      item.assignedTo = [...item.assignedTo, userId]
    }
    
    setReceiptItems(newItems)
  }
  
  const handleSaveTransaction = async () => {
    if (!session) return
    
    try {
      // Validate
      if (!merchantName || !receiptDate || receiptTotal <= 0) {
        toast.error("Lengkapi semua informasi transaksi")
        return
      }
      
      // Format the transaction data
      const transactionData = {
        name: merchantName,
        description: `Struk belanja dari ${merchantName}`,
        amount: receiptTotal,
        date: new Date(receiptDate).getTime(),
        payments: [{
          payerId: user.uid,
          payerName: user.displayName || user.email,
          amount: receiptTotal
        }],
        receiptImageUrl: parsedReceipt?.imageUrl || null,
        receiptItems: receiptItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          assignedTo: item.isAssigned ? item.assignedTo : []
        })),
        participants: session.participants
          .filter(p => p.status === 'active')
          .map(p => p.userId)
      }
      
      await addTransaction(session.id, transactionData)
      
      toast.success("Transaksi berhasil ditambahkan!")
      router.push(`/sessions/${session.id}`)
    } catch (error) {
      console.error("Error saving transaction:", error)
      toast.error("Gagal menyimpan transaksi")
    }
  }
  
  if (!user || sessionLoading) {
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
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/sessions/${session.id}`)}
                className="rounded-full bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Scan Struk</h1>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsHelpOpen(true)}
              className="rounded-full bg-white/10"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 pt-2">
        <div className="max-w-3xl mx-auto">
          {!parsedReceipt ? (
            <Card className="bg-black/30 border-white/10">
              <CardContent className="p-6">
                {!receiptImage ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <Receipt className="h-12 w-12 text-gray-400" />
                    </div>
                    
                    <h2 className="text-xl font-bold mb-2">Unggah Struk Belanja</h2>
                    <p className="text-gray-400 text-center mb-8 max-w-md">
                      Unggah foto struk belanja untuk memproses dan menambahkan transaksi ke sesi patungan
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                      <Button
                        className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500"
                        onClick={startCamera}
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Ambil Foto
                      </Button>
                      
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                        <div className="flex items-center justify-center py-3 px-4 border border-white/20 rounded-md bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-center h-full">
                          {isUploading ? (
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-5 w-5 mr-2" />
                          )}
                          Pilih File
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="aspect-[3/4] overflow-hidden rounded-lg border border-white/20 bg-black/50">
                        <img
                          src={receiptImage}
                          alt="Receipt"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={resetImage}
                          className="rounded-full h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button
                        className="bg-gradient-to-r from-pink-500 to-orange-500"
                        onClick={processReceipt}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <Receipt className="h-5 w-5 mr-2" />
                            Proses Struk
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="bg-black/30 border-white/10">
                <CardHeader>
                  <CardTitle>Hasil Scan Struk</CardTitle>
                  <CardDescription>
                    Verifikasi dan edit informasi struk sebelum menyimpan transaksi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Nama Tempat</label>
                      <Input
                        value={merchantName}
                        onChange={(e) => setMerchantName(e.target.value)}
                        className="bg-black/30 border-white/10"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Tanggal</label>
                      <Input
                        type="date"
                        value={receiptDate}
                        onChange={(e) => setReceiptDate(e.target.value)}
                        className="bg-black/30 border-white/10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Total</label>
                    <Input
                      type="number"
                      value={receiptTotal}
                      onChange={(e) => setReceiptTotal(Number(e.target.value))}
                      className="bg-black/30 border-white/10"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-gray-400">Item-item</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddItem}
                        className="h-7 px-2 text-xs border-white/10"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Tambah Item
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {receiptItems.map((item, index) => (
                        <Card key={index} className="bg-black/20 border-white/5">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="w-full">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="font-medium flex items-center">
                                    <button
                                      onClick={() => handleToggleAssignItem(index)}
                                      className={`w-5 h-5 rounded-full mr-2 flex items-center justify-center border ${
                                        item.isAssigned 
                                          ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                                          : 'bg-transparent border-white/20 text-gray-400'
                                      }`}
                                    >
                                      {item.isAssigned && <Check className="h-3 w-3" />}
                                    </button>
                                    Item #{index + 1}
                                  </div>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveItem(index)}
                                    className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-6 gap-2">
                                  <div className="col-span-3">
                                    <Input
                                      placeholder="Nama item"
                                      value={item.name}
                                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                      className="bg-black/20 border-white/10 h-8 text-sm"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <Input
                                      type="number"
                                      placeholder="Harga"
                                      value={item.price}
                                      onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                                      className="bg-black/20 border-white/10 h-8 text-sm"
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <Input
                                      type="number"
                                      placeholder="Jml"
                                      value={item.quantity}
                                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                      className="bg-black/20 border-white/10 h-8 text-sm"
                                    />
                                  </div>
                                </div>
                                
                                {item.isAssigned && (
                                  <div className="mt-2">
                                    <div className="text-xs text-gray-400 mb-1">Dibagikan ke:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {session.participants
                                        .filter(p => p.status === 'active')
                                        .map((participant) => (
                                          <button
                                            key={participant.userId}
                                            onClick={() => handleToggleParticipantForItem(index, participant.userId)}
                                            className={`px-2 py-1 text-xs rounded-full flex items-center ${
                                              item.assignedTo.includes(participant.userId)
                                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                : 'bg-gray-800/50 text-gray-400 border border-gray-700'
                                            }`}
                                          >
                                            {participant.displayName.split(' ')[0]}
                                            {!item.assignedTo.includes(participant.userId) && (
                                              <Plus className="h-3 w-3 ml-1" />
                                            )}
                                            {item.assignedTo.includes(participant.userId) && (
                                              <Check className="h-3 w-3 ml-1" />
                                            )}
                                          </button>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {receiptItems.length === 0 && (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          Tidak ada item yang terdeteksi. Tambahkan item secara manual.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={resetImage}
                    className="border-white/10"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                  
                  <Button
                    className="bg-gradient-to-r from-pink-500 to-orange-500"
                    onClick={handleSaveTransaction}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Transaksi
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      {/* Camera Dialog */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center">
            <Button variant="ghost" onClick={stopCamera}>
              <X className="h-5 w-5 mr-2" />
              Tutup
            </Button>
            
            <h2 className="text-xl font-bold">Ambil Foto Struk</h2>
            
            <div className="w-10"></div>
          </div>
          
          <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
            {cameraError ? (
              <div className="text-center p-6">
                <div className="text-red-400 mb-4">{cameraError}</div>
                <Button variant="outline" onClick={stopCamera}>
                  Kembali
                </Button>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute inset-0 border-2 border-white/30 border-dashed m-8 pointer-events-none"></div>
              </div>
            )}
          </div>
          
          <div className="p-6 flex justify-center">
            <Button
              size="lg"
              className="h-16 w-16 rounded-full bg-white"
              onClick={captureImage}
            >
              <Camera className="h-8 w-8 text-black" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Help Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="bg-black/95 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Bantuan Scan Struk</DialogTitle>
            <DialogDescription className="text-gray-400">
              Panduan untuk menggunakan fitur scan struk
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <h3 className="font-medium">Cara Menggunakan:</h3>
            <ol className="space-y-2 text-gray-300 list-decimal list-inside">
              <li>Ambil foto struk dengan kamera atau unggah dari galeri</li>
              <li>Sistem akan mencoba mengenali teks dari struk</li>
              <li>Verifikasi dan edit hasil pengenalan jika diperlukan</li>
              <li>Sesuaikan item-item dan siapa saja yang ikut berbagi</li>
              <li>Simpan transaksi ke dalam sesi patungan</li>
            </ol>
            
            <h3 className="font-medium mt-4">Tips:</h3>
            <ul className="space-y-2 text-gray-300 list-disc list-inside">
              <li>Pastikan struk terlihat jelas dan tidak buram</li>
              <li>Hindari bayangan dan pencahayaan yang terlalu terang</li>
              <li>Jika hasil scan tidak akurat, Anda bisa mengedit secara manual</li>
              <li>Untuk setiap item, Anda bisa memilih siapa saja yang ikut membayar</li>
            </ul>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsHelpOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
