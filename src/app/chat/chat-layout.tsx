'use client'
import { useState } from "react"
import { type User } from "../type"
import { Card, CardContent } from "@/components/ui/card"
import { ChatSidebar } from "./sidebar-chat"
import { ChatArea } from "./chat-area"
import { cn } from "@/lib/utils"






export function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleSelectUser = (user: User | null) => {
    setSelectedUser(user)
  }

  const handleSelectChatUser = (chatUser: User) => {
    if (chatUser) {
      setSelectedUser({
        uid: chatUser.uid,
        name: chatUser.name || 'Anonymous',
        email: chatUser.email || `${chatUser.uid}@example.com`,
        avatar: chatUser.avatar
      })
    }
  }

  return (
    <div className="h-full w-full flex p-2 bg-gray-100 dark:bg-gray-800">
      <Card className="w-full h-full border-0 shadow-none rounded-none overflow-hidden">
        <CardContent className="p-0 h-full flex">
        <ChatSidebar
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          onSelectChatUser={handleSelectChatUser}
        />

        <ChatArea 
        selectedUser={selectedUser} 
        />
        </CardContent>
        </Card>
    </div>
  )
}