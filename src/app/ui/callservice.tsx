import { useState } from 'react';
import CallHistory from './callhistory';
import InputNumber from './inputnumber';
import { useCall } from '../callcontext';

export default function CallService() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeNumber, setActiveNumber] = useState('');
  
  const handleCall = (phoneNumber: string) => {
    setIsCallActive(true);
    setActiveNumber(phoneNumber);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setActiveNumber('');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white">
      <div className="relative left-10 p-4 w-80 bg-white border-r border-gray-200 flex flex-col">
        <InputNumber onCall={handleCall} />
      </div>

      <div className="pl-11 flex-1 flex flex-col overflow-hidden">
        <div className="w-2/3 h-full max-w-7xl flex flex-col bg-white">
        <CallHistory />
        </div>
      </div>

    </div>
    );
}