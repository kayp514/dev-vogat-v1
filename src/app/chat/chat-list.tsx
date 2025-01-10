'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Chat } from "../types/chat"
import { cn } from "@/lib/utils"



interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  selectedChatId: string | number;
}


export function ChatList({ onChatSelect, selectedChatId }: ChatListProps) {

  return (
    <Card className={cn(
      "h-full border-r rounded-none transition-all duration-300 ease-in-out",
      "w-[320px]"
    )}>
      <CardHeader className="p-4 space-y-0 pb-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight">Messages</h2>
          <Badge variant="secondary">12 unread</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat)}
                className={`w-full flex items-center gap-3 p-3 text-left transition-all hover:bg-accent hover:text-accent-foreground ${
                  selectedChatId === chat.id 
                    ? "bg-accent/60 text-accent-foreground" 
                    : ""
                }`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 shrink-0 border">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                    chat.status === 'online' 
                      ? 'bg-green-500' 
                      : chat.status === 'busy'
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-medium truncate text-sm">
                      {chat.name}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {chat.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate leading-relaxed">
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


const chats = [
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
