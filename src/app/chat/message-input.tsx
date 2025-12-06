'use client'

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, Smile } from 'lucide-react'
import { useDebounce } from "@/hooks/use-debounce"

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>
  onTyping: (isTyping: boolean) => void
  disabled?: boolean
}

export function MessageInput({ 
  onSendMessage, 
  onTyping, 
  disabled = false 
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Debounce typing status to avoid too many events
  const debouncedIsTyping = useDebounce(isTyping, 1000)
  
  useEffect(() => {
    // Notify when typing status changes
    onTyping(debouncedIsTyping)
    
    // When typing stops, reset after delay
    if (!debouncedIsTyping && isTyping) {
      setIsTyping(false)
    }
  }, [debouncedIsTyping, isTyping, onTyping])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    
    // Set typing status when user types
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true)
    }
    
    // Clear typing status when input is empty
    if (isTyping && !e.target.value.trim()) {
      setIsTyping(false)
    }
  }

  const handleSendMessage = async () => {
    if (message.trim()) {
      await onSendMessage(message)
      setMessage("")
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="p-4 border-t bg-background sticky bottom-0 z-10">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full hover:bg-accent"
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Attach file</span>
        </Button>
        
        <Input
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 pl-20 pr-12 py-6 rounded-full bg-muted/50 border-muted focus-visible:ring-1 focus-visible:ring-primary"
          disabled={disabled}
        />
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="shrink-0"
          disabled={disabled}
        >
          <Smile className="h-5 w-5" />
          <span className="sr-only">Add emoji</span>
        </Button>
        
        <Button 
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled}
          size="icon" 
          className="shrink-0"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  )
}
