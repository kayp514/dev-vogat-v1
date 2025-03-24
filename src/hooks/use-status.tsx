"use client"

import { useCallback } from "react"
import { useSocket } from "../app/providers/SocketCtx"
import type { UserStatus } from "@/app/type"

export function useStatus(userId: string) {
    const { isConnected, updateStatus: setStatus, getUserStatus } = useSocket()
  
    // Get current status
    const status = getUserStatus(userId)
  
    // Update status wrapper
    const updateStatus = useCallback(
      (newStatus: UserStatus) => {
        setStatus(newStatus)
      },
      [setStatus],
    )
  
    return {
      status,
      updateStatus,
      isConnected,
    }
  }
