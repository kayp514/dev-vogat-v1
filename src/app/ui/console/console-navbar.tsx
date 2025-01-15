'use client'


import { RadioTower, User, Activity, Hash } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'User', id: 'user', icon: User, current: false, description: 'Manage User settings' },
  { name: 'SIP Trunk', id: 'sip-trunk', icon: RadioTower, current: true, description: 'Manage SIP Trunk settings' },
  { name: 'Numbers', id: 'numbers', icon: Hash, current: false, description: 'Manage Phone numbers' },
  { name: 'Monitoring', id: 'monitoring', icon: Activity, current: false, description: 'Monitor Phone activity' },
]

interface ConsoleNavBarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}
  

export function ConsoleNavBar({ activeTab, setActiveTab }: ConsoleNavBarProps) {
  return (
    <div className="flex h-screen w-[200px] flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
           Admin Console
          </h2>
          <div className="space-y-1">
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <nav className="grid gap-1 px-2">
                {navigation.map((item) => (
                  <TooltipProvider key={item.id} delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={activeTab === item.id ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-2",
                            activeTab === item.id && "bg-muted"
                          )}
                          onClick={() => setActiveTab(item.id)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}

