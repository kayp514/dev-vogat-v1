'use client'
import { useState } from 'react'
import { Bell, User2, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import SettingsScreen from './settingsScreen'
import { SignOut } from "@tern-secure/nextjs"
import { PstnStatus } from './pstn-status'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { type UserData } from "../type"


interface HeaderProps {
  userData: Partial<UserData>;
}

export function Header({ userData }: HeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const handleSignOut = () => {
        return <SignOut />
      };

  return (
    <div className="flex h-full items-center justify-between px-4">
      <div className="flex-1" />
      <div className="flex items-center gap-10">
      <div className="w-[220px]">
          <PstnStatus
          className="hover:bg-accent/50 transition-colors"
           />
      </div>
      <div className="flex items-center gap-4">
        <button className="rounded-full p-2 hover:bg-accent">
          <Bell className="h-5 w-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg hover:bg-accent px-2 py-1">
            <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userData.avatar} />
              <AvatarFallback>{userData.email ? userData.email[0].toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                    userData.status === 'online' 
                      ? 'bg-green-500' 
                      : userData.status === 'busy'
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`} />
            </div>
            {/* <span className="text-sm font-medium">{userData.displayName || userData.email}</span> */}  
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
              <User2 className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out <SignOut />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0">
          <SettingsScreen userData={userData} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

