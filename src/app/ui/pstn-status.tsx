'use client'

import { useContext } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Network, PhoneCall, Router, Phone } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SipProviderCtx } from "../SipProviderCtx"

type PstnStatusType = 'connected' | 'disconnected' | 'connecting'

interface PstnStatusProps {
    className?: string
  }

  function StatusIcon({ status, className }: { status: PstnStatusType, className?: string }) {
    return (
      <div className={cn("relative", className)}>
        <Network className="h-4 w-4 text-muted-foreground" />
        <span className={cn(
        "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-background",
        status === 'connected' && "bg-green-500",
        status === 'connecting' && "bg-yellow-500 animate-pulse",
        status === 'disconnected' && "bg-red-500",
      )} />
      </div>
    )
  }

  export function PstnStatus({ className }: PstnStatusProps) {
    const { sipStatus, transportStatus, networkStatus } = useContext(SipProviderCtx)

    const getConnectionStatus = (): PstnStatusType => {
      if (networkStatus === 'offline') {
        return 'disconnected'
      }
      
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

    const getStatusDetails = (status: PstnStatusType) => {
      switch (status) {
        case 'connected':
          return {
            label: 'Connected',
            description: 'PSTN service is active and ready',
            color: 'text-green-500',
            icon: <StatusIcon status="connected" className="text-green-500" />
          }
        case 'connecting':
          return {
            label: 'Connecting',
            description: 'Establishing connection...',
            color: 'text-yellow-500',
            icon: <StatusIcon status="connecting" className="text-yellow-500" />
          }
        case 'disconnected':
        default:
          return {
            label: 'Disconnected',
            description: networkStatus === 'offline' 
              ? 'No network connection' 
              : 'PSTN service unavailable',
            color: 'text-red-500',
            icon: <StatusIcon status="disconnected" className="text-red-500" />
          }
      }
    }

    const connectionStatus = getConnectionStatus() 
    const statusDetails = getStatusDetails(connectionStatus)

      return (
        <TooltipProvider>
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
          <Card className={cn(
            "bg-background/60 backdrop-blur-sm border-muted transition-all duration-200", 
            "hover:bg-accent/50 hover:shadow-sm",
            "relative",
            className
          )}>
                        <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-4 p-2">
                  <div className="flex items-center gap-2">
                    {statusDetails.icon}
                    <span className="text-sm font-medium">PSTN</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "flex items-center gap-2 transition-colors duration-200",
                      connectionStatus === 'connecting' && "animate-pulse"
                    )}
                  >
                    <span className={cn(
                      "h-2 w-2 rounded-full transition-colors",
                      connectionStatus === 'connected' && "bg-green-500",
                      connectionStatus === 'connecting' && "bg-yellow-500",
                      connectionStatus === 'disconnected' && "bg-red-500"
                    )} />
                    <span className={cn(
                      "transition-colors duration-200",
                      statusDetails.color
                    )}>
                      {statusDetails.label}
                    </span>
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {statusDetails.description}
              </TooltipContent>
            </Tooltip>
            </Card>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" align="start" sideOffset={8}>
          <div className="flex justify-between space-x-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">PSTN Status Details</h4>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-24">Network</Badge>
                  <span className={cn(
                    "text-xs",
                    networkStatus === 'online' ? "text-green-500" : "text-red-500"
                  )}>
                    {networkStatus === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-24">Transport</Badge>
                  <span className={cn(
                    "text-xs",
                    transportStatus === 'connected' ? "text-green-500" : 
                    transportStatus === 'connecting' ? "text-yellow-500" : "text-red-500"
                  )}>
                    {transportStatus.charAt(0).toUpperCase() + transportStatus.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-24">SIP</Badge>
                  <span className={cn(
                    "text-xs",
                    sipStatus === 'registered' ? "text-green-500" :
                    sipStatus === 'initializing' || sipStatus === 'registering' ? "text-yellow-500" :
                    "text-red-500"
                  )}>
                    {sipStatus.charAt(0).toUpperCase() + sipStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </HoverCardContent>
        </HoverCard>
        </TooltipProvider>
      )
    }