import { PhoneIcon, MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/20/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface CallUIProps {
  phoneNumber: string;
  onEndCall: () => void;
}

export default function CallUI({ phoneNumber, onEndCall }: CallUIProps) {
  return (
    <div className="fixed top-14 right-0 bottom-0 h-full w-80 bg-white shadow-lg flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Calling</h2>
          <button
            onClick={onEndCall}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="flex-grow flex flex-col justify-center items-center p-4">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <PhoneIcon className="h-12 w-12 text-gray-500" aria-hidden="true" />
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-2">{phoneNumber}</p>
        <p className="text-gray-500">Calling...</p>
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <button className="flex flex-col items-center justify-center p-2 bg-gray-100 rounded-lg">
            <MicrophoneIcon className="h-6 w-6 text-gray-600" />
            <span className="mt-1 text-xs text-gray-600">Mute</span>
          </button>
          <button className="flex flex-col items-center justify-center p-2 bg-gray-100 rounded-lg">
            <SpeakerWaveIcon className="h-6 w-6 text-gray-600" />
            <span className="mt-1 text-xs text-gray-600">Speaker</span>
          </button>
          <button
            onClick={onEndCall}
            className="flex flex-col items-center justify-center p-2 bg-red-500 rounded-lg"
          >
            <PhoneIcon className="h-6 w-6 text-white" />
            <span className="mt-1 text-xs text-white">End</span>
          </button>
        </div>
      </div>
    </div>
  )
}