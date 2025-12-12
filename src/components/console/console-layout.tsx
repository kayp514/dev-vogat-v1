'use client'

import { useState } from "react"
import { ConsoleNavBar } from "./console-navbar"
import { SipTrunk } from "./sip-trunk"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Activity, Settings, ChevronFirst, ChevronLast } from 'lucide-react'
import { ConsoleUser } from "./console-user"
import { ConsoleDID } from "./console-did"
import { ConsoleBilling } from "./console-billing"



// Component map for different tabs
const TabComponents: Record<string, React.ComponentType> = {
  'sip-trunk': SipTrunk,
  'user': ConsoleUser,
  'numbers': ConsoleDID,
  'monitoring': () => (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Monitoring
        </CardTitle>
        <CardDescription>
          Monitor system performance and activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-[200px] items-center justify-center rounded-md border-2 border-dashed">
          <p className="text-sm text-muted-foreground">Monitoring data will be displayed here</p>
        </div>
      </CardContent>
    </Card>
  ),
  'settings': () => (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Settings
        </CardTitle>
        <CardDescription>
          Configure system-wide settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-[200px] items-center justify-center rounded-md border-2 border-dashed">
          <p className="text-sm text-muted-foreground">System settings will be displayed here</p>
        </div>
      </CardContent>
    </Card>
  ),
  'billing': ConsoleBilling,
}

export function ConsoleLayout() {
  const [activeTab, setActiveTab] = useState("user")
  const [isCollapsed, setIsCollapsed] = useState(false)

  const ActiveComponent = TabComponents[activeTab]

  return (
    <div className="flex h-full">
      {/* Console Navigation - positioned next to main-nav with collapse functionality */}
      <div className={cn(
        "border-r relative transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[60px]" : "w-[280px]"
      )}>
        <ConsoleNavBar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isCollapsed={isCollapsed} 
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-4 top-6 z-10 h-8 w-8 rounded-full border bg-background"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronLast className="h-4 w-4" />
          ) : (
            <ChevronFirst className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isCollapsed ? "Expand" : "Collapse"} Sidebar
          </span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden h-full">
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="flex justify-center w-full py-6 px-4">
            <div className="w-full max-w-6xl">
              <div className="animate-in fade-in slide-in-from-right-5 duration-500">
                {ActiveComponent ? (
                  <ActiveComponent />
                ) : (
                  <div className="flex h-[60vh] items-center justify-center">
                    <p className="text-muted-foreground">Select a section from the sidebar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

