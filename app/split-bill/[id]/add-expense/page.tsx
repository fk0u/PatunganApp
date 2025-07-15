"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, DollarSign, User, Users } from "lucide-react"
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useSession, Session, Participant } from "@/contexts/SessionContext"
import { CircleSpinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

// Form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  amount: z.coerce.number().positive("Amount must be positive"),
  quantity: z.coerce.number().int().positive("Quantity must be a positive integer"),
  paidBy: z.string().min(1, "Payer is required"),
  sharedBy: z.array(z.string()).min(1, "At least one person must share this expense"),
  category: z.string().optional(),
  description: z.string().optional(),
  isCustom: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddExpensePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const { getSessionById, addExpenseItem } = useSession()
  const { toast } = useToast()
  
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Fetch session data
  useEffect(() => {
    async function fetchSession() {
      try {
        setLoading(true)
        const sessionData = await getSessionById(params.id)
        setSession(sessionData)
      } catch (error) {
        console.error('Error fetching session:', error)
        toast({
          title: "Error",
          description: "Failed to load session details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchSession()
  }, [params.id])
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      quantity: 1,
      paidBy: user?.uid || "",
      sharedBy: [],
      category: "",
      description: "",
      isCustom: false,
    },
  });
  
  // When session loads, update the form default values
  useEffect(() => {
    if (session && user) {
      form.setValue("paidBy", user.uid)
      
      // Set all participants to share by default
      const participantIds = session.participants.map(p => p.id)
      form.setValue("sharedBy", participantIds)
    }
  }, [session, user])
  
  // Submit the form
  const onSubmit = async (values: FormValues) => {
    if (!session) return
    
    try {
      await addExpenseItem(session.id, {
        name: values.name,
        amount: values.amount,
        quantity: values.quantity,
        paidBy: values.paidBy,
        sharedBy: values.sharedBy,
        category: values.category,
        description: values.description,
        isCustom: values.isCustom
      })
      
      toast({
        title: "Expense added",
        description: "Your expense has been added successfully",
      })
      
      router.push(`/split-bill/${session.id}`)
    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
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
  
  const categories = [
    "Food & Drinks", 
    "Transportation", 
    "Accommodation", 
    "Entertainment", 
    "Groceries", 
    "Shopping", 
    "Other"
  ]
  
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
          <h1 className="text-2xl font-bold">Add Expense</h1>
        </div>
        <p className="text-sm text-gray-500">
          For {session.name}
        </p>
      </motion.div>
      
      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name and Amount */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Dinner, Taxi, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          placeholder="0.00" 
                          className="pl-10" 
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        step="1" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Category and Description */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      placeholder="Add more details about this expense..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Paid By */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid By</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select who paid" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {session.participants.map((participant) => (
                        <SelectItem key={participant.id} value={participant.id}>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={participant.photoURL || ''} alt={participant.name} />
                              <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {participant.name}
                            {participant.id === user?.uid && " (You)"}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Shared By */}
          <div className="space-y-4">
            <FormLabel>Shared By</FormLabel>
            <FormDescription>
              Select who should share this expense
            </FormDescription>
            <div className="space-y-2">
              {session.participants.map((participant) => (
                <FormField
                  key={participant.id}
                  control={form.control}
                  name="sharedBy"
                  render={({ field }) => (
                    <FormItem
                      key={participant.id}
                      className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(participant.id)}
                          onCheckedChange={(checked) => {
                            const currentValue = [...field.value]
                            if (checked) {
                              if (!currentValue.includes(participant.id)) {
                                field.onChange([...currentValue, participant.id])
                              }
                            } else {
                              field.onChange(
                                currentValue.filter((value) => value !== participant.id)
                              )
                            }
                          }}
                        />
                      </FormControl>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={participant.photoURL || ''} alt={participant.name} />
                          <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {participant.name}
                            {participant.id === user?.uid && " (You)"}
                          </div>
                          {participant.email && (
                            <div className="text-xs text-gray-500">
                              {participant.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            {form.formState.errors.sharedBy && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.sharedBy.message}
              </p>
            )}
          </div>
          
          {/* Submit Button */}
          <Button type="submit" className="w-full">
            Add Expense
          </Button>
        </form>
      </Form>
    </div>
  )
}
