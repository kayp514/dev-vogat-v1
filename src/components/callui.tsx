"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  PhoneOutgoing,
  Volume2,
  VolumeX,
  KeyRound,
  Signal,
  Clock,
  Maximize2,
  Minimize2,
  UserPlus,
  Grid2X2,
  LayoutGrid,
  Maximize,
  X,
  MinusCircle,
  Video,
  VideoOff,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ParticipantScreen } from "./participant"
import type { CallState, CallType } from "@/lib/type"
import type { Participant, CallerInfo } from "../app/type"

interface UserInfo extends CallerInfo {}

interface CallUIProps {
  callerInfo: UserInfo
  calleeInfo: UserInfo
  activeNumber: string
  callState: CallState
  callType: CallType
  handleEndCall: () => void
  setIsCallActive: (isActive: boolean) => void
  isMaximized: boolean
  setIsMaximized: (isMax: boolean) => void
  participants: Participant[]
  onParticipantUpdate: (participantId: string, updates: Partial<Participant>) => void
  onParticipantAdd: (userInfo: UserInfo) => void
  onParticipantRemove: (participantId: string) => void
}

function DTMFDialPad() {
  const [dtmfInput, setDtmfInput] = useState("")

  const dialpadButtons = [
    { id: 1, name: "1" },
    { id: 2, name: "2", sub: "ABC" },
    { id: 3, name: "3", sub: "DEF" },
    { id: 4, name: "4", sub: "GHI" },
    { id: 5, name: "5", sub: "JKL" },
    { id: 6, name: "6", sub: "MNO" },
    { id: 7, name: "7", sub: "PQRS" },
    { id: 8, name: "8", sub: "TUV" },
    { id: 9, name: "9", sub: "WXYZ" },
    { id: 10, name: "*" },
    { id: 11, name: "0", sub: "+" },
    { id: 12, name: "#" },
  ]

  const handleDTMFInput = (digit: string) => {
    setDtmfInput((prev) => prev + digit)
  }

  return (
    <div className="w-full max-w-xs mx-auto p-4">
      <Input
        type="text"
        value={dtmfInput}
        readOnly
        className="mb-4 text-center text-lg font-medium"
        placeholder="DTMF Input"
      />
      <div className="grid grid-cols-3 gap-2">
        {dialpadButtons.map((button) => (
          <Button
            key={button.id}
            variant="outline"
            onClick={() => handleDTMFInput(button.name)}
            className="h-12 text-lg font-medium hover:bg-primary/10"
          >
            <div className="flex flex-col items-center">
              <span>{button.name}</span>
              {button.sub && <span className="text-[10px] text-muted-foreground">{button.sub}</span>}
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}

export function CallUI({
  callerInfo,
  calleeInfo,
  activeNumber,
  callState,
  callType,
  handleEndCall,
  setIsCallActive,
  isMaximized,
  setIsMaximized,
  participants = [],
  onParticipantUpdate,
  onParticipantAdd,
  onParticipantRemove,
}: CallUIProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [networkQuality, setNetworkQuality] = useState("Excellent")
  const [isGridView, setIsGridView] = useState(false)
  const [isSelfViewMinimized, setIsSelfViewMinimized] = useState(false)
  const callStartTimeRef = useRef<number | null>(null)
  const [fullscreenParticipant, setFullscreenParticipant] = useState<string | null>(null)

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (callState === "established") {
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now()
      }
      intervalId = setInterval(() => {
        if (callStartTimeRef.current) {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
        }
      }, 1000)
    } else {
      callStartTimeRef.current = null
      setCallDuration(0)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [callState])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleToggleVideo = (participantId: string) => {
    onParticipantUpdate(participantId, {
      isVideoOn: !participants?.find((p) => p.id === participantId)?.isVideoOn,
    })
  }

  const handleToggleMute = (participantId: string) => {
    onParticipantUpdate(participantId, {
      isMuted: !participants?.find((p) => p.id === participantId)?.isMuted,
    })
  }

  const handleAddParticipant = () => {
    onParticipantAdd({
      id: String(participants.length + 1),
      name: `Participant ${participants.length + 1}`,
      phoneNumber: `+1234567${participants.length + 1}`,
      isVideoOn: false,
      isMuted: false,
    } as UserInfo)
  }

  const handleRemoveParticipant = (participantId: string) => {
    onParticipantRemove(participantId)
  }

  const handleToggleFullscreen = (participantId: string | null = null) => {
    if (fullscreenParticipant === participantId) {
      document.exitFullscreen()
      setFullscreenParticipant(null)
    } else {
      setFullscreenParticipant(participantId)
      document.documentElement.requestFullscreen()
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenParticipant(null)
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  return (
    <TooltipProvider>
      <div
        className={cn(
          "fixed transition-all duration-300",
          isMaximized 
            ? "inset-0 pt-14 bg-background/95" 
            : "bottom-4 right-4",
          "pointer-events-none",
        )}
      >
        {isMaximized && (
          <div className="fixed inset-0 bg-background/60 backdrop-blur-sm -z-10" aria-hidden="true" />
        )}
        <Card
          className={cn(
            "pointer-events-auto",
            "shadow-lg transition-all duration-300",
            isMaximized 
              ? "h-[calc(100vh-3.5rem)] w-full border-0" 
              : "w-[300px] rounded-lg",
            "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
          )}
        >
          <div
            className={cn(
              "h-12 px-4",
              callType === "outgoing" ? "bg-blue-500/10" : "bg-green-500/10",
              "border-b flex items-center justify-between",
              "transition-colors duration-300",
            )}
          >
            <div className="flex items-center gap-2">
              {callType === "outgoing" ? (
                <PhoneOutgoing className="h-4 w-4 text-blue-500" />
              ) : (
                <PhoneCall className="h-4 w-4 text-green-500" />
              )}
              <span className={cn("text-sm font-medium", callType === "outgoing" ? "text-blue-500" : "text-green-500")}>
                {participants.length > 2 ? "Group Call" : callType === "outgoing" ? "Outgoing Call" : "Incoming Call"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-background/80"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>

          {isMaximized ? (
            <div className="h-14 px-4 bg-background/95 border-b backdrop-blur-sm flex items-center">
              <div className="flex items-center gap-4 w-[200px]">
                <div className="flex items-center gap-2">
                  <Signal className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{networkQuality}</span>
                </div>
              </div>

              {/* Centered Controls */}
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2">
                  <TooltipProvider delayDuration={100}>
                    <div className="flex items-center gap-2 rounded-full bg-muted/80 p-1.5 backdrop-blur-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary",
                              isMuted && "bg-red-500/20 text-red-500 hover:bg-red-500/30",
                            )}
                            onClick={() => handleToggleMute("me")}
                          >
                            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mute</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary",
                              isSpeakerOn && "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30",
                            )}
                            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                          >
                            {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Speaker</TooltipContent>
                      </Tooltip>

                      <Separator orientation="vertical" className="h-6" />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
                            onClick={handleEndCall}
                          >
                            <PhoneOff className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>End Call</TooltipContent>
                      </Tooltip>

                      <Separator orientation="vertical" className="h-6" />

                      {(participants.length > 2 || !isSelfViewMinimized) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
                              onClick={() => setIsGridView(!isGridView)}
                            >
                              {isGridView ? <LayoutGrid className="h-4 w-4" /> : <Grid2X2 className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Toggle Layout</TooltipContent>
                        </Tooltip>
                      )}

                      {participants.length < 8 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
                              onClick={handleAddParticipant}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add Participant</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </div>
              </div>

              <div className="flex items-center gap-2 w-[200px] justify-end">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDuration(callDuration)}</span>
              </div>
            </div>
          ) : (
            <div className="h-10 px-4 bg-muted/30 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Signal className="h-3 w-3 text-green-500" />
                <span className="text-xs">{networkQuality}</span>
              </div>
              {callState === "established" && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{formatDuration(callDuration)}</span>
                </div>
              )}
            </div>
          )}

          {isMaximized ? (
            <div className="relative h-[calc(100%-6.5rem)]">
              <div className="absolute inset-0 p-4">
              <div className="h-full w-full p-6">
                <div
                  className={cn(
                    "h-full w-full",
                    isGridView
                    ? cn("grid gap-3",
                      participants.length === 2 
                        ? "grid-cols-2 px-[15%] items-center" 
                        : participants.length <= 4 
                          ? "grid-cols-2" 
                          : "grid-cols-3"
                    )
                    : "relative"
                  )}
                >
                  {participants.map((participant) => {
                    const isMainParticipant = participant.id === calleeInfo.id;
                    const isSelfView = participant.id === callerInfo.id;
                    return (
                    <div
                      key={participant.id}
                      className={cn(
                        "transition-all duration-300",
                        isGridView 
                          ? cn(
                            "w-full",
                            participants.length === 2 && 
                            "aspect-video"
                          ) 
                          : cn(
                            isMainParticipant
                            ? "absolute inset-0"
                            : isSelfView &&
                            cn(
                            "fixed bottom-24 right-10 w-[320px] h-[180px]",
                            "shadow-lg rounded-xl overflow-hidden",
                            "border border-border/50",
                            "backdrop-blur-sm",
                            "transition-all duration-300",
                            "hover:scale-105",
                            "z-[45]"
                      ),
                    ),

                  )}
                >

                      <ParticipantScreen
                        participant={participant}
                        onToggleVideo={handleToggleVideo}
                        onToggleMute={handleToggleMute}
                        onRemoveParticipant={handleRemoveParticipant}
                        onToggleFullscreen={() => handleToggleFullscreen(participant.id)}
                        isFullscreen={fullscreenParticipant === participant.id}
                        isGridView={isGridView}
                        isLarge={isMainParticipant && !isGridView}
                      />
                    </div>
                  )
                })}
                </div>
              </div>
            </div>
            </div>
          ) : (
            <>
              <CardHeader className="p-4 space-y-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={calleeInfo?.avatar} />
                    <AvatarFallback>{calleeInfo?.name ? calleeInfo.name[0].toUpperCase() : "Z"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{calleeInfo?.name || "Unknown User"}</h3>
                    <p className="text-sm text-muted-foreground">{activeNumber}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0">
                <div className="text-center space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {callState === "establishing" ? "Calling..." : callState === "established" ? "On Call" : callState}
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn("h-10 w-10 rounded-full", isMuted && "bg-red-100 text-red-500")}
                      onClick={() => handleToggleMute("me")}
                    >
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn("h-10 w-10 rounded-full", isSpeakerOn && "bg-blue-100 text-blue-500")}
                      onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    >
                      {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <DTMFDialPad />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    handleEndCall()
                    setIsCallActive(false)
                  }}
                >
                  <PhoneOff className="h-4 w-4 mr-2" />
                  End Call
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </TooltipProvider>
  )
}

