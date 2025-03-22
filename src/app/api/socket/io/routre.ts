{/*
  import { Server as NetServer } from 'http'
import { NextApiResponse } from "next"
import { Server as SocketIOServer } from "socket.io"

import { getSocketIO } from '@/lib/socket'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

let io: SocketIOServer | undefined
console.log('router socket', io)


export async function GET(req: Request, res: NextApiResponse) {
    if(!io) {
    const server = new NetServer()
    io = getSocketIO(server)

    console.log('router socket', io)

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id)

      socket.on("initialize", (userId) => {
        socket.data.userId = userId
        socket.data.status = "online"
        io?.emit('statusUpdate', {
            userId,
            status: "online",
            timestamp: Date.now()
        })
      })

      socket.on("setStatus", (status) => {
        const userId = socket.data.userId
        if (userId) {
          socket.data.status = status
          io?.emit('statusUpdate',  {
            userId,
            status,
            timestamp: Date.now()
          })
        }
      })

      socket.on("disconnect", () => {
        const userId = socket.data.userId
        if (userId) {
          io?.emit('statusUpdate', {
          userId,
          status: "offline",
          timestamp: Date.now()
        })
        }
      })
    })
}

    return new Response("Socket.IO server running")
}

*/}