import { PhoneIcon, MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid'
import { PhoneCall, PhoneOutgoing, PhoneMissed, Voicemail } from "lucide-react"
import { XMarkIcon } from '@heroicons/react/24/outline'

interface CallUIProps {
  phoneNumber: string;
  onEndCall: () => void;
  callType: 'outgoing' | 'incoming';
}

export default function CallUI({ phoneNumber, onEndCall, callType }: CallUIProps) {
  return (
    <div className="fixed top-16 right-0 bottom-0 w-80 bg-white shadow-lg flex flex-col z-50">
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
        <div className="py-4 grid grid-cols-3 gap-4 w-full">
          <button className="flex flex-col items-center justify-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <MicrophoneIcon className="h-6 w-6 text-gray-600 mb-1" />
            <span className="text-xs text-gray-600">Mute</span>
          </button>
          <button className="flex flex-col items-center justify-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <SpeakerWaveIcon className="h-6 w-6 text-gray-600 mb-1" />
            <span className="text-xs text-gray-600">Speaker</span>
          </button>
          <button
            onClick={onEndCall}
            className="flex flex-col items-center justify-center p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            <PhoneIcon className="h-6 w-6 text-white mb-1" />
            <span className="text-xs text-white">
              {callType === 'outgoing' ? 'End' : 'Decline'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}