'use client'

import { Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Chat } from "../types/chat"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  selectedChatId: string | number;
}

export function ChatList({ onChatSelect, selectedChatId }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<'all' | 'online' | 'unread'>('all')

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'online' && chat.status === 'online') ||
                         (filter === 'unread' && Math.random() > 0.7) // Simulated unread state

    return matchesSearch && matchesFilter
  })

  return (
    <Card className={cn(
      "h-full border-r rounded-none transition-all duration-300 ease-in-out",
      "w-[320px]"
    )}>
      <CardHeader className="p-4 space-y-4 pb-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight">Messages</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter Messages</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilter('all')}>
                All Messages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('online')}>
                Online Contacts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('unread')}>
                Unread Messages
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="space-y-0.5">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 text-left transition-all",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  selectedChatId === chat.id && "bg-accent/60 text-accent-foreground",
                )}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                    "transition-colors duration-300",
                    chat.status === 'online' && "bg-green-500",
                    chat.status === 'busy' && "bg-yellow-500",
                    chat.status === 'offline' && "bg-gray-400"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-medium truncate text-sm">
                      {chat.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {Math.random() > 0.7 && ( // Simulated unread state
                        <Badge 
                          variant="secondary" 
                          className="h-5 w-5 rounded-full p-0 flex items-center justify-center"
                        >
                          {Math.floor(Math.random() * 5) + 1}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {chat.timestamp}
                      </span>
                    </div>
                  </div>
                  <p className={cn(
                    "text-xs text-muted-foreground truncate leading-relaxed",
                    "group-hover:text-accent-foreground/70",
                    selectedChatId === chat.id && "text-accent-foreground/70"
                  )}>
                    {chat.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

const chats: Chat[] = [
  {
    id: "1",
    name: "Alice Smith",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "Hey, how are you?",
    timestamp: "2m ago",
    status: "online",
  },
  {
    id: "2",
    name: "Bob Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "Can we schedule a meeting?",
    timestamp: "1h ago",
    status: "busy",
  },
  {
    id: "3",
    name: 'Leslie Alexander',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'Explicabo nihil m. Sed est rcitatieniet.',
    timestamp: '1d ago',
    status: "online",
  },
  {
    id: "4",
    name: 'Michael Foster',
    avatar:
      'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'L incidum itaque aut perferendis.',
    timestamp: '2d ago',
    status: "busy",
  },
  {
    id: "5",
    name: 'Dries Vincent',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'Quia animi hara corporis nisi.',
    timestamp: '2d ago',
    status: "offline",
  },
  {
    id: "6",
    name: 'Lindsay Walton',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'Unde dolore euearubus culpa illum.',
    timestamp: '3d ago',
    status: "offline",
  },
  {
    id: "7",
    name: 'Lindsay Walton',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'Unde dolore execulpa illum.',
    timestamp: '3d ago',
    status: "offline",
  },
  {
    id: "8",
    name: 'Lindsay Walton',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'Unde dolore illum.',
    timestamp: '3d ago',
    status: "online",
  },
  {
    id: "9",
    name: 'Lindsay Walton',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'Unde dolore exercitus culpa illum.',
    timestamp: '3d ago',
    status: "online"
  },
  {
    id: "10",
    name: 'Lindsay Walton',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'Undeut c culpa illum.',
    timestamp: '3d ago',
    status: "online"
  },
  {
    id: "11",
    name: 'Lindsay Walton',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'Unde dolore exercitaus culpa illum.',
    timestamp: '3d ago',
    status: "online"
  },
  {
    id: "12",
    name: 'Lindsay Walton',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'Unde dolore exercitata illum.',
    timestamp: '3d ago',
    status: "busy"
  },
  {
    id: "13",
    name: 'Lindsay Walton',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'Unde dolore exercitationem nobis  illum.',
    timestamp: '3d ago',
    status: "busy"
  },
  {
    id: "14",
    name: 'Leslie Alexander',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'Explicabo nihil m. Sed est rcitatieniet.',
    timestamp: '1d ago',
    status: "online"
  },
  {
    id: "15",
    name: 'Dries Vincent',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage:
      'Quia animi hara corporis nisi.',
    timestamp: '2d ago',
    status: "busy"
  },
]

