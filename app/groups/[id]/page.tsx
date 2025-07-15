"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { getGroupById, getGroupExpenses, getGroupEvents, generateDebtSimplification } from "@/lib/firestore"
import { Group, Expense, Event, DebtSimplification } from "@/lib/types"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Users, 
  ReceiptText, 
  Calendar, 
  PlusCircle,
  Calculator,
  ArrowLeftRight,
  UserPlus,
  Settings
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"

interface GroupPageProps {
  params: {
    id: string
  }
}

export default function GroupPage({ params }: GroupPageProps) {
  const [group, setGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [simplification, setSimplification] = useState<DebtSimplification | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("expenses")
  
  const { userData } = useAuth()
  const router = useRouter()
  const groupId = params.id
  
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        // Fetch group details
        const groupData = await getGroupById(groupId)
        if (!groupData) {
          toast.error("Group not found")
          router.push("/dashboard")
          return
        }
        
        setGroup(groupData)
        
        // Check if current user is a member
        const isMember = groupData.members.some(
          member => member.userId === userData?.id && member.status === 'active'
        )
        
        if (!isMember) {
          toast.error("You don't have access to this group")
          router.push("/dashboard")
          return
        }
        
        // Fetch expenses and events
        const [expensesData, eventsData] = await Promise.all([
          getGroupExpenses(groupId),
          getGroupEvents(groupId)
        ])
        
        setExpenses(expensesData)
        setEvents(eventsData)
      } catch (error) {
        console.error("Error fetching group data:", error)
        toast.error("Failed to load group data")
      } finally {
        setLoading(false)
      }
    }
    
    fetchGroupData()
  }, [groupId, router, userData?.id])
  
  const handleGenerateSimplification = async () => {
    try {
      const simplificationData = await generateDebtSimplification(groupId)
      setSimplification(simplificationData)
      
      if (!simplificationData) {
        toast.info("No debts to simplify in this group")
        return
      }
      
      toast.success("Debt simplification generated successfully")
    } catch (error) {
      console.error("Error generating debt simplification:", error)
      toast.error("Failed to generate debt simplification")
    }
  }
  
  const isAdmin = group?.members.some(
    member => member.userId === userData?.id && member.role === 'admin'
  )
  
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-7 w-40 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          <Skeleton className="h-[400px] w-full" />
        </div>
      </ProtectedRoute>
    )
  }
  
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          className="gap-2 p-0 h-auto font-normal"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Button>
        
        {/* Group Header */}
        <header className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{group?.name}</h1>
              <p className="text-muted-foreground">
                {group?.members.length} {group?.members.length === 1 ? 'member' : 'members'} · Created {group?.createdAt ? formatDistanceToNow(group.createdAt, { addSuffix: true }) : ''}
              </p>
            </div>
          </div>
          
          {isAdmin && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => router.push(`/groups/${groupId}/settings`)}>
              <Settings size={14} />
              <span>Manage</span>
            </Button>
          )}
        </header>
        
        {/* Description */}
        {group?.description && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm">{group.description}</p>
            </CardContent>
          </Card>
        )}
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="gap-2"
            onClick={() => router.push(`/groups/${groupId}/add-expense`)}
          >
            <PlusCircle size={16} />
            <span>Add Expense</span>
          </Button>
          
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/groups/${groupId}/invite`)}
          >
            <UserPlus size={16} />
            <span>Invite People</span>
          </Button>
        </div>
        
        {/* Group Content Tabs */}
        <Tabs 
          defaultValue="expenses" 
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
          
          {/* Expenses Tab */}
          <TabsContent value="expenses" className="mt-4 space-y-4">
            {expenses.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Recent Expenses</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1"
                    onClick={handleGenerateSimplification}
                  >
                    <Calculator size={14} />
                    <span>Simplify Debts</span>
                  </Button>
                </div>
                
                {expenses.map(expense => (
                  <Link key={expense.id} href={`/groups/${groupId}/expenses/${expense.id}`} className="block">
                    <Card className="transition-all hover:shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-base">{expense.title}</CardTitle>
                          <p className="font-medium">Rp {expense.amount.toLocaleString()}</p>
                        </div>
                        <CardDescription className="flex justify-between">
                          <span>Paid by {expense.paidBy === userData?.id ? 'you' : 'someone'}</span>
                          <span>{expense.participants.length} participants</span>
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="text-xs text-muted-foreground pt-0">
                        {formatDistanceToNow(expense.createdAt, { addSuffix: true })}
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
                
                {/* Debt Simplification Results */}
                {simplification && (
                  <Card className="bg-primary/5 border-primary/20 mt-6">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ArrowLeftRight size={16} />
                        Simplified Payments
                      </CardTitle>
                      <CardDescription>
                        Make these payments to settle all debts efficiently
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {simplification.suggestedTransactions.map((transaction, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-background rounded-md">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{transaction.fromUserId.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <ArrowLeftRight size={14} />
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{transaction.toUserId.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">Rp {transaction.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.fromUserId === userData?.id ? 'You pay' : 'Someone pays'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <ReceiptText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-medium text-lg mb-1">No expenses yet</h3>
                <p className="text-muted-foreground mb-4">Add your first expense to start tracking</p>
                <Button onClick={() => router.push(`/groups/${groupId}/add-expense`)}>
                  Add Expense
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Events Tab */}
          <TabsContent value="events" className="mt-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Upcoming & Past Events</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1"
                onClick={() => router.push(`/groups/${groupId}/create-event`)}
              >
                <PlusCircle size={14} />
                <span>Create Event</span>
              </Button>
            </div>
            
            {events.length > 0 ? (
              events.map(event => (
                <Link key={event.id} href={`/groups/${groupId}/events/${event.id}`} className="block">
                  <Card className="transition-all hover:shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{event.name}</CardTitle>
                        <Badge variant={event.status === 'active' ? 'default' : 
                                        event.status === 'planning' ? 'outline' : 
                                        event.status === 'completed' ? 'secondary' : 'destructive'}>
                          {event.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {format(event.startDate, 'PPP')}
                        {event.endDate && ` - ${format(event.endDate, 'PPP')}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-1">
                      <p className="text-sm line-clamp-1">{event.description || "No description"}</p>
                      {event.budget && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Budget: </span>
                          <span>Rp {event.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground pt-1">
                      {event.participants.length} participants
                    </CardFooter>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-10">
                <Calendar className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-medium text-lg mb-1">No events yet</h3>
                <p className="text-muted-foreground mb-4">Create your first event to start planning</p>
                <Button onClick={() => router.push(`/groups/${groupId}/create-event`)}>
                  Create Event
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Members Tab */}
          <TabsContent value="members" className="mt-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Group Members</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1"
                onClick={() => router.push(`/groups/${groupId}/invite`)}
              >
                <UserPlus size={14} />
                <span>Invite</span>
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {group?.members.map(member => (
                    <li key={member.userId} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{member.userId.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.userId === userData?.id ? 'You' : member.userId}
                            {member.userId === group.createdBy && (
                              <span className="ml-2 text-xs text-muted-foreground">(Creator)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {formatDistanceToNow(member.joinedAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                        {member.role}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
