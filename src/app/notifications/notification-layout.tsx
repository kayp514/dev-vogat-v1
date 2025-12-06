"use client"

import { Card, CardContent } from "@/components/ui/card"
import { NotificationsDisplay } from "@/components/notifications-display"
import type { UserData } from "@/app/type"

interface NotificationLayoutProps {
  userData?: Partial<UserData>
}

export function NotificationLayout({ userData }: NotificationLayoutProps) {
  return (
    <div className="h-full w-full p-2 flex bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <Card className="w-full h-full border border-border shadow-xs rounded-lg overflow-hidden flex flex-col">
        <CardContent className="p-0 h-full flex">
          <NotificationsDisplay />
        </CardContent>
      </Card>
    </div>
  )
}

