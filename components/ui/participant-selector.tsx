"use client"

import React, { useState, useEffect } from "react"
import { useSessions } from "@/contexts/SessionContext"
import { Participant } from "@/types"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { 
  CheckCircle2, 
  UserCheck,
  Users,
  Check,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface ParticipantSelectorProps {
  participants: Participant[]
  selectedParticipants: string[]
  onSelectionChange: (selected: string[]) => void
}

export const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  participants,
  selectedParticipants,
  onSelectionChange
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  
  const filteredParticipants = participants.filter(participant => 
    participant.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleToggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      onSelectionChange(selectedParticipants.filter(id => id !== userId))
    } else {
      onSelectionChange([...selectedParticipants, userId])
    }
  }
  
  const handleSelectAll = () => {
    onSelectionChange(participants.map(p => p.userId))
  }
  
  const handleDeselectAll = () => {
    onSelectionChange([])
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari peserta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/30 border-white/10"
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {selectedParticipants.length} dari {participants.length} dipilih
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSelectAll}
            className="h-8 text-xs border-white/10 bg-white/5"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Pilih Semua
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDeselectAll}
            className="h-8 text-xs border-white/10 bg-white/5"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Batalkan Semua
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {filteredParticipants.length > 0 ? (
            filteredParticipants.map((participant) => {
              const isSelected = selectedParticipants.includes(participant.userId)
              
              return (
                <div 
                  key={participant.userId}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-pink-500/20 border border-pink-500/40' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => handleToggleParticipant(participant.userId)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      {participant.avatarUrl ? (
                        <AvatarImage src={participant.avatarUrl} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
                          {participant.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">{participant.displayName}</div>
                    </div>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected
                      ? 'bg-pink-500 text-white'
                      : 'bg-black/30 border border-white/20 text-gray-400'
                  }`}>
                    {isSelected && <Check className="h-4 w-4" />}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-400">
              <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada peserta yang sesuai dengan pencarian</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
