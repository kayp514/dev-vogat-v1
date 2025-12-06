'use client'

import { CallHistory } from '../../components/callhistory';
import { InputNumber } from '../../components/inputnumber';
import { useCallSIP } from '@/app/providers/CallSipProviderCtx';

import type { UserData, CallerInfo } from "../type"

interface CallServiceProps {
  userData: UserData
  onCall: (phoneNumber: string, callerInfo: CallerInfo, calleeInfo: CallerInfo) => void
}

export function CallService({ userData, onCall }: CallServiceProps) {
  
  const { handleOutgoingCall } = useCallSIP();


  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-[320px] border-r shrink-0 bg-background">
        <div className="p-4 space-y-4">
          <InputNumber userData={userData} onCall={onCall} />
        </div>
      </div>

      <div className="flex-1 bg-background min-w-[600px]">
        <CallHistory />
      </div>
    </div>
    );
}