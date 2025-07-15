"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { createGroup } from "@/lib/firestore"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Users } from "lucide-react"

export default function CreateGroupPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  
  const { userData } = useAuth()
  const router = useRouter()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Please enter a group name")
      return
    }
    
    setLoading(true)
    
    try {
      // Create group with current user as admin
      const newGroup = await createGroup({
        name,
        description,
        members: [
          {
            userId: userData?.id || "",
            role: "admin",
            joinedAt: Date.now(),
            status: "active"
          }
        ]
      })
      
      toast.success("Group created successfully!")
      router.push(`/groups/${newGroup.id}`)
    } catch (error: any) {
      console.error("Error creating group:", error)
      toast.error(error.message || "Failed to create group")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          className="gap-2 p-0 h-auto font-normal"
          onClick={() => router.back()}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Create a New Group
            </CardTitle>
            <CardDescription>
              Start a shared ledger with friends, roommates, or colleagues
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Roommates, Team Lunch, Trip to Bali"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What's this group for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Group"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
