// userinfo.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
}

export default function UserInfo({ userData }: { userData: UserData }) {
  if (!userData) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Warning:</strong>
        <span className="block sm:inline"> User data not available.</span>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>User Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar>
            {userData.photoURL ? (
              <AvatarImage src={userData.photoURL} alt={userData.displayName || 'User'} />
            ) : (
              <AvatarFallback>{userData.displayName?.[0] || userData.email[0].toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="font-medium">{userData.displayName || 'No display name'}</p>
            <p className="text-sm text-gray-500">{userData.email}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p><strong>User ID:</strong> {userData.uid}</p>
          {userData.emailVerified !== undefined && (
            <p><strong>Email Verified:</strong> {userData.emailVerified ? 'Yes' : 'No'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}