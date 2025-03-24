'use client'
import { useState, useEffect } from "react"
import { type User } from "../type"
import { Card, CardContent } from "@/components/ui/card"
import { ChatSidebar } from "./sidebar-chat"
import { ChatArea } from "./chat-area"
import { cn } from "@/lib/utils"



export function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarCollapsed(!!selectedUser)
      } else {
        setSidebarCollapsed(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [selectedUser])

  const handleSelectUser = (user: User | null) => {
    setSelectedUser(user)
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }

  const handleSelectChatUser = (chatUser: User) => {
    if (chatUser) {
      setSelectedUser({
        uid: chatUser.uid,
        name: chatUser.name || 'Anonymous',
        email: chatUser.email || `${chatUser.uid}@example.com`,
        avatar: chatUser.avatar
      })

      if (isMobile) {
        setSidebarCollapsed(true)
      }
    }
  }

  const handleBackToList = () => {
    if (isMobile) {
      setSidebarCollapsed(false)
    }
  }

  return (
    <div className="h-full w-full flex p-2 bg-gray-100 dark:bg-gray-800">
      <Card className="w-full h-full border border-border shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-0 h-full flex">
          <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out border-r border-border bg-card",
            isMobile ? (sidebarCollapsed ? "w-0 opacity-0" : "w-full opacity-100") : "w-[350px]",
          )}
          >
            {(!isMobile || !sidebarCollapsed) && (
              <div className="h-full">
                <ChatSidebar
                selectedUser={selectedUser}
                onSelectUser={handleSelectUser}
                onSelectChatUser={handleSelectChatUser}
                />
                </div>
              )}
            </div>

            <div
            className={cn(
              "h-full transition-all duration-300 ease-in-out bg-background flex-1",
              isMobile ? (sidebarCollapsed ? "w-full opacity-100" : "w-0 opacity-0") : "flex-1",
            )}
          >
            {(!isMobile || sidebarCollapsed) && (
            <ChatArea 
            selectedUser={selectedUser}
            onBackToList={handleBackToList}
            isMobile={isMobile}
            />
          )}
          </div>
          </CardContent>
          </Card>
          </div>
  )
}