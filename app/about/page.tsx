"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Sparkles, Users, ReceiptText, BarChart2 } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="h-5 w-5" />
            <span>Kembali</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tentang Kami</h1>
            <p className="text-gray-600 text-sm">Mengenal Patungan lebih dekat</p>
          </div>
        </div>
      </motion.div>

      <GlassCard className="p-6 text-center bg-purple-500/5 border-purple-200/50">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="h-12 w-12 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">Selamat Datang di Patungan!</h2>
        <p className="text-gray-700 leading-relaxed">
          Patungan adalah aplikasi inovatif yang dirancang untuk menyederhanakan proses pembagian tagihan dan pelacakan
          pengeluaran sosial Anda. Kami percaya bahwa mengelola keuangan bersama teman atau keluarga seharusnya mudah
          dan menyenangkan.
        </p>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Fitur Utama Kami:</h3>
        <ul className="space-y-4">
          <li className="flex items-start space-x-3">
            <ReceiptText className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium text-gray-800">Scan Struk Cerdas</h4>
              <p className="text-sm text-gray-600">
                Manfaatkan kekuatan AI Gemini untuk secara otomatis mengekstrak detail item, harga, pajak, dan total
                dari foto struk Anda.
              </p>
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <Users className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium text-gray-800">Pembagian Fleksibel</h4>
              <p className="text-sm text-gray-600">
                Mudah mengklaim item personal atau membagi item yang bisa dibagi dengan porsi yang disesuaikan antar
                peserta.
              </p>
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <BarChart2 className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium text-gray-800">Laporan Pengeluaran (Segera Hadir)</h4>
              <p className="text-sm text-gray-600">
                Dapatkan wawasan tentang kebiasaan pengeluaran Anda dengan laporan dan analisis yang komprehensif.
              </p>
            </div>
          </li>
        </ul>
      </GlassCard>

      <GlassCard className="p-6 text-center bg-blue-500/5 border-blue-200/50">
        <h3 className="font-bold text-gray-800 mb-3">Misi Kami</h3>
        <p className="text-gray-700 leading-relaxed">
          Misi kami adalah menghilangkan kerumitan dalam mengelola pengeluaran kelompok, memungkinkan Anda untuk fokus
          pada momen-momen berharga bersama orang-orang terdekat.
        </p>
      </GlassCard>

      <div className="text-center mt-8">
        <Link href="/">
          <Button className="btn-primary">Mulai Gunakan Patungan</Button>
        </Link>
      </div>
    </div>
  )
}
