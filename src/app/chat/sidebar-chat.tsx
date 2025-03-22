"use client"
import { useState } from "react"
import { ChatList } from "./chat-list"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { User } from "@/lib/db/types"
import { ConversationHeader } from "@/components/conversation-header"

interface ChatSidebarProps {
  selectedUser: User | null
  onSelectUser: (user: User | null) => void
  onSelectChatUser: (user: User) => void
}

export function ChatSidebar({ selectedUser, onSelectUser, onSelectChatUser }: ChatSidebarProps) {
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Messages</h2>

        <Button
          onClick={() => setIsNewMessageOpen(true)}
          variant="default"
          size="sm"
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Message
        </Button>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatList selectedUserId={selectedUser?.uid} onSelectChat={onSelectChatUser} />
      </div>
    </div>
  )
}

