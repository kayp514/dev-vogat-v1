"use client";

import { ChatHeader } from "@/components/chat-header";
import { MessageList } from "@/components/message-list";
import type { User } from "@/lib/db/types";
import { useChat } from "@/ternsecure-realtime/ctx/ChatCtx";
import { useWebSkt } from "@/ternsecure-realtime/ctx/SocketWebSktCtx";
import { MessageInput } from "@/components/message-input";
import { fetcher } from "@/lib/utils";

interface ChatAreaProps {
  selectedUser: User | null;
  onBackToList?: () => void;
  isMobile?: boolean;
}

export function ChatArea({
  selectedUser,
  onBackToList,
  isMobile,
}: ChatAreaProps) {
  const { clientId } = useWebSkt();
  const { sendMessage, setTypingStatus } = useChat();

  const handleSendMessage = async (content: string) => {
    if (selectedUser && content.trim()) {
      // 1. Send message via socket for real-time delivery
      await sendMessage(content, selectedUser.uid, selectedUser);
      
      // 2. Save message to database for persistence
      try {
        await fetcher('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientId: selectedUser.uid,
            content: content.trim(),
            workspaceId: '', // Empty string for direct chats
          }),
        });
      } catch (error) {
        console.error('Failed to save message to database:', error);
        // Message was sent via socket, so don't throw error to user
        // Just log it for debugging
      }
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (selectedUser) {
      setTypingStatus(isTyping, selectedUser.uid);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        selectedUser={selectedUser}
        onBackToList={onBackToList}
        isMobile={isMobile}
      />
      <MessageList currentUserId={clientId} selectedUser={selectedUser} />
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={!selectedUser}
      />
    </div>
  );
}
