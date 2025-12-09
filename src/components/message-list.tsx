"use client";

import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";
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
      className={cn(
        "flex w-full items-end space-x-2",
        isCurrentUser ? "justify-end" : "justify-start",
        shouldGroupWithPrev ? "mt-0.5" : "mt-3"
      )}
    >
      <div
        className={cn(
          "flex items-end gap-2 max-w-[70%]",
          isCurrentUser && "flex-row-reverse"
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
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
          </div>
          {showMetadata && (
            <div
              className={cn(
                "flex items-center gap-1",
                isCurrentUser ? "justify-end" : "justify-start"
              )}
            >
              <span className="text-xs text-muted-foreground">
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
    getMessages,
    messages,
    subscribeToMessages,
    subscribeToMessageStatus,
  } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageStatuses, setMessageStatuses] = useState<
    Record<string, MessageStatus>
  >({});

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

  useEffect(() => {
    if (!selectedUser) return;

    const roomId = [currentUserId, selectedUser.uid].sort().join("_");
    setLoading(true);

    getMessages(roomId, { limit: 50 })
      .then(() => {
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        setLoading(false);
        setError("Failed to load messages");
      });
  }, [selectedUser, currentUserId, getMessages]);

  useEffect(() => {
    if (!selectedUser) return;

    const roomId = [currentUserId, selectedUser.uid].sort().join("_");

    // Handle new messages
    const handleNewMessage = (message: ChatMessage) => {
      // Only process messages for the current conversation
      if (message.roomId === roomId) {
        // Play sound for incoming messages
        if (message.fromId !== currentUserId) {
          // You could add a message received sound here
        }
      }
    };

    console.log(`Subscribing to real-time messages for room ${roomId}`);

    // Subscribe to new messages
    const unsubscribe = subscribeToMessages(handleNewMessage);

    return () => {
      console.log(`Unsubscribing from real-time messages for room ${roomId}`);
      unsubscribe();
    };
  }, [selectedUser, currentUserId, subscribeToMessages]);

  useEffect(() => {
    if (scrollRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, selectedUser]);

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
  const conversationMessages = messages[roomId] || [];

  if (loading) {
    return <EmptyMessageState message="Loading messages..." />;
  }

  if (error) {
    return <EmptyMessageState message={error} />;
  }

  if (conversationMessages.length === 0) {
    return (
      <EmptyMessageState message="No messages yet. Start the conversation!" />
    );
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1">
      <div className="px-4 py-6">
        <div ref={scrollRef} className="space-y-6 max-w-3xl mx-auto">
          {groupMessagesByDate(conversationMessages).map((group) => (
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
