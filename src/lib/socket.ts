import { Server as NetServer } from 'http'
import { Server } from 'socket.io'
import type { 
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData 
} from '@/app/types/socket'


const SOCKET_URL = process.env.SOCKET_URL


export function getSocketIO(server: NetServer) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })
  
  return io
}