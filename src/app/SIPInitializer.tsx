// src/app/SIPInitializer.tsx
'use client'

import { useEffect } from 'react'
import { useSIP } from './SIPContext'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SIPInitializer() {
  const { sipStatus, isInitialized, isRegistered, initializeSIP, register } = useSIP()

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

  if (sipStatus === 'registered') {
    return null
  }

  return (
    <Alert variant="destructive" className=" top-0 left-0 right-0 m-4">
      <AlertTitle className="flex items-center justify-between">
        SIP Status
        <Button 
          variant="ghost" 
          className="h-4 w-4 p-0" 
          onClick={() => {/* Add logic to dismiss alert */}}
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