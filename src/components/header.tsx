"use client";
import { useState } from "react";
import {
  Bell,
  LogOut,
  Settings,
  CheckCircle2,
  Sun,
  Moon,
  Laptop,
  Phone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import SettingsScreen from "./settingsScreen";
//import { SignOut } from "@tern-secure/nextjs"
import { PstnStatus } from "./pstn-status";
import { Logo } from "./logo";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { type UserData } from "../app/type";
import { usePresence } from "@/ternsecure-realtime/hooks/usePresence";
import type {
  PresenceUpdate,
  UserStatus,
} from "@/ternsecure-realtime/utils/socket";
import { useAuth } from "@tern-secure/nextjs";
import { clearNextSessionCookie } from "@/app/actions";
import { authHandlerOptions } from "@/lib/auth";

interface PresenceStatusConfig {
  status: UserStatus;
  label: string;
  color: string;
}

const PRESENCE_STATUSES: PresenceStatusConfig[] = [
  { status: "online", label: "Online", color: "bg-green-500" },
  { status: "busy", label: "Do not disturb", color: "bg-red-500" },
  { status: "away", label: "Away", color: "bg-yellow-500" },
  { status: "offline", label: "Offline", color: "bg-gray-400" },
];

interface HeaderProps {
  userData: Partial<UserData>;
}

export function Header({ userData }: HeaderProps) {
  const { signOut } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { updatePresence, presenceUpdates } = usePresence();
  const [hasNotifications] = useState(true);
  const { theme, setTheme } = useTheme();

  const currentUserPresence = presenceUpdates.find(
    (update: PresenceUpdate) => update.clientId === userData.uid
  )?.presence;

  const handleSignOut = () => {
    signOut({
      async onBeforeSignOut() {
        await clearNextSessionCookie({
          cookies: authHandlerOptions.cookies,
          revokeRefreshTokensOnSignOut:
            authHandlerOptions.revokeRefreshTokensOnSignOut,
        });
      },
    });
  };

  return (
    <div className="flex h-full items-center justify-between px-4 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm transition-all duration-200 hover:bg-background/90">
      <div className="flex-1">
        <div className="flex items-center gap-3 group">
          <div className="relative overflow-hidden rounded-md bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-105">
            <Logo
              src=""
              fallback="V"
              size="md"
              className="relative z-10 text-primary transition-transform duration-300 group-hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight text-foreground transition-all duration-300 group-hover:text-primary">
              Vogat
            </h1>
            <p className="text-xs text-muted-foreground">
              Secure Communications
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="w-[220px]">
          <PstnStatus className="hover:bg-accent/50 transition-colors" />
        </div>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
              >
                <Bell className="h-5 w-5" />
                {hasNotifications && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center animate-pulse">
                    3
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-medium">Notifications</h4>
                <Button variant="ghost" size="sm" className="text-xs h-8">
                  Mark all as read
                </Button>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="space-y-0.5">
                  <div className="flex items-start gap-3 p-4 bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/avatars/01.png" />
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Alice Brown</p>
                        <Badge
                          variant="outline"
                          className="ml-auto text-[10px] h-5"
                        >
                          New
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        Sent you a message: "Hey, are you available for a quick
                        call?"
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Just now
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Missed Call</p>
                        <Badge
                          variant="outline"
                          className="ml-auto text-[10px] h-5"
                        >
                          New
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        You missed a call from Bob Smith
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        10 minutes ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Account Verified</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        Your account has been successfully verified. You now
                        have full access to all features.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Yesterday
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/avatars/03.png" />
                      <AvatarFallback>CS</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Charlie Smith</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        Tagged you in a comment: "Thanks @you for your help with
                        the project!"
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        2 days ago
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  View all notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg hover:bg-accent px-2 py-1">
              <div className="relative">
                <Avatar className="h-10 w-10 border border-muted">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback>
                    {userData.email ? userData.email[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                    currentUserPresence?.status === "online"
                      ? "bg-green-500"
                      : currentUserPresence?.status === "busy"
                      ? "bg-red-500"
                      : currentUserPresence?.status === "away"
                      ? "bg-yellow-500"
                      : currentUserPresence?.status === "offline"
                      ? "bg-gray-400"
                      : "bg-slate-300"
                  }`}
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
              <div className="flex flex-col space-y-2 p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarImage src={userData.avatar} />
                    <AvatarFallback>
                      {userData.email ? userData.email[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {userData.name || userData.email?.split("@")[0]}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {userData.email}
                    </p>
                    {userData.phoneNumber && (
                      <div className="flex items-center gap-1 mt-1">
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0 text-xs font-normal"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          {userData.phoneNumber}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuLabel>Set Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={currentUserPresence?.status}>
                {PRESENCE_STATUSES.map(({ status, label, color }) => (
                  <DropdownMenuRadioItem
                    key={status}
                    value={status}
                    className="cursor-pointer"
                    onClick={() => updatePresence(status)}
                  >
                    <div className="flex items-center">
                      <span
                        className={`h-2 w-2 rounded-full ${color} mr-2`}
                      ></span>
                      <span>{label}</span>
                      {currentUserPresence?.status === status && (
                        <CheckCircle2 className="ml-auto h-4 w-4" />
                      )}
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />

              <div className="px-3 py-2 flex items-center gap-3">
                <span className="text-sm font-medium text-foreground min-w-[50px]">
                  Theme
                </span>
                <div className="flex-1">
                  <div className="bg-muted p-1 rounded-md grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                        theme === "light"
                          ? "bg-background text-foreground shadow-sm"
                          : "hover:bg-background/50 text-muted-foreground"
                      }`}
                    >
                      <Sun className="h-3.5 w-3.5" />
                      <span>Light</span>
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                        theme === "dark"
                          ? "bg-background text-foreground shadow-sm"
                          : "hover:bg-background/50 text-muted-foreground"
                      }`}
                    >
                      <Moon className="h-3.5 w-3.5" />
                      <span>Dark</span>
                    </button>
                    <button
                      onClick={() => setTheme("system")}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                        theme === "system"
                          ? "bg-background text-foreground shadow-sm"
                          : "hover:bg-background/50 text-muted-foreground"
                      }`}
                    >
                      <Laptop className="h-3.5 w-3.5" />
                      <span>System</span>
                    </button>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
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
  );
}
