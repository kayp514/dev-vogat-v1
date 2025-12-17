"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageSquare, Users, UserPlus } from "lucide-react";
import type { User } from "@/app/type";
import type {
  ConversationData,
  UserStatus,
  ChatMessage,
} from "@/ternsecure-realtime/utils/socket";
import { useChat, useWebSkt } from "@/ternsecure-realtime";
import { usePresence } from "@/ternsecure-realtime/hooks/usePresence";
import { useState, useEffect } from "react";

type ConversationProps = {
  activeFilter: "all" | "unread" | "favorites";
  setActiveFilter: (filter: "all" | "unread" | "favorites") => void;
  activeTab: string;
  selectedUserId?: string;
  onSelectChat: (user: User) => void;
};

type ConversationButtonProps = {
  user: User;
  isSelected: boolean;
  onSelect: (user: User) => void;
  lastMessage?: ChatMessage;
  presence?: UserStatus;
};

const ConversationButton = (props: ConversationButtonProps) => {
  const { user, isSelected, onSelect, lastMessage } = props;
  const { presenceUpdates } = usePresence();
  const { isTyping } = useChat();

  const name =
    user.name ||
    (user.email ? user.email.split("@")[0] : user.uid.substring(0, 8));
  const avatarLetter = name[0]?.toUpperCase() || "U";

  const userPresence = presenceUpdates.find(
    update => update.clientId === user.uid
  )?.presence;

  const isUserTyping = Boolean(isTyping[user.uid]);

  const formatMessageTime = (timestamp: string) => {
    const distance = formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
    });
    return distance === "less than a minute ago" ? "now" : distance;
  };

  const truncateMessage = (message: string, maxLength: number = 30) => {
    if (message.length <= maxLength) return message;
    return `${message.substring(0, maxLength)}...`;
  };

  return (
    <Button
      key={user.uid}
      onClick={() => onSelect(user)}
      variant="ghost"
      className={`w-full justify-start p-3 h-auto hover:bg-accent/50 transition-colors cursor-pointer ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      <div className="flex items-center space-x-4 w-full">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-background">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {avatarLetter}
              </AvatarFallback>
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
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold truncate">
              {name}
            </span>
            {lastMessage?.timestamp && (
              <span className="text-xs text-muted-foreground shrink-0">
                {formatMessageTime(lastMessage.timestamp)}
              </span>
            )}
          </div>

          <div className="mt-1">
            {isUserTyping ? (
              <p className="text-xs text-muted-foreground italic">Typing...</p>
            ) : lastMessage ? (
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {lastMessage.fromId === user.uid ? `${name}: ` : "You: "}
                  {truncateMessage(lastMessage.message)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No messages yet</p>
            )}
          </div>
        </div>
      </div>
    </Button>
  );
};

const Loading = () => (
  <div className="flex items-center justify-center h-20">
    <p className="text-sm text-muted-foreground">Loading chats...</p>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-20">
    <p className="text-sm text-destructive">Error: {message}</p>
  </div>
);

const EmptyState = ({
  activeFilter,
  hasConversations,
}: {
  activeFilter: "all" | "unread" | "favorites";
  hasConversations: boolean;
}) => (
  <div className="flex flex-col items-center justify-center h-40 p-4 text-center">
    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
    <p className="text-sm text-muted-foreground">
      {activeFilter === "all" && !hasConversations
        ? "No conversations yet"
        : activeFilter === "all"
        ? "No conversations found"
        : activeFilter === "unread"
        ? "No unread messages"
        : "No favorite conversations"}
    </p>
    {activeFilter === "all" && !hasConversations && (
      <Button variant="link" size="sm" className="mt-2">
        Start a new conversation
      </Button>
    )}
  </div>
);

const ConversationFilters = ({
  activeFilter,
  setActiveFilter,
}: {
  activeFilter: "all" | "unread" | "favorites";
  setActiveFilter: (filter: "all" | "unread" | "favorites") => void;
}) => (
  <div className="bg-background/80 backdrop-blur-xs border-b px-2 py-2 z-10">
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
);

export function Conversation({
  activeFilter,
  setActiveFilter,
  onSelectChat,
}: ConversationProps) {
  const {
    selectedUser,
    setSelectedUser,
    subscribeToMessages,
    getConversations,
    getLastMessage,
  } = useChat();

  const { clientId } = useWebSkt();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const currentUserId = clientId;
  const { presenceState } = usePresence();

  useEffect(() => {
    let isMounted = true;

    const loadConversations = async () => {
      try {
        setLoading(true);
        const result = await getConversations({ limit: 50, offset: 0 });

        if (isMounted) {
          setConversations(result.conversations);
          setHasMore(result.hasMore);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message);
          setLoading(false);
        }
      }
    };

    const handleNewMessage = (message: ChatMessage) => {
      if (!isMounted) return;
      console.log("New message received:", message);
      setConversations((prevConversations) => {
        // Extract both IDs from roomId (format: "user1_user2")
        const [user1, user2] = message.roomId.split("_");
        const recipientId = user1 === message.fromId ? user2 : user1;

        const conversationExists = prevConversations.some(
          (conv) =>
            conv.otherUserId === message.fromId ||
            conv.otherUserId === recipientId
        );

        if (!conversationExists) {
          // Add new conversation at the beginning
          const newConversation: ConversationData = {
            roomId: message.roomId,
            otherUserId:
              recipientId === currentUserId ? message.fromId : recipientId,
            lastMessage: message,
            unreadCount: 0,
            lastActivity: new Date(message.timestamp).getTime(),
          };
          return [newConversation, ...prevConversations];
        }

        return prevConversations.map((conv) => {
          const isRelevantConversation =
            conv.otherUserId === message.fromId ||
            conv.otherUserId === recipientId;

          if (isRelevantConversation) {
            console.log("Updating conversation for:", conv.otherUserId);
            return {
              ...conv,
              lastMessage: message,
              updatedAt: message.timestamp,
            };
          }
          return conv;
        });
      });
    };

    loadConversations();
    const unsubscribe = subscribeToMessages(handleNewMessage);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [getConversations, subscribeToMessages]);

  const displayedConversations = conversations.filter((conv) => {
    if (activeFilter === "unread") {
      return conv.unreadCount > 0;
    }
    if (activeFilter === "favorites") {
      return false;
    }
    return true;
  });

  return (
    <>
      <ConversationFilters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />

      <ScrollArea className="h-[calc(100vh-225px)]">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorDisplay message={error} />
        ) : displayedConversations.length === 0 ? (
          <EmptyState
            activeFilter={activeFilter}
            hasConversations={conversations.length > 0}
          />
        ) : (
          <div className="space-y-1 p-2">
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const otherUserId = conversation.otherUserId;
                const presenceUpdate = presenceState.get(otherUserId);
                const status = presenceUpdate?.presence.status || "unknown";
                const lastMessage =
                  getLastMessage(otherUserId) || conversation.lastMessage;

                const isFromCurrentUser = lastMessage.fromId === currentUserId;

                const userData = isFromCurrentUser
                  ? lastMessage.toData
                  : lastMessage.metaData;
                const user: User = {
                  uid: otherUserId,
                  name:
                    userData?.name ||
                    userData?.email?.split("@")[0] ||
                    otherUserId.substring(0, 8),
                  email: userData?.email || "",
                  avatar: userData?.avatar || "",
                };

                return (
                  <ConversationButton
                    key={otherUserId}
                    user={user}
                    isSelected={selectedUser?.uid === otherUserId}
                    onSelect={(user) => {
                      setSelectedUser(user);
                      onSelectChat(user);
                    }}
                    lastMessage={lastMessage}
                    presence={status}
                  />
                );
              })}
            </div>
          </div>
        )}
      </ScrollArea>
    </>
  );
}

export function Contacts() {
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
          <p className="text-sm text-muted-foreground">
            Your contacts will appear here
          </p>
          <Button variant="link" size="sm" className="mt-2">
            Import contacts
          </Button>
        </div>
      </ScrollArea>
    </>
  );
}
