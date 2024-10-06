//src/app/ui/callnotify.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { PhoneIcon, XIcon } from 'lucide-react';

interface CallNotificationProps {
  callerNumber: string;
  onAccept: () => void;
  onReject: () => void;
}

export function CallNotification({ callerNumber, onAccept, onReject }: CallNotificationProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-2">Incoming Call</h3>
      <p className="mb-4">From: {callerNumber}</p>
      <div className="flex justify-end space-x-2">
        <Button onClick={onReject} variant="destructive">
          <XIcon className="mr-2 h-4 w-4" />
          Reject
        </Button>
        <Button onClick={onAccept} variant="default">
          <PhoneIcon className="mr-2 h-4 w-4" />
          Accept
        </Button>
      </div>
    </div>
  );
}