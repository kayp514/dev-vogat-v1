"use client";

import { ChatHeader } from "@/components/chat-header";
import { MessageList } from "@/components/message-list";
import type { User } from "@/lib/db/types";
import { useChat } from "@/ternsecure-realtime/ctx/ChatCtx";
import { useWebSkt } from "@/ternsecure-realtime/ctx/SocketWebSktCtx";
import { MessageInput } from "@/components/message-input";

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
      await sendMessage(content, selectedUser.uid, selectedUser);
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
