"use client"
import { useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import type { User } from "../type"
import { cn } from "@/lib/utils"
import { useState } from "react"
import type { ConversationData, ChatMessage, UserStatus } from "@/ternsecure-realtime/utils/socket"
import { useWebSkt } from "@/ternsecure-realtime/ctx/SocketWebSktCtx"
import { useChat } from "@/ternsecure-realtime/ctx/ChatCtx"
import { usePresence } from "@/ternsecure-realtime/hooks/usePresence"

interface ChatListProps {
  selectedUserId?: string
  onSelectChat: (user: User) => void
}

const ChatListButton = ({
  user,
  isSelected,
  onSelect,
  LastMessage,
  presence = "unknown",
}: {
  user: User
  isSelected: boolean
  onSelect: (user: User) => void
  LastMessage?: ChatMessage
  presence?: UserStatus
}) => {
  const { presenceUpdates } = usePresence()

  const name = user.name || (user.email ? user.email.split("@")[0] : user.uid.substring(0, 8))
  const avatarLetter = name[0].toUpperCase()
  const avatar = user.avatar || user.avatar

  const userPresence = presenceUpdates.find((update) => update.clientId === user.uid)?.presence

  const formatMessageTime = (timestamp: string) => {
    const distance = formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    return distance === "less than a minute ago" ? "now" : distance
  }

  const truncateMessage = (message: string, maxLength = 30) => {
    if (message.length <= maxLength) return message
    return `${message.substring(0, maxLength)}...`
  }

  return (
    <Button
      key={user.uid}
      onClick={() => onSelect(user)}
      variant="ghost"
      className={cn(
        "w-full flex items-center gap-3 p-4 text-left transition-all h-[72px]",
        "hover:bg-accent/50 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        isSelected ? "bg-accent/60 text-accent-foreground" : "",
      )}
    >
      <div className="relative">
        <Avatar className="h-12 w-12 border">
          {user.avatar ? <AvatarImage src={avatar} alt={name} /> : <AvatarFallback>{avatarLetter}</AvatarFallback>}
        </Avatar>
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-background ${
            userPresence?.status === "online"
              ? "bg-green-500"
              : userPresence?.status === "busy"
                ? "bg-red-500"
                : userPresence?.status === "away"
                  ? "bg-yellow-500"
                  : userPresence?.status === "offline"
                    ? "bg-gray-400"
                    : "bg-slate-300"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2">
          <p className="font-medium truncate text-sm">{name}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {LastMessage?.timestamp && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatMessageTime(LastMessage.timestamp)}
                </span>
              )}
            </span>
          </div>
        </div>
        {LastMessage ? (
          <p
            className={cn(
              "text-xs text-muted-foreground truncate leading-relaxed",
              "group-hover:text-accent-foreground/70",
              isSelected && "text-accent-foreground/70",
            )}
          >
            {truncateMessage(LastMessage.message)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">No messages yet</p>
        )}
      </div>
    </Button>
  )
}

export function ChatList({ selectedUserId, onSelectChat }: ChatListProps) {
  const {
    selectedUser,
    setSelectedUser,
    subscribeToMessages,
    getConversations,
    getLastMessage,
    getChatUserIds,
    getUserById,
  } = useChat()

  const { clientId } = useWebSkt()

  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const currentUserId = clientId

  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "online" | "unread">("all")

  useEffect(() => {
    let isMounted = true

    const loadConversations = async () => {
      try {
        setLoading(true)
        const result = await getConversations({ limit: 50, offset: 0 })

        if (isMounted) {
          setConversations(result.conversations)
          setHasMore(result.hasMore)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message)
          setLoading(false)
        }
      }
    }

    const handleNewMessage = (message: ChatMessage) => {
      if (!isMounted) return
      console.log("New message received:", message) // Debug log
      setConversations((prevConversations) => {
        // Extract both IDs from roomId (format: "user1_user2")
        const [user1, user2] = message.roomId.split("_")
        const recipientId = user1 === message.fromId ? user2 : user1

        const conversationExists = prevConversations.some(
          (conv) => conv.otherUserId === message.fromId || conv.otherUserId === recipientId,
        )

        if (!conversationExists) {
          // Add new conversation at the beginning
          const newConversation: ConversationData = {
            roomId: message.roomId,
            otherUserId: recipientId === currentUserId ? message.fromId : recipientId,
            lastMessage: message,
            unreadCount: 0,
            lastActivity: new Date(message.timestamp).getTime(),
          }
          return [newConversation, ...prevConversations]
        }

        return prevConversations.map((conv) => {
          const isRelevantConversation = conv.otherUserId === message.fromId || conv.otherUserId === recipientId

          if (isRelevantConversation) {
            console.log("Updating conversation for:", conv.otherUserId)
            return {
              ...conv,
              lastMessage: message,
              updatedAt: message.timestamp, // If you have this field
            }
          }
          return conv
        })
      })
    }

    loadConversations()
    const unsubscribe = subscribeToMessages(handleNewMessage)

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [getConversations, subscribeToMessages])

  const { presenceUpdates, presenceState } = usePresence()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-muted-foreground">Loading conversations...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-muted-foreground">No conversations yet</div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-1 p-1">
          {conversations.map((conversation) => {
            const otherUserId = conversation.otherUserId
            const presenceUpdate = presenceState.get(otherUserId)
            const status = presenceUpdate?.presence.status || "unknown"
            const lastMessage = getLastMessage(otherUserId) || conversation.lastMessage
            const isFromCurrentUser = lastMessage.fromId === currentUserId
            const userData = isFromCurrentUser ? lastMessage.toData : lastMessage.metaData
            const user: User = {
              uid: otherUserId,
              name: userData?.name || userData?.email?.split("@")[0] || otherUserId.substring(0, 8),
              email: userData?.email || "",
              avatar: userData?.avatar || "",
            }

            return (
              <ChatListButton
                key={otherUserId}
                user={user}
                isSelected={selectedUser?.uid === otherUserId}
                onSelect={(user) => {
                  setSelectedUser(user)
                  onSelectChat(user)
                }}
                LastMessage={lastMessage}
                presence={status}
              />
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

