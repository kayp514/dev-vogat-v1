"use client"

import { useState } from "react"
import { Bell, CheckCircle2, Clock, Filter, MoreVertical, Phone, Search, Trash2, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Mock notification data
const mockNotifications = [
  {
    id: "1",
    type: "message",
    title: "New Message",
    content: 'Alice Brown sent you a message: "Hey, are you available for a quick call?"',
    sender: {
      name: "Alice Brown",
      avatar: "/avatars/01.png",
      initials: "AB",
    },
    timestamp: "Just now",
    read: false,
  },
  {
    id: "2",
    type: "call",
    title: "Missed Call",
    content: "You missed a call from Bob Smith",
    sender: {
      name: "Bob Smith",
      avatar: "/avatars/02.png",
      initials: "BS",
    },
    timestamp: "10 minutes ago",
    read: false,
  },
  {
    id: "3",
    type: "system",
    title: "Account Verified",
    content: "Your account has been successfully verified. You now have full access to all features.",
    timestamp: "Yesterday",
    read: true,
  },
  {
    id: "4",
    type: "mention",
    title: "Mentioned You",
    content: 'Charlie Smith tagged you in a comment: "Thanks @you for your help with the project!"',
    sender: {
      name: "Charlie Smith",
      avatar: "/avatars/03.png",
      initials: "CS",
    },
    timestamp: "2 days ago",
    read: true,
  },
  {
    id: "5",
    type: "calendar",
    title: "Meeting Reminder",
    content: "Your meeting with the Design Team starts in 30 minutes",
    timestamp: "30 minutes ago",
    read: false,
  },
  {
    id: "6",
    type: "document",
    title: "Document Shared",
    content: 'David Johnson shared a document with you: "Q4 Marketing Strategy"',
    sender: {
      name: "David Johnson",
      avatar: "/avatars/04.png",
      initials: "DJ",
    },
    timestamp: "3 days ago",
    read: true,
  },
  {
    id: "7",
    type: "security",
    title: "Security Alert",
    content: "New login detected from an unknown device in San Francisco, CA",
    timestamp: "1 week ago",
    read: true,
  },
  {
    id: "8",
    type: "message",
    title: "New Message",
    content: 'Emma Wilson replied to your thread: "That sounds great! Let\'s proceed with the plan."',
    sender: {
      name: "Emma Wilson",
      avatar: "/avatars/05.png",
      initials: "EW",
    },
    timestamp: "1 week ago",
    read: true,
  },
]

export function NotificationsDisplay({ onBackToList, isMobile }: { onBackToList?: () => void; isMobile?: boolean }) {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications = notifications.filter((notification) => {
    // Filter by tab
    if (activeTab === "unread" && notification.read) return false
    if (activeTab === "system" && notification.type !== "system") return false

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.content.toLowerCase().includes(query) ||
        (notification.sender?.name && notification.sender.name.toLowerCase().includes(query))
      )
    }

    return true
  })

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return (
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
            <Bell className="h-4 w-4 text-blue-600" />
          </div>
        )
      case "call":
        return (
          <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
            <Phone className="h-4 w-4 text-green-600" />
          </div>
        )
      case "system":
        return (
          <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
          </div>
        )
      case "mention":
        return (
          <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
            <User className="h-4 w-4 text-amber-600" />
          </div>
        )
      case "calendar":
        return (
          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center">
            <Clock className="h-4 w-4 text-indigo-600" />
          </div>
        )
      default:
        return (
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell className="h-4 w-4 text-gray-600" />
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBackToList} className="mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-chevron-left"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span className="sr-only">Back</span>
          </Button>
        )}
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="p-4 border-b">
        <div className="flex flex-col gap-4">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                <Badge variant="secondary" className="ml-2">
                  {unreadCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-4 transition-colors hover:bg-muted/50",
                  !notification.read && "bg-muted/50",
                )}
              >
                {notification.sender?.avatar ? (
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={notification.sender.avatar} />
                    <AvatarFallback>{notification.sender.initials}</AvatarFallback>
                  </Avatar>
                ) : (
                  getNotificationIcon(notification.type)
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{notification.title}</p>
                    {!notification.read && (
                      <Badge variant="outline" className="ml-auto text-[10px] h-5">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{notification.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!notification.read && (
                      <DropdownMenuItem onClick={() => markAsRead(notification.id)}>Mark as read</DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => deleteNotification(notification.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "all"
                  ? "You don't have any notifications yet"
                  : activeTab === "unread"
                    ? "You've read all your notifications"
                    : "You don't have any system notifications"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

