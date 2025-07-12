"use client"

import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Dialog } from "@/components/ui/dialog"
import { AIChatDialog } from "@/components/ai-chat-dialog" // Import the AI Chat Dialog

export default function ChatPage() {
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
            <h1 className="text-2xl font-bold text-gray-800">AI Chat</h1>
            <p className="text-gray-600 text-sm">Ngobrol dengan AI Moment</p>
          </div>
        </div>
      </motion.div>

      {/* AI Chat rendered inside a Dialog root so DialogContent has the correct context */}
      <Dialog open>
        <AIChatDialog onClose={() => {}} />
      </Dialog>
    </div>
  )
}
