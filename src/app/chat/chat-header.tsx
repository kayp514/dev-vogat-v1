"use client"
import { Phone, Video, MoreVertical } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { User } from "@/lib/db/types"
import { usePresence } from "@/ternsecure-realtime/hooks/usePresence"

interface ChatHeaderProps {
  selectedUser: User | null
}

export function ChatHeader({ selectedUser }: ChatHeaderProps) {
  const { presenceState } = usePresence()

  if (!selectedUser) {
    return (
      <div className="h-16 border-b px-6 flex items-center">
        <h2 className="text-lg font-medium text-muted-foreground">Select a conversation to start chatting</h2>
      </div>
    )
  }

  const name =
    selectedUser.name || (selectedUser.email ? selectedUser.email.split("@")[0] : selectedUser.uid.substring(0, 8))

  const avatarLetter = name[0].toUpperCase()

  const presenceUpdate = presenceState.get(selectedUser.uid)
  const status = presenceUpdate?.presence.status || "unknown"

  return (
    <div className="h-16 border-b px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10 border">
            {selectedUser.avatar ? (
              <AvatarImage src={selectedUser.avatar} alt={name} />
            ) : (
              <AvatarFallback>{avatarLetter}</AvatarFallback>
            )}
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
          <h2 className="text-base font-medium">{name}</h2>
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
        <Button variant="ghost" size="icon" className="rounded-full">
          <Phone className="h-4 w-4" />
          <span className="sr-only">Call</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Video className="h-4 w-4" />
          <span className="sr-only">Video call</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View profile</DropdownMenuItem>
            <DropdownMenuItem>Block user</DropdownMenuItem>
            <DropdownMenuItem>Clear chat</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

