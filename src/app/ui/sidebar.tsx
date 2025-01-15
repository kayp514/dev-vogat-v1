import { MessageCircle, Phone, Bolt } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
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
         <Sidebar className="fixed inset-y-0 left-0 z-20 w-[60px] border-r" collapsible='none'>
          <SidebarContent className="py-2">
            <SidebarMenu className="space-y-2">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.id} className="px-2">
                  <SidebarMenuButton
                    onClick={() => setActiveTab(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.name}
                    className="flex h-12 w-12 items-center justify-center rounded-md hover:bg-accent"
                  >
                    <item.icon className="h-6 w-6 items-center" />
                    <span className="hidden">{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        </SidebarProvider>

  )
}

