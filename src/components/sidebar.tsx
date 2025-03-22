import { MessageCircle, Phone, Bolt } from 'lucide-react'
import { cn } from "@/lib/utils"

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"

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
    <SidebarProvider>
      <Sidebar className="fixed inset-y-0 left-0 z-20 w-[72px] border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" collapsible='none'>
        <SidebarContent className="flex flex-col items-center pt-14">
          <SidebarMenu className="space-y-4 px-2">
            {navigation.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => setActiveTab(item.id)}
                  isActive={activeTab === item.id}
                  tooltip={item.name}
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
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}

