"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Loader2 } from "lucide-react";
import type { User } from "@/app/type";
import type {
  ConversationData,
  UserStatus,
  ChatMessage,
} from "@/ternsecure-realtime/utils/socket";
import { useChat, useWebSkt } from "@/ternsecure-realtime";
import { usePresence } from "@/ternsecure-realtime/hooks/usePresence";
import { useState, useEffect } from "react";
import { fetcher } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";

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
    (update) => update.clientId === user.uid
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
            <span className="text-sm font-semibold truncate">{name}</span>
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
  <div className="flex flex-col items-center justify-center h-40 gap-2">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    <p className="text-sm text-muted-foreground">Loading conversations...</p>
  </div>
);

const ErrorDisplay = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center h-40 p-4 text-center gap-2">
    <p className="text-sm text-destructive">Error: {message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    )}
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
    getLastMessage,
  } = useChat();

  const { clientId } = useWebSkt();
  const currentUserId = clientId;
  const { presenceState } = usePresence();
  const [localChats, setLocalChats] = useState<any[]>([]);

  const fetchConversations = async ({ pageParam = 0 }: { pageParam?: number }) => {
    const res = await fetcher(`/api/chats?cursor=${pageParam}&limit=50`);
    return {
      chats: res.chats || [],
      nextCursor: res.nextCursor,
      hasMore: res.hasMore
    };
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["chats"],
    queryFn: fetchConversations,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const chats = data?.pages.flatMap((page) => page.chats) ?? [];

  useEffect(() => {
    if (chats.length > 0 && localChats.length === 0) {
      setLocalChats(chats);
    }
  }, [chats.length]);

  useEffect(() => {
    let isMounted = true;

    const handleNewMessage = (message: ChatMessage) => {
      if (!isMounted) return;
      console.log("New message received:", message);

      setLocalChats((prevChats) => {
        // Extract both IDs from roomId (format: "user1_user2")
        const [user1, user2] = message.roomId.split("_");
        const otherUserId = user1 === currentUserId ? user2 : user1;

        const chatExists = prevChats.some(
          (chat) =>
            (chat.senderId === otherUserId && chat.recipientId === currentUserId) ||
            (chat.recipientId === otherUserId && chat.senderId === currentUserId)
        );

        if (!chatExists) {
          const newChat = {
            id: message.roomId,
            senderId: message.fromId,
            recipientId: otherUserId === message.fromId ? currentUserId : otherUserId,
            workspaceId: "",
            lastMessage: new Date(message.timestamp),
            createdAt: new Date(message.timestamp),
            updatedAt: new Date(message.timestamp),
            sender: message.fromId === currentUserId ? null : message.metaData,
            recipient: otherUserId === currentUserId ? null : message.toData,
            messages: [
              {
                id: message.roomId,
                content: message.message,
                createdAt: new Date(message.timestamp),
                read: false,
                senderId: message.fromId,
              },
            ],
          };
          return [newChat, ...prevChats];
        }

        // Update existing chat
        return prevChats.map((chat) => {
          const isRelevantChat =
            (chat.senderId === otherUserId && chat.recipientId === currentUserId) ||
            (chat.recipientId === otherUserId && chat.senderId === currentUserId);

          if (isRelevantChat) {
            return {
              ...chat,
              lastMessage: new Date(message.timestamp),
              messages: [
                {
                  id: message.roomId,
                  content: message.message,
                  createdAt: new Date(message.timestamp),
                  read: false,
                  senderId: message.fromId,
                },
              ],
            };
          }
          return chat;
        });
      });
    };

    const unsubscribe = subscribeToMessages(handleNewMessage);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUserId, subscribeToMessages]);

  const displayedChats = localChats.filter((chat) => {
    if (activeFilter === "unread") {
      return chat.messages?.some(
        (msg: any) => !msg.read && msg.senderId !== currentUserId
      );
    }
    if (activeFilter === "favorites") {
      return false; // TODO: Implement favorites logic
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
        {status === "pending" ? (
          <Loading />
        ) : status === "error" ? (
          <ErrorDisplay
            message={error?.message || "Failed to load conversations"}
            onRetry={() => refetch()}
          />
        ) : displayedChats.length === 0 ? (
          <EmptyState
            activeFilter={activeFilter}
            hasConversations={localChats.length > 0}
          />
        ) : (
          <div className="space-y-1 p-2">
            <div className="space-y-1">
              {displayedChats.map((chat) => {
                // Determine the other user in the conversation
                const otherUserId =
                  chat.senderId === currentUserId
                    ? chat.recipientId
                    : chat.senderId;

                const otherUserData =
                  chat.senderId === currentUserId ? chat.recipient : chat.sender;

                const presenceUpdate = presenceState.get(otherUserId);
                const status = presenceUpdate?.presence.status || "unknown";

                const socketLastMessage = getLastMessage(otherUserId);
                const lastMessage: ChatMessage = socketLastMessage || {
                  messageId: chat.messages?.[0]?.id || "",
                  message: chat.messages?.[0]?.content || "",
                  timestamp: chat.messages?.[0]?.createdAt?.toString() || chat.lastMessage?.toString() || "",
                  fromId: chat.messages?.[0]?.senderId || "",
                  toId: otherUserId,
                  roomId: `${chat.senderId}_${chat.recipientId}`,
                  metaData: otherUserData,
                  toData: undefined,
                };

                const user: User = {
                  uid: otherUserId,
                  name:
                    otherUserData?.name ||
                    otherUserData?.email?.split("@")[0] ||
                    otherUserId.substring(0, 8),
                  email: otherUserData?.email || "",
                  avatar: otherUserData?.avatar || "",
                };

                return (
                  <ConversationButton
                    key={`${chat.id}-${otherUserId}`}
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

            {(hasNextPage || isFetchingNextPage) && (
              <div className="flex justify-center pt-4 pb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                  className="text-muted-foreground"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading more...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </>
  );
}
