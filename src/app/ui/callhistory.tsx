'use client'

import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { PhoneCall, PhoneOutgoing, PhoneMissed, Voicemail, Phone, Clock, CalendarDays, Filter } from 'lucide-react'
import { cn } from "@/lib/utils"
import { type ChatStatus } from "../types/chat"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type CallType = 'incoming' | 'outgoing' | 'missed' | 'voicemail'
type FilterType = 'all' | CallType
type TimeFilter = 'all' | 'today' | 'week' | 'month'

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
  notes?: string
}

const callTypeConfig = {
  incoming: { 
    icon: PhoneCall, 
    color: 'text-green-500',
    label: 'Incoming',
    bgColor: 'bg-green-50 dark:bg-green-950/50',
    borderColor: 'border-green-200 dark:border-green-900'
  },
  outgoing: { 
    icon: PhoneOutgoing, 
    color: 'text-blue-500',
    label: 'Outgoing',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    borderColor: 'border-blue-200 dark:border-blue-900'
  },
  missed: { 
    icon: PhoneMissed, 
    color: 'text-red-500',
    label: 'Missed',
    bgColor: 'bg-red-50 dark:bg-red-950/50',
    borderColor: 'border-red-200 dark:border-red-900'
  },
  voicemail: { 
    icon: Voicemail, 
    color: 'text-yellow-500',
    label: 'Voicemail',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/50',
    borderColor: 'border-yellow-200 dark:border-yellow-900'
  },
}

export default function CallHistory() {
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')

  const filterByTime = (item: CallHistoryItem) => {
    const now = new Date()
    const itemDate = new Date(item.date)
    
    switch (timeFilter) {
      case 'today':
        return itemDate.toDateString() === now.toDateString()
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7))
        return itemDate > weekAgo
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
        return itemDate > monthAgo
      default:
        return true
    }
  }

  const filteredHistory = callHistory.filter(item => {
    const matchesType = typeFilter === 'all' || item.type === typeFilter
    const matchesTime = filterByTime(item)
    return matchesType && matchesTime
  })

  const stats = {
    total: filteredHistory.length,
    missed: filteredHistory.filter(item => item.type === 'missed').length,
    duration: filteredHistory.reduce((acc, item) => {
      if (item.duration) {
        const [mins, secs] = item.duration.split('m ').map(n => parseInt(n))
        return acc + (mins * 60) + (secs || 0)
      }
      return acc
    }, 0)
  }

  return (
    <Card className="h-full border-0 rounded-none shadow-none">
      <CardHeader className="space-y-4 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Call History</CardTitle>
            <CardDescription>View and manage your recent calls</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Time Range
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by time</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTimeFilter('all')}>
                All time
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter('today')}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter('week')}>
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter('month')}>
                Last 30 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Total Calls</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <PhoneMissed className="h-4 w-4 text-red-500" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Missed Calls</p>
                  <p className="text-xl font-bold">{stats.missed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Total Duration</p>
                  <p className="text-xl font-bold">
                    {Math.floor(stats.duration / 60)}m {stats.duration % 60}s
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setTypeFilter(v as FilterType)}>
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="all" className="gap-2">
              All
            </TabsTrigger>
            {Object.entries(callTypeConfig).map(([type, config]) => (
              <TabsTrigger key={type} value={type} className="gap-2">
                <config.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="divide-y divide-border">
            {filteredHistory.map((item) => (
              <CallHistoryItem key={item.id} item={item} />
            ))}
            {filteredHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No calls found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            )}
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
    <TooltipProvider>
      <div className="group flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={item.user.imageUrl} alt={item.user.name} />
            <AvatarFallback>{item.user.name[0]}</AvatarFallback>
          </Avatar>
          {item.user.status && (
            <span className={cn(
              "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
              item.user.status === 'online' && "bg-green-500",
              item.user.status === 'busy' && "bg-yellow-500",
              item.user.status === 'offline' && "bg-gray-400"
            )} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{item.user.name}</p>
                <Badge 
                  variant="outline"
                  className={cn(
                    "h-5 gap-1 px-1 text-xs font-normal",
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  <Icon className={cn("h-3 w-3", config.color)} />
                  <span className={config.color}>{config.label}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {item.duration && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.duration}
                  </span>
                )}
                <Tooltip>
                  <TooltipTrigger className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <time className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {getRelativeTime(item.date)}
                    </time>
                  </TooltipTrigger>
                  <TooltipContent>
                    {item.date.toLocaleString()}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <Phone className="h-4 w-4" />
                <span className="sr-only">Call {item.user.name}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 rounded-full"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View contact</DropdownMenuItem>
                  <DropdownMenuItem>Add to contacts</DropdownMenuItem>
                  <DropdownMenuItem>Block number</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    Delete from history
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {item.notes && (
            <>
              <Separator className="my-2" />
              <p className="text-sm text-muted-foreground">{item.notes}</p>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
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
      status: 'online'
    },
    type: 'incoming',
    duration: '2m 15s',
    date: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    notes: 'Discussed project timeline and next steps'
  },
  {
    id: 2,
    user: {
      name: 'Lindsay Walton',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      status: 'busy'
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
      status: 'offline'
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
    notes: 'Left a message about the client meeting tomorrow'
  },
]

