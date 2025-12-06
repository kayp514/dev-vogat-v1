"use client"
import { cn } from "@/lib/utils"
import { ChatBubbleOvalLeftEllipsisIcon, DevicePhoneMobileIcon, CommandLineIcon } from "@heroicons/react/24/outline"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Bell } from "lucide-react"

interface AppSideBarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const navigation = [
  { name: "Chat", id: "chat", icon: ChatBubbleOvalLeftEllipsisIcon },
  { name: "Calls", id: "calls", icon: DevicePhoneMobileIcon },
  { name: "Notifications", id: "notifications", icon: Bell },
  { name: "Admin Console", id: "console", icon: CommandLineIcon },
]

export function AppSideBar({ activeTab, setActiveTab }: AppSideBarProps) {
  return (
    <div className="flex h-full w-full flex-col items-center py-4 bg-gray-100 dark:bg-gray-800 border-r border-border/40">
      <div className="flex flex-col items-center justify-center space-y-4">
        {navigation.map((item) => (
          <TooltipProvider key={item.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ease-in-out",
                    // Default state with subtle background
                    "bg-background/80 text-muted-foreground shadow-xs border border-transparent",
                    // Hover effects with dynamic colors based on icon type
                    "hover:scale-105",
                    item.id === "chat" &&
                      "hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 dark:hover:bg-blue-950/30 dark:hover:text-blue-400",
                    item.id === "calls" &&
                      "hover:bg-green-50 hover:text-green-500 hover:border-green-200 dark:hover:bg-green-950/30 dark:hover:text-green-400",
                    item.id === "notifications" &&
                    "hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200 dark:hover:bg-orange-950/30 dark:hover:text-orange-400",
                    item.id === "console" &&
                      "hover:bg-purple-50 hover:text-purple-500 hover:border-purple-200 dark:hover:bg-purple-950/30 dark:hover:text-purple-400",
                    // Active state with more prominent styling and dynamic colors
                    activeTab === item.id && [
                      "shadow-md",
                      item.id === "chat" &&
                        "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
                      item.id === "calls" &&
                        "bg-green-100 text-green-600 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800",
                      item.id === "notifications" &&
                        "bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800",
                      item.id === "console" &&
                        "bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800",
                    ],
                  )}
                >
                  {/* Dynamic indicator dot for active state */}
                  {activeTab === item.id && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-background",
                        item.id === "chat" && "bg-blue-500 dark:bg-blue-400",
                        item.id === "calls" && "bg-green-500 dark:bg-green-400",
                        item.id === "notifications" && "bg-orange-500 dark:bg-orange-400",
                        item.id === "console" && "bg-purple-500 dark:bg-purple-400",
                      )}
                    />
                  )}

                  {/* Icon with subtle animation */}
                  <item.icon
                    className={cn("h-6 w-6 transition-all", activeTab === item.id ? "scale-110" : "scale-100")}
                  />
                  <span className="sr-only">{item.name}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6} className="font-medium">
                {item.name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      <div className="mt-auto"></div>
    </div>
  )
}

