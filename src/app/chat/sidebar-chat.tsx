"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import type { User } from "@/lib/db/types";
import { ConversationHeader } from "@/components/conversation-header";
import { Conversation } from "@/components/conversation";
import { Contact } from "@/components/contact";

interface ChatSidebarProps {
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
  onSelectChatUser: (user: User) => void;
}

export function ChatSidebar({
  selectedUser,
  onSelectChatUser,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [filterOptions, setFilterOptions] = useState({
    showOnlineOnly: false,
    showUnreadOnly: false,
  });
  const [activeFilter, setActiveFilter] = useState<
    "all" | "unread" | "favorites"
  >("all");

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <ConversationHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filterOptions={filterOptions}
          setFilterOptions={setFilterOptions}
        />

        <TabsContent
          value="chats"
          className="flex-1 p-0 m-0 overflow-hidden flex flex-col"
        >
          <Conversation
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            activeTab={activeTab}
            selectedUserId={selectedUser?.uid}
            onSelectChat={onSelectChatUser}
          />
        </TabsContent>
        <TabsContent
          value="contacts"
          className="flex-1 p-0 m-0 overflow-hidden flex flex-col"
        >
          <Contact
            selectedUserId={selectedUser?.uid}
            onSelectChat={onSelectChatUser}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
