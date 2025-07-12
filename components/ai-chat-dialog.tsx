"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"

interface AIChatDialogProps {
  onClose: () => void
}

export function AIChatDialog({ onClose }: AIChatDialogProps) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (input.trim() === "") return

    const userMessage = { role: "user" as const, content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      console.error("Error sending message to AI:", error)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Maaf, saya tidak dapat memproses permintaan Anda saat ini." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg">
      <DialogHeader className="mb-4">
        <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" /> AI Moment Chat
        </DialogTitle>
        <DialogDescription className="text-gray-600">
          Tanyakan apa saja tentang pembagian tagihan atau keuangan Anda.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto space-y-4 p-2 pr-4 custom-scrollbar">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <GlassCard
                className={cn(
                  "max-w-[80%] p-3 rounded-xl",
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none",
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </GlassCard>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <GlassCard className="max-w-[80%] p-3 rounded-xl bg-gray-100 text-gray-800 rounded-bl-none flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-600">Mengetik...</span>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DialogFooter className="mt-4 flex items-center gap-2">
        <Input
          placeholder="Ketik pesan Anda..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !isLoading) handleSendMessage()
          }}
          className="flex-1 input-glass"
          disabled={isLoading}
        />
        <Button onClick={handleSendMessage} disabled={isLoading || input.trim() === ""} className="btn-primary">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
