"use client"

import React from "react"
import { CalendarIcon, Clock, CreditCard, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Session } from "@/contexts/SessionContext"
import { formatDistanceToNow } from "date-fns"

interface SplitBillCardProps {
  session: Session
}

export function SplitBillCard({ session }: SplitBillCardProps) {
  return (
    <Card className="w-full overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <CardTitle className="text-xl">{session.name}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {session.description || "No description provided"}
            </CardDescription>
          </div>
          <Badge 
            variant={session.isSettled ? "outline" : "default"} 
            className={session.isSettled 
              ? "bg-gray-100 text-gray-500 hover:bg-gray-100" 
              : "bg-blue-100 text-blue-700 hover:bg-blue-100"
            }
          >
            {session.isSettled ? "Settled" : "Active"}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Clock className="h-4 w-4" />
          <span>Created {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <CreditCard className="h-4 w-4" />
          <span>Total: ${session.totalAmount.toFixed(2)}</span>
        </div>
        
        {session.eventDate && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <CalendarIcon className="h-4 w-4" />
            <span>{new Date(session.eventDate).toLocaleDateString()}</span>
          </div>
        )}
        
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Participants ({session.participants.length})</span>
          </div>
          <div className="flex -space-x-2 overflow-hidden">
            {session.participants.slice(0, 5).map((participant) => (
              <Avatar key={participant.id} className="h-8 w-8 border-2 border-white">
                <AvatarImage src={participant.photoURL || ''} alt={participant.name} />
                <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {session.participants.length > 5 && (
              <Avatar className="h-8 w-8 border-2 border-white bg-gray-200">
                <AvatarFallback>+{session.participants.length - 5}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
