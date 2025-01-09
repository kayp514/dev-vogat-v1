import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { PhoneCall, PhoneOutgoing, PhoneMissed, Voicemail } from "lucide-react"
import { cn } from "@/lib/utils"
import { type ChatStatus } from "../types/chat"

type CallType = 'incoming' | 'outgoing' | 'missed' | 'voicemail'

interface CallHistoryItem {
  id: number
  user: {
    name: string
    imageUrl: string
    status?: ChatStatus
  }
  type: CallType
  duration: string
  date: Date
}

const callTypeConfig = {
  incoming: { 
    icon: PhoneCall, 
    color: 'text-green-500',
    label: 'Incoming',
    bgColor: 'bg-green-50'
  },
  outgoing: { 
    icon: PhoneOutgoing, 
    color: 'text-blue-500',
    label: 'Outgoing',
    bgColor: 'bg-blue-50'
  },
  missed: { 
    icon: PhoneMissed, 
    color: 'text-red-500',
    label: 'Missed',
    bgColor: 'bg-red-50'
  },
  voicemail: { 
    icon: Voicemail, 
    color: 'text-yellow-500',
    label: 'Voicemail',
    bgColor: 'bg-yellow-50'
  },
}



export default function CallHistory() {
  const [filter, setFilter] = useState<'all' | CallType>('all')

  const filteredHistory = callHistory.filter(item => {
    if (filter === 'all') return true
    return item.type === filter
  })

  return (
    <Card className="h-full border-0 rounded-none shadow-none">
      <CardHeader className="px-6 py-4 border-b space-y-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Call History</h2>
          <div className="flex gap-2">
            {['all', 'missed', 'voicemail'].map((type) => (
              <Button
                key={type}
                variant={filter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(type as typeof filter)}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="divide-y divide-border">
            {filteredHistory.map((item) => (
              <CallHistoryItem key={item.id} item={item} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}


function CallHistoryItem({ item }: { item: CallHistoryItem }) {
  const config = callTypeConfig[item.type]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors">
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={item.user.imageUrl} alt={item.user.name} />
          <AvatarFallback>{item.user.name[0]}</AvatarFallback>
        </Avatar>
        {item.user.status && (
          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
            item.user.status === 'online' 
              ? 'bg-green-500' 
              : item.user.status === 'busy'
              ? 'bg-yellow-500'
              : 'bg-gray-400'
          }`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-sm">{item.user.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                config.bgColor,
                config.color
              )}>
                <Icon className="h-3 w-3" />
                {config.label}
              </span>
              {item.duration && (
                <span className="text-xs text-muted-foreground">
                  {item.duration}
                </span>
              )}
            </div>
          </div>
          <time className="text-xs text-muted-foreground whitespace-nowrap">
            {getRelativeTime(item.date)}
          </time>
        </div>
      </div>
    </div>
  )
}

  function getRelativeTime(date: Date) {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
  
    if (diffInDays > 0) {
      return `${diffInDays}d ago`
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}m ago`
    } else {
      return 'Just now'
    }
  }


const callHistory: CallHistoryItem[] = [
  {
    id: 1,
    user: {
      name: 'Michael Foster',
      imageUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'incoming',
    duration: '2m 15s',
    date: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
  {
    id: 2,
    user: {
      name: 'Lindsay Walton',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'outgoing',
    duration: '1m 32s',
    date: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },
  {
    id: 3,
    user: {
      name: 'Courtney Henry',
      imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'missed',
    duration: '',
    date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
  },
  {
    id: 4,
    user: {
      name: 'Whitney Francis',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'voicemail',
    duration: '37s',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 5,
    user: {
      name: 'Whitney Francis',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'voicemail',
    duration: '37s',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 6,
    user: {
      name: 'Whitney Francis',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'voicemail',
    duration: '37s',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 7,
    user: {
      name: 'Whitney Francis',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'voicemail',
    duration: '37s',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 8,
    user: {
      name: 'Whitney Francis',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'voicemail',
    duration: '37s',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 9,
    user: {
      name: 'Whitney Francis',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'voicemail',
    duration: '37s',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 10,
    user: {
      name: 'Courtney Henry',
      imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'missed',
    duration: '',
    date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
  },
  {
    id: 11,
    user: {
      name: 'Michael Foster',
      imageUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'incoming',
    duration: '2m 15s',
    date: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
]