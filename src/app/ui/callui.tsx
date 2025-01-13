import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  Phone, 
  PhoneCall,
  PhoneOff,
  PhoneOutgoing,
  Volume2,
  PhoneForwarded,
  KeyIcon,
  SignalHigh,
  ArrowRight,
  Clock,
  MapPin,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from "@/components/ui/input"
import { CallState, CallType } from '@/app/CallSipProvider';
import { mute, unmute, sendDTMF, terminateCall, getNetworkType, getCallDuration } from '../../lib/call'
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"



interface CallerInfo {
  name: string;
  avatar?: string;
  phoneNumber: string;
}

interface CallUIProps {
  callerInfo: CallerInfo;
  activeNumber: string;
  callState: CallState;
  callType: CallType;
  handleEndCall: () => void
  setIsCallActive: (isActive: boolean) => void
  isMaximized: boolean; 
  setIsMaximized: (isMax: boolean) => void;
}

function ParticipantCard({ 
  participant, 
  role, 
  callState, 
  duration, 
  formatDuration 
}: { 
  participant: CallerInfo; 
  role: 'caller' | 'me';
  callState?: string;
  duration?: number;
  formatDuration?: (seconds: number) => string;
}) {
  return (
    <Card className={cn(
      "w-[280px] bg-background/60 backdrop-blur-sm",
      "transition-all duration-300",
      role === 'me' ? "hover:shadow-md" : "hover:shadow-md"
    )}>
      <CardContent className="pt-6 px-6 pb-4">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <Avatar className={cn(
              role === 'caller' ? "h-24 w-24" : "h-24 w-24",
              "ring-4 ring-background",
              role === 'caller' 
                ? "ring-blue-500/20 hover:ring-blue-500/20" 
                : "ring-green-500/20 hover:ring-green-500/20",
              "transition-all duration-300"
            )}>
              <AvatarImage src={participant.avatar} />
              <AvatarFallback className={cn(
                role === 'caller' ? "text-2xl" : "text-2xl"
              )}>
                {participant.name[0]}
              </AvatarFallback>
            </Avatar>
            <span className={cn(
              "absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background",
              role === 'caller' ? "bg-blue-500" : "bg-green-500"
            )} />
          </div>
          
          <div className="space-y-1">
            <h3 className={cn(
              "font-semibold tracking-tight",
              role === 'caller' ? "text-lg" : "text-lg"
            )}>
              {participant.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {participant.phoneNumber}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DTMFDialPad () {
  const [dtmfInput, setDtmfInput] = useState('')

  const dialpadButtons = [
    { id: 1, name: '1' },
    { id: 2, name: '2' },
    { id: 3, name: '3' },
    { id: 4, name: '4' },
    { id: 5, name: '5' },
    { id: 6, name: '6' },
    { id: 7, name: '7' },
    { id: 8, name: '8' },
    { id: 9, name: '9' },
    { id: 10, name: '*' },
    { id: 11, name: '0' },
    { id: 12, name: '#' },
  ]

  const handleDTMFInput = (digit: string) => {
    setDtmfInput(prev => prev + digit)
    sendDTMF(digit)
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
        {dialpadButtons.map((number) => (
          <Button
            key={number.id}
            variant="outline"
            onClick={() => handleDTMFInput(number.name)}
            className="h-12 text-lg font-medium hover:bg-primary/10"
          >
            {number.name}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default function CallUI({ 
  callerInfo,
  activeNumber,
  callState,
  callType,
  setIsCallActive,
  handleEndCall,
  isMaximized,
  setIsMaximized
 }: CallUIProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [isDialpadOpen, setIsDialpadOpen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [networkQuality, setNetworkQuality] = useState('Excellent')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const callStartTimeRef = useRef<number | null>(null)

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ x: number; y: number } | null>(null)

  
  const handleMuteToggle = () => {
    if (isMuted) {
      unmute()
    } else {
      mute()
    }
    setIsMuted(!isMuted)
  }

  const handleSpeakerToggle = () => {
    // Implement speaker toggle logic here
    setIsSpeakerOn(!isSpeakerOn)
  }

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  const handleDrag = (e: React.MouseEvent) => {
    if (isDragging && dragRef.current) {
      setPosition({
        x: e.clientX - dragRef.current.x,
        y: e.clientY - dragRef.current.y
      })
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    dragRef.current = null
  }


  useEffect(() => {
    console.log('callState:', callState)
    let intervalId: NodeJS.Timeout

    const updateNetworkQuality = () => {
      const networkInfo = getNetworkType()
      if (networkInfo.status === 'success' && networkInfo.data) {
        setNetworkQuality(networkInfo.data)
      }
    }

    const updateCallDuration = () => {
      if (callStartTimeRef.current && callState === 'established') {
        const currentDuration = Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        setCallDuration(currentDuration)
      }
    }

    const handleAudio = () => {

    }

    handleAudio()

    if (callState === 'established') {
      console.log('callui setting callStartTimeRef')
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now()
      }
      intervalId = setInterval(() => {
        updateNetworkQuality()
        updateCallDuration()
      }, 1000)
    } else {
      console.log('callui resetting callStartTimeRef')
      callStartTimeRef.current = null
      setCallDuration(0)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [callState])


  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleMute = () => setIsMuted(!isMuted)
  const handleSpeaker = () => setIsSpeakerOn(!isSpeakerOn)
  const handleTransfer = () => setIsTransferring(!isTransferring)
  const handleDialpad = () => setIsDialpadOpen(!isDialpadOpen)

  const onEndCall = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.srcObject = null
    }
    handleEndCall()
    setIsCallActive(false)
  }, [handleEndCall, setIsCallActive])



  return (
    <Card 
      className={cn(
        "shadow-lg transition-all duration-300",
        isMaximized 
          ? "h-[calc(100vh-3.5rem)] w-full rounded-none" // Full height minus header
          : "w-[300px] bg-background/95 backdrop-blur",
        "overflow-hidden"
      )}
      style={!isMaximized ? {
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'move' : 'default'
      } : undefined}
    >
      <div
        className={cn(
          "h-10 px-4",
          callType === 'outgoing' ? "bg-blue-500/10" : "bg-green-500/10",
          !isMaximized && "cursor",
          "border-b"
        )}
        onMouseDown={!isMaximized ? handleDragStart : undefined}
        onMouseMove={!isMaximized ? handleDrag : undefined}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center space-x-2">
            {callType === 'outgoing' ? (
              <PhoneOutgoing className="h-4 w-4 text-blue-500" />
            ) : (
              <PhoneCall className="h-4 w-4 text-green-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              callType === 'outgoing' ? "text-blue-500" : "text-green-500"
            )}>
              {callType === 'outgoing' ? 'Outgoing Call' : 'Incoming Call'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
      </div>
      </div>

      <div className="h-8 px-4 bg-muted/30 border-b">
        <div className="flex items-center justify-between h-full">
          <span className={cn(
            "text-xs font-medium",
            callState === 'established' ? "text-green-600" : "text-blue-600"
          )}>
            {callState === 'establishing' ? 'Calling...' : 
             callState === 'established' ? 'On Call' : callState}
          </span>
          {callState === 'established' && (
            <span className="text-xs text-muted-foreground">
              {formatDuration(callDuration)}
            </span>
          )}
        </div>
      </div>

      {isMaximized ? (
        <div className="flex h-[calc(100vh-3.5rem-2.5rem)]">
          <div className="w-20 border-r bg-muted/30 flex flex-col items-center py-6 space-y-6">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full",
                isMuted && "bg-red-100 text-red-500"
              )}
              onClick={() => setIsMuted(!isMuted)}
            >
              <Mic className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full",
                isSpeakerOn && "bg-blue-100 text-blue-500"
              )}
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            >
              <Volume2 className="h-5 w-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                >
                  <KeyIcon className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <DTMFDialPad />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="flex items-start gap-8">
              <ParticipantCard
                participant={callerInfo}
                role="caller"
                callState={callState}
                duration={callDuration}
                formatDuration={formatDuration}
              />
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="h-px w-8 bg-muted-foreground/20" />
                <div className={cn(
    "rounded-full p-3 relative",
    callState === 'establishing' 
      ? "bg-blue-500/10" 
      : "bg-muted",
    "transition-colors duration-300"
  )}>
    {callState === 'establishing' && (
      <>
        <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-[pulse_2s_ease-in-out_infinite]" />
        <div className="absolute inset-0 rounded-full bg-blue-500/5 animate-[pulse_2s_ease-in-out_infinite_0.5s]" />
      </>
    )}
    <PhoneCall className={cn(
      "h-4 w-4 relative",
      callState === 'establishing'
        ? "text-blue-500 animate-[ringing_1.5s_ease-in-out_infinite]"
        : "text-muted-foreground",
      "transform-origin-center transition-colors duration-300"
    )} />
  </div>
                <div className="h-px w-8 bg-muted-foreground/20" />
              </div>
              <ParticipantCard
                participant={{
                  name: "Me",
                  avatar: "/path/to/my/avatar.jpg",
                  phoneNumber: activeNumber,
                }}
                role="me"
              />
            </div>

            {/* End Call Button */}
            <Button
              variant="destructive"
              size="lg"
              className="mt-12"
              onClick={() => {
                handleEndCall()
                setIsCallActive(false)
              }}
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              End Call
            </Button>
          </div>
        </div>
      ) : (

      <>
      <CardHeader className="p-4 space-y-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={callerInfo.avatar} />
            <AvatarFallback>{callerInfo.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{callerInfo.name}</h3>
            <p className="text-sm text-muted-foreground">{callerInfo.phoneNumber}</p>
          </div>
        </div>
      </CardHeader>


      <CardContent className="p-4 pt-0">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {callState === 'establishing' ? 'Calling...' : 
             callState === 'established' ? 'On Call' : callState}
          </p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full",
                isMuted && "bg-red-100 text-red-500"
              )}
              onClick={() => setIsMuted(!isMuted)}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full",
                isSpeakerOn && "bg-blue-100 text-blue-500"
              )}
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                >
                  <KeyIcon className="h-4 w-4" />
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
  )
}