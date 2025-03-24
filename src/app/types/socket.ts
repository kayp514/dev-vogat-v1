import type { Server as NetServer, Socket } from "net"
import type { NextApiResponse } from "next"
import type { Server as SocketIOServer } from "socket.io"
import type { UserStatus } from '@/app/type'

export interface StatusUpdate {
    userId: string;
    status: UserStatus;
    timestamp: number;
}
  
  export interface ServerToClientEvents {
    statusUpdate: (update: StatusUpdate) => void;
    userConnected: (userId: string) => void;
    userDisconnected: (userId: string) => void;
  }
  
  export interface ClientToServerEvents {
    setStatus: (status: UserStatus) => void;
    initialize: (userId: string) => void;
  }

  export interface InterServerEvents {
    ping: () => void
  }
  
  export interface SocketData {
    userId: string
    status: UserStatus
  }


export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}