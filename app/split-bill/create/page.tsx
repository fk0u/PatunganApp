"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  CalendarIcon, 
  CameraIcon, 
  Clock, 
  DollarSign, 
  MapPin,
  Plus, 
  Receipt, 
  User,
  Users 
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useSession } from "@/contexts/SessionContext"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { z } from "zod"

// Form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  description: z.string().optional(),
  location: z.string().optional(),
  eventDate: z.date().optional(),
  participants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().optional(),
      photoURL: z.string().optional(),
      isRegistered: z.boolean()
    })
  ),
  receiptImage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateSplitBillPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { createSession } = useSession()
  const { toast } = useToast()
  
  const [participants, setParticipants] = useState<any[]>([])
  const [newParticipantName, setNewParticipantName] = useState("")
  const [newParticipantEmail, setNewParticipantEmail] = useState("")
  const [isAddingParticipant, setIsAddingParticipant] = useState(false)
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      participants: [
        // Add the current user as a participant
        {
          id: user?.uid || "",
          name: user?.displayName || "You",
          email: user?.email || "",
          photoURL: user?.photoURL || "",
          isRegistered: true
        }
      ],
      receiptImage: "",
    },
  });
  
  // Add a new participant
  const addParticipant = () => {
    if (!newParticipantName.trim()) return;
    
    const participant = {
      id: `temp-${Date.now()}`,
      name: newParticipantName,
      email: newParticipantEmail,
      isRegistered: false
    };
    
    const currentParticipants = form.getValues("participants");
    form.setValue("participants", [...currentParticipants, participant]);
    
    setNewParticipantName("");
    setNewParticipantEmail("");
    setIsAddingParticipant(false);
  };
  
  // Remove a participant
  const removeParticipant = (id: string) => {
    const currentParticipants = form.getValues("participants");
    form.setValue(
      "participants",
      currentParticipants.filter((p) => p.id !== id)
    );
  };
  
  // Submit the form
  const onSubmit = async (values: FormValues) => {
    try {
      const sessionId = await createSession({
        name: values.name,
        description: values.description,
        location: values.location,
        eventDate: values.eventDate ? values.eventDate.getTime() : undefined,
        participants: values.participants,
        receiptImage: values.receiptImage,
        expenseItems: [],
        transactions: [],
        totalAmount: 0,
      });
      
      toast({
        title: "Split bill created",
        description: "Your split bill has been created successfully",
      });
      
      router.push(`/split-bill/${sessionId}`);
    } catch (error) {
      console.error("Error creating split bill:", error);
      toast({
        title: "Error",
        description: "Failed to create split bill. Please try again.",
        variant: "destructive",
      });
    }
  };
  
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
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Create Split Bill</h1>
        </div>
      </motion.div>
      
      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name and Description */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Dinner at Restaurant..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details about this split bill..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Location and Date */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter a location..."
                        className="pl-10"
                        {...field}
                        value={field.value || ""}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="eventDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date (optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span className="text-gray-400">Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Participants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Participants</FormLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingParticipant(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            {/* Participants list */}
            <div className="space-y-2">
              {form.watch("participants").map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center">
                    <div className="bg-gray-200 p-2 rounded-full mr-3">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {participant.name}
                        {participant.id === user?.uid && " (You)"}
                      </p>
                      {participant.email && (
                        <p className="text-xs text-gray-500">{participant.email}</p>
                      )}
                    </div>
                  </div>
                  
                  {participant.id !== user?.uid && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParticipant(participant.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              
              {/* Add participant form */}
              {isAddingParticipant && (
                <div className="p-3 bg-gray-50 rounded-md space-y-3">
                  <div className="space-y-2">
                    <Input
                      placeholder="Name"
                      value={newParticipantName}
                      onChange={(e) => setNewParticipantName(e.target.value)}
                    />
                    <Input
                      placeholder="Email (optional)"
                      value={newParticipantEmail}
                      onChange={(e) => setNewParticipantEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingParticipant(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addParticipant}
                      disabled={!newParticipantName.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Receipt Image - This would typically use a file upload component */}
          <div className="space-y-4">
            <FormLabel>Receipt (optional)</FormLabel>
            <Button
              type="button"
              variant="outline"
              className="w-full h-32 border-dashed flex flex-col items-center justify-center"
            >
              <CameraIcon className="h-8 w-8 mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Add a photo of your receipt</p>
            </Button>
          </div>
          
          {/* Submit Button */}
          <Button type="submit" className="w-full">
            Create Split Bill
          </Button>
        </form>
      </Form>
    </div>
  )
}
