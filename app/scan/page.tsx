"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  FlipCameraIcon, 
  ImageIcon, 
  Loader2, 
  ArrowLeft,
  Upload,
  RefreshCw,
  Banknote,
  PlusCircle,
  ReceiptText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { recognizeText, type OCRResult } from '@/lib/ocrService';

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [hasCamera, setHasCamera] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);
  
  const startCamera = useCallback(async () => {
    try {
      setIsCameraOpen(true);
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode }
        });
        
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCamera(false);
      toast.error('Tidak dapat mengakses kamera');
    }
  }, [facingMode]);
  
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);
  
  const flipCamera = useCallback(() => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    stopCamera();
    setFacingMode(newMode);
    setTimeout(() => {
      startCamera();
    }, 300);
  }, [facingMode, startCamera, stopCamera]);
  
  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame on canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to image
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageDataUrl);
        
        // Stop camera
        stopCamera();
      }
      
      setIsCapturing(false);
    }
  }, [stopCamera]);
  
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setOcrResult(null);
    setIsRecognizing(false);
    startCamera();
  }, [startCamera]);
  
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setUploadedImage(result);
        setCapturedImage(result);
        if (isCameraOpen) {
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  }, [isCameraOpen, stopCamera]);
  
  const processReceipt = useCallback(async () => {
    if (!capturedImage) return;
    
    setIsRecognizing(true);
    
    try {
      // Use our real OCR service
      const result = await recognizeText(capturedImage);
      setOcrResult(result);
      
      toast.success('Teks berhasil dikenali!');
    } catch (error) {
      console.error('Error recognizing text:', error);
      toast.error('Gagal mengenali teks');
    } finally {
      setIsRecognizing(false);
    }
  }, [capturedImage]);
  
  const handleManualAdd = useCallback((index: number, field: 'name' | 'price' | 'quantity', value: string | number) => {
    if (!ocrResult) return;
    
    const updatedItems = [...(ocrResult.items || [])];
    
    if (field === 'name') {
      updatedItems[index] = { ...updatedItems[index], name: value as string };
    } else if (field === 'price') {
      updatedItems[index] = { ...updatedItems[index], price: parseFloat(value as string) };
    } else if (field === 'quantity') {
      updatedItems[index] = { ...updatedItems[index], quantity: parseFloat(value as string) };
    }
    
    setOcrResult({
      ...ocrResult,
      items: updatedItems,
      total: updatedItems.reduce((sum, item) => sum + item.price, 0)
    });
  }, [ocrResult]);
  
  const addNewItem = useCallback(() => {
    if (!ocrResult) return;
    
    const newItem = {
      name: '',
      price: 0,
      quantity: 1
    };
    
    setOcrResult({
      ...ocrResult,
      items: [...(ocrResult.items || []), newItem]
    });
  }, [ocrResult]);
  
  const removeItem = useCallback((index: number) => {
    if (!ocrResult || !ocrResult.items) return;
    
    const updatedItems = [...ocrResult.items];
    updatedItems.splice(index, 1);
    
    setOcrResult({
      ...ocrResult,
      items: updatedItems,
      total: updatedItems.reduce((sum, item) => sum + item.price, 0)
    });
  }, [ocrResult]);
  
  const saveAndContinue = useCallback(() => {
    if (!ocrResult) {
      toast.error('Tidak ada data hasil scan');
      return;
    }
    
    // Simpan data untuk mode lokal
    const localReceiptData = {
      restaurant_info: {
        name: ocrResult.merchant || 'Toko',
        date: ocrResult.date || new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      },
      items: ocrResult.items ? ocrResult.items.map(item => ({
        name: item.name,
        quantity: item.quantity || 1,
        unit_price: item.price,
        total_price: (item.quantity || 1) * item.price,
        category_guess: 'other',
        sharing_potential: 0.5
      })) : [],
      summary: {
        subtotal: ocrResult.total || 0,
        total: ocrResult.total || 0
      }
    };
    
    // Simpan ke session storage
    sessionStorage.setItem('localReceiptData', JSON.stringify(localReceiptData));
    
    // Langsung navigasi ke halaman local-session
    router.push('/local-session');
  }, [ocrResult, router]);
  
  useEffect(() => {
    if (!isCameraOpen && !capturedImage && !ocrResult) {
      startCamera();
    }
    
    return () => {
      if (isCameraOpen) {
        stopCamera();
      }
    };
  }, [isCameraOpen, capturedImage, ocrResult, startCamera, stopCamera]);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
            className="rounded-full bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Scan Struk</h1>
          <div className="w-10" />
        </div>
        
        <AnimatePresence mode="wait">
          {/* Camera View */}
          {isCameraOpen && !capturedImage && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <div className="relative w-full bg-black rounded-xl overflow-hidden aspect-[3/4]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Camera controls */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full bg-black/50 backdrop-blur-sm"
                    onClick={flipCamera}
                  >
                    <FlipCameraIcon className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-16 h-16 rounded-full bg-white border-4 border-gray-800"
                    onClick={captureImage}
                    disabled={isCapturing}
                  >
                    {isCapturing ? (
                      <Loader2 className="h-8 w-8 text-black animate-spin" />
                    ) : (
                      <Camera className="h-8 w-8 text-black" />
                    )}
                  </Button>
                  
                  <label className="cursor-pointer">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="rounded-full bg-black/50 backdrop-blur-sm"
                      type="button"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      aria-label="Upload image from gallery"
                    />
                  </label>
                </div>
                
                {!hasCamera && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                    <p className="text-center mb-4">Kamera tidak tersedia</p>
                    <label className="cursor-pointer">
                      <Button variant="secondary">
                        <Upload className="h-5 w-5 mr-2" />
                        Unggah Gambar
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-400 text-center mt-2">
                Posisikan struk dalam bingkai dan pastikan tulisan dapat terbaca dengan jelas
              </p>
            </motion.div>
          )}
          
          {/* Captured Image View */}
          {capturedImage && !ocrResult && (
            <motion.div
              key="capturedImage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <div className="relative w-full bg-black rounded-xl overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full object-contain max-h-[70vh]"
                />
              </div>
              
              <div className="flex justify-center space-x-4 mt-6">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="border-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ambil Ulang
                </Button>
                
                <Button
                  onClick={processReceipt}
                  disabled={isRecognizing}
                  className="bg-gradient-to-r from-purple-500 to-blue-500"
                >
                  {isRecognizing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Kenali Teks'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Recognition Result View */}
          {ocrResult && (
            <motion.div
              key="ocrResult"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <div className="flex space-x-4 mb-4">
                <div className="w-1/3">
                  <img
                    src={capturedImage!}
                    alt="Receipt"
                    className="w-full rounded-xl object-cover"
                  />
                  
                  <div className="mt-4 bg-gray-900 rounded-xl p-3">
                    <h3 className="text-sm font-medium mb-2">Info Struk:</h3>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-400">Tanggal</p>
                        <p className="text-sm">{ocrResult.date || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-400">Toko</p>
                        <p className="text-sm">{ocrResult.merchant || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="w-2/3 bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Detail Belanja:</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={addNewItem}
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      Tambah Item
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
                    {ocrResult.items && ocrResult.items.length > 0 ? (
                      ocrResult.items.map((item, index) => (
                        <div 
                          key={index} 
                          className="bg-gray-800 rounded-lg p-3 flex flex-col"
                        >
                          <div className="flex justify-between mb-2">
                            <Input
                              value={item.name}
                              onChange={(e) => handleManualAdd(index, 'name', e.target.value)}
                              className="bg-gray-700 border-0 text-sm flex-1 mr-2"
                              placeholder="Nama item"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-white"
                              onClick={() => removeItem(index)}
                            >
                              &times;
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2 items-center">
                              <Input
                                type="number"
                                value={item.quantity?.toString() || "1"}
                                onChange={(e) => handleManualAdd(index, 'quantity', e.target.value)}
                                className="bg-gray-700 border-0 text-sm w-16"
                                min="0.1"
                                step="0.1"
                              />
                              <span className="text-gray-400 text-sm">×</span>
                            </div>
                            
                            <div className="flex items-center">
                              <span className="text-gray-400 text-sm mr-2">Rp</span>
                              <Input
                                type="number"
                                value={item.price.toString()}
                                onChange={(e) => handleManualAdd(index, 'price', e.target.value)}
                                className="bg-gray-700 border-0 text-sm w-28"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                        <ReceiptText className="h-12 w-12 mb-3 opacity-20" />
                        <p>Tidak ada item terdeteksi</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={addNewItem}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Tambah Item Manual
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {ocrResult && ocrResult.items && ocrResult.items.length > 0 && (
                    <div className="flex justify-between font-bold mt-4 py-3 border-t border-gray-700">
                      <span>Total</span>
                      <span>
                        {parseFloat((ocrResult.total || 0).toString()).toLocaleString('id-ID', { 
                          style: 'currency', 
                          currency: 'IDR', 
                          minimumFractionDigits: 0 
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center space-x-4 mt-6">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="border-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan Baru
                </Button>
                
                <Button
                  onClick={saveAndContinue}
                  className="bg-gradient-to-r from-purple-500 to-blue-500"
                  disabled={!ocrResult || !ocrResult.items || ocrResult.items.length === 0}
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Lanjutkan Pembagian
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Hidden Canvas for Image Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
