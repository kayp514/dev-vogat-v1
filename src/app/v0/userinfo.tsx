// app/vzero/UserInfo.tsx

'use client';

import { useState, useEffect } from 'react';

interface UserData {
  email: string;
  uid: string;
  // Add other user data fields as needed
}

export default function UserInfo({ userData }: { userData: UserData }) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userData) {
      setError('User data not available');
    }
  }, [userData]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>User Information</h2>
      <p>Email: {userData.email}</p>
      <p>Name: {userData.uid}</p>
      {/* Add other user info fields as needed */}
    </div>
  );
}