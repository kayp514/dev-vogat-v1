'use client'

import { useContext } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Network, PhoneCall, Router, Phone } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SipProviderCtx } from "../SipProviderCtx"

type PstnStatusType = 'connected' | 'disconnected' | 'connecting'

interface PstnStatusProps {
    className?: string
  }

  function PSTNIcon({ className }: { className?: string }) {
    return (
      <div className={cn("relative", className)}>
        {/* You can choose one of these combinations */}
        
        {/* Option 1: Network with Phone overlay */}
        <Network className="h-4 w-4 text-muted-foreground" />
        {/* <Phone className="h-2.5 w-2.5 text-muted-foreground absolute -bottom-0.5 -right-0.5" /> */}
        
        {/* Option 2: Router with PhoneCall */}
        {/* <Router className="h-4 w-4 text-muted-foreground" />
        <PhoneCall className="h-2.5 w-2.5 text-muted-foreground absolute -bottom-0.5 -right-0.5" /> */}
        
        {/* Option 3: Custom SVG icon */}
        {/* <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M3 7c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7z" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
          <circle cx="12" cy="12" r="4" />
        </svg> */}
      </div>
    )
  }

  export function PstnStatus({ className }: PstnStatusProps) {
    const { sipStatus, transportStatus } = useContext(SipProviderCtx)

    const getConnectionStatus = () => {
        if (transportStatus !== 'connected') {
          return 'disconnected'
        }
        
        switch (sipStatus) {
          case 'registered':
            return 'connected'
          case 'initializing':
          case 'registering':
            return 'connecting'
          default:
            return 'disconnected'
        }
    }

    const getStatusColor = (status: PstnStatusType) => {
      switch (status) {
        case 'connected':
          return 'bg-green-500'
        case 'connecting':
          return 'bg-yellow-500 animate-pulse'
        case 'disconnected':
        default:
          return 'bg-red-500'
      }
    }

    const getStatusText = (status: PstnStatusType) => {
        switch (status) {
          case 'connected':
            return 'Connected'
          case 'connecting':
            return 'Connecting...'
          case 'disconnected':
          default:
            return 'Disconnected'
        }
      }

    const connectionStatus = getConnectionStatus() 

      return (
        <Card className={cn(
          "bg-background/60 backdrop-blur-sm border-muted", 
          className
        )}>
          <CardContent className="flex items-center gap-4 p-2">
            <div className="flex items-center gap-2">
             <PSTNIcon />
              <span className="text-sm font-medium">PSTN</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <Badge 
              variant="outline" 
              className={cn(
                "flex items-center gap-2",
                connectionStatus === 'connecting' && "animate-pulse"
              )}
            >
              <span className={cn(
                "h-2 w-2 rounded-full",
                getStatusColor(connectionStatus)
              )} />
              {getStatusText(connectionStatus)}
            </Badge>
          </CardContent>
        </Card>
      )
    }