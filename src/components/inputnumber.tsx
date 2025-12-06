import { useState, useCallback } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Phone, X, ChevronDown, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { CallerInfo, UserData } from "@/app/type"


const dialpadKeys = [
  { value: '1', sub: '' },
  { value: '2', sub: 'ABC' },
  { value: '3', sub: 'DEF' },
  { value: '4', sub: 'GHI' },
  { value: '5', sub: 'JKL' },
  { value: '6', sub: 'MNO' },
  { value: '7', sub: 'PQRS' },
  { value: '8', sub: 'TUV' },
  { value: '9', sub: 'WXYZ' },
  { value: '*', sub: '' },
  { value: '0', sub: '+' },
  { value: '#', sub: '' },
]

const recentNumbers = [
  { number: '+1 (555) 123-4567', name: 'John Doe' },
  { number: '+1 (555) 987-6543', name: 'Jane Smith' },
  { number: '+1 (555) 246-8135', name: 'Alice Johnson' },
]

interface InputNumberProps {
  userData: UserData
  onCall?: (phoneNumber: string, callerInfo: CallerInfo, calleeInfo: CallerInfo) => void
}

export function InputNumber({ userData, onCall }: InputNumberProps) {
  const [showNumbers, setShowNumbers] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallInitiating, setIsCallInitiating] = useState(false)
  const [showDialpad, setShowDialpad] = useState(false)


  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters except +
    const cleaned = value.replace(/[^\d+]/g, '')
    
    // Format the number (basic US format)
    if (cleaned.startsWith('+')) {
      return cleaned
    } else if (cleaned.length > 10) {
      return `+${cleaned}`
    } else if (cleaned.length > 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length > 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    } else if (cleaned.length > 0) {
      return `(${cleaned}`
    }
    return cleaned
  }

  
  const toggleNumbers = () => {
    setShowNumbers(!showNumbers);
  };

  const handleNumberInput = useCallback((value: string) => {
    setPhoneNumber(prev => {
      const newValue = prev.replace(/[^\d+]/g, '') + value
      return formatPhoneNumber(newValue)
    })
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value))
  }

  const handleBackspace = () => {
    setPhoneNumber(prev => {
      const cleaned = prev.replace(/[^\d+]/g, '')
      return formatPhoneNumber(cleaned.slice(0, -1))
    })
  }

  const handleNumberClick = (number: string) => {
    setPhoneNumber(phoneNumber + number);
  };

  const clearNumber = () => {
    setPhoneNumber('');
  };

  const initiateCall = async () => {
    if (!phoneNumber) return

    setIsCallInitiating(true)

      const callerInfo: CallerInfo = {
        ...userData,
        isHost: true,
        isVideoOn: false,
        isMuted: false,
      }
  
      const calleeInfo: CallerInfo = {
        id: phoneNumber,
        uid: phoneNumber,
        name:
          phoneNumber in recentNumbers
            ? recentNumbers.find((c) => c.number === phoneNumber)?.name || "Unknown"
            : "Unknown",
        email: "",
        avatar: "",
        phoneNumber: phoneNumber,
        isHost: false,
        isVideoOn: false,
        isMuted: false,
      }

      const rawNumber = phoneNumber.replace(/[^\d+]/g, '')
      try {
        await onCall?.(rawNumber, callerInfo, calleeInfo)
      } finally {
        setIsCallInitiating(false)
      }
  };

  
    return (
      <Card className="w-full">
        <CardContent className="p-4 pt-4">
          <div className="space-y-4">
            {/* Phone Input Section */}
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="text-lg font-medium pr-20 tracking-wider"
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
                      <span className="sr-only">Clear number</span>
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
                    <span className="sr-only">Toggle dialpad</span>
                  </Button>
                </div>
              </div>
            </div>
  
            {/* Dialpad Section */}
            {showDialpad && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  {dialpadKeys.map((key) => (
                    <Button
                      key={key.value}
                      variant="outline"
                      className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-gray-800 bg-white shadow-sm hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50"
                      onClick={() => handleNumberInput(key.value)}
                    >
                      {key.value}
                    </Button>
                  ))}
                </div>
                </div>
            )}
  
            {/* Call Button */}
            <div className="flex gap-2">
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

          <div className="space-y-2">
                <Separator />
                <h3 className="text-sm font-medium text-muted-foreground px-2">
                  Recent Numbers
                </h3>
                <ScrollArea className="h-[120px]">
                  {recentNumbers.map((contact, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start px-2 py-4 h-auto"
                      onClick={() => setPhoneNumber(contact.number)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Plus className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">
                            {contact.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {contact.number}
                          </span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </ScrollArea>
              </div>
          </div>
        </CardContent>
        <Toaster />
      </Card>
    )
  }
