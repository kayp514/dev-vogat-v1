// In a new file, e.g., src/hooks/useSIP.ts
'use client'

import { useEffect } from 'react';
import { initializeSIP, SIPResponse } from '../lib/call';
import { useSIPContext } from '../contexts/SIPContext';

export function useSIP() {
  const { sipStatus, setSipStatus } = useSIPContext();

  useEffect(() => {
    async function initSIP() {
        if (!sipStatus) {
            const response = await initializeSIP();
            setSipStatus(response);
        }
    }
    initSIP();
  }, [sipStatus, setSipStatus]);

  return sipStatus;
}