"use client";

import type { User } from "@/lib/db/types";
import { useState, useEffect } from "react";
import { useContactSearch } from "@/hooks/use-contact-search";
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

interface Contact {
  uid: string;
  name: string | null;
  email: string;
  avatar: string | null;
  phoneNumber: string | null;
}

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend?: (user: User, message: string) => void;
}

export function NewMessageDialog(props: NewMessageDialogProps) {
  const { open, onOpenChange, onSend } = props;
  const [selectedUser, setSelectedUser] = useState<Contact | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { contacts, searchQuery, isPending, updateSearchQuery, loadContacts } =
    useContactSearch();
  const { sendMessage } = useChat();

  // Load contacts when dialog opens
  useEffect(() => {
    if (open) {
      loadContacts();
    }
  }, [open, loadContacts]);

  // Filter contacts by search query
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = async () => {
    if (!selectedUser || !message.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: selectedUser.uid,
          content: message.trim(),
          type: "direct",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create chat");
      }

      const { chat } = await response.json();

      await sendMessage(message.trim(), chat.recipientId, selectedUser);

      if (onSend) {
        onSend(selectedUser as User, message.trim());
      }

      // Reset and close
      setSelectedUser(null);
      setMessage("");
      updateSearchQuery("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to start chat:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to start chat. Please try again."
      );
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
                ) : filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.uid}
                      className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedUser(contact)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={contact.avatar || undefined} />
                        <AvatarFallback>{contact.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm overflow-hidden">
                        <div className="font-medium truncate">
                          {contact.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {contact.email}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No contacts found
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
