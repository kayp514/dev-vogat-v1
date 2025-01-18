import {
    UserAgent,
    Invitation,
  } from 'sip.js';

export type CallType = 'outgoing' | 'incoming'
export type RegistrationState = 'Initial' | 'Registered' | 'Unregistered' | 'Terminated';
export type TransportStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
export type SIPStatus = 'uninitialized' | 'initializing' | 'initialized' | 'registering' | 'registered' | 'unregistering' | 'disconnected' | 'error'

export type CallState = 
  'initial' | 
  'initiating' | 
  'establishing' | 
  'established' | 
  'terminating' | 
  'terminated' | 
  'error';

export type { Invitation } ;


export type SIPResponse = {
  status: 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

export type SIPConfig = {
  username: string;
  password: string;
  server: string;
  port: number;
  protocol: 'udp' | 'tcp' | 'tls';
  socket: string;
  outboundProxy?: string;
  phoneNumber?: number;
  sipExtension?: number; 
}

export type ConnectionState = {
  transport: TransportStatus
  sip: SIPStatus
  lastError?: Error
  reconnectionAttempt?: number
}

export interface CallMatchingConfig {
  blackList?: string[];
  whiteList?: string[];
  customMatch?: (invitation: Invitation) => Promise<boolean>;
  earlyMedia?: boolean;
}

export interface ListenForIncomingCallsOptions{
  userAgent: UserAgent;
  handler: (invitation: Invitation) => void;
  config?: {
    blackList?: string[];
    whiteList?: string[];
    customMatch?: (invitation: Invitation) => Promise<boolean>;
    earlyMedia?: boolean;
  };
}

export interface AliasMapping {
  [key: string]: string;
}

export const CONFIG = {
  ourDomain: 'sips.lifesprintcare.ca',
  fallbackIp: '172.110.70.155',
  domain: 'sips.lifesprintcare.ca',
  localIP: '172.110.70.155',
};

export interface UserInfo {
  username: string;
  phoneNumber: string;
}