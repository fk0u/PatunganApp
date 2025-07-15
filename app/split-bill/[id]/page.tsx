"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  ChevronDown, 
  DollarSign, 
  ListPlus, 
  MessageCircleMore,
  Plus, 
  Receipt, 
  Send,
  Share, 
  User,
  Users 
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FloatingNavWrapper, FloatingNav } from "@/components/floating-nav"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useSession, Session, ExpenseItem, Participant, Transaction } from "@/contexts/SessionContext"
import { useChat } from "@/contexts/ChatContext"
import { CircleSpinner } from "@/components/ui/spinner"
import { formatDistanceToNow, format } from "date-fns"

interface ChatMessageProps {
  content: string
  sender: 'user' | 'assistant'
  timestamp: number
  userName: string
  userPhotoURL?: string
}

function ChatMessage({ content, sender, timestamp, userName, userPhotoURL }: ChatMessageProps) {
  const isUser = sender === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src="/placeholder-logo.png" alt="Assistant" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div className={`rounded-lg p-3 max-w-[75%] ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
        <p className="text-sm">{content}</p>
        <p className="text-xs mt-1 opacity-70">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </p>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 ml-2">
          <AvatarImage src={userPhotoURL || ''} alt={userName} />
          <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

function ExpenseItemCard({ item, session }: { item: ExpenseItem, session: Session }) {
  const payer = session.participants.find(p => p.id === item.paidBy)
  
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.description}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">${(item.amount * item.quantity).toFixed(2)}</p>
            <p className="text-xs text-gray-500">
              {item.quantity > 1 ? `${item.quantity} × $${item.amount.toFixed(2)}` : ''}
            </p>
          </div>
        </div>
        
        <div className="mt-3 flex items-center text-sm text-gray-500">
          <span>Paid by: </span>
          <Avatar className="h-5 w-5 ml-2 mr-1">
            <AvatarImage src={payer?.photoURL || ''} alt={payer?.name || 'Unknown'} />
            <AvatarFallback>{payer?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <span>{payer?.name || 'Unknown'}</span>
        </div>
        
        <div className="mt-2">
          <p className="text-xs text-gray-500">Shared by ({item.sharedBy.length}):</p>
          <div className="flex mt-1">
            {item.sharedBy.map(participantId => {
              const participant = session.participants.find(p => p.id === participantId)
              return (
                <Avatar key={participantId} className="h-6 w-6 -ml-1 first:ml-0 border border-white">
                  <AvatarImage src={participant?.photoURL || ''} alt={participant?.name || 'Unknown'} />
                  <AvatarFallback>{participant?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TransactionCard({ transaction, session }: { transaction: Transaction, session: Session }) {
  const fromUser = session.participants.find(p => p.id === transaction.from)
  const toUser = session.participants.find(p => p.id === transaction.to)
  
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src={fromUser?.photoURL || ''} alt={fromUser?.name || 'Unknown'} />
              <AvatarFallback>{fromUser?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <ArrowLeft className="h-4 w-4 mx-2" />
            <Avatar className="h-8 w-8">
              <AvatarImage src={toUser?.photoURL || ''} alt={toUser?.name || 'Unknown'} />
              <AvatarFallback>{toUser?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </div>
          <Badge 
            variant={transaction.status === 'completed' ? 'outline' : 'default'}
            className={transaction.status === 'completed' 
              ? 'bg-green-100 text-green-700 hover:bg-green-100' 
              : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
            }
          >
            {transaction.status === 'completed' ? 'Paid' : 'Pending'}
          </Badge>
        </div>
        
        <div className="mt-3 flex justify-between">
          <div>
            <p className="text-sm text-gray-500">
              {fromUser?.name || 'Unknown'} pays {toUser?.name || 'Unknown'}
            </p>
            {transaction.method && (
              <p className="text-xs text-gray-500">Method: {transaction.method}</p>
            )}
          </div>
          <p className="font-bold">${transaction.amount.toFixed(2)}</p>
        </div>
        
        {transaction.notes && (
          <p className="mt-2 text-sm italic text-gray-500">{transaction.notes}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function SplitBillDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    getSessionById, 
    calculateSplits, 
    addExpenseItem, 
    recordTransaction, 
    updateTransactionStatus,
    settleSession,
    listenToSession
  } = useSession()
  const { 
    messages, 
    loading: chatLoading, 
    sendMessage, 
    listenToSessionMessages 
  } = useChat()
  const { toast } = useToast()
  
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [activeTab, setActiveTab] = useState("expenses")
  
  // Fetch session data
  useEffect(() => {
    async function fetchSession() {
      try {
        setLoading(true)
        const sessionData = await getSessionById(params.id)
        setSession(sessionData)
        
        if (sessionData) {
          // Setup real-time listener
          const unsubscribe = listenToSession(params.id, (updatedSession) => {
            if (updatedSession) {
              setSession(updatedSession)
            }
          })
          
          // Listen to chat messages
          const chatUnsubscribe = listenToSessionMessages(params.id)
          
          // Calculate splits if there are expense items
          if (sessionData.expenseItems.length > 0) {
            calculateSplits(params.id).then(setTransactions)
          }
          
          return () => {
            unsubscribe()
            chatUnsubscribe()
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error)
        toast({
          title: "Error",
          description: "Failed to load split bill details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchSession()
  }, [params.id])
  
  // Handle sending chat message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session) return
    
    try {
      await sendMessage(newMessage, session.id)
      setNewMessage("")
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }
  
  // Handle settling the bill
  const handleSettleBill = async () => {
    if (!session) return
    
    try {
      await settleSession(session.id)
      toast({
        title: "Bill settled",
        description: "The split bill has been marked as settled",
      })
    } catch (error) {
      console.error('Error settling bill:', error)
      toast({
        title: "Error",
        description: "Failed to settle the bill",
        variant: "destructive",
      })
    }
  }
  
  // Handle updating transaction status
  const handleUpdateTransactionStatus = async (transactionId: string, status: 'completed' | 'cancelled') => {
    if (!session) return
    
    try {
      await updateTransactionStatus(session.id, transactionId, status)
      toast({
        title: "Transaction updated",
        description: `Transaction has been marked as ${status}`,
      })
      
      // Refresh transactions
      const updatedTransactions = await calculateSplits(session.id)
      setTransactions(updatedTransactions)
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      })
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircleSpinner size="lg" />
      </div>
    )
  }
  
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-2">Session not found</h1>
        <p className="text-gray-500 mb-6">The split bill session you're looking for doesn't exist</p>
        <Button onClick={() => router.push('/split-bill')}>
          Back to Split Bills
        </Button>
      </div>
    )
  }
  
  const userParticipant = session.participants.find(p => p.id === user?.uid)
  
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/split-bill')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{session.name}</h1>
            <p className="text-sm text-gray-500">
              Created {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Badge 
            variant={session.isSettled ? "outline" : "default"}
            className={session.isSettled 
              ? "bg-gray-100 text-gray-500 hover:bg-gray-100" 
              : "bg-blue-100 text-blue-700 hover:bg-blue-100"
            }
          >
            {session.isSettled ? "Settled" : "Active"}
          </Badge>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8">
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
            {!session.isSettled && (
              <Button variant="default" size="sm" className="h-8" onClick={handleSettleBill}>
                <DollarSign className="h-4 w-4 mr-1" />
                Settle
              </Button>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Session Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Total Amount</h2>
            <p className="text-2xl font-bold">${session.totalAmount.toFixed(2)}</p>
          </div>
          
          <Separator className="my-3" />
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-700">Participants</span>
              </div>
              <span className="text-sm font-medium">{session.participants.length}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Receipt className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-700">Expense Items</span>
              </div>
              <span className="text-sm font-medium">{session.expenseItems.length}</span>
            </div>
            
            {session.location && (
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ListPlus className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-700">Location</span>
                </div>
                <span className="text-sm font-medium">{session.location}</span>
              </div>
            )}
            
            {session.eventDate && (
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ListPlus className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-700">Date</span>
                </div>
                <span className="text-sm font-medium">
                  {format(new Date(session.eventDate), 'PPP')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs defaultValue="expenses" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>
        
        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          {session.expenseItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <h3 className="font-medium mb-1">No expenses yet</h3>
              <p className="text-sm">Add your first expense to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {session.expenseItems.map((item) => (
                <ExpenseItemCard key={item.id} item={item} session={session} />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <h3 className="font-medium mb-1">No transactions yet</h3>
              <p className="text-sm">Add expenses to see how payments should be split</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} session={session} />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <div className="bg-white rounded-lg p-4 h-[400px] overflow-y-auto flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <MessageCircleMore className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="font-medium mb-1">No messages yet</h3>
                  <p className="text-sm text-gray-500">Start a conversation about this split bill</p>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    content={message.content}
                    sender={message.sender}
                    timestamp={message.timestamp}
                    userName={message.userName || 'User'}
                    userPhotoURL={message.userPhotoURL}
                  />
                ))}
                {chatLoading && (
                  <div className="flex justify-center my-4">
                    <CircleSpinner size="sm" />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex">
            <Input
              placeholder="Ask a question about this split bill..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="mr-2"
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim() || chatLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Floating Action Button */}
      {!session.isSettled && activeTab === "expenses" && (
        <FloatingNavWrapper>
          <FloatingNav>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md rounded-full px-6"
            >
              <div onClick={() => router.push(`/split-bill/${session.id}/add-expense`)}>
                <Plus className="h-5 w-5 mr-2" />
                Add Expense
              </div>
            </Button>
          </FloatingNav>
        </FloatingNavWrapper>
      )}
    </div>
  )
}
