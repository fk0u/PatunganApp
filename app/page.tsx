"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wallet,
  Users,
  Scan,
  Sparkles,
  BarChart3,
  MessageSquare,
  Shield,
  Zap,
  ArrowRight,
  Play,
  Star,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { AuthModal } from "@/components/auth/AuthModal"
import { SpotlightPreview } from "@/components/ui/spotlight"
import { Highlight } from "@/components/ui/hero-highlight"
import { TextGenerateEffect } from "@/components/ui/text-effects"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const features = [
    {
      icon: <Scan className="h-6 w-6" />,
      title: "Smart Receipt Scanning",
      description: "Scan struk belanja dengan AI untuk pembagian otomatis yang akurat dan cepat"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Collaborative Splitting",
      description: "Ajak teman-teman untuk membagi tagihan secara real-time dengan mudah"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "AI Chat Assistant",
      description: "Tanya AI tentang keuangan dan dapatkan insight spending yang personal"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Smart Analytics",
      description: "Analisis pengeluaran dengan visualisasi data yang komprehensif"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Private",
      description: "Data Anda aman dengan enkripsi end-to-end dan privacy protection"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Proses pembagian tagihan dalam hitungan detik dengan teknologi terdepan"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager",
      avatar: "SC",
      text: "Patungan mengubah cara kami split bill. Sangat mudah dan akurat!"
    },
    {
      name: "Ahmad Rizki",
      role: "Software Engineer", 
      avatar: "AR",
      text: "AI-powered scanning benar-benar game changer. Highly recommended!"
    },
    {
      name: "Maya Sari",
      role: "Designer",
      avatar: "MS", 
      text: "UI/UX nya intuitive banget, fitur analytics juga sangat helpful."
    }
  ]

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <BackgroundBeams />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">Patungan</span>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setIsAuthModalOpen(true)}
          className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/20 transition-all"
        >
          Masuk / Daftar
        </motion.button>
      </nav>

      {/* Hero Section */}
      <SpotlightPreview className="pt-20 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-block">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/20 rounded-full px-4 py-2 mb-6 inline-block"
            >
              <span className="text-sm font-medium text-purple-300">
                ✨ Powered by AI • Trusted by 10,000+ Users
              </span>
            </motion.div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
            Split Bills Like a
            <br />
            <Highlight className="text-black dark:text-white">
              Pro with AI
            </Highlight>
          </h1>

          <TextGenerateEffect
            words="Scan, Split, dan Share tagihan dengan teknologi AI terdepan. Buat pengalaman patungan yang lebih smart dan efisien."
            className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
          />

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsAuthModalOpen(true)}
              className="group relative px-8 py-4 rounded-full font-semibold text-lg overflow-hidden"
              style={{
                background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
                boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)"
              }}
            >
              <span className="relative z-10 flex items-center">
                Mulai Gratis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-8 py-4 border border-white/20 rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
            >
              <Play className="mr-2 h-5 w-5" />
              Lihat Demo
            </motion.button>
          </div>
        </motion.div>
      </SpotlightPreview>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Fitur Yang Memukau
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Teknologi terdepan untuk pengalaman split bill yang tak tertandingi
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="group relative p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
                <div className="rounded-2xl absolute inset-0 pointer-events-none z-[-1] overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                  <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                  <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-20 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Dipercaya Pengguna
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Lihat apa kata mereka tentang Patungan
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.text}"</p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(120deg, rgba(139, 92, 246, 0.15), rgba(34, 211, 238, 0.15))",
              boxShadow: "0 0 40px rgba(139, 92, 246, 0.1)",
              border: "1px solid rgba(139, 92, 246, 0.2)"
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(139,92,246,0.1),transparent_70%)]"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Siap Mengubah Cara Split Bill?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Bergabung dengan ribuan pengguna yang sudah merasakan kemudahan Patungan
              </p>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsAuthModalOpen(true)}
                className="group relative px-8 py-4 rounded-full font-semibold text-lg overflow-hidden"
                style={{
                  background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
                  boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)"
                }}
              >
                <span className="relative z-10 flex items-center">
                  Daftar Sekarang - Gratis!
                  <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 md:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Patungan</span>
            </div>
            
            <div className="flex items-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; 2025 Patungan. Made with ❤️ for better financial collaboration.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  )
}
