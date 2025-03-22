'use client'

import { RadioTower, User, Activity, Hash, ChevronRight, Settings, LucideIcon, CreditCard } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface NavigationItem {
  name: string
  id: string
  icon: LucideIcon
  description: string
  badge?: string
}

const navigation: { name: string; items: NavigationItem[] }[] = [
  {
    name: 'Account Management',
    items: [
      { 
        name: 'User', 
        id: 'user', 
        icon: User, 
        description: 'Manage User settings',
        badge: 'Admin'
      },
    ]
  },
  {
    name: 'Communication',
    items: [
      { 
        name: 'SIP Trunk', 
        id: 'sip-trunk', 
        icon: RadioTower, 
        description: 'Manage SIP Trunk settings',
        badge: 'Active'
      },
      { 
        name: 'Numbers', 
        id: 'numbers', 
        icon: Hash, 
        description: 'Manage Phone numbers',
        badge: '5 DID'
      },
    ]
  },
  {
    name: 'Billing',
    items: [
      {
        name: 'Billing & Usage',
        id: 'billing',
        icon: CreditCard,
        description: 'Manage billing and usage',
        badge: 'Enterprise'
      },
    ]
  },
  {
    name: 'System',
    items: [
      { 
        name: 'Monitoring', 
        id: 'monitoring', 
        icon: Activity, 
        description: 'Monitor Phone activity'
      },
      { 
        name: 'Settings', 
        id: 'settings', 
        icon: Settings, 
        description: 'System configuration'
      },
    ]
  }
]

interface ConsoleNavBarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isCollapsed: boolean
}

export function ConsoleNavBar({ activeTab, setActiveTab, isCollapsed }: ConsoleNavBarProps) {
  return (
    <Card className="h-full rounded-none border-0 shadow-none overflow-hidden">
      <CardHeader className={cn(
        "space-y-1.5 transition-all duration-300 ease-in-out",
        isCollapsed ? "p-2" : "p-4"
      )}>
        <CardTitle className={cn(
          "text-lg font-semibold transition-all duration-300 ease-in-out",
          isCollapsed && "sr-only"
        )}>
          Admin Console
        </CardTitle>
        <CardDescription className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed && "sr-only"
        )}>
          Manage your system settings
        </CardDescription>
      </CardHeader>
      <Separator className="mb-4" />
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-8.5rem)] px-2">
          <div className="space-y-4 p-2">
            {navigation.map((group) => (
              <div key={group.name} className="space-y-2">
                <h3 className={cn(
                  "px-2 text-xs font-medium tracking-wider text-muted-foreground transition-all duration-300 ease-in-out",
                  isCollapsed && "sr-only"
                )}>
                  {group.name}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <TooltipProvider key={item.id} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={activeTab === item.id ? "secondary" : "ghost"}
                            className={cn(
                              "w-full transition-all duration-300 ease-in-out",
                              isCollapsed ? "justify-center px-2" : "justify-between px-2",
                              activeTab === item.id && "bg-secondary"
                            )}
                            onClick={() => setActiveTab(item.id)}
                          >
                            <span className={cn(
                              "flex items-center gap-2",
                              isCollapsed && "justify-center"
                            )}>
                              <item.icon className="h-4 w-4" />
                              {!isCollapsed && <span>{item.name}</span>}
                            </span>
                            {!isCollapsed && (
                              <span className="flex items-center gap-2">
                                {item.badge && (
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "h-5 text-xs",
                                      activeTab === item.id && "bg-secondary-foreground/10"
                                    )}
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                                <ChevronRight 
                                  className={cn(
                                    "h-4 w-4 text-muted-foreground/50",
                                    activeTab === item.id && "text-foreground"
                                  )} 
                                />
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side={isCollapsed ? "right" : "bottom"} className="max-w-[200px]">
                          <p>{isCollapsed ? item.name : item.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

