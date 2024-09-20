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
      <div className="flex-grow flex flex-col justify-start items-center pt-4 px-4">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-3">
          <PhoneIcon className="h-10 w-10 text-gray-500" aria-hidden="true" />
        </div>
        <p className="text-xl font-bold text-gray-900 mb-1">{phoneNumber}</p>
        <p className="text-sm text-gray-500 mb-6">
          {callType === 'outgoing' ? 'Calling...' : 'Incoming call'}
        </p>
        <div className="grid grid-cols-3 gap-4 w-full">
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