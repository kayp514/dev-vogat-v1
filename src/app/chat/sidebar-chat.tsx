"use client"
import { useState, useEffect } from "react"
import { ChatList } from "./chat-list"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { User } from "@/lib/db/types"
import { useChat } from "@/ternsecure-realtime/ctx/ChatCtx"
import { ConversationHeader } from "@/components/conversation-header"
import type { ConversationData, ChatMessage, UserStatus } from "@/ternsecure-realtime/utils/socket"
import { useWebSkt } from "@/ternsecure-realtime/ctx/SocketWebSktCtx"
import { Conversation } from "@/components/conversation"
import { usePresence } from "@/ternsecure-realtime/hooks/usePresence"

interface ChatSidebarProps {
  selectedUser: User | null
  onSelectUser: (user: User | null) => void
  onSelectChatUser: (user: User) => void
}

export function ChatSidebar({ 
  selectedUser, 
  onSelectUser, 
  onSelectChatUser 
}: ChatSidebarProps) {
  const { clientId } = useWebSkt()
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [activeTab, setActiveTab] = useState("chats")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState({
    showOnlineOnly: false,
    showUnreadOnly: false,
  })
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "favorites">("all")
  const [hasMore, setHasMore] = useState(false)
  const currentUserId = clientId

  const {
    setSelectedUser,
    subscribeToMessages,
    getConversations,
    getLastMessage,
    getChatUserIds,
    getUserById,
  } = useChat()

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoading(true)
        const result = await getConversations({ limit: 50, offset: 0 })
          setConversations(result.conversations)
          setHasMore(result.hasMore)
          setIsLoading(false)
      } catch (err) {
          setError((err as Error).message)
          setIsLoading(false)
      }
    }


    const handleNewMessage = (message: ChatMessage) => {
      console.log('New message received:', message); // Debug log
      setConversations(prevConversations => {
          // Extract both IDs from roomId (format: "user1_user2")
          const [user1, user2] = message.roomId.split('_');
          const recipientId = user1 === message.fromId ? user2 : user1;

          const conversationExists = prevConversations.some(
            conv => conv.otherUserId === message.fromId || conv.otherUserId === recipientId
          );

          if (!conversationExists) {
            // Add new conversation at the beginning
            const newConversation: ConversationData = {
              roomId: message.roomId,
              otherUserId: recipientId === currentUserId ? message.fromId : recipientId,
              lastMessage: message,
              unreadCount: 0,
              lastActivity: new Date(message.timestamp).getTime()
            };
            return [newConversation, ...prevConversations];
          }

          return prevConversations.map(conv => {
            const isRelevantConversation = 
              conv.otherUserId === message.fromId || 
              conv.otherUserId === recipientId;
  
            if (isRelevantConversation) {
              console.log('Updating conversation for:', conv.otherUserId);
              return {
                ...conv,
                lastMessage: message,
                updatedAt: message.timestamp // If you have this field
              };
            }
            return conv;
          });
        });
      };
    
    loadConversations()
    const unsubscribe = subscribeToMessages(handleNewMessage)
    
    return () => {
      unsubscribe()
    }
  }, [getConversations, subscribeToMessages])




  const getFilteredConversations = () => {
    const filtered = conversations.filter((conv) => {
      const userData = getUserById(conv.otherUserId)
      const userName = userData?.name || conv.otherUserId
      
      if (searchQuery) {
        return userName.toLowerCase().includes(searchQuery.toLowerCase())
      }

      if (activeFilter === "unread") {
        return conv.unreadCount > 0
      } else if (activeFilter === "favorites") {
        return conv.isFavorite
      }
      
      return true
    })

    return filtered
  }

  const displayedConversations = getFilteredConversations()

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <ConversationHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filterOptions={filterOptions}
            setFilterOptions={setFilterOptions}
          />
          
          <TabsContent value="chats" className="flex-1 p-0 m-0 overflow-hidden flex flex-col">
            <Conversation
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              displayedConversations={displayedConversations}
              isLoading={isLoading}
              activeTab={activeTab}
              selectedUserId={selectedUser?.uid} onSelectChat={onSelectChatUser} />
          </TabsContent>
      </Tabs>
    </div>
  )
}
