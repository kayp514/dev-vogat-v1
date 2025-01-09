import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Phone, X, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"


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

export default function InputNumber({ onCall }: InputNumberProps) {
  const [showNumbers, setShowNumbers] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallInitiating, setIsCallInitiating] = useState(false)
  const [showDialpad, setShowDialpad] = useState(false)

  
  const toggleNumbers = () => {
    setShowNumbers(!showNumbers);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  const handleNumberClick = (number: string) => {
    setPhoneNumber(phoneNumber + number);
  };

  const clearNumber = () => {
    setPhoneNumber('');
  };

  const initiateCall = async () => {
    if (phoneNumber) {
      setIsCallInitiating(true)
      try {
        await onCall(phoneNumber)
      } finally {
        setIsCallInitiating(false)
      }
    }
  };

  
    return (
      <Card className="w-full max-w-sm mx-auto shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Phone Input Section */}
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="text-lg font-medium pr-20"
                />
                <div className="absolute right-0 top-0 h-full flex items-center gap-1 pr-3">
                  {phoneNumber && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={clearNumber}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDialpad(!showDialpad)}
                    className={cn(
                      "h-8 w-8 p-0",
                      showDialpad && "bg-muted"
                    )}
                  >
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      showDialpad && "rotate-180"
                    )} />
                  </Button>
                </div>
              </div>
            </div>
  
            {/* Dialpad Section */}
            {showDialpad && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  {numbers.map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-gray-800 bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50"
                      onClick={() => handleNumberClick(item.name)}
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
  
            {/* Call Button */}
            <Button
            className={cn(
              "w-full h-12",
              "transition-colors duration-200",
              !phoneNumber || isCallInitiating
                ? "bg-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-500"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
            size="lg"
            disabled={!phoneNumber || isCallInitiating}
            onClick={initiateCall}
          >
            <Phone className="mr-2 h-4 w-4" />
            {isCallInitiating ? 'Calling...' : 'Call'}
          </Button>
          </div>
        </CardContent>
        <Toaster />
      </Card>
    )
  }
