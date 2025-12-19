"use client";

import { useState } from "react";
import { MessageSquare, Users } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewMessageDialog } from "@/components/new-message-dialog";
import { ConversationFilter } from "@/components/chat-filters";

type ConversationHeaderProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filterOptions: {
    showOnlineOnly: boolean;
    showUnreadOnly: boolean;
  };
  setFilterOptions: (options: {
    showOnlineOnly: boolean;
    showUnreadOnly: boolean;
  }) => void;
};

export function ConversationHeader(props: ConversationHeaderProps) {
  const { filterOptions, setFilterOptions } = props;
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="p-3 border-b bg-background/80 backdrop-blur-xs sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Messages</h2>
          <div className="flex items-center gap-2">
            <NewMessageDialog
              open={isNewMessageOpen}
              onOpenChange={setIsNewMessageOpen}
            />
            <ConversationFilter
              filterOptions={filterOptions}
              setFilterOptions={setFilterOptions}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-background sticky top-[57px] z-10">
        <TabsList className="w-full rounded-none border-b p-0 h-12 grid grid-cols-2 gap-0">
          <TabsTrigger
            value="chats"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center justify-center gap-2 transition-all h-full"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium">Chats</span>
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center justify-center gap-2 transition-all h-full"
          >
            <Users className="h-4 w-4" />
            <span className="font-medium">Contacts</span>
          </TabsTrigger>
        </TabsList>
      </div>
    </>
  );
}
