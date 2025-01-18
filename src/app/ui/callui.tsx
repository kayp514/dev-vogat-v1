'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, PhoneCall, PhoneOff, PhoneOutgoing, 
  Volume2, VolumeX,
  KeyRound, Signal, Clock, Maximize2, Minimize2,
  UserPlus } from 'lucide-react'
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


export default function CallUI({
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
      <div className={cn(
        "fixed z-50",
        isMaximized
          ? "inset-0 pl-[72px] pt-14"
          : "bottom-4 right-4",
        "pointer-events-none"
      )}>
        {isMaximized && (
          <div
            className="fixed inset-0 pl-[72px] pt-14 bg-background/60 backdrop-blur-sm -z-10"
            aria-hidden="true"
          />
        )}
        <Card
          className={cn(
            "pointer-events-auto",
            "shadow-lg transition-all duration-300",
            isMaximized
              ? "h-[calc(100vh-3.5rem)] w-[calc(100vw-72px)] ml-auto"
              : "w-[300px] rounded-lg",
            "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          )}
        >
          <div
            className={cn(
              "h-12 px-4",
              callType === 'outgoing' ? "bg-blue-500/10" : "bg-green-500/10",
              "border-b flex items-center justify-between",
              "transition-colors duration-300"
            )}
          >
            <div className="flex items-center gap-2">
              {callType === 'outgoing' ? (
                <PhoneOutgoing className="h-4 w-4 text-blue-500" />
              ) : (
                <PhoneCall className="h-4 w-4 text-green-500" />
              )}
              <span className={cn(
                "text-sm font-medium",
                callType === 'outgoing' ? "text-blue-500" : "text-green-500"
              )}>
                {participants.length > 2 ? 'Group Call' : (callType === 'outgoing' ? 'Outgoing Call' : 'Incoming Call')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-background/80"
                onClick={() => setIsMaximized(!isMaximized)}
              >
                {isMaximized ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="h-10 px-4 bg-muted/30 border-b flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-medium flex items-center gap-1",
                callState === 'established' ? "text-green-600" : "text-blue-600"
              )}>
                <Signal className="h-3 w-3" />
                {networkQuality}
              </span>
            </div>
            {callState === 'established' && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatDuration(callDuration)}
                </span>
              </div>
            )}
          </div>

          {isMaximized ? (
            <div className="flex h-[calc(100%-5.5rem)]">
              <div className="w-20 border-r bg-muted/30 flex flex-col items-center py-8 space-y-8 backdrop-blur-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-14 w-14 rounded-full",
                        isMuted
                          ? "bg-red-100 text-red-500 hover:bg-red-100/80 hover:text-red-500/90"
                          : "hover:bg-accent"
                      )}
                      onClick={() => handleToggleMute('me')}
                    >
                      {isMuted ? (
                        <MicOff className="h-6 w-6" />
                      ) : (
                        <Mic className="h-6 w-6" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {isMuted ? 'Unmute' : 'Mute'} microphone
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-14 w-14 rounded-full",
                        isSpeakerOn
                          ? "bg-blue-100 text-blue-500 hover:bg-blue-100/80 hover:text-blue-500/90"
                          : "hover:bg-accent"
                      )}
                      onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    >
                      {isSpeakerOn ? (
                        <Volume2 className="h-6 w-6" />
                      ) : (
                        <VolumeX className="h-6 w-6" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {isSpeakerOn ? 'Disable' : 'Enable'} speaker
                  </TooltipContent>
                </Tooltip>

                <Popover>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-14 w-14 rounded-full hover:bg-accent"
                          >
                            <KeyRound className="h-6 w-6" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Open dialpad
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <PopoverContent className="w-auto p-0" align="center">
                    <DTMFDialPad />
                  </PopoverContent>
                </Popover>

                {participants.length < 8 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-14 w-14 rounded-full hover:bg-accent"
                        onClick={handleAddParticipant}
                      >
                        <UserPlus className="h-6 w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Add participant
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-sm">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="relative h-full w-full">
                <div className="w-full h-[calc(100vh-12rem)]">
          {participants.filter(p => p.id !== callerInfo.id).map((participant) => (
          <div key={participant.id} className="w-full h-full">
            <ParticipantScreen
              participant={participant}
              onToggleVideo={handleToggleVideo}
              onToggleMute={handleToggleMute}
              onRemoveParticipant={handleRemoveParticipant}
              onToggleFullscreen={() => handleToggleFullscreen(participant.id)}
              isFullscreen={fullscreenParticipant === participant.id}
            />
          </div>
        ))}
        </div>
        <div className="absolute bottom-4 right-4 w-[280px] h-[180px] rounded-lg overflow-hidden shadow-lg border border-border/50 hover:scale-105 transition-transform duration-200">
        <ParticipantScreen
                  participant={{
                    ...callerInfo,
                    isHost: true,
                    isVideoOn: false,
                    isMuted: isMuted,
                    role: 'caller'
                  }}
                  onToggleVideo={handleToggleVideo}
                  onToggleMute={handleToggleMute}
                  onRemoveParticipant={handleRemoveParticipant}
                  onToggleFullscreen={() => handleToggleFullscreen(callerInfo.id)}
                  isFullscreen={fullscreenParticipant === callerInfo.id}
                        />
                        </div>
                        </div>
                </ScrollArea>
              </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-4 p-4 rounded-full bg-background/95 backdrop-blur-sm border shadow-lg">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-12 w-12 rounded-full",
                              isMuted && "bg-red-500/20 text-red-200"
                            )}
                            onClick={() => handleToggleMute('me')}
                          >
                            {isMuted ? (
                              <MicOff className="h-5 w-5" />
                            ) : (
                              <Mic className="h-5 w-5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isMuted ? 'Unmute' : 'Mute'}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-12 w-12 rounded-full"
                            onClick={() => {
                              handleEndCall()
                              setIsCallActive(false)
                            }}
                          >
                            <PhoneOff className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          End call
                        </TooltipContent>
                      </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-12 w-12 rounded-full"
                            >
                              <UserPlus className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Add participant
                          </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
            </div>
          ) : (
            <>
              <CardHeader className="p-4 space-y-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={calleeInfo.avatar} />
                    <AvatarFallback>{calleeInfo.name[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{calleeInfo.name}</h3>
                    <p className="text-sm text-muted-foreground">{activeNumber}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0">
                <div className="text-center space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {callState === 'establishing' ? 'Calling...' :
                      callState === 'established' ? 'On Call' : callState}
                  </p>
                  <div className="flex justify-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "h-10 w-10 rounded-full",
                            isMuted && "bg-red-100 text-red-500"
                          )}
                          onClick={() => handleToggleMute('me')}
                        >
                          {isMuted ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isMuted ? 'Unmute' : 'Mute'} microphone
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "h-10 w-10 rounded-full",
                            isSpeakerOn && "bg-blue-100 text-blue-500"
                          )}
                          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                        >
                          {isSpeakerOn ? (
                            <Volume2 className="h-4 w-4" />
                          ) : (
                            <VolumeX className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isSpeakerOn ? 'Disable' : 'Enable'} speaker
                      </TooltipContent>
                    </Tooltip>

                    <Popover>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full"
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            Open dialpad
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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

