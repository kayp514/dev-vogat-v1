'use client'
import { useState } from 'react'
import { MessageCircle, Phone, Bell, User2, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import SettingsScreen from './settingsScreen'
import { SignOut } from "@tern-secure/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
    userData: {
      displayName?: string;
      email?: string;
      uid?: string;
      photoURL?: string;
    }
  }

export function Header({ userData }: HeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const handleSignOut = () => {
        return (
          <SignOut />
        )
      };

  return (
    <div className="flex h-full items-center justify-between px-4">
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <button className="rounded-full p-2 hover:bg-accent">
          <Bell className="h-5 w-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg hover:bg-accent px-2 py-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userData.photoURL} />
              <AvatarFallback>{userData.email ? userData.email[0].toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{userData.displayName || userData.email}</span>
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
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0">
          <SettingsScreen userData={userData} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

