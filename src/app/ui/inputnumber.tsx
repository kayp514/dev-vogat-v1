import { useState, useEffect } from 'react';
import { BarsArrowDownIcon, PhoneIcon } from '@heroicons/react/20/solid'
import { useCall } from '../callcontext';

const numbers = [
  { id: 1, name: '1' },
  { id: 2, name: '2' },
  { id: 3, name: '3' },
  { id: 4, name: '4' },
  { id: 5, name: '5' },
  { id: 6, name: '6' },
  { id: 7, name: '7' },
  { id: 8, name: '8' },
  { id: 9, name: '9' },
  { id: 10, name: '*' },
  { id: 11, name: '0' },
  { id: 12, name: '#' },
];

interface InputNumberProps {
  onCall: (phoneNumber: string) => void;
}

export default function InputNumber({ onCall } : InputNumberProps) {
  const [showNumbers, setShowNumbers] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const { handleOutgoingCall } = useCall()
  const [isRinging, setIsRinging] = useState(false)
  const [audio] = useState(new Audio('/path/to/ringtone.mp3'))

  useEffect(() => {
    audio.loop = true
    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [audio])


  const toggleNumbers = () => {
    setShowNumbers(!showNumbers);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  const handleNumberClick = (number: string) => {
    setPhoneNumber(phoneNumber + number);
  };

  const initiateCall = () => {
    if (phoneNumber.trim() !== ''){
      handleOutgoingCall(phoneNumber);
    }
  };

  const isCallButtonDisabled = phoneNumber.trim() === '';

  return (
    <div className="px-4 py-4">
      <div className="flex rounded-md shadow-sm">
        <div className="relative w-full">
          <input
            id="phone"
            name="phone"
            type="text"
            placeholder="Type Phone Number"
            value={phoneNumber}
            onChange={handleInputChange}
            className="peer block w-full border-0 bg-gray-50 py-1.5 text-gray-900 focus:ring-0 sm:text-sm sm:leading-6"
          />
                  <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 border-t border-gray-300 peer-focus:border-t-2 peer-focus:border-indigo-600"
        />
        </div>
        <button
          type="button"
          onClick={toggleNumbers}
          className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {showNumbers ? (
          <BarsArrowDownIcon aria-hidden="true" className="-ml-0.5 h-5 w-5 text-gray-700" />
          ):(
          <BarsArrowDownIcon aria-hidden="true" className="-ml-0.5 h-5 w-5 text-gray-400" />
        )}
        </button>
      </div>
      {showNumbers && (
      <div className="flex flex-col mt-4 gap-2 items-center">
        <div className="flex gap-2">
        {numbers.slice(0,3).map((item) =>
            <button
            key={item.id}
            type="button"
            onClick={() => handleNumberClick(item.name)}
            className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-gray-800 bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50"
            >
                {item.name}
            </button>
        )}
        </div>
        <div className="flex gap-2">
        {numbers.slice(3,6).map((item) =>
  
            <button
            key={item.id}
            type="button"
            onClick={() => handleNumberClick(item.name)}
            className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-gray-800 bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50"
            >
                {item.name}
            </button>
        )}
        </div>
        <div className="flex gap-2">
        {numbers.slice(6,9).map((item) =>
        <div>
            <button
            key={item.id}
            type="button"
            onClick={() => handleNumberClick(item.name)}
            className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-gray-800 bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50"
            >
                {item.name}
            </button>
        </div>
        
        )}
        </div>
        <div className="flex gap-2">
        {numbers.slice(9).map((item) =>
        <div>
            <button
            key={item.id}
            type="button"
            onClick={() => handleNumberClick(item.name)}
            className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-gray-800 bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50"
            >
                {item.name}
            </button>
        </div>
        
        )}
        </div>
        </div>
        )}
      <div className="mt-4">
        <button
        type="button"
        disabled={isCallButtonDisabled}
        onClick={initiateCall}
        className={`w-full rounded-md px-3 py-2 text-sm font-semibold shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center justify-center
        ${isCallButtonDisabled ? 'bg-gray-200 text-gray-500' : 'bg-indigo-600 text-white '}`}
        >
        <PhoneIcon className="h-5 w-5 mr-2" aria-hidden="true" />
         Call
        </button>
      </div>
    </div>
  )
}
