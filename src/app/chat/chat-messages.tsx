'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Phone, Video, MoreVertical, ImageIcon, Paperclip, Smile, Mic } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { type Chat, type Message } from "../types/chat"
import { cn } from "@/lib/utils"

interface ChatMessagesProps {
  selectedChat: Chat | null
}

export function ChatMessages({ selectedChat }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Simulate typing indicator
  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      const timer = setTimeout(() => {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 3000)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [messages.length, selectedChat])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        sender: "You",
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
      setNewMessage("")
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  return (
    <Card className={cn(
      "flex h-[calc(100vh-3.5rem)] flex-col rounded-none border-0",
      "w-full transition-all duration-300 ease-in-out"
    )}>
      {/* Header */}
      <CardHeader className="border-b px-6 py-3 shrink-0">
        {selectedChat ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={selectedChat.avatar} />
                  <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                </Avatar>
                <span className={cn(
                  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                  "transition-colors duration-300",
                  selectedChat.status === 'online' && "bg-green-500",
                  selectedChat.status === 'busy' && "bg-yellow-500",
                  selectedChat.status === 'offline' && "bg-gray-400"
                )} />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                  {selectedChat.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedChat.status === 'online' ? 'Active now' : 'Last seen recently'}
                </p>
              </div>
            </div>

            <TooltipProvider>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-accent hover:text-accent-foreground"
                    >
                      <Phone className="h-4 w-4" />
                      <span className="sr-only">Voice Call</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Voice Call</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-accent hover:text-accent-foreground"
                    >
                      <Video className="h-4 w-4" />
                      <span className="sr-only">Video Call</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Video Call</TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-accent hover:text-accent-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>View contact info</DropdownMenuItem>
                    <DropdownMenuItem>Search in conversation</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Block contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipProvider>
          </div>
        ) : (
          <p className="text-muted-foreground">Select a chat to start messaging</p>
        )}
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-hidden p-0">
        {selectedChat ? (
          <ScrollArea 
            ref={scrollAreaRef} 
            className="h-full px-6"
            type="always"
          >
            <div className="flex flex-col gap-6 py-6 max-w-3xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.sender === "You" ? "flex-row-reverse" : ""
                  )}
                >
                  {message.sender !== "You" && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedChat.avatar} />
                      <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5",
                    message.sender === "You" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    <p className="text-sm leading-relaxed break-words">
                      {message.content}
                    </p>
                    <p className={cn(
                      "mt-1 text-[11px]",
                      message.sender === "You"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedChat.avatar} />
                    <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl px-4 py-2.5">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce [animation-delay:0.2s]">●</span>
                      <span className="animate-bounce [animation-delay:0.4s]">●</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Select a chat to view messages</p>
          </div>
        )}
      </CardContent>

      {/* Message Input */}
      {selectedChat && (
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex w-full max-w-3xl mx-auto gap-3">
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      className="rounded-full hover:bg-accent hover:text-accent-foreground"
                    >
                      <Paperclip className="h-5 w-5" />
                      <span className="sr-only">Attach file</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach file</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      className="rounded-full hover:bg-accent hover:text-accent-foreground"
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span className="sr-only">Send image</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send image</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                className="min-h-[44px] max-h-32 pe-20 resize-none rounded-xl pr-20"
                rows={1}
              />
              <div className="absolute right-3 top-2.5 flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full hover:bg-accent hover:text-accent-foreground"
                      >
                        <Smile className="h-5 w-5" />
                        <span className="sr-only">Add emoji</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add emoji</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-accent hover:text-accent-foreground"
                      >
                        <Mic className="h-5 w-5" />
                        <span className="sr-only">Voice message</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Voice message</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <Button 
              type="submit" 
              size="icon" 
              className="h-11 w-11 shrink-0 rounded-xl"
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </CardFooter>
      )}
    </Card>
  )
}

