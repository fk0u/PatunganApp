"use client"
import { useState } from "react"
import { Play, ArrowLeft, Zap, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0)

  const demoSteps = [
    {
      title: "Upload Struk",
      description: "Pengguna mengupload foto struk dari restoran",
      image: "/placeholder.svg?height=300&width=400",
      details: "AI Gemini langsung memproses gambar dan mengekstrak semua informasi dalam hitungan detik",
    },
    {
      title: "AI Processing",
      description: "AI menganalisis dan mengkategorikan setiap item",
      image: "/placeholder.svg?height=300&width=400",
      details:
        "Sistem mendeteksi item yang bisa dibagi vs item personal, menghitung pajak, dan menyiapkan interface interaktif",
    },
    {
      title: "Live Collaboration",
      description: "Semua teman bergabung dan mengklaim item mereka",
      image: "/placeholder.svg?height=300&width=400",
      details: "Real-time synchronization memungkinkan semua orang melihat perubahan secara langsung",
    },
    {
      title: "Smart Settlement",
      description: "Aplikasi menghitung siapa berutang berapa",
      image: "/placeholder.svg?height=300&width=400",
      details: "Hasil akhir yang transparan dengan opsi untuk menyalin info pembayaran",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
            <span>Kembali</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Patungan
            </span>
          </div>
        </nav>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Demo Interaktif</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Lihat bagaimana Patungan mengubah pengalaman split bill Anda dari yang merepotkan menjadi menyenangkan
            </p>
          </div>

          {/* Demo Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2 bg-white rounded-lg p-2 shadow-lg">
              {demoSteps.map((step, index) => (
                <Button
                  key={index}
                  variant={currentStep === index ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentStep(index)}
                  className={currentStep === index ? "bg-gradient-to-r from-purple-600 to-blue-600" : ""}
                >
                  {index + 1}. {step.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Demo Content */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Demo Visual */}
            <div className="order-2 lg:order-1">
              <Card className="overflow-hidden shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Demo: {demoSteps[currentStep].title}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Demo Description */}
            <div className="order-1 lg:order-2 space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-4">{demoSteps[currentStep].title}</h2>
                <p className="text-lg text-gray-600 mb-4">{demoSteps[currentStep].description}</p>
                <p className="text-gray-700">{demoSteps[currentStep].details}</p>
              </div>

              {/* Step Indicators */}
              <div className="flex space-x-2">
                {demoSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-8 rounded-full transition-colors ${
                      index === currentStep ? "bg-gradient-to-r from-purple-600 to-blue-600" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  Sebelumnya
                </Button>
                <Button
                  onClick={() => setCurrentStep(Math.min(demoSteps.length - 1, currentStep + 1))}
                  disabled={currentStep === demoSteps.length - 1}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </div>

          {/* Key Features Highlight */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Fitur Unggulan</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <Zap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle>AI-Powered OCR</CardTitle>
                  <CardDescription>
                    Teknologi Gemini AI membaca struk dengan akurasi tinggi dalam hitungan detik
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle>Real-time Collaboration</CardTitle>
                  <CardDescription>
                    Semua peserta dapat berinteraksi secara bersamaan tanpa konflik atau delay
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <TrendingUp className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                  <CardTitle>Smart Analytics</CardTitle>
                  <CardDescription>
                    Lacak pola pengeluaran sosial dan dapatkan insights untuk budgeting yang lebih baik
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <CardContent className="py-12">
                <h2 className="text-3xl font-bold mb-4">Siap Mencoba Patungan?</h2>
                <p className="text-xl mb-6 opacity-90">Mulai pengalaman split bill yang revolusioner sekarang juga</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/scan">
                    <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
                      Mulai Sekarang
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-3 text-lg border-white text-white hover:bg-white hover:text-purple-600 bg-transparent"
                  >
                    Pelajari Lebih Lanjut
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
