"use client"

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"
import { SocketCtx } from "./SocketCtx"
import type { ServerToClientEvents, ClientToServerEvents } from "@/app/types/socket"
import type { UserStatus } from "@/app/type"
import { useAuth } from "@tern-secure/nextjs" 

const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL
const RECONNECTION_ATTEMPTS = 5
const RECONNECTION_DELAY = 1000
const CONNECTION_TIMEOUT = 60000

interface SocketProviderProps {
  children: ReactNode
}


export function SocketProvider({ children }: SocketProviderProps) {
  const { user } = useAuth() 
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [userStatus, setUserStatus] = useState<Record<string, UserStatus>>({})
  const connectionAttempted = useRef(false)
  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (connectionAttempted.current || socket) return

    connectionAttempted.current = true
    

    try {
      const socketInstance = io(baseUrl, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: RECONNECTION_ATTEMPTS,
        reconnectionDelay: RECONNECTION_DELAY,
        timeout: CONNECTION_TIMEOUT,
        autoConnect: true,
      })

      setSocket(socketInstance)
      return socketInstance
    } catch (error) {
      console.error("Socket initialization error:", error)
      setConnectionError("Failed to initialize socket connection")
      connectionAttempted.current = false
      return null
    }
  }, [socket])

  // Handle socket events
  useEffect(() => {
    if (!socket) return

    const handleConnect = () => {
      console.log("Socket connected")
      setIsConnected(true)
      setConnectionError(null)

      // Re-initialize user if we have an ID stored
      if (user?.uid ) {
        socket.emit("initialize", user.uid)
      }
    }

    const handleDisconnect = (reason: string) => {
      console.log("Socket disconnected:", reason)
      setIsConnected(false)
    }

    const handleConnectError = (error: Error) => {
      console.error("Socket connection error:", error)
      setConnectionError(error.message)
      setIsConnected(false)
    }

    const handleStatusUpdate = (update: { userId: string; status: UserStatus }) => {
      setUserStatus((prev) => ({
        ...prev,
        [update.userId]: update.status,
      }))
    }

    // Set up event listeners
    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("connect_error", handleConnectError)
    socket.on("statusUpdate", handleStatusUpdate)

    // Clean up event listeners
    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("connect_error", handleConnectError)
      socket.off("statusUpdate", handleStatusUpdate)
    }
  }, [socket, user?.uid])

  // Initialize user
  const initializeUser = useCallback(
    (userId: string) => {
      if (!socket || !isConnected) {
        initializeSocket()
        return
      }

      if(user?.uid) {
        socket.emit("initialize", userId)
      }
    },
    [socket, isConnected, initializeSocket, user],
  )

  // Update user status
  const updateStatus = useCallback(
    (status: UserStatus) => {
      if (socket && isConnected) {
        socket.emit("setStatus", status)
      }
    },
    [socket, isConnected],
  )

  // Get user status
  const getUserStatus = useCallback(
    (userId: string) => {
      return userStatus[userId] || "offline"
    },
    [userStatus],
  )

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
      setConnectionError(null)
      connectionAttempted.current = false
    }
  }, [socket])

  // Auto-initialize socket on mount
  useEffect(() => {
    if (!socket && !connectionAttempted.current) {
      initializeSocket()
    }
    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [socket, initializeSocket, disconnect])

  return (
    <SocketCtx.Provider
      value={{
        socket,
        isConnected,
        connectionError,
        initializeUser,
        updateStatus,
        getUserStatus,
        disconnect,
      }}
    >
      {children}
    </SocketCtx.Provider>
  )
}

