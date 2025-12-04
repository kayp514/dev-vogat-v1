'use client'

import { AppLayout } from "../../components/app-layout";
import { useAuth } from "@tern-secure/nextjs";
import useSWR from 'swr'
import { fetcher } from "@/lib/utils";
import { UserData } from '../type'
import { useStatus } from  "@/hooks/use-status"
import { createSocketConfig } from "@/ternsecure-realtime/utils/socketSessionConfig";
import { SocketProvider } from "@/ternsecure-realtime/providers/SocketProvider";
import { ChatProvider } from "@/ternsecure-realtime/providers/ChatProvider";


const API_KEY = process.env.TERNSECURE_REALTIME_KEY


export default function VzeroPage() {
  const { user } = useAuth()
  if(!user) return null

  ///const { data: cachedUser } = useSWR(
  //  user?.uid ? `/api/users` : null,
 //   fetcher,
//);

  const baseUserData: UserData = {
    id: 'me',
    name: user?.displayName || (user?.email ? user.email.split('@')[0] : user?.uid.substring(0, 8)),
    email: user?.email || '',
    uid: user?.uid || '',
    avatar: user?.photoURL || '',
    phoneNumber: user?.phoneNumber || '+1 (647) 243-8101',
  }


  const socketConfig = createSocketConfig(
    user?.uid || "", 
    API_KEY ?? 'fake_vgt_key',
    { 
      storageType: 'localStorage',
      storageKey: 'app_socket_session'
    }
  );





  const userData = {
    ...baseUserData,
  }

  return (
    <SocketProvider config={socketConfig}>
      <ChatProvider clientMetaData={userData}>
        <AppLayout userData={userData} /> 
        </ChatProvider>
    </SocketProvider>
    )
}