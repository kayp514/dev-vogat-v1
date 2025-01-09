'use client'
import { ChatList } from "@/app/chat/chat-list"
import { ChatMessages } from "@/app/chat/chat-messages"
import { useState } from "react"
import { type Chat } from "../types/chat"


export function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  return (
    <div className="flex h-full">
      <ChatList
      selectedChatId={selectedChat?.id || ''}
      onChatSelect={setSelectedChat}
      />
      <ChatMessages selectedChat={selectedChat} />
    </div>
  )
}
