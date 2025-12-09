"use client";

import { ChatHeader } from "@/components/chat-header";
import { MessageList } from "@/components/message-list";
import type { User } from "@/lib/db/types";
import { useChat } from "@/ternsecure-realtime/ctx/ChatCtx";
import { useWebSkt } from "@/ternsecure-realtime/ctx/SocketWebSktCtx";
import { MessageInput } from "@/components/message-input";
import { MessageSquare } from "lucide-react";

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

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-muted/10">
        <div className="max-w-md">
          <div className="bg-primary/10 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Your messages</h2>
          <p className="text-muted-foreground mb-6">
            Select a conversation or start a new one to begin messaging
          </p>
        </div>
      </div>
    );
  }

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
