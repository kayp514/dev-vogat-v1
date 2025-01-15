//src/app/ui/callnotify.tsx
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  XIcon, 
  PhoneCall,
  UserRound,
  PhoneIncoming,
  PhoneOff, Volume2, VolumeX 
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query"

interface CallNotificationProps {
  callerNumber: string;
  onAccept: () => void;
  onReject: () => void;
}

export function CallNotification({ callerNumber, onAccept, onReject }: CallNotificationProps) {
  const [isMuted, setIsMuted] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  return (
    <Card className={cn(
      "fixed z-50 shadow-lg",
      "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
      "border-2 border-primary/20",
      isDesktop ? "bottom-4 right-4 w-[400px]" : "bottom-0 right-0 left-0 m-4 w-auto",
      "animate-in slide-in-from-bottom-5 duration-300"
    )}>
      {/* Pulsing Header */}
      <div className="relative h-1 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-t-lg overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 animate-pulse" />
      </div>

      <div className="p-6">
        {/* Caller Info */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-blue-500/20">
              <AvatarImage src="/path/to/avatar.jpg" />
              <AvatarFallback className="bg-blue-500/10">
                <UserRound className="h-8 w-8 text-blue-500/80" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-blue-500/90 flex items-center justify-center">
              <PhoneIncoming className="h-3 w-3 text-white animate-in spin-in-180"/>
            </div>
          </div>

          <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
            <h3 className="text-lg font-semibold tracking-tight mb-1">
              Incoming Call
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {callerNumber}
            </p>
            </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-[pulse_2s_ease-in-out_infinite]" />
              <span className="text-xs text-blue-500 font-medium">
               Incoming call...
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
        <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-destructive" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isMuted ? 'Unmute ringtone' : 'Mute ringtone'}
              </span>
            </Button>
            <p className="text-xs text-muted-foreground">
              {isMuted ? 'Ringtone muted' : 'Tap to mute ringtone'}
            </p>
          </div>
          <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className={cn(
              "flex-1 border-2 border-destructive/30 hover:bg-destructive/10",
              "text-destructive hover:text-destructive",
              "transition-colors duration-200"
            )}
            onClick={onReject}
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            Decline
          </Button>
          <Button
            className={cn(
              "flex-1 bg-green-500 hover:bg-green-600",
              "border-2 border-green-500/50",
              "transition-colors duration-200"
            )}
            onClick={onAccept}
          >
            <Phone className="h-4 w-4 mr-2" />
            Accept
          </Button>
        </div>
      </div>
      </div>
    </Card>
  );
}