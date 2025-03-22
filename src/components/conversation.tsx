"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MessageSquare, ExternalLink, Users, UserPlus } from "lucide-react"
import type { User } from "@/app/type"
import type { ConversationData , UserStatus} from "@/ternsecure-realtime/utils/socket"
import { useChat } from "@/ternsecure-realtime/ctx/ChatCtx"
import { useWebSkt } from "@/ternsecure-realtime/ctx/SocketWebSktCtx"
import { usePresence } from "@/ternsecure-realtime/hooks/usePresence"

interface ConversationProps {
  activeFilter: "all" | "unread" | "favorites"
  setActiveFilter: (filter: "all" | "unread" | "favorites") => void
  displayedConversations: ConversationData[]
  isLoading: boolean
  activeTab: string
  selectedUserId?: string
  onSelectChat: (user: User) => void
}

const ConversationItem = ({
  conversation,
  onSelectChat,
  currentUserId,
  presence = "unknown",
}: {
  conversation: ConversationData
  onSelectChat: (user: User) => void
  currentUserId: string
  presence?: UserStatus
}) => {
    const { presenceUpdates } = usePresence()


  const otherUserId = conversation.otherUserId
  const lastMessage = conversation.lastMessage
  const isFromCurrentUser = lastMessage.fromId === currentUserId
  const userData = isFromCurrentUser ? lastMessage.toData : lastMessage.metaData
  const user: User = {
    uid: otherUserId,
    name: userData?.name || userData?.email?.split("@")[0] || otherUserId.substring(0, 8),
    email: userData?.email || "",
    avatar: userData?.avatar || "",
  }

  const userPresence = presenceUpdates.find((update) => update.clientId === user.uid)?.presence

  return (
    <div
      key={otherUserId}
      className={`p-2.5 hover:bg-accent/50 cursor-pointer transition-colors rounded-md mb-1 ${
        conversation.isExternal ? "border-l-2 border-green-500" : ""
      }`}
      onClick={() => onSelectChat(user)}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <Avatar className="h-11 w-11 border border-muted">
            {user.avatar ? (
              <AvatarImage src={user.avatar} />
            ) : (
              <AvatarFallback>{user.name[0].toUpperCase()}</AvatarFallback>
            )}
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
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 max-w-[70%]">
              <h3 className="font-medium text-sm truncate">{user.name}</h3>
              {conversation.isExternal && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center h-4 w-4 rounded-full bg-green-100 flex-shrink-0">
                        <ExternalLink className="h-2.5 w-2.5 text-green-600" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      External PSTN message
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground line-clamp-1 leading-snug max-w-[85%]">
              {lastMessage.message}
            </p>
            {conversation.unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center flex-shrink-0"
              >
                {conversation.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Conversation({
  activeFilter,
  setActiveFilter,
  displayedConversations,
  isLoading,
  activeTab,
  selectedUserId,
  onSelectChat,
}: ConversationProps) {
  const { clientId } = useWebSkt()
  const currentUserId = clientId

  return (
    <>
      <div className="bg-background/80 backdrop-blur-sm border-b px-2 py-2 z-10">
        <div className="flex space-x-1 rounded-lg bg-muted/50 p-1">
          <Button
            variant={activeFilter === "all" ? "default" : "ghost"}
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={() => setActiveFilter("all")}
          >
            All
          </Button>
          <Button
            variant={activeFilter === "unread" ? "default" : "ghost"}
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={() => setActiveFilter("unread")}
          >
            <Badge variant="destructive" className="mr-1.5 h-5 px-1.5">
              7
            </Badge>
            Unread
          </Button>
          <Button
            variant={activeFilter === "favorites" ? "default" : "ghost"}
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={() => setActiveFilter("favorites")}
          >
            <span className="text-yellow-500 mr-1">★</span>
            Favorites
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-225px)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <p className="text-sm text-muted-foreground">Loading conversations...</p>
          </div>
        ) : displayedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 p-4 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {activeFilter === "all"
                ? "No conversations found"
                : activeFilter === "unread"
                  ? "No unread messages"
                  : "No favorite conversations"}
            </p>
            {activeFilter === "all" && (
              <Button variant="link" size="sm" className="mt-2">
                Start a new conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            <div className="space-y-1">
              {displayedConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.otherUserId}
                  conversation={conversation}
                  onSelectChat={onSelectChat}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </>
  )
}

export function ContactsTab() {
  return (
    <>
      <div className="flex justify-end p-2 border-b bg-background sticky top-[137px] z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Add Contact
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a new contact</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea className="h-[calc(100vh-185px)]">
        <div className="p-4 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">Your contacts will appear here</p>
          <Button variant="link" size="sm" className="mt-2">
            Import contacts
          </Button>
        </div>
      </ScrollArea>
    </>
  )
}

