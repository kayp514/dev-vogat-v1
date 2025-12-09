"use client";

import type { User } from "@/lib/db/types";
import { useState } from "react";
import { useSearch } from "@/hooks/use-search";
import { useChat } from "@/ternsecure-realtime";
import { Search, Plus, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend?: (user: User, message: string) => void;
}

export function NewMessageDialog(props: NewMessageDialogProps) {
  const { open, onOpenChange, onSend } = props;
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { users, searchQuery, isPending, updateSearchQuery } = useSearch();
  const { sendMessage } = useChat();

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = async () => {
    if (!selectedUser || !message.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch("api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: selectedUser.uid,
          content: message.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to send message");
      }

      // Send the message via socket after DB save is successful
      await sendMessage(message.trim(), selectedUser.uid, selectedUser);

      onOpenChange(false);
      setSelectedUser(null);
      setMessage("");
      updateSearchQuery("");

      if (onSend) {
        onSend(selectedUser, message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        side="right"
        sideOffset={10}
      >
        <div className="p-4 border-b">
          <h4 className="font-medium text-sm">New Conversation</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Start chatting with a contact or phone number
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="recipient"
                placeholder="Search contacts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => updateSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && !selectedUser && (
              <div className="border rounded-md max-h-40 overflow-y-auto mt-2 bg-background">
                {isPending ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.uid}
                      className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm overflow-hidden">
                        <div className="font-medium truncate">{user.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Initial message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Type message..."
              className="min-h-[80px] max-h-[290px] resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleStartChat}
            disabled={!selectedUser || !message.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4 mr-2" />
            )}
            Start Conversation
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
