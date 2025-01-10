import { useState, useEffect, useRef } from 'react'
import { Divide, SendHorizontal, PlusCircle , Phone, Video, MoreVertical} from 'lucide-react';
import { TooltipProvider, TooltipTrigger, Tooltip, TooltipContent } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { type Chat, type Message } from "../types/chat"
import { cn } from "@/lib/utils"

interface ChatMessagesProps {
  selectedChat: Chat | null;
}

export function ChatMessages({ selectedChat }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = scrollHeight > 200 ? '200px' : `${scrollHeight}px`
    }
  }, [newMessage])

  
    return (
      <Card className={cn(
        "flex h-[calc(100vh-3.5rem)] flex-col rounded-none border-0",
        "w-full transition-all duration-300 ease-in-out"
      )}>
        <CardHeader className="border-b px-6 py-4 p-4 shrink-0">
        {selectedChat ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 shrink-0 border">
                    <AvatarImage src={selectedChat.avatar} />
                    <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                    selectedChat.status === 'online' 
                      ? 'bg-green-500' 
                      : selectedChat.status === 'busy'
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`} />
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

              <div className="flex items-center gap-2">
              <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9 rounded-full",
                        "hover:bg-primary/10 hover:text-primary",
                        "transition-colors duration-200"
                      )}
                      onClick={() => {/* Handle voice call */}}
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
                      className={cn(
                        "h-9 w-9 rounded-full",
                        "hover:bg-primary/10 hover:text-primary",
                        "transition-colors duration-200"
                      )}
                      onClick={() => {/* Handle video call */}}
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
                      className={cn(
                        "h-9 w-9 rounded-full",
                        "hover:bg-primary/10 hover:text-primary",
                        "transition-colors duration-200"
                      )}
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>View contact info</DropdownMenuItem>
                    <DropdownMenuItem>Search in conversation</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Block contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            </div>
          </div>
          ) : (
            <p className="text-muted-foreground">Select a chat to start messaging</p>
          )}
        </CardHeader>
  
        <CardContent className="flex-1 overflow-hidden p-0">
        {selectedChat ? (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 w-full ${
                    message.sender === "You" ? "flex-row-reverse" : ""
                  }`}
                >
                  {message.sender !== "You" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={selectedChat.avatar} />
                      <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      message.sender === "You"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    <p className={`mt-1 text-[11px] ${
                      message.sender === "You"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">Select a chat to view messages</p>
                    </div>
                  )}
        </CardContent>

        {selectedChat && (
        <CardFooter className="border-t p-4 shrink-0">
          <form onSubmit={handleSendMessage} className="flex w-full max-w-4xl mx-auto gap-3">
            <Textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-11 w-11 shrink-0 rounded-xl"
            >
              <SendHorizontal className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </CardFooter>
        )
        }
      </Card>
    )
      {/* <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Messages</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button>
                  <PlusCircle className="h-5 w-5 text-gray-600 hover:text-indigo-600" />
                  </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>New message</p>
                  </TooltipContent>
                  </Tooltip>
                  </TooltipProvider>
        </div>
          <ScrollArea  className="flex-1">
            <ul className="divide-y divide-gray-100">
              {conversations.map((comment) => (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                    <li key={comment.id}
        className={`px-2 py-2  flex cursor-pointer hover:bg-gray-100 ${selectedConversation.id === comment.id ? 'bg-gray-100' : ''}`}
        onClick={() => setSelectedConversation(comment)}
        >
          <img alt="" src={comment.imageUrl} className="h-8 w-8 flex-none rounded-full bg-gray-50" />
          <div className="flex-auto">
            <div className="flex items-baseline justify-between gap-x-4">
              <p className="text-sm px-2 font-semibold leading-6 text-gray-900">{comment.name}</p>
              <p className="flex-none text-xs text-gray-600">
                <time dateTime={comment.dateTime}>{comment.date}</time>
              </p>
            </div>
            <p className="line-clamp-2 text-sm leading-6 text-gray-600">{comment.content}</p>
          </div>
        </li>
        </TooltipTrigger>
        <TooltipContent>
          <p>{comment.name}</p>
        </TooltipContent>
        </Tooltip>
        </TooltipProvider>
      ))}
    </ul>
    </ScrollArea>
  </div> 
 
  <div className="flex-1 flex flex-col overflow-hidden">
  <div className="h-full w-full flex flex-col bg-white">
    <div className="flex-1 overflow-hidden">
      <div className="h-full flex flex-col ">
      <div className="px-4 py-4 flex border-b bg-white">
            <img alt="" src={selectedConversation.imageUrl} className="h-8 w-8 rounded-full" />
              <h2 className="text-lg pl-3 font-semibold">{selectedConversation.name}</h2>
            </div>
            <ScrollArea className="flex-1 p-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex px-8 py-2 ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                  <div
                      className={` p-3 rounded-lg ${
                        message.sender === 'You' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                      }`}
                    >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-2">
            <form onSubmit={handleSendMessage}>
            <div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
                <textarea
                ref={textareaRef}
                id="comment"
                name="comment"
                rows={1}
                placeholder="Type a message..."
                value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ maxHeight: '200px' }}
            className="block w-full px-2 resize-none border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
          />
          </div>
          <div className="flex justify-between pt-2">
          <div className="flex-shrink-0">
          <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="submit">
                    <SendHorizontal className="h-6 w-6 hover:text-indigo-600 text-gray-600" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Send</p>
                    </TooltipContent>
                    </Tooltip>
                    </TooltipProvider>
          </div>
          </div>
        </form>
        </div>
        </div>
        </div>
        </div>
    */}
    
      

}

const conversations = [
  {
    id: 1,
    name: 'Leslie Alexander',
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'Explicabo nihil m. Sed est rcitatieniet.',
    date: '1d ago',
    dateTime: '2023-03-04T15:54Z',
  },
  {
    id: 2,
    name: 'Michael Foster',
    imageUrl:
      'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'L incidum itaque aut perferendis.',
    date: '2d ago',
    dateTime: '2023-03-03T14:02Z',
  },
  {
    id: 3,
    name: 'Dries Vincent',
    imageUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'Quia animi hara corporis nisi.',
    date: '2d ago',
    dateTime: '2023-03-03T13:23Z',
  },
  {
    id: 4,
    name: 'Lindsay Walton',
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'Unde dolore euearubus culpa illum.',
    date: '3d ago',
    dateTime: '2023-03-02T21:13Z',
  },
  {
    id: 5,
    name: 'Lindsay Walton',
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'Unde dolore execulpa illum.',
    date: '3d ago',
    dateTime: '2023-03-02T21:13Z',
  },
  {
    id: 6,
    name: 'Lindsay Walton',
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'Unde dolore illum.',
    date: '3d ago',
    dateTime: '2023-03-02T21:13Z',
  },
  {
    id: 7,
    name: 'Lindsay Walton',
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'Unde dolore exercitus culpa illum.',
    date: '3d ago',
    dateTime: '2023-03-02T21:13Z',
  },
  {
    id: 8,
    name: 'Lindsay Walton',
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'Undeut c culpa illum.',
    date: '3d ago',
    dateTime: '2023-03-02T21:13Z',
  },
  {
    id: 9,
    name: 'Lindsay Walton',
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'Unde dolore exercitaus culpa illum.',
    date: '3d ago',
    dateTime: '2023-03-02T21:13Z',
  },
  {
    id: 10,
    name: 'Lindsay Walton',
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'Unde dolore exercitata illum.',
    date: '3d ago',
    dateTime: '2023-03-02T21:13Z',
  },
  {
    id: 11,
    name: 'Lindsay Walton',
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'Unde dolore exercitationem nobis  illum.',
    date: '3d ago',
    dateTime: '2023-03-02T21:13Z',
  },
  {
    id: 12,
    name: 'Leslie Alexander',
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'Explicabo nihil m. Sed est rcitatieniet.',
    date: '1d ago',
    dateTime: '2023-03-04T15:54Z',
  },
  {
    id: 13,
    name: 'Dries Vincent',
    imageUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    content:
      'Quia animi hara corporis nisi.',
    date: '2d ago',
    dateTime: '2023-03-03T13:23Z',
  },
]

  const mockMessages = [
    { id: 1, sender: "Alice", content: "Hey, how are you?", timestamp: "10:00 AM" },
    { id: 2, sender: "You", content: "I'm good, thanks! How about you?", timestamp: "10:05 AM" },
    { id: 3, sender: "Alice", content: "Doing well! Any plans for the weekend?", timestamp: "10:10 AM" },
    { id: 4, sender: "You", content: "Not yet, maybe catch a movie. You?", timestamp: "10:15 AM" },
  ]