'use client'

import { Button } from '@/components/ui/button'
import { Mic, MicOff, VideoIcon, VideoOff, UserMinus, Maximize, Minimize } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { type Participant } from '../type'


interface ParticipantScreenProps {
  participant: Participant
  isLarge?: boolean
  onToggleVideo: (id: string) => void
  onToggleMute: (id: string) => void
  onRemoveParticipant: (id: string) => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
}

export function ParticipantScreen({
  participant,
  isLarge = false,
  onToggleVideo,
  onToggleMute,
  onRemoveParticipant,
  onToggleFullscreen,
  isFullscreen,
}: ParticipantScreenProps) {
  return (
    <div className={cn(
      "group relative h-full rounded-2xl overflow-hidden transition-all duration-500",
      "bg-gradient-to-br from-background/80 to-muted/80",
      "backdrop-blur-md border shadow-lg z-50",
      isFullscreen && "fixed inset-0 z-[60] rounded-none w-screen h-screen max-w-none"
    )}>
      {/* Video or Avatar */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {participant.isVideoOn ? (
          <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
            <div className="text-muted-foreground">
              <VideoIcon className="h-12 w-12 mx-auto mb-2" />
              <span className="text-sm">Video placeholder</span>
            </div>
          </div>
        ) : (
          <div className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            "bg-gradient-to-br from-muted/50 to-muted/30"
          )}>
            <Avatar className={cn(
              "transition-all duration-300",
              participant.id === 'me' ? "h-16 w-16" : "h-24 w-24"
            )}>
              <AvatarImage src={participant.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {participant.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Overlay Controls */}
      <div className={cn(
        "absolute inset-0 flex flex-col justify-end z-[51]",
        "bg-gradient-to-t from-black/80 via-black/40 to-transparent",
        "transition-all duration-300",
        "group-hover:opacity-100",
        participant.id === 'me' ? "opacity-0" : "opacity-100"
      )}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">
                {participant.name}
              </span>
              <div className="flex items-center gap-1.5">
                {participant.isMuted && (
                  <Badge 
                    variant="secondary" 
                    className="bg-red-500/20 text-red-200 hover:bg-red-500/30"
                  >
                    <MicOff className="h-3 w-3 mr-1" />
                    Muted
                  </Badge>
                )}
                {!participant.isVideoOn && (
                  <Badge 
                    variant="secondary" 
                    className="bg-muted/20 text-white hover:bg-muted/30"
                  >
                    <VideoOff className="h-3 w-3 mr-1" />
                    No Video
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className={cn(
                        "h-8 px-3 gap-2",
                        "bg-white/10 hover:bg-white/20 active:bg-white/30",
                        "text-white border-0",
                        "transition-colors duration-200",
                        "backdrop-blur-sm"
                      )}
                      onClick={() => onToggleVideo(participant.id)}
                    >
                      {participant.isVideoOn ? (
                        <>
                          <VideoIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Video On</span>
                        </>
                      ) : (
                        <>
                          <VideoOff className="h-4 w-4" />
                          <span className="hidden sm:inline">Video Off</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {participant.isVideoOn ? 'Turn off video' : 'Turn on video'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className={cn(
                        "h-8 px-3 gap-2",
                        "bg-white/10 hover:bg-white/20 active:bg-white/30",
                        "text-white border-0",
                        "transition-colors duration-200",
                        "backdrop-blur-sm",
                        participant.isMuted && "bg-red-500/20 hover:bg-red-500/30"
                      )}
                      onClick={() => onToggleMute(participant.id)}
                    >
                      {participant.isMuted ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          <span className="hidden sm:inline">Unmute</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          <span className="hidden sm:inline">Mute</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {participant.isMuted ? 'Unmute' : 'Mute'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className={cn(
                        "h-8 px-3 gap-2",
                        "bg-white/10 hover:bg-white/20 active:bg-white/30",
                        "text-white border-0",
                        "transition-colors duration-200",
                        "backdrop-blur-sm"
                      )}
                      onClick={onToggleFullscreen}
                    >
                      {isFullscreen ? (
                        <>
                          <Minimize className="h-4 w-4" />
                          <span className="hidden sm:inline">Exit</span>
                        </>
                      ) : (
                        <>
                          <Maximize className="h-4 w-4" />
                          <span className="hidden sm:inline">Fullscreen</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  </TooltipContent>
                </Tooltip>

                {participant.id !== 'me' && !participant.isHost && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className={cn(
                          "h-8 px-3 gap-2",
                          "bg-red-500/20 hover:bg-red-500/30",
                          "text-white border-0",
                          "transition-colors duration-200",
                          "backdrop-blur-sm"
                        )}
                        onClick={() => onRemoveParticipant(participant.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                        <span className="hidden sm:inline">Remove</span>
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

      {/* Corner Indicator for Self View */}
      {participant.id === 'me' && (
        <div className="absolute top-2 left-2 z-[51]">
          <Badge 
            variant="secondary" 
            className="bg-background/40 hover:bg-background/40 text-xs"
          >
            Self View
          </Badge>
        </div>
      )}

      {/* Fullscreen Navigation */}
      {isFullscreen && (
        <div className="fixed left-1/2 bottom-8 -translate-x-1/2 z-[70]">
          <div className="flex items-center gap-4 p-4 rounded-full bg-background/95 backdrop-blur-sm border shadow-lg">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-full",
                      participant.isMuted && "bg-red-500/20 text-red-200"
                    )}
                    onClick={() => onToggleMute(participant.id)}
                  >
                    {participant.isMuted ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {participant.isMuted ? 'Unmute' : 'Mute'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-full",
                      !participant.isVideoOn && "bg-red-500/20 text-red-200"
                    )}
                    onClick={() => onToggleVideo(participant.id)}
                  >
                    {participant.isVideoOn ? (
                      <VideoIcon className="h-5 w-5" />
                    ) : (
                      <VideoOff className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {participant.isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={onToggleFullscreen}
                  >
                    {isFullscreen ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  )
}
