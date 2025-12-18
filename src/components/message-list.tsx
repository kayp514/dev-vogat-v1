"use client";

import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Loader2 } from "lucide-react";
import type {
  ChatMessage,
  MessageStatus,
} from "@/ternsecure-realtime/utils/socket";
import { useChat } from "@/ternsecure-realtime/ctx/ChatCtx";
import type { User } from "@/lib/db/types";
import {
  ClockIcon,
  CheckIcon,
  CheckCheckIcon,
  AlertCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@tern-secure/nextjs";

interface MessageListProps {
  currentUserId: string;
  selectedUser: User | null;
}

interface MessageGroup {
  date: string;
  messages: ChatMessage[];
}

const statusSounds =
  typeof window !== "undefined"
    ? {
        sent: new Audio("/sounds/sent.mp3"),
        delivered: new Audio("/sounds/sent.mp3"),
      }
    : null;

if (statusSounds) {
  Object.values(statusSounds).forEach((sound) => {
    sound.load();
    sound.volume = 0.4;
  });
}

const MessageStatusIndicator = ({ status }: { status: MessageStatus }) => {
  return (
    <span className="flex items-center transition-opacity duration-200">
      {status === "pending" && (
        <ClockIcon className="h-3 w-3 text-current animate-pulse" />
      )}
      {status === "sent" && (
        <CheckIcon className="h-3 w-3 text-current animate-in fade-in" />
      )}
      {status === "delivered" && (
        <CheckCheckIcon className="h-3 w-3 text-current animate-in fade-in" />
      )}
      {status === "error" && (
        <AlertCircleIcon className="h-3 w-3 text-red-500 animate-in fade-in" />
      )}
    </span>
  );
};

const MessageBubble = ({
  message,
  isCurrentUser,
  selectedUser,
  showMetadata,
  shouldGroupWithPrev,
  shouldGroupWithNext,
  deliveryStatus,
}: {
  message: ChatMessage;
  isCurrentUser: boolean;
  selectedUser: User;
  showMetadata: boolean;
  shouldGroupWithPrev: boolean;
  shouldGroupWithNext: boolean;
  deliveryStatus: Record<string, MessageStatus>;
}) => {
  const bubbleClassName = cn(
    "p-3 shadow-xs wrap-break-word",
    isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted",
    shouldGroupWithPrev && shouldGroupWithNext
      ? "rounded-md"
      : shouldGroupWithPrev
      ? "rounded-md rounded-tl-sm"
      : shouldGroupWithNext
      ? "rounded-md rounded-bl-sm"
      : "rounded-lg"
  );

  const formatMessageTime = (timestamp: string) => {
    const distance = formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
    });
    return distance === "less than a minute ago" ? "now" : distance;
  };

  return (
    <div
      key={message.messageId}
      className={cn(
        "flex w-full items-end space-x-2",
        isCurrentUser ? "justify-end" : "justify-start",
        shouldGroupWithPrev ? "mt-0.5" : "mt-3"
      )}
    >
      <div
        className={cn(
          "flex items-end gap-2 max-w-[70%]",
          isCurrentUser ? "flex-row-reverse space-x-reverse" : "order-0"
        )}
      >
        <div className="shrink-0 w-8 self-end">
          {!shouldGroupWithPrev && (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {isCurrentUser
                  ? "ME"
                  : selectedUser.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className={bubbleClassName}>
            <p className="text-sm leading-relaxed">{message.message}</p>
          </div>
          {showMetadata && (
            <div
              className={cn(
                "flex items-center justify-between mt-1 space-x-2",
                isCurrentUser ? "justify-end" : "justify-start"
              )}
            >
              <span className="text-xs opacity-70">
                {formatMessageTime(message.timestamp)}
              </span>
              {isCurrentUser && (
                <MessageStatusIndicator
                  status={deliveryStatus[message.messageId] || "pending"}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MessageGroup = ({
  group,
  currentUserId,
  deliveryStatus,
  selectedUser,
}: {
  group: MessageGroup;
  currentUserId: string;
  deliveryStatus: Record<string, MessageStatus>;
  selectedUser: User;
}) => {
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 py-1 text-xs text-muted-foreground rounded-full">
            {formatMessageDate(group.date)}
          </span>
        </div>
      </div>
      {group.messages.map((msg, msgIndex) => {
        const isCurrentUser = msg.fromId === currentUserId;
        const prevMsg = group.messages[msgIndex - 1];
        const nextMsg = group.messages[msgIndex + 1];

        const shouldGroupWithPrev =
          prevMsg &&
          prevMsg.fromId === msg.fromId &&
          new Date(msg.timestamp).getTime() -
            new Date(prevMsg.timestamp).getTime() <
            2 * 60 * 1000;

        const shouldGroupWithNext =
          nextMsg &&
          nextMsg.fromId === msg.fromId &&
          new Date(nextMsg.timestamp).getTime() -
            new Date(msg.timestamp).getTime() <
            2 * 60 * 1000;

        return (
          <MessageBubble
            key={msg.messageId}
            message={msg}
            isCurrentUser={isCurrentUser}
            selectedUser={selectedUser}
            showMetadata={!shouldGroupWithNext}
            shouldGroupWithPrev={shouldGroupWithPrev}
            shouldGroupWithNext={shouldGroupWithNext}
            deliveryStatus={deliveryStatus}
          />
        );
      })}
    </div>
  );
};

const formatMessageDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }
};

const EmptyMessageState = ({ message }: { message: string }) => (
  <ScrollArea className="flex-1">
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center space-y-3">
        <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  </ScrollArea>
);

export function MessageList({ currentUserId, selectedUser }: MessageListProps) {
  const {
    subscribeToMessages,
    subscribeToMessageStatus,
  } = useChat();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messageStatuses, setMessageStatuses] = useState<
    Record<string, MessageStatus>
  >({});
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const currentUserEmail = user?.email || "";

  const generateRoomId = (email1: string, email2: string): string => {
    const emails = [email1.toLowerCase(), email2.toLowerCase()].sort();
    return `room_${emails[0]}_${emails[1]}`;
  };

  const roomIdFromEmails =
    selectedUser && currentUserEmail
      ? generateRoomId(currentUserEmail, selectedUser.email)
      : null;

  // Reset scroll position when conversation changes (no API call here)
  useEffect(() => {
    setShouldScrollToBottom(true);
  }, [selectedUser?.uid]);
  


  // Fetch messages from DB with infinite scroll
  const fetchDBMessages = async ({
    pageParam = undefined,
  }: {
    pageParam?: string;
  }) => {
    if (!roomIdFromEmails) {
      return { messages: [], nextCursor: null, hasMore: false };
    }

    const params = new URLSearchParams({
      roomId: roomIdFromEmails,
      limit: "50",
    });

    if (pageParam) {
      params.append("cursor", pageParam);
    }

    const response = await fetcher(`/api/messages?${params.toString()}`);
    console.log("[message-list] DB fetch messages:", response);

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to fetch messages");
    }

    const transformedMessages: ChatMessage[] = (response.messages || []).map(
      (msg: any) => ({
        messageId: msg.id,
        message: msg.content,
        timestamp: msg.createdAt,
        fromId: msg.senderId,
        toId:
          msg.senderId === currentUserId ? selectedUser!.uid : currentUserId,
        roomId: [currentUserId, selectedUser!.uid].sort().join("_"), // Socket format
        metaData: msg.sender,
        toData: undefined,
      })
    );

    return {
      messages: transformedMessages,
      nextCursor: response.nextCursor,
      hasMore: response.hasMore,
    };
  };

  const {
    data: dbData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingDB,
    isError: isDBError,
    error: dbError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["messages", roomIdFromEmails],
    queryFn: fetchDBMessages,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!roomIdFromEmails && !!selectedUser,
    // Use 30 second stale time - trust cache for recent data
    // Socket handles realtime updates, so we don't need to refetch constantly
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10, // Keep in garbage collection cache for 10 minutes
    // Only refetch the first page when the query becomes stale, not all pages
    //refetchOnMount: "always",
    //refetchOnWindowFocus: false,
  });

  // DB messages (historical) - already deduplicated and sorted
  const allMessages = (dbData?.pages.flatMap((page) => page.messages) ?? [])
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

  // Subscribe to message status updates
  useEffect(() => {
    const handleStatusChange = (
      messageId: string,
      newStatus: MessageStatus
    ) => {
      const previousStatus = messageStatuses[messageId];
      if (previousStatus !== newStatus) {
        if (newStatus === "sent") {
          statusSounds?.sent.play().catch(() => {});
        }
      }
    };

    const unsubscribe = subscribeToMessageStatus((messageId, status) => {
      handleStatusChange(messageId, status as MessageStatus);
      setMessageStatuses((prev) => ({
        ...prev,
        [messageId]: status as MessageStatus,
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeToMessageStatus, messageStatuses]);

  // Subscribe to realtime messages from socket and update TanStack Query cache directly
  useEffect(() => {
    if (!selectedUser || !roomIdFromEmails) return;

    const roomId = [currentUserId, selectedUser.uid].sort().join("_");

    const handleNewMessage = (message: ChatMessage) => {
      if (message.roomId === roomId) {
        // Update TanStack Query cache directly with the new message
        queryClient.setQueryData(
          ["messages", roomIdFromEmails],
          (oldData: any) => {
            if (!oldData?.pages?.length) {
              // If no existing data, create initial structure
              return {
                pages: [{ messages: [message], nextCursor: null, hasMore: false }],
                pageParams: [undefined],
              };
            }

            // Check if message already exists in any page
            const messageExists = oldData.pages.some((page: any) =>
              page.messages.some((m: ChatMessage) => m.messageId === message.messageId)
            );

            if (messageExists) return oldData;

            // Add new message to the first page (most recent)
            const newPages = [...oldData.pages];
            newPages[0] = {
              ...newPages[0],
              messages: [...newPages[0].messages, message],
            };

            return {
              ...oldData,
              pages: newPages,
            };
          }
        );
        
        // Play sound for incoming messages from others
        if (message.fromId !== currentUserId) {
          // You could add a message received sound here
        }
        
        // Auto-scroll to bottom for new messages
        setShouldScrollToBottom(true);
      }
    };

    const unsubscribe = subscribeToMessages(handleNewMessage);

    return () => {
      unsubscribe();
    };
  }, [selectedUser, currentUserId, subscribeToMessages, roomIdFromEmails, queryClient]);

  // Auto-scroll to bottom when new messages arrive (only if shouldScrollToBottom is true)
  useEffect(() => {
    if (!shouldScrollToBottom) return;
    
    if (scrollRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [allMessages.length, selectedUser, shouldScrollToBottom]);

  // Handle scroll to load more messages from DB
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearTop = target.scrollTop < 100;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;

    // When user scrolls up, disable auto-scroll to bottom
    if (!isNearBottom) {
      setShouldScrollToBottom(false);
    } else {
      setShouldScrollToBottom(true);
    }

    // Fetch older messages from DB when near top
    if (isNearTop && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Add this helper function to group messages by date
  const groupMessagesByDate = (messages: ChatMessage[]): MessageGroup[] => {
    const groups: Record<string, ChatMessage[]> = {};

    messages.forEach((message) => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }));
  };

  if (!selectedUser) {
    return <EmptyMessageState message="Select a user to start chatting" />;
  }

  const roomId = [currentUserId, selectedUser.uid].sort().join("_");

  // Show loading state while fetching initial messages from DB
  if (isLoadingDB) {
    return (
      <ScrollArea className="flex-1">
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  // Show error state with retry option
  if (isDBError) {
    return (
      <ScrollArea className="flex-1">
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center space-y-3">
            <div className="bg-destructive/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
              <AlertCircleIcon className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">
              {dbError instanceof Error ? dbError.message : "Failed to load messages"}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (allMessages.length === 0) {
    return (
      <EmptyMessageState message="No messages yet. Start the conversation!" />
    );
  }

  return (
    <ScrollArea
      ref={scrollAreaRef}
      className="flex-1"
      onScrollCapture={handleScroll}
    >
      <div className="px-4 py-6">
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Button variant="ghost" size="sm" disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading more messages...
            </Button>
          </div>
        )}
        <div ref={scrollRef} className="space-y-6 max-w-3xl mx-auto">
          {groupMessagesByDate(allMessages).map((group) => (
            <div key={group.date} className="space-y-4">
              <div className="sticky top-2 z-10">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-3 text-xs text-muted-foreground rounded-full border shadow-xs">
                      {formatMessageDate(group.date)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {group.messages.map((msg, msgIndex) => {
                  const isCurrentUser = msg.fromId === currentUserId;
                  const prevMsg = group.messages[msgIndex - 1];
                  const nextMsg = group.messages[msgIndex + 1];

                  const shouldGroupWithPrev =
                    prevMsg &&
                    prevMsg.fromId === msg.fromId &&
                    new Date(msg.timestamp).getTime() -
                      new Date(prevMsg.timestamp).getTime() <
                      2 * 60 * 1000;

                  const shouldGroupWithNext =
                    nextMsg &&
                    nextMsg.fromId === msg.fromId &&
                    new Date(nextMsg.timestamp).getTime() -
                      new Date(msg.timestamp).getTime() <
                      2 * 60 * 1000;

                  return (
                    <MessageBubble
                      key={msg.messageId}
                      message={msg}
                      isCurrentUser={isCurrentUser}
                      selectedUser={selectedUser}
                      showMetadata={!shouldGroupWithNext}
                      shouldGroupWithPrev={shouldGroupWithPrev}
                      shouldGroupWithNext={shouldGroupWithNext}
                      deliveryStatus={messageStatuses}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
