"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Sparkles, Plus, List, MoreVertical, Trash2, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { useChat } from "@/contexts/ChatContext"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface AIChatDialogProps {
  onClose: () => void
}

export function AIChatDialog({ onClose }: AIChatDialogProps) {
  const { 
    chatSessions, 
    currentSession, 
    currentMessages, 
    loadingSessions, 
    loadingMessages, 
    sendingMessage, 
    createChatSession, 
    setActiveSession, 
    sendMessage,
    archiveChatSession
  } = useChat()
  
  const [input, setInput] = useState("")
  
  // Create a new session on mount if no sessions exist or none are active
  useEffect(() => {
    const initializeChat = async () => {
      if (!currentSession) {
        if (chatSessions.length === 0) {
          // Create a new session
          const newSession = await createChatSession("New Conversation")
          await setActiveSession(newSession.id)
        } else {
          // Set the most recent session as active
          await setActiveSession(chatSessions[0].id)
        }
      }
    }
    
    initializeChat()
  }, [chatSessions, currentSession, createChatSession, setActiveSession])

  const handleSendMessage = async () => {
    if (input.trim() === "" || !currentSession || sendingMessage) return

    const content = input.trim()
    setInput("")
    
    await sendMessage(content)
  }
  
  const handleNewChat = async () => {
    const newSession = await createChatSession("New Conversation")
    await setActiveSession(newSession.id)
    setInput("")
  }
  
  const handleSessionClick = async (sessionId: string) => {
    await setActiveSession(sessionId)
  }
  
  const handleArchiveSession = async (sessionId: string) => {
    await archiveChatSession(sessionId)
    
    // If this was the current session, create a new one
    if (currentSession?.id === sessionId) {
      const newSession = await createChatSession("New Conversation")
      await setActiveSession(newSession.id)
    }
  }

  return (
    <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg">
      <DialogHeader className="mb-4">
        <div className="flex items-center justify-between">
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" /> AI Moment Chat
          </DialogTitle>
          
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <List className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between py-2">
                    <h3 className="text-lg font-semibold">Chat History</h3>
                    <Button onClick={handleNewChat} variant="ghost" size="sm" className="flex items-center gap-1">
                      <Plus className="h-4 w-4" /> New Chat
                    </Button>
                  </div>
                  
                  <ScrollArea className="flex-1 mt-4">
                    {loadingSessions ? (
                      <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {chatSessions.map((session) => (
                          <div 
                            key={session.id}
                            className={cn(
                              "p-3 rounded-lg cursor-pointer flex items-center justify-between group",
                              currentSession?.id === session.id 
                                ? "bg-blue-50 border border-blue-200" 
                                : "hover:bg-gray-50 border border-transparent"
                            )}
                            onClick={() => handleSessionClick(session.id)}
                          >
                            <div className="flex-1 overflow-hidden">
                              <h4 className="font-medium text-sm truncate">{session.title}</h4>
                              {session.lastMessage && (
                                <p className="text-xs text-gray-500 truncate mt-1">{session.lastMessage}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {format(new Date(session.updatedAt), 'MMM d, h:mm a')}
                              </p>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleArchiveSession(session.id)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                        
                        {chatSessions.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-40 text-center">
                            <Clock className="h-8 w-8 text-gray-300 mb-2" />
                            <p className="text-gray-500">No chat history yet</p>
                            <p className="text-xs text-gray-400 mt-1">Start a new conversation</p>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
            
            <Button onClick={handleNewChat} variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DialogDescription className="text-gray-600">
          Tanyakan apa saja tentang pembagian tagihan atau keuangan Anda.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto space-y-4 p-2 pr-4 custom-scrollbar">
        <AnimatePresence>
          {loadingMessages ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : currentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
              <Sparkles className="h-12 w-12 text-purple-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">Bagaimana saya bisa membantu?</h3>
              <p className="text-sm text-gray-500 max-w-xs mt-2">
                Tanyakan tentang cara terbaik berbagi tagihan, subscription, atau tips pengelolaan keuangan grup
              </p>
            </div>
          ) : (
            currentMessages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}
              >
                <GlassCard
                  className={cn(
                    "max-w-[80%] p-3 rounded-xl",
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none",
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.createdAt && (
                    <p className="text-xs opacity-70 mt-1 text-right">
                      {format(new Date(msg.createdAt), 'h:mm a')}
                    </p>
                  )}
                </GlassCard>
              </motion.div>
            ))
          )}
          {sendingMessage && (
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
            if (e.key === "Enter" && !sendingMessage) handleSendMessage()
          }}
          className="flex-1 input-glass"
          disabled={sendingMessage || !currentSession}
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={sendingMessage || input.trim() === "" || !currentSession} 
          className="btn-primary"
        >
          {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
