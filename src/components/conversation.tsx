"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare } from "lucide-react";
import type { User } from "@/app/type";
import type { ChatMessage } from "@/ternsecure-realtime/utils/socket";
import { useChat, useWebSkt } from "@/ternsecure-realtime";
import { usePresence } from "@/ternsecure-realtime/hooks/usePresence";
import { useEffect } from "react";
import { fetcher } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ConversationSearch } from "@/components/conversation-search";
import { ConversationFilters } from "@/components/chat-filters";
import { ConversationButton } from "@/components/chat-buttons";
import {
  Loading,
  EmptyState,
  ErrorDisplay,
} from "@/components/chat-component-state";

type ConversationProps = {
  activeFilter: "all" | "unread" | "favorites";
  setActiveFilter: (filter: "all" | "unread" | "favorites") => void;
  activeTab: string;
  selectedUserId?: string;
  onSelectChat: (user: User) => void;
};

export function Conversation({
  activeFilter,
  setActiveFilter,
  onSelectChat,
}: ConversationProps) {
  const { selectedUser, setSelectedUser, subscribeToMessages, getLastMessage } =
    useChat();

  const { clientId } = useWebSkt();
  const currentUserId = clientId;
  const { presenceState } = usePresence();
  const [localChats, setLocalChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = async ({
    pageParam = 0,
  }: {
    pageParam?: number;
  }) => {
    const res = await fetcher(`/api/chats?cursor=${pageParam}&limit=50`);
    return {
      chats: res.chats || [],
      nextCursor: res.nextCursor,
      hasMore: res.hasMore,
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
            (chat.senderId === otherUserId &&
              chat.recipientId === currentUserId) ||
            (chat.recipientId === otherUserId &&
              chat.senderId === currentUserId)
        );

        if (!chatExists) {
          const newChat = {
            id: message.roomId,
            senderId: message.fromId,
            recipientId:
              otherUserId === message.fromId ? currentUserId : otherUserId,
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
            (chat.senderId === otherUserId &&
              chat.recipientId === currentUserId) ||
            (chat.recipientId === otherUserId &&
              chat.senderId === currentUserId);

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

  // Filter and sort chats - most recent message first
  const displayedChats = localChats
    .filter((chat) => {
      // Apply search filter
      if (searchQuery) {
        const otherUserData =
          chat.senderId === currentUserId ? chat.recipient : chat.sender;
        const name = otherUserData?.name?.toLowerCase() || "";
        const email = otherUserData?.email?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        if (!name.includes(query) && !email.includes(query)) {
          return false;
        }
      }

      if (activeFilter === "unread") {
        return chat.messages?.some(
          (msg: any) => !msg.read && msg.senderId !== currentUserId
        );
      }
      if (activeFilter === "favorites") {
        return false; // TODO: Implement favorites logic
      }
      return true;
    })
    .sort((a, b) => {
      // Get the latest message timestamp for each chat
      const aTimestamp = a.lastMessage
        ? new Date(a.lastMessage).getTime()
        : a.messages?.[0]?.createdAt
        ? new Date(a.messages[0].createdAt).getTime()
        : 0;
      const bTimestamp = b.lastMessage
        ? new Date(b.lastMessage).getTime()
        : b.messages?.[0]?.createdAt
        ? new Date(b.messages[0].createdAt).getTime()
        : 0;
      // Sort descending (most recent first)
      return bTimestamp - aTimestamp;
    });

  // Calculate total unread messages count across all chats
  const totalUnreadCount = localChats.reduce((total, chat) => {
    const unreadInChat =
      chat.messages?.filter(
        (msg: any) => !msg.read && msg.senderId !== currentUserId
      )?.length || 0;
    return total + unreadInChat;
  }, 0);

  return (
    <>
      <ConversationSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <ConversationFilters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        unreadCount={totalUnreadCount}
      />

      <ScrollArea className="h-[calc(100vh-300px)]">
        {status === "pending" ? (
          <Loading />
        ) : status === "error" ? (
          <ErrorDisplay
            message={error?.message || "Failed to load conversations"}
            onRetry={() => refetch()}
          />
        ) : displayedChats.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            message={
              searchQuery
                ? "No conversations match your search"
                : activeFilter === "all" && localChats.length === 0
                ? "No conversations yet"
                : activeFilter === "all"
                ? "No conversations found"
                : activeFilter === "unread"
                ? "No unread messages"
                : "No favorite conversations"
            }
            action={
              activeFilter === "all" && localChats.length === 0 && !searchQuery
                ? {
                    label: "Start a new conversation",
                    onClick: () => {
                      // TODO: Implement new conversation action
                      console.log("Start new conversation");
                    },
                  }
                : undefined
            }
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
                  chat.senderId === currentUserId
                    ? chat.recipient
                    : chat.sender;

                const presenceUpdate = presenceState.get(otherUserId);
                const status = presenceUpdate?.presence.status || "unknown";

                const socketLastMessage = getLastMessage(otherUserId);
                const lastMessage: ChatMessage = socketLastMessage || {
                  messageId: chat.messages?.[0]?.id || "",
                  message: chat.messages?.[0]?.content || "",
                  timestamp:
                    chat.messages?.[0]?.createdAt?.toString() ||
                    chat.lastMessage?.toString() ||
                    "",
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
