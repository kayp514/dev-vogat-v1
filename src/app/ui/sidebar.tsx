'use client'

import { useState } from 'react'
import { MessageCircle, Phone, Bell, User2, LogOut } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import SettingsScreen from './settingsScreen'
import { useCallSIP } from '@/app/CallSIPContext'
import { useSIP } from '@/app/SIPContext'
import CallUI from '@/app/ui/callui'
import { CallNotification } from './callnotify'
import { SignOut } from "@tern-secure/nextjs"

interface UserData {
  displayName?: string
  email: string
  photoURL?: string
  uid: string
}

const navigation = [
  { name: 'Chat', id: 'chat', icon: MessageCircle, current: true },
  { name: 'Calls', id: 'calls', icon: Phone, current: false },
]

interface MainSideBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}


export function AppSideBar({ activeTab, setActiveTab }: MainSideBarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { isInitialized, isRegistered } = useSIP()
  const { 
    isCallActive, 
    activeNumber, 
    callState, 
    callType, 
    handleEndCall, 
    setIsCallActive, 
    handleAcceptCall, 
    handleRejectCall 
  } = useCallSIP()

  return (
    <SidebarProvider>
         <Sidebar className="fixed inset-y-0 left-0 z-20 w-[60px] border-r" collapsible='none'>
          <SidebarHeader className="border-b px-4 py-4">
            <img
              alt="Company Logo"
              src="./lifesprint_logo.png"
              className="h-8 w-auto"
            />
          </SidebarHeader>
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
          <div className="mt-auto border-t p-4">
            <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
          </div>
        </Sidebar>
        </SidebarProvider>

/*


        
        {isCallActive && callType === 'outgoing' && (
          <CallUI
            activeNumber={activeNumber}
            callState={callState}
            callType={callType}
            handleEndCall={handleEndCall}
            setIsCallActive={setIsCallActive}
          />
        )}
        {isCallActive && callType === 'incoming' && callState === 'establishing' && (
          <CallNotification
            callerNumber={activeNumber}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
          />
        )}
        {isCallActive && callType === 'incoming' && callState === 'established' && (
          <CallUI
            activeNumber={activeNumber}
            callState={callState}
            callType={callType}
            handleEndCall={handleEndCall}
            setIsCallActive={setIsCallActive}
          />
        )}

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0">
          <SettingsScreen userData={userData} />
        </DialogContent>
      </Dialog>
      */
  )
}

