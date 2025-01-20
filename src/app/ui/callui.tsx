'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
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
  Video,
  VideoOff,
  MinusCircle,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ParticipantScreen } from './participant'
import { type CallState, CallType } from '@/lib/type'
import { type Participant, type CallerInfo } from '../type'


interface UserInfo extends CallerInfo {}

interface CallUIProps {
  callerInfo: CallerInfo
  calleeInfo: CallerInfo
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
  const [dtmfInput, setDtmfInput] = useState('')

  const dialpadButtons = [
    { id: 1, name: '1' },
    { id: 2, name: '2', sub: 'ABC' },
    { id: 3, name: '3', sub: 'DEF' },
    { id: 4, name: '4', sub: 'GHI' },
    { id: 5, name: '5', sub: 'JKL' },
    { id: 6, name: '6', sub: 'MNO' },
    { id: 7, name: '7', sub: 'PQRS' },
    { id: 8, name: '8', sub: 'TUV' },
    { id: 9, name: '9', sub: 'WXYZ' },
    { id: 10, name: '*' },
    { id: 11, name: '0', sub: '+' },
    { id: 12, name: '#' },
  ]

  const handleDTMFInput = (digit: string) => {
    setDtmfInput(prev => prev + digit)
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
              {button.sub && (
                <span className="text-[10px] text-muted-foreground">
                  {button.sub}
                </span>
              )}
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
  const [networkQuality, setNetworkQuality] = useState('Excellent')
  const [isGridView, setIsGridView] = useState(false)
  const [isSelfViewMinimized, setIsSelfViewMinimized] = useState(false)
  const callStartTimeRef = useRef<number | null>(null)
  const [fullscreenParticipant, setFullscreenParticipant] = useState<string | null>(null)


  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (callState === 'established') {
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
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleToggleVideo = (participantId: string) => {
    onParticipantUpdate(participantId, {
      isVideoOn: !participants?.find(p => p.id === participantId)?.isVideoOn
    })
  }

  const handleToggleMute = (participantId: string) => {
    onParticipantUpdate(participantId, {
      isMuted: !participants?.find(p => p.id === participantId)?.isMuted
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

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <TooltipProvider>
      <div
        className={cn(
          "fixed z-50",
          isMaximized ? "inset-0 pl-[72px] pt-14" : "bottom-4 right-4",
          "pointer-events-none",
        )}
      >
        {isMaximized && (
          <div className="fixed inset-0 pl-[72px] pt-14 bg-background/60 backdrop-blur-sm -z-10" aria-hidden="true" />
        )}
        <Card
          className={cn(
            "pointer-events-auto",
            "shadow-lg transition-all duration-300",
            isMaximized ? "h-[calc(100vh-3.5rem)] w-[calc(100vw-72px)] ml-auto" : "w-[300px] rounded-lg",
            "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
            "border-primary/10",
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
              <div className="absolute inset-0">
                <div
                  className={cn(
                    "h-full w-full p-4",
                    isGridView && participants.length > 1 ? "grid grid-cols-2 gap-4" : "relative",
                  )}
                >
                  <div
                    className={cn(
                      "relative rounded-xl overflow-hidden",
                      isGridView ? "h-full" : "h-full w-full",
                      "transition-all duration-300",
                    )}
                  >
                    {participants
                      .filter((p) => p.id !== callerInfo.id)
                      .map((participant) => (
                        <ParticipantScreen
                          key={participant.id}
                          participant={participant}
                          onToggleVideo={handleToggleVideo}
                          onToggleMute={handleToggleMute}
                          onRemoveParticipant={handleRemoveParticipant}
                          onToggleFullscreen={() => handleToggleFullscreen(participant.id)}
                          isFullscreen={fullscreenParticipant === participant.id}
                        />
                      ))}
                  </div>

                  {!isSelfViewMinimized && (
                    <div
                      className={cn(
                        "transition-all duration-300",
                        isGridView
                          ? "h-full rounded-xl overflow-hidden"
                          : "fixed z-20 bottom-24 right-6 w-[240px] h-[160px] group-hover:translate-y-[-80px]",
                        "group hover:scale-105",
                      )}
                    >
                      <div className="absolute -top-8 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                          onClick={() => handleToggleVideo("me")}
                        >
                          {callerInfo.isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                          onClick={() => handleToggleFullscreen(callerInfo.id)}
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                          onClick={() => {
                            setIsSelfViewMinimized(true)
                            if (isGridView) setIsGridView(false)
                          }}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <Card className="w-full h-full overflow-hidden border-primary/20">
                        <ParticipantScreen
                          participant={{
                            ...callerInfo,
                            isHost: true,
                            isVideoOn: false,
                            isMuted: isMuted,
                            role: "caller",
                          }}
                          onToggleVideo={handleToggleVideo}
                          onToggleMute={handleToggleMute}
                          onRemoveParticipant={handleRemoveParticipant}
                          onToggleFullscreen={() => handleToggleFullscreen(callerInfo.id)}
                          isFullscreen={fullscreenParticipant === callerInfo.id}
                        />
                      </Card>
                    </div>
                  )}

                  {isSelfViewMinimized && (
                    <Button
                      variant="ghost"
                      className="fixed bottom-24 right-6 z-20 h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
                      onClick={() => {
                        setIsSelfViewMinimized(false)
                        if (participants.length <= 2) setIsGridView(true)
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={callerInfo.avatar} />
                        <AvatarFallback>{callerInfo.name[0]}</AvatarFallback>
                      </Avatar>
                    </Button>
                  )}
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