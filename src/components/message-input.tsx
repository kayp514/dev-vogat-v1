"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { Send, Paperclip, Smile, Image, FileText, Mic } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { init } from "emoji-mart";

init({ data });

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const debouncedIsTyping = useDebounce(isTyping, 1000);

  useEffect(() => {
    // Notify when typing status changes
    onTyping(debouncedIsTyping);

    // When typing stops, reset after delay
    if (!debouncedIsTyping && isTyping) {
      setIsTyping(false);
    }
  }, [debouncedIsTyping, isTyping, onTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Set typing status when user types
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
    }

    // Clear typing status when input is empty
    if (isTyping && !e.target.value.trim()) {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      await onSendMessage(message);
      setMessage("");
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage((prev) => prev + emoji.native);
  };

  return (
    <div className="p-2 border-t bg-background sticky bottom-0 z-20 w-full">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-center gap-2 max-w-full">
          <div className="absolute left-0 flex items-center pl-3 gap-1.5 z-10">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-accent"
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-56 p-0">
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    className="flex items-center justify-start gap-2 px-3 py-2 h-auto"
                  >
                    <Image className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Image</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex items-center justify-start gap-2 px-3 py-2 h-auto"
                  >
                    <FileText className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Document</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex items-center justify-start gap-2 px-3 py-2 h-auto"
                  >
                    <Mic className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Audio</span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-accent"
                >
                  <Smile className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="w-[352px] p-0"
              >
                <Picker
                  onEmojiSelect={handleEmojiSelect}
                  set="native"
                  theme="auto"
                  previewPosition="none"
                  skinTonePosition="search"
                  noCountryFlags="false"
                  maxFrequentRows={0}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="flex-1 pl-20 pr-12 py-6 rounded-full bg-muted/50 border-muted focus-visible:ring-1 focus-visible:ring-primary"
          />

          <div className="absolute right-0 flex items-center pr-3">
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!message.trim() || disabled}
              className={`rounded-full h-8 w-8 transition-colors ${
                message.trim() && !disabled
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
