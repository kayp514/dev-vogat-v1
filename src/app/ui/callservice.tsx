'use client'

import CallHistory from './callhistory';
import InputNumber from './inputnumber';
import { useCallSIP } from '@/app/CallSIPContext';

export default function CallService() {
  
  const { handleOutgoingCall } = useCallSIP();


  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white">
      <div className="relative left-10 p-4 w-80 bg-white border-r border-gray-200 flex flex-col">
        <InputNumber onCall={handleOutgoingCall} />
      </div>

      <div className="pl-11 flex-1 flex flex-col overflow-hidden">
        <div className="w-2/3 h-full max-w-7xl flex flex-col bg-white">
        <CallHistory />
        </div>
      </div>

    </div>
    );
}