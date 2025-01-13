// src/app/SIPInitializer.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSIP } from './SipProviderCtx'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SIPInitializer() {
  const { sipStatus, isInitialized, isRegistered, initializeSIP, register } = useSIP()
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
    <Alert variant="destructive">
      <AlertTitle className="flex items-center justify-between">
        SIP Status
        <Button 
          variant="ghost" 
          className="h-4 w-4 p-0" 
          onClick={() => setShowAlert(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription>
        {sipStatus === 'uninitialized' && "Preparing to initialize SIP..."}
        {sipStatus === 'initializing' && "Initializing SIP..."}
        {sipStatus === 'initialized' && "SIP initialized. Preparing to register..."}
        {sipStatus === 'registering' && "SIP initialized. Registering..."}
        {sipStatus === 'error' && "Error in SIP initialization or registration. Please try again."}
      </AlertDescription>
    </Alert>
  )
}