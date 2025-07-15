"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { getGroupById, createEvent } from "@/lib/firestore"
import { Group, EventParticipant } from "@/lib/types"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, CalendarDays, User, Users, MapPin } from "lucide-react"
import { format } from "date-fns"

interface CreateEventPageProps {
  params: {
    id: string
  }
}

export default function CreateEventPage({ params }: CreateEventPageProps) {
  const [group, setGroup] = useState<Group | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [location, setLocation] = useState("")
  const [budget, setBudget] = useState("")
  const [participants, setParticipants] = useState<EventParticipant[]>([])
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
            role: member.userId === userData?.id ? 'organizer' : 'participant',
            joinedAt: Date.now(),
            status: member.userId === userData?.id ? 'confirmed' : 'invited'
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Please enter an event name")
      return
    }
    
    if (!startDate) {
      toast.error("Please select a start date")
      return
    }
    
    const budgetAmount = budget ? parseFloat(budget) : undefined
    if (budget && (isNaN(budgetAmount!) || budgetAmount! <= 0)) {
      toast.error("Please enter a valid budget amount")
      return
    }
    
    setSubmitting(true)
    
    try {
      // Create the event
      await createEvent({
        groupId,
        name,
        description,
        startDate: startDate.getTime(),
        endDate: endDate?.getTime(),
        location,
        budget: budgetAmount,
        participants
      })
      
      toast.success("Event created successfully!")
      router.push(`/groups/${groupId}`)
    } catch (error: any) {
      console.error("Error creating event:", error)
      toast.error(error.message || "Failed to create event")
    } finally {
      setSubmitting(false)
    }
  }
  
  const toggleParticipant = (userId: string, isIncluded: boolean) => {
    setParticipants(prev => 
      prev.map(participant => 
        participant.userId === userId
          ? { 
              ...participant, 
              status: isIncluded ? (
                participant.userId === userData?.id ? 'confirmed' : 'invited'
              ) : 'declined'
            }
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
              <CalendarDays size={20} className="text-primary" />
              Create New Event
            </CardTitle>
            <CardDescription>
              Plan an event for {group?.name}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Weekend Trip, Birthday Party, Team Dinner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What's this event about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {startDate ? (
                          format(startDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {endDate ? (
                          format(endDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => 
                          startDate ? date < startDate : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <div className="flex gap-2">
                  <MapPin size={16} className="mt-3 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Where will this event take place?"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (Optional, Rp)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <Label>Who's invited?</Label>
                
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-4">
                    {participants.map(participant => (
                      <div key={participant.userId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            id={`participant-${participant.userId}`} 
                            checked={participant.status !== 'declined'}
                            onCheckedChange={(checked) => 
                              toggleParticipant(participant.userId, checked as boolean)
                            }
                            disabled={participant.userId === userData?.id} // Can't uninvite yourself
                          />
                          <Label 
                            htmlFor={`participant-${participant.userId}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <User size={16} />
                            <span>
                              {participant.userId === userData?.id ? 'You' : participant.userId}
                              {participant.role === 'organizer' && (
                                <span className="ml-2 text-xs text-muted-foreground">(Organizer)</span>
                              )}
                            </span>
                          </Label>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {participant.status === 'confirmed' ? 'Confirmed' : 
                           participant.status === 'invited' ? 'Invited' : 'Declined'}
                        </div>
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
                {submitting ? "Creating..." : "Create Event"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
