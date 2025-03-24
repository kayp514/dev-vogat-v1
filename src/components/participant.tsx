"use client"

import { Button } from "@/components/ui/button"
import { Mic, MicOff, VideoIcon, VideoOff, UserMinus, Maximize, Minimize } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Participant } from "@/app/type"

interface ParticipantScreenProps {
  participant: Participant
  isLarge?: boolean
  onToggleVideo: (id: string) => void
  onToggleMute: (id: string) => void
  onRemoveParticipant: (id: string) => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
  isGridView?: boolean
}

export function ParticipantScreen({
  participant,
  isLarge = false,
  onToggleVideo,
  onToggleMute,
  onRemoveParticipant,
  onToggleFullscreen,
  isFullscreen,
  isGridView = false,
}: ParticipantScreenProps) {
  return (
    <div
      className={cn(
        "group relative h-full rounded-xl overflow-hidden transition-all duration-300",
        "bg-gradient-to-br from-muted/20 to-muted/30",
        "backdrop-blur-sm border shadow-md",
        isFullscreen && "fixed inset-0 z-[60] rounded-none w-screen h-screen max-w-none",
        isGridView && "aspect-video",
      )}
    >
      {/* Video or Avatar */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {participant.isVideoOn ? (
          <div className={cn("w-full h-full relative overflow-hidden")}>
            {/* Video placeholder - in real implementation, replace with actual video element */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/10 to-muted/20">
              <VideoIcon className="h-12 w-12 text-muted-foreground/30" />
            </div>
          </div>
        ) : (
          <div className={cn("flex flex-col items-center justify-center w-full h-full")}>
            <Avatar className={cn("transition-all duration-300", "h-24 w-24")}>
              <AvatarImage src={participant.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {participant?.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <p className="mt-4 text-sm font-medium text-muted-foreground">{participant.name}</p>
          </div>
        )}
      </div>

      {/* Overlay Controls */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-between",
          "z-[50]",
          "bg-gradient-to-t from-background/40 via-transparent to-background/40",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        )}
      >
        {/* Top Controls */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-background/60 backdrop-blur-sm text-foreground">
                {participant.role === "caller" ? "You" : participant.name}
              </Badge>
              {participant.isMuted && (
                <Badge variant="secondary" className="bg-muted/60 text-muted-foreground">
                  <MicOff className="h-3 w-3" />
                </Badge>
              )}
              {!participant.isVideoOn && (
                <Badge variant="secondary" className="bg-muted/60 text-muted-foreground">
                  <VideoOff className="h-3 w-3" />
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-3">
          <div className="flex items-center justify-end gap-2">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full",
                      "bg-background/60 hover:bg-background/80",
                      "backdrop-blur-sm",
                    )}
                    onClick={() => onToggleVideo(participant.id)}
                  >
                    {participant.isVideoOn ? <VideoIcon className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {participant.isVideoOn ? "Turn off video" : "Turn on video"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className={cn(
                        "h-8 w-8 rounded-full",
                        "bg-background/60 hover:bg-background/80",
                        "backdrop-blur-sm",
                    )}
                    onClick={() => onToggleMute(participant.id)}
                  >
                    {participant.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {participant.isMuted ? "Unmute" : "Mute"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className={cn(
                        "h-8 w-8 rounded-full",
                        "bg-background/60 hover:bg-background/80",
                        "backdrop-blur-sm",
                    )}
                    onClick={() => onToggleFullscreen()}
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                </TooltipContent>
              </Tooltip>

              {participant.role !== "caller" && !participant.isHost && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-full",
                        "bg-destructive/10 hover:bg-destructive/20",
                        "text-destructive",
                        "backdrop-blur-sm",
                      )}
                      onClick={() => onRemoveParticipant(participant.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Remove from call
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  )
}

