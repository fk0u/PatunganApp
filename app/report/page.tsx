"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Info, ArrowLeft, Trash2, ReceiptText } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Define a type for a saved session (must match the one in local-session/page.tsx)
interface SavedSession {
  id: string
  timestamp: number
  restaurantName: string
  totalAmount: number
  // You might include more details here if needed for the report,
  // but for simplicity, we'll just display basic info.
}

export default function ReportPage() {
  const [sessions, setSessions] = useState<SavedSession[]>([])

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = () => {
    const existingSessionsString = localStorage.getItem("moment_split_bill_sessions")
    const loadedSessions: SavedSession[] = existingSessionsString ? JSON.parse(existingSessionsString) : []
    // Sort by timestamp descending (most recent first)
    setSessions(loadedSessions.sort((a, b) => b.timestamp - a.timestamp))
  }

  const handleClearAllSessions = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua riwayat sesi? Tindakan ini tidak dapat dibatalkan.")) {
      localStorage.removeItem("moment_split_bill_sessions")
      setSessions([])
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

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
            <h1 className="text-2xl font-bold text-gray-800">Laporan Pengeluaran</h1>
            <p className="text-gray-600 text-sm">Riwayat sesi Anda</p>
          </div>
        </div>
      </motion.div>

      {sessions.length === 0 ? (
        <GlassCard className="p-6 text-center bg-blue-500/5 border-blue-200/50">
          <div className="flex items-center justify-center mb-4">
            <Info className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Belum Ada Sesi Tersimpan</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Sesi yang telah Anda finalisasi akan muncul di sini. Mulai dengan melakukan scan struk!
          </p>
          <Link href="/">
            <Button className="btn-primary">Scan Struk Sekarang</Button>
          </Link>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Riwayat Sesi Anda:</h3>
            <div className="space-y-3">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 glass-light rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <ReceiptText className="h-6 w-6 text-purple-600" />
                    <div>
                      <span className="font-medium text-gray-800">{session.restaurantName}</span>
                      <p className="text-sm text-gray-600">{formatDate(session.timestamp)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-lg text-gray-800">
                    Rp {session.totalAmount.toLocaleString("id-ID")}
                  </span>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          <Button
            variant="outline"
            onClick={handleClearAllSessions}
            className="w-full bg-red-500/5 border-red-200/50 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Hapus Semua Sesi
          </Button>
        </>
      )}

      <div className="text-center mt-8">
        <Link href="/">
          <Button className="btn-primary">Kembali ke Beranda</Button>
        </Link>
      </div>
    </div>
  )
}
