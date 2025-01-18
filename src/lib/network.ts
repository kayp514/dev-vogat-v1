import { SIPResponse, SIPStatus, TransportStatus, ConnectionState, CONFIG} from './type';
import {
    UserAgent,
    Registerer,
    RegistererState,
  } from 'sip.js';

import { registerUserAgent } from './call';

let transportListeners: ((status: TransportStatus) => void)[] = []
let connectionListeners: ((state: ConnectionState) => void)[] = []
let userAgent: UserAgent | null = null;
let registerer: Registerer | null = null;

const RECONNECTION_ATTEMPTS = 3
const RECONNECTION_DELAY = 4000
const REGISTER_TIMEOUT = 32000;
const MAX_REGISTRATION_RETRIES = 3;

let reconnectionAttempt = 0
let reconnectionTimer: NodeJS.Timeout | null = null

export function addTransportListener(callback: (status: TransportStatus) => void) {
    transportListeners.push(callback)
  }
  
  export function removeTransportListener(callback: (status: TransportStatus) => void) {
    transportListeners = transportListeners.filter(listener => listener !== callback)
  }
  
  export function addConnectionListener(callback: (state: ConnectionState) => void) {
    connectionListeners.push(callback)
  }
  
  export function removeConnectionListener(callback: (state: ConnectionState) => void) {
    connectionListeners = connectionListeners.filter(listener => listener !== callback)
  }

export function notifyConnectionState(transport: TransportStatus, sip: SIPStatus, error?: Error) {
    const state: ConnectionState = { transport, sip, lastError: error, reconnectionAttempt }
    connectionListeners.forEach(listener => listener(state))
  }

export function getNetworkType(): SIPResponse {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.type) {
        return { status: 'success', message: 'Network type retrieved', data: connection.type };
      }
    }
    return { status: 'error', message: 'Network information not available' };
  }

export async function handleReconnection() {
    if (reconnectionAttempt >= RECONNECTION_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      notifyConnectionState('error', 'error', new Error('Max reconnection attempts reached'))
      return
    }
  
    reconnectionAttempt++
    console.log(`Attempting reconnection ${reconnectionAttempt}/${RECONNECTION_ATTEMPTS}`)
    notifyConnectionState('connecting', 'initializing')
  
    try {
      await userAgent?.reconnect()
      console.log('Reconnection successful')
      
      // After successful reconnection, attempt to register if previously registered
      if (registerer?.state === RegistererState.Registered) {
        try {
          await registerUserAgent()
        } catch (error) {
          console.error('Failed to re-register after reconnection:', error)
        }
      }
    } catch (error) {
      console.error('Reconnection failed:', error)
      
      // Schedule next reconnection attempt
      reconnectionTimer = setTimeout(() => {
        handleReconnection()
      }, RECONNECTION_DELAY)
    }
  }
  
export function setupNetworkMonitoring() {
    window.addEventListener('online', async () => {
      console.log('Browser went online')
      reconnectionAttempt = 0 // Reset counter when network becomes available
      
      if (userAgent && !userAgent.isConnected()) {
        await handleReconnection()
      }
    })
  
    window.addEventListener('offline', () => {
      console.log('Browser went offline')
      notifyConnectionState('disconnected', 'disconnected')
      
      // Clear any pending reconnection attempts
      if (reconnectionTimer) {
        clearTimeout(reconnectionTimer)
        reconnectionTimer = null
      }
    })
  }