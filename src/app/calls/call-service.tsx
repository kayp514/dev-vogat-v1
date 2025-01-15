'use client'

import CallHistory from '../ui/callhistory';
import InputNumber from '../ui/inputnumber';
import { useCallSIP } from '@/app/CallSipProviderCtx';

export function CallService() {
  
  const { handleOutgoingCall } = useCallSIP();


  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-[320px] border-r flex-shrink-0 bg-background">
        <div className="p-4 space-y-4">
          <InputNumber onCall={handleOutgoingCall} />
        </div>
      </div>

      <div className="flex-1 bg-background min-w-[600px]">
        <CallHistory />
      </div>
    </div>
    );
}