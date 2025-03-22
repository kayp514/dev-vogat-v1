'use client'

import { createContext, useContext } from "react"
import type { ServerToClientEvents, ClientToServerEvents } from "@/app/types/socket"
import type { UserStatus } from "@/app/type"
import { type Socket } from "socket.io-client"

interface SocketCtxType {
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null
    isConnected: boolean
    connectionError: string | null
    initializeUser: (userId: string) => void
    updateStatus: (status: UserStatus) => void
    getUserStatus: (userId: string) => string
    disconnect: () => void
}
  
export const SocketCtx = createContext<SocketCtxType>({
    socket: null,
    isConnected: false,
    connectionError: null,
    initializeUser: () => {},
    updateStatus: () => {},
    getUserStatus: () => 'offline',
    disconnect: () => {},
})

SocketCtx.displayName = "SocketCtx"

export function useSocket() {
    const ctx =  useContext(SocketCtx)

    if (!ctx) {
        throw new Error("useSocket must be used within a SocketProvider")
    }

    return ctx
}