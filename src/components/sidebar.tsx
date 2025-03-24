import { MessageCircle, Phone, Bolt } from 'lucide-react'
import { cn } from "@/lib/utils"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navigation = [
  { name: 'Chat', id: 'chat', icon: MessageCircle, current: true },
  { name: 'Calls', id: 'calls', icon: Phone, current: false },
  { name: 'Console', id: 'console', icon: Bolt, current: false },
]

interface MainSideBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AppSideBar({ activeTab, setActiveTab }: MainSideBarProps) {
  return (
    <div className="flex h-full w-full flex-col items-center py-4 bg-gray-100 dark:bg-gray-800">
      <div className="flex flex-col items-center justify-center space-y-4">
            {navigation.map((item) => (
              <TooltipProvider key={item.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                    activeTab === item.id &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm",
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform",
                    activeTab === item.id && "animate-in zoom-in-50 duration-300"
                  )} />
                  <span className="sr-only">{item.name}</span>
                  </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            </div>
            </div>
  )
}