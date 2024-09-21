import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MicrophoneIcon, SpeakerWaveIcon, PhoneIcon, ArrowPathRoundedSquareIcon, CalculatorIcon } from '@heroicons/react/24/solid'
import { PhoneCall, PhoneOutgoing, PhoneMissed, Voicemail, SignalIcon, Mic, Phone, PhoneForwarded} from "lucide-react"
import { MobileIcon } from "@radix-ui/react-icons"
import { XMarkIcon } from '@heroicons/react/24/outline'

interface CallUIProps {
  phoneNumber: string;
  onEndCall: () => void;
  callType: 'outgoing' | 'incoming';
}

export default function CallUI({ phoneNumber, onEndCall, callType }: CallUIProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [isDialpadOpen, setIsDialpadOpen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleMute = () => setIsMuted(!isMuted)
  const handleSpeaker = () => setIsSpeakerOn(!isSpeakerOn)
  const handleTransfer = () => setIsTransferring(!isTransferring)
  const handleDialpad = () => setIsDialpadOpen(!isDialpadOpen)

  return (
    <div className="fixed top-16 right-0 bottom-0 w-80 bg-gray-100 shadow-lg flex flex-col z-50">
      <div className="p-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {callType === 'outgoing' ? (
              <PhoneOutgoing className="h-5 w-5 text-blue-500" aria-hidden="true" />
            ) : (
              <PhoneCall className="h-5 w-5 text-green-500" aria-hidden="true" />
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {callType === 'outgoing' ? 'Outgoing' : 'Incoming'}
            </h2>
          </div>
          <button
            onClick={onEndCall}
            className="text-gray-400 hover:text-gray-500"
            aria-label="End call"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col justify-start items-center">
      <div className="bg-white p-2 flex w-80">
          <div className="flex space-x-2">
            <SignalIcon className="h-4 w-4 text-green-500" aria-hidden="true" />
            <span className="text-xs text-gray-600">Excellent</span>
          </div>
          <div className="text-xs pl-40 text-gray-600">
            {formatDuration(callDuration)}
          </div>
        </div>

        <div className="w-80">
        <div 
        className="p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(255,128,181,0.3) 0%, rgba(144,137,252,0.3) 100%)',
        }}
      >
        <div className="flex flex-col items-center justify-center">
        <span className="inline-block h-14 w-14 overflow-hidden rounded-full bg-gray-100">
        <svg fill="currentColor" viewBox="0 0 24 24" className="h-full w-full text-gray-300">
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </span>
        <p className="text-xl font-bold text-gray-900 mb-1 p-2">{phoneNumber}</p>
        <p className="text-sm text-gray-500 mb-6">
          {callType === 'outgoing' ? 'Calling...' : 'Incoming call'}
        </p>
        </div>
        </div>
        </div>
        <div className="bg-white p-4 border-t border-gray-200 w-80">
          <div className="grid grid-cols-3 gap-4 mb-4">
          <Button
          variant="outline"
          className="items-center justify-center p-2 ${isMuted ? 'bg-fuchsia-300' : 'bg-gray-100'}`}"
          onClick={handleMute}
          >
            <Mic className="h-6 w-6 mb-1 mr-2 text-gray-600" />
            <span className="text-xs text-gray-600">Mute</span>
          </Button>
          <Button
          variant="outline"
          className="items-center justify-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <SpeakerWaveIcon className="h-6 w-6 text-gray-600 mb-1 mr-2" />
            <span className="text-xs text-gray-600">Speaker</span>
          </Button>
          <Button 
          variant="outline"
          className="items-center justify-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          onClick={handleTransfer}
          >
            <PhoneForwarded className="h-6 w-6 text-gray-600 mb-1 mr-2" />
            <span className="text-xs text-gray-600">Transfer</span>
          </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
          <Button className="items-center justify-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <CalculatorIcon className="h-6 w-6 text-gray-600 mb-1 mr-2" />
            <span className="text-xs text-gray-600">Dialpad</span>
          </Button>
          <Button 
          variant="destructive"
          className="items-center justify-center p-3 col-span-2"
          onClick={onEndCall}
          >
            <Phone className="h-6 w-6 text-white mb-1 mr-2" />
            <span className="text-xs text-white">End Call</span>
          </Button>

          </div>
        </div>
      </div>
    </div>
  )
}