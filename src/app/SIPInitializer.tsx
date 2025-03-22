// src/app/SIPInitializer.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSIP } from './providers/SipProviderCtx'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"


export function SIPInitializer() {
  const { sipStatus, transportStatus, networkStatus, isInitialized, isRegistered, initializeSIP, register } = useSIP()
  const [showAlert, setShowAlert] = useState(true)

  useEffect(() => {
    if (sipStatus === 'uninitialized') {
      initializeSIP()
    }
  }, [sipStatus, initializeSIP])

  useEffect(() => {
    if (isInitialized && !isRegistered && sipStatus !== 'registering') {
      register()
    }
  }, [isInitialized, isRegistered, sipStatus, register])

  if (sipStatus === 'registered' || !showAlert) {
    return null
  }

  return (
    <div className={cn(
      "fixed top-0 left-[60px] right-0 z-50 p-4 animate-in fade-in slide-in-from-top-5",
      "pointer-events-none" // Allow clicks to pass through to elements below
    )}>
      <Alert 
        variant="destructive" 
        className={cn(
          "pointer-events-auto", // Re-enable pointer events for the alert
          "max-w-2xl mx-auto",
          "border-2",
          "shadow-lg",
          "backdrop-blur bg-background/95"
        )}
      >
        <div className="flex items-center justify-between">
          <AlertTitle>SIP Status</AlertTitle>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6" 
            onClick={() => setShowAlert(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <AlertDescription className="mt-2 text-sm">
          {sipStatus === 'uninitialized' && "Preparing to initialize SIP..."}
          {sipStatus === 'initializing' && "Initializing SIP..."}
          {sipStatus === 'initialized' && "SIP initialized. Preparing to register..."}
          {sipStatus === 'registering' && "SIP initialized. Registering..."}
          {sipStatus === 'disconnected' && "SIP Disconnected"}
          {sipStatus === 'error' && "Error in SIP initialization or registration. Please try again."}
        </AlertDescription>
      </Alert>
    </div>
  )
}