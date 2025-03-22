"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, Video, Info, ChevronLeft } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { User } from "@/app/type"
import { usePresence } from "@/ternsecure-realtime/hooks/usePresence"

interface ChatHeaderProps {
  selectedUser: User
  onBackToList?: () => void
  isMobile?: boolean
}


export function ChatHeader({ 
    selectedUser, 
    onBackToList, 
    isMobile 
}: ChatHeaderProps) {

    const { presenceState } = usePresence()

    const name =
    selectedUser.name || (selectedUser.email ? selectedUser.email.split("@")[0] : selectedUser.uid.substring(0, 8))

  const avatarLetter = name[0].toUpperCase()

  const presenceUpdate = presenceState.get(selectedUser.uid)
  const status = presenceUpdate?.presence.status || "unknown"

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background/90 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button 
          variant="ghost" 
          size="icon" 
          className="mr-1" 
          onClick={onBackToList}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative">
          <Avatar>
            <AvatarImage src={selectedUser.avatar} />
            <AvatarFallback>{avatarLetter}</AvatarFallback>
          </Avatar>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-background ${
              status === "online"
                ? "bg-green-500"
                : status === "busy"
                  ? "bg-red-500"
                  : status === "away"
                    ? "bg-yellow-500"
                    : status === "offline"
                      ? "bg-gray-400"
                      : "bg-slate-300"
            }`}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{name}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {status === "online"
              ? "Online"
              : status === "busy"
                ? "Busy"
                : status === "away"
                  ? "Away"
                  : status === "offline"
                    ? "Offline"
                    : "Unknown status"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Phone className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice call</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Video className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Video call</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Info className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Contact Information</h4>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>{avatarLetter}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">{name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center mt-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    <span className="text-xs">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" className="flex-1 mr-2">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

