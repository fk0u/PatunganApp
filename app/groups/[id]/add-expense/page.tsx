"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { getGroupById, createExpense } from "@/lib/firestore"
import { Group, ExpenseParticipant } from "@/lib/types"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, ReceiptText, Divide, User, Users } from "lucide-react"

interface AddExpensePageProps {
  params: {
    id: string
  }
}

export default function AddExpensePage({ params }: AddExpensePageProps) {
  const [group, setGroup] = useState<Group | null>(null)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [splitMethod, setSplitMethod] = useState("equal")
  const [participants, setParticipants] = useState<ExpenseParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
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
        
        // Initialize participants with all group members
        const initialParticipants = groupData.members
          .filter(member => member.status === 'active')
          .map(member => ({
            userId: member.userId,
            share: 0, // Will be calculated later
            status: 'pending'
          }))
        
        setParticipants(initialParticipants)
      } catch (error) {
        console.error("Error fetching group data:", error)
        toast.error("Failed to load group data")
      } finally {
        setLoading(false)
      }
    }
    
    fetchGroupData()
  }, [groupId, router, userData?.id])
  
  // Calculate shares based on split method
  useEffect(() => {
    if (!participants.length || !amount) return
    
    const totalAmount = parseFloat(amount)
    if (isNaN(totalAmount)) return
    
    const activeParticipants = participants.filter(p => p.status !== 'paid')
    
    if (splitMethod === "equal") {
      // Equal split
      const perPersonAmount = totalAmount / activeParticipants.length
      
      setParticipants(prev => 
        prev.map(participant => ({
          ...participant,
          share: activeParticipants.some(p => p.userId === participant.userId)
            ? parseFloat(perPersonAmount.toFixed(2))
            : 0
        }))
      )
    } else {
      // Custom split - just initialize with zeros, user will set values
      setParticipants(prev => 
        prev.map(participant => ({
          ...participant,
          share: activeParticipants.some(p => p.userId === participant.userId) ? 0 : 0
        }))
      )
    }
  }, [splitMethod, amount, participants.length])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error("Please enter an expense title")
      return
    }
    
    const totalAmount = parseFloat(amount)
    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    
    // Validate that custom split adds up to total
    if (splitMethod === "custom") {
      const totalShares = participants
        .reduce((sum, participant) => sum + participant.share, 0)
      
      if (Math.abs(totalShares - totalAmount) > 0.01) {
        toast.error("The sum of all shares must equal the total amount")
        return
      }
    }
    
    setSubmitting(true)
    
    try {
      // Create the expense
      await createExpense({
        groupId,
        title,
        amount: totalAmount,
        category: category || undefined,
        participants
      })
      
      toast.success("Expense added successfully!")
      router.push(`/groups/${groupId}`)
    } catch (error: any) {
      console.error("Error adding expense:", error)
      toast.error(error.message || "Failed to add expense")
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleCustomShareChange = (userId: string, shareAmount: string) => {
    const share = parseFloat(shareAmount)
    
    setParticipants(prev => 
      prev.map(participant => 
        participant.userId === userId
          ? { ...participant, share: isNaN(share) ? 0 : share }
          : participant
      )
    )
  }
  
  const toggleParticipant = (userId: string, isIncluded: boolean) => {
    setParticipants(prev => 
      prev.map(participant => 
        participant.userId === userId
          ? { ...participant, status: isIncluded ? 'pending' : 'paid' }
          : participant
      )
    )
  }
  
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          className="gap-2 p-0 h-auto font-normal"
          onClick={() => router.push(`/groups/${groupId}`)}
        >
          <ArrowLeft size={16} />
          <span>Back to Group</span>
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText size={20} className="text-primary" />
              Add New Expense
            </CardTitle>
            <CardDescription>
              Record an expense for {group?.name}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Expense Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Dinner, Groceries, Movie tickets"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount (Rp)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  placeholder="e.g., Food, Transportation, Entertainment"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <Label>How should this be split?</Label>
                
                <RadioGroup 
                  value={splitMethod} 
                  onValueChange={setSplitMethod}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="equal" id="equal" />
                    <Label htmlFor="equal" className="flex items-center gap-2 cursor-pointer">
                      <Divide size={16} />
                      <span>Split equally</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="flex items-center gap-2 cursor-pointer">
                      <Users size={16} />
                      <span>Custom amounts</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <Label>Who's involved?</Label>
                
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-4">
                    {participants.map(participant => (
                      <div key={participant.userId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            id={`participant-${participant.userId}`} 
                            checked={participant.status === 'pending'}
                            onCheckedChange={(checked) => 
                              toggleParticipant(participant.userId, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={`participant-${participant.userId}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <User size={16} />
                            <span>
                              {participant.userId === userData?.id ? 'You' : participant.userId}
                            </span>
                          </Label>
                        </div>
                        
                        {splitMethod === "custom" && participant.status === 'pending' && (
                          <div className="w-24">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={participant.share || ""}
                              onChange={(e) => 
                                handleCustomShareChange(participant.userId, e.target.value)
                              }
                              placeholder="0.00"
                              className="text-right"
                            />
                          </div>
                        )}
                        
                        {splitMethod === "equal" && participant.status === 'pending' && (
                          <div className="w-24 text-right font-medium">
                            Rp {participant.share.toLocaleString(undefined, { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push(`/groups/${groupId}`)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add Expense"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
