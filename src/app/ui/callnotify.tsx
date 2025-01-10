//src/app/ui/callnotify.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  PhoneIcon, 
  XIcon, 
  PhoneCall,
  UserRound 
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CallNotificationProps {
  callerNumber: string;
  onAccept: () => void;
  onReject: () => void;
}

export function CallNotification({ callerNumber, onAccept, onReject }: CallNotificationProps) {
  return (
    <Card className={cn(
      "fixed bottom-4 right-4 w-[380px]",
      "bg-background/95 backdrop-blur-lg shadow-lg",
      "border-2 border-blue-500/20",
      "animate-in slide-in-from-right-5 duration-300"
    )}>
      {/* Pulsing Header */}
      <div className="relative h-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-t-lg overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/20 animate-[pulse_2s_ease-in-out_infinite]" />
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
              <PhoneCall className="h-3 w-3 text-white animate-[ringing_1.5s_ease-in-out_infinite]" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold tracking-tight mb-1">
              Incoming Call
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {callerNumber}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-[pulse_2s_ease-in-out_infinite]" />
              <span className="text-xs text-blue-500 font-medium">
                Ringing...
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="outline"
            className={cn(
              "flex-1 border-2 border-destructive/30 hover:bg-destructive/10",
              "text-destructive hover:text-destructive"
            )}
            onClick={onReject}
          >
            <XIcon className="h-4 w-4 mr-2" />
            Decline
          </Button>
          <Button
            className={cn(
              "flex-1 bg-green-500 hover:bg-green-600",
              "border-2 border-green-500/50"
            )}
            onClick={onAccept}
          >
            <PhoneIcon className="h-4 w-4 mr-2" />
            Accept
          </Button>
        </div>
      </div>
    </Card>
  );
}