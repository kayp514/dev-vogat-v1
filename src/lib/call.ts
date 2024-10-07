import {
  UserAgent,
  UserAgentOptions,
  Inviter,
  SessionState,
  Registerer,
  Session,
  URI,
  InvitationAcceptOptions,
  RegistererOptions,
  Invitation,
  InviterOptions,
  InviterInviteOptions,
  Web,
  RegistererState,
  SessionDescriptionHandlerOptions,
  SessionDescriptionHandler,
} from 'sip.js';
import { IncomingInviteRequest, IncomingRequestMessage } from 'sip.js/lib/core/messages';
import { Emitter } from 'sip.js/lib/api/emitter';
import { Transport, TransportOptions } from 'sip.js/lib/platform/web/transport';

let userAgent: UserAgent | null = null;
let registerer: Registerer | null = null;
let currentSession: Session | null = null;
let isRegistering = false;
let remoteAudio: HTMLAudioElement | null = null;

let registrationStateChangeHandler: ((state: RegistrationState) => void) | null = null;
let callState: CallState = 'idle';
let callStateChangeHandler: ((state: CallState) => void) | null = null;
let incomingCallHandler: ((invitation: Invitation) => void) | null = null;

let registrationAttemptInProgress = false;
let registrationRetryCount = 0;
const MAX_REGISTRATION_RETRIES = 3;

let registrationQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;
const REGISTER_TIMEOUT = 32000;

export type RegistrationState = 'Initial' | 'Registered' | 'Unregistered' | 'Terminated';

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

interface CallMatchingConfig {
  blackList?: string[];
  whiteList?: string[];
  customMatch?: (invitation: Invitation) => Promise<boolean>;
  earlyMedia?: boolean;
}

interface ListenForIncomingCallsOptions{
  userAgent: UserAgent;
  handler: (invitation: Invitation) => void;
  config?: {
    blackList?: string[];
    whiteList?: string[];
    customMatch?: (invitation: Invitation) => Promise<boolean>;
    earlyMedia?: boolean;
  };
}

interface AliasMapping {
  [key: string]: string;
}

const CONFIG = {
  ourDomain: 'sips.lifesprintcare.ca',
  fallbackIp: '172.110.70.155',
  domain: 'sips.lifesprintcare.ca',
  localIP: '172.110.70.155',
};

interface UserInfo {
  username: string;
  phoneNumber: string;
}


async function fetchUserInfo(identifier: string): Promise<UserInfo> {
  // In a real implementation, this would be an API call to your backend
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulating a server-side lookup
      const phoneNumber = `1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      resolve({ username: identifier, phoneNumber: phoneNumber });
    }, 300); // Simulating network delay
  });
}

function normalizePhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.startsWith('1') ? cleaned : `1${cleaned}`;
}


function normalizeNumberGoogle(number: string): string {
  const digitsOnly = number.replace(/\D/g, '');
  return digitsOnly.startsWith('1') ? digitsOnly : '1' + digitsOnly;
}

function parseUri(uriString: string): URI | undefined {
  try {
    return UserAgent.makeURI(uriString);
  } catch (error) {
    console.error('Error parsing URI:', error);
    return undefined;
  }
}

function logSipEvent(event: string, details: any): void {
  console.log(`SIP Event: ${event}`, JSON.stringify(details, null, 2));
}

function validateAndCorrectUri(uri: URI): URI {
  if (uri.host.endsWith('.invalid')) {
    uri.host = CONFIG.ourDomain;
  }
  return uri;
  }

export function setUserAgent(ua: UserAgent) {
  userAgent = ua;
}

export function getUserAgent(): UserAgent | null {
  return userAgent;
}

export type CallState = 'idle' | 'establishing' | 'established' | 'terminating' | 'terminated' | 'error'


interface CustomSessionDescriptionHandlerOptions extends SessionDescriptionHandlerOptions {
  hold?: boolean;
}


class CustomTransport extends Transport {
  private connectionState: boolean = false;

  constructor(logger: any, options: any) {
    super(logger, options);
  }

  public send(message: string): Promise<void> {
    if (!this.connectionState) {
      console.error('Transport not connected. Cannot send message:', message);
      return Promise.reject(new Error('Transport not connected'));
    }
    console.log('Sending message:', message);
    return super.send(message).catch((error: Error) => {
      console.error('Error sending message:', error);
      throw error;
    });
  }

  public async connect(): Promise<void> {
    console.log('Connecting transport');
    try {
      await super.connect();
      this.connectionState = true; // Track connection state
    } catch (error) {
      console.error('Error connecting transport:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    console.log('Disconnecting transport');
    try {
      await super.disconnect();
      this.connectionState = false; // Update connection state
    } catch (error) {
      console.error('Error disconnecting transport:', error);
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.connectionState;
  }
}

function isInviterOrInvitation(session: Session): session is Inviter | Invitation {
  return 'terminate' in session && typeof session.terminate === 'function';
}

function mapSessionStateToCallState(sessionState: SessionState): CallState {
  switch(sessionState){
    case SessionState.Initial:
      return 'idle'
    case SessionState.Establishing:
      return 'establishing'
    case SessionState.Established:
      return 'established'
    case SessionState.Terminating:
      return 'terminating'
    case SessionState.Terminated:
      return 'terminated'
    default:
      return 'error'
  }
}

function createRemoteAudio() {
  if (!remoteAudio) {
    remoteAudio = new Audio();
    remoteAudio.autoplay = true;
    document.body.appendChild(remoteAudio);
  }
  return remoteAudio;
}

function getAssociatedNumber(request: IncomingRequestMessage): string | undefined {
  const pCalledPartyId = request.getHeader('P-Called-Party-ID');
  if (pCalledPartyId) {
    const pCalledPartyIdUri = parseUri(pCalledPartyId);
    if (pCalledPartyIdUri) {
      return pCalledPartyIdUri.user;
    }
  }

  const toUri = request.to?.uri;
  if (toUri) {
    return toUri.user;
  }

  if (request.ruri) {
    return request.ruri.user;
  }

  return undefined;
}

function getAssociatedNumbers(request: IncomingRequestMessage): string[] {
  const numbers: string[] = [];

  const pAssertedIdentity = request.getHeader('P-Asserted-Identity');
  if (pAssertedIdentity) {
    const pAssertedIdentityUri = parseUri(pAssertedIdentity);
    if (pAssertedIdentityUri && pAssertedIdentityUri.user) {
      numbers.push(pAssertedIdentityUri.user);
    }
  }

  if (request.from?.uri.user) {
    numbers.push(request.from.uri.user);
  }

  if (request.to?.uri.user) {
    numbers.push(request.to.uri.user);
  }

  if (request.ruri?.user) {
    numbers.push(request.ruri.user);
  }

  const uniqueNumbers = new Set(numbers.map(normalizeNumberGoogle));
  return Array.from(uniqueNumbers);
}

function isRequestComplete(request: IncomingRequestMessage): boolean {
  const contentLengthHeader = request.getHeader('content-length');
  const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
  
  const body = request.body || '';
  
  return body.length >= contentLength;
}

function normalizePhoneNumberOLD(number: string): string {
  return number.replace(/\D/g, '').replace(/^1/, '');
}

function isNumberMatch(num1: string, num2: string): boolean {
  const norm1 = normalizePhoneNumber(num1);
  const norm2 = normalizePhoneNumber(num2);
  return norm1 === norm2 || norm1.endsWith(norm2) || norm2.endsWith(norm1);
}

export function handleCallStateChange(callback: (state: CallState) => void) {
  callStateChangeHandler = callback;
}

export async function initializeSIP(): Promise<SIPResponse> {
  if (userAgent) {
    console.log('UserAgent already initialized');
    return { status: 'warning', message: 'UserAgent already initialized' };
  }

  const sipConfig = getSavedSIPConfig();
  if (!sipConfig) {
    return { status: 'error', message: 'SIP configuration not found' };
  }

  try {
    const uri = UserAgent.makeURI(`sip:${sipConfig.username}@${sipConfig.server}`);
    if (!uri) {
      throw new Error('Failed to create SIP URI');
    }

    const viaHost = await getViaHost();
    console.log('using viaHost:', viaHost)
  
    const transportOptions: TransportOptions = {
      server: `wss://sips.lifesprintcare.ca:6051/wss`,
      connectionTimeout: 15000,
      keepAliveInterval: 30000,
      traceSip: true,
    };
  
    const userAgentOptions: UserAgentOptions = {
      uri,
      transportConstructor: CustomTransport, // Use CustomTransport
      transportOptions,
      delegate: {
        onInvite: (invitation: Invitation) => {
          console.log('Incoming call accepted');
          console.log('From:', invitation.remoteIdentity.uri.toString());
          console.log('To:', invitation.localIdentity.uri.toString());
        },
        onDisconnect: (error: Error) => {
          console.log('Transport disconnected:', error);
          cleanupCall();
        },
      },
      authorizationUsername: sipConfig.username,
      authorizationPassword: sipConfig.password,
      displayName: sipConfig.username,
      contactName: sipConfig.username,
      logLevel: 'debug',
      logConfiguration: true,
      hackAllowUnregisteredOptionTags: true,
      hackViaTcp: true,
      contactParams: { transport: 'WSS', rinstance: Math.floor(Math.random() * 10000000).toString() },
      allowLegacyNotifications: true,
      noAnswerTimeout: 60,
      viaHost: await getViaHost(),
      userAgentString: 'Vogat/1.0',
    };


    userAgent = new UserAgent(userAgentOptions);


// Set the contact URI manually after creating the UserAgent
const contactUri = UserAgent.makeURI(`sip:6472438101@${userAgent.configuration.viaHost}:57432;transport=${userAgent.configuration.contactParams?.transport}`);
if (contactUri) {
  if (userAgent.contact) {
    userAgent.contact.uri = contactUri;
    console.log('Contact URI set to:', userAgent.contact.uri);
  } else {
    console.warn('UserAgent contact is null, unable to set contact URI');
  }
} else {
  console.warn('Failed to create contact URI or contact URI parameters are null');
}

    

    // Add event listeners for connection status
    userAgent.transport.onConnect = () => console.log('Transport connected');
    userAgent.transport.onDisconnect = (error) => console.error('Transport disconnected:', error);

    await userAgent.start();
    console.log('UserAgent started');


    const acceptOptions = {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false }
      },
    };

    const registrationResult = await registerUserAgent();
    if (registrationResult.status !== 'success') {
      throw new Error(registrationResult.message);
    }


    return { status: 'success', message: 'SIP initialized successfully' };
  } catch (error) {
    console.error("SIP initialization failed:", error);
    return { status: 'error', message: `SIP initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export function listenForIncomingCalls(handler: (invitation: Invitation) => void): () => void {
  if (!userAgent) {
    console.warn('UserAgent not initialized');
    return () => {};
  }

  userAgent.delegate = {
    onInvite: (invitation: Invitation) => {
      console.log('Incoming call received');
      console.log('From:', invitation.remoteIdentity.uri.toString());
      console.log('To:', invitation.localIdentity.uri.toString());

        if (!isUserAgentRegistered()) {
    console.warn('Received incoming call while not registered. Rejecting.');
    invitation.reject({ statusCode: 480, reasonPhrase: 'Temporarily Unavailable' });
    return;
  }

  if (currentSession) {
    console.log('Already in a call, rejecting incoming call');
    invitation.reject({ statusCode: 486, reasonPhrase: 'Busy Here' });
    return;
  }

  updateCallState('establishing');

  let isAnswered = false;


      invitation.stateChange.addListener((newState: SessionState) => {
        console.log(`Incoming call session state changed to: ${newState}`);
        switch (newState) {
          case SessionState.Establishing:
            updateCallState('establishing');
            break;
          case SessionState.Established:
            console.log('Incoming call has been established');
            currentSession = invitation;
            handleSession(invitation);
            updateCallState('established');
            isAnswered = true;
            break;
          case SessionState.Terminating:
            updateCallState('terminating');
            break;
          case SessionState.Terminated:
            console.log('Incoming call has been terminated');
            updateCallState('terminated');
            currentSession = null;
            break;
          default:
            console.log(`Unhandled session state: ${newState}`);
        }
      });

      handler(invitation);
    }
  };

  console.log('Listening for incoming calls');
  return () => {
    if (userAgent) {
      userAgent.delegate = {};
    }
    console.log('Stopped listening for incoming calls');
  };
}

export function acceptIncomingCall(invitation: Invitation): Promise<void> {
  if (currentSession) {
    return Promise.reject(new Error('Already in a call'));
  }

  const acceptOptions: InvitationAcceptOptions = {
    sessionDescriptionHandlerOptions: {
      constraints: { audio: true, video: false },
    },
  };


  return invitation.accept(acceptOptions)
    .then(() => {
      console.log('Call accepted');
      currentSession = invitation;
      handleSession(invitation);
      updateCallState('established');
    })
    .catch((error) => {
      console.error('Error accepting call:', error);
      updateCallState('error');
    });
}


function attemptFallback(invitation: Invitation, handler: (invitation: Invitation) => void) {
  console.log('Attempting fallback for incoming call');
  
  const toHeader = invitation.request.to;
  const sipConfig = getSavedSIPConfig();

  if (toHeader && sipConfig && sipConfig.username) {
    const toUri = toHeader.uri;
    
    // Compare the last 10 digits of the To header user with our username
    const incomingLastTen = toUri.user?.replace(/\D/g, '').slice(-10);
    const ourLastTen = sipConfig.username.replace(/\D/g, '').slice(-10);

    if (incomingLastTen === ourLastTen) {
      console.log('Fallback: Accepting call based on last 10 digits match');
      handler(invitation);
    } else {
      console.warn('Fallback: No match found. Rejecting call.');
      invitation.reject({ statusCode: 404, reasonPhrase: 'Not Found' });
    }
  } else {
    console.warn('Fallback: Invalid To header or username. Rejecting call.');
    invitation.reject({ statusCode: 404, reasonPhrase: 'Not Found' });
  }
}

async function getPublicIPAddress(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching public IP:', error);
    return ''; // Return an empty string or a default value
  }
}

async function getViaHost(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching public IP:', error);
    return window.location.hostname; // Fallback to the current hostname
  }
}

function getSavedSIPConfig(): SIPConfig | null {
  const username = localStorage.getItem('sipUsername');
  const password = localStorage.getItem('sipPassword');
  const securityInfo = JSON.parse(localStorage.getItem('sipSecurityInfo') || '{}');

  if (!username || !password || !securityInfo.server || !securityInfo.port || !securityInfo.protocol || !securityInfo.socket) {
    return null;
  }

  return {
    username: username.split('@')[0],
    password,
    server: securityInfo.server,
    port: parseInt(securityInfo.port, 10),
    protocol: securityInfo.protocol as 'udp' | 'tcp' | 'tls',
    socket: securityInfo.socket,
  };
}

export function isUserAgentRegistered(): boolean {
  return registerer?.state === RegistererState.Registered
}

export async function registerUserAgent(): Promise<SIPResponse> {
  if (!userAgent) {
    return { status: 'error', message: 'User agent not initialized' };
  }

  if (registerer?.state === RegistererState.Registered) {
    return { status: 'success', message: 'User already registered' };
  }

  if (isRegistering) {
    return { status: 'warning', message: 'Registration already in progress' };
  }

  isRegistering = true;

  return new Promise((resolve) => {
    const registrationAttempt = async () => {
      try {
        if (!userAgent) {
          throw new Error('User agent not initialized');
        }

        if (!registerer) {
          const registerOptions: RegistererOptions = {
            registrar: userAgent.configuration.uri,
          };
          registerer = new Registerer(userAgent, registerOptions);
          
          registerer.stateChange.addListener((newState) => {
            console.log(`Registration state changed to: ${newState}`);
            if (registrationStateChangeHandler) {
              registrationStateChangeHandler(getRegistrationState());
            }

            if (newState === RegistererState.Registered || newState === RegistererState.Unregistered) {
              isRegistering = false;
            }
          });
        }

        const registerPromise = registerer.register();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Registration timed out')), REGISTER_TIMEOUT);
        });

        await Promise.race([registerPromise, timeoutPromise]);
        console.log('Registration successful');
        resolve({ status: 'success', message: 'User registered successfully' });
      } catch (error) {
        console.error('Registration failed:', error);
        resolve({ status: 'error', message: 'Failed to register user' });
      } finally {
        isRegistering = false;
        processNextInQueue();
      }
    };

    registrationQueue.push(registrationAttempt);
    if (!isProcessingQueue) {
      processNextInQueue();
    }
});
}

function processNextInQueue() {
  if (registrationQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }

  isProcessingQueue = true;
  const nextRegistrationAttempt = registrationQueue.shift();
  if (nextRegistrationAttempt) {
    nextRegistrationAttempt();
      }
}

export async function unregisterUserAgent(): Promise<SIPResponse> {
  if (!userAgent || !registerer) {
    return { status: 'error', message: 'User agent not initialized or not registered' };
  }

  if (registerer.state === RegistererState.Terminated) {
    return { status: 'success', message: 'User agent already unregistered' };
  }

  try {
    await registerer.unregister();
    return { status: 'success', message: 'User agent unregistered successfully' };
  } catch (error) {
    return { status: 'error', message: 'Failed to unregister user agent' };
  }
}

export function getRegistrationState(): RegistrationState {
  if (!registerer) {
    return 'Unregistered';
  }
  switch (registerer.state) {
    case RegistererState.Initial:
      return 'Initial';
    case RegistererState.Registered:
      return 'Registered';
    case RegistererState.Unregistered:
      return 'Unregistered';
    case RegistererState.Terminated:
      return 'Terminated';
    default:
      return 'Unregistered';
  }
}

export function handleRegistrationStateChange(callback: (state: RegistrationState) => void) {
  registrationStateChangeHandler = callback;
  if (registerer) {
    registerer.stateChange.addListener((newState) => {
      if (registrationStateChangeHandler) {
        registrationStateChangeHandler(getRegistrationState());
      }
    });
  }
}

export async function ensureUserAgentRegistered(): Promise<SIPResponse> {
    if (!userAgent) {
      return { status: 'error', message: 'User agent not initialized' };
    }
  
    if (isUserAgentRegistered()) {
      return { status: 'success', message: 'User agent already registered' };
    }
  
    return registerUserAgent();
  }

function updateCallState(newState: CallState) {
  callState = newState;
  if (callStateChangeHandler) {
    callStateChangeHandler(newState);
  }
}

export function setCallStateChangeHandler(handler: (state: CallState) => void) {
  callStateChangeHandler = handler;
}

function compareURIs(uri1: URI, uri2: URI): boolean {
  return uri1.user === uri2.user && uri1.host === uri2.host;
}

export async function makeOutgoingCall(phoneNumber: string, onStateChange: (state: CallState) => void): Promise<SIPResponse> {
  const registrationStatus = await ensureUserAgentRegistered();
  if (registrationStatus.status !== 'success') {
    onStateChange('error');
    return registrationStatus;
  }

  if (!userAgent) {
    onStateChange('error');
    return { status: 'error', message: 'UserAgent not initialized' };
  }

  try {
    const target = UserAgent.makeURI(`sip:${phoneNumber}@${getSavedSIPConfig()?.server}`);
    if (!target) {
      onStateChange('error');
      throw new Error('Failed to create target URI');
    }

    const inviterOptions: InviterOptions = {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false }
      }
    };

    const inviter = new Inviter(userAgent, target, inviterOptions);
    setCurrentSession(inviter);
    let currentCallState : CallState = 'establishing';
    onStateChange(currentCallState);

    inviter.stateChange.addListener((state: SessionState) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Outgoing call state changed to ${state}`);
      currentCallState = mapSessionStateToCallState(state);
      onStateChange(currentCallState);

      switch (state) {
        case SessionState.Establishing:
          console.log('Outgoing call is being established...');
          break;
        case SessionState.Established:
          console.log('Outgoing call has been established');
          currentSession = inviter;
          handleSession(inviter);
          break;
        case SessionState.Terminating:
          console.log('Outgoing call is terminating...');
          break;
        case SessionState.Terminated:
          console.log('Outgoing call has been terminated');
          currentSession = null;
          break;
        default:
          console.log(`Unhandled session state: ${state}`);
      }
    });

    const timeoutPromise = new Promise<SIPResponse>((_, reject) => {
      setTimeout(() => {
        if (inviter.state !== SessionState.Established) {
          inviter.dispose();
          onStateChange('terminated');
          reject({ status: 'error', message: 'Call timed out' });
        }
      }, 60000); // 60 seconds timeout
    })

    await Promise.race([
      inviter.invite(),
      timeoutPromise
    ]);

    return { status: 'success', message: currentCallState };
  } catch (error) {
    console.error('Error making outgoing call:', error);
    setCurrentSession(null);
    onStateChange('error');
    return { status: 'error', message: 'Failed to make outgoing call' };
  }
}

function handleSession(session: Session): void {
  console.log('Handling new session');
  currentSession = session;
  const audio = createRemoteAudio();

  if (session.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
    const peerConnection = session.sessionDescriptionHandler.peerConnection;

    peerConnection?.addEventListener('connectionstatechange', () => {
      console.log('PeerConnection state changed:', peerConnection?.connectionState);
      if (peerConnection?.connectionState === 'connected') {
        const remoteStream = new MediaStream(
          peerConnection.getReceivers().map((receiver) => receiver.track)
        );
        audio.srcObject = remoteStream;
      }
    })

    peerConnection?.addEventListener('track', (event: RTCTrackEvent) => {
      console.log('Received track directly on peerConnection:', event.track.kind);
      const [remoteStream] = event.streams;
      if (remoteStream) {
        audio.srcObject = remoteStream;
      }
    });
  }

  session.stateChange.addListener((state: SessionState) => {
    console.log(`Session state changed to ${state}`);
    switch (state) {
      case SessionState.Establishing:
        console.log('Call is being established');
        break;
      case SessionState.Established:
        console.log('Call established, ensuring audio is playing');
        audio.play().catch(error => console.error('Error playing remote audio:', error));
        break;
      case SessionState.Terminating:
        console.log('Call is terminating');
        break;
      case SessionState.Terminated:
        console.log('Call has been terminated');
        if (audio.srcObject) {
          const tracks = (audio.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
        audio.srcObject = null;
        currentSession = null;
        break;
    }
  });
}

export function getCurrentSession(): Session | null {
  return currentSession;
}

export function setCurrentSession(session: Session | null): void {
  currentSession = session;
}

export function terminateCall(): Promise<SIPResponse> {
  return new Promise((resolve) => {
    const session = getCurrentSession();
    if (!session) {
      console.log('No active call to terminate');
      resolve({ status: 'warning', message: 'No active call to terminate' });
      return;
    }

    const terminateAndCleanup = (): SIPResponse => {
      setCurrentSession(null);
      cleanupCall();
      return { status: 'success', message: 'Call terminated successfully' };
    };

    const forceTerminate = () => {
      console.warn('Forced call termination due to timeout');
      currentSession?.dispose();
      resolve(terminateAndCleanup());
    };

    const terminationTimeout = setTimeout(forceTerminate, 5000); // 5 seconds timeout

    const finalizeTermination = () => {
      clearTimeout(terminationTimeout);
      resolve(terminateAndCleanup());
    };

    if (session.state === SessionState.Established) {
      session.bye()
        .then(() => {
          console.log('Call terminated successfully');
        })
        .catch((error: Error) => {
          console.error('Error terminating call:', error);
        })
        .finally(finalizeTermination);
    } else if (session.state === SessionState.Establishing) {
      if (currentSession instanceof Inviter) {
        currentSession.cancel()
          .then(() => {
            console.log('Outgoing call cancelled successfully');
          })
          .catch((error: Error) => {
            console.error('Error cancelling outgoing call:', error);
          })
          .finally(finalizeTermination);
        } else {
          // For incoming calls that are not yet established
          session.dispose();
          console.log('Incoming call disposed');
          finalizeTermination();
        }
    } else {
      console.warn('Session in unexpected state:', session.state);
      finalizeTermination();
    }
  });
}


function cleanupCall() {
  if (currentSession) {
    // Remove all listeners from the stateChange emitter
    const emitter = currentSession.stateChange;
    const removeAllListeners = (emitter: Emitter<SessionState>) => {
      // Remove listeners for all possible SessionState values
      Object.values(SessionState).forEach(state => {
        emitter.removeListener((newState: SessionState) => newState === state);
      });
    };
    removeAllListeners(emitter);
    currentSession = null;
  }

  if (remoteAudio) {
    if (remoteAudio.srcObject) {
      const tracks = (remoteAudio.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    remoteAudio.srcObject = null;
    remoteAudio.remove();
    remoteAudio = null;
  }

  if (callStateChangeHandler) {
    callStateChangeHandler('terminated');
  }
}

export function mute(): SIPResponse {
  if (currentSession && currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
    const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
    peerConnection?.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === 'audio') {
        sender.track.enabled = false;
      }
    });
    return { status: 'success', message: 'Call muted' };
  }
  return { status: 'warning', message: 'No active call to mute' };
}

export function unmute(): SIPResponse {
  if (currentSession && currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
    const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
    peerConnection?.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === 'audio') {
        sender.track.enabled = true;
      }
    });
    return { status: 'success', message: 'Call unmuted' };
  }
  return { status: 'warning', message: 'No active call to unmute' };
}

export function sendDTMF(tone: string): SIPResponse {
  if (currentSession && currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
    const options = {
      requestOptions: {
        body: {
          contentDisposition: 'render',
          contentType: 'application/dtmf-relay',
          content: `Signal=${tone}\r\nDuration=100`
        }
      }
    };
    
    currentSession.info(options)
      .then(() => console.log('DTMF sent successfully'))
      .catch((error: Error) => console.error('Error sending DTMF:', error));

    return { status: 'success', message: `DTMF tone ${tone} sent` };
  }
  return { status: 'warning', message: 'No active call to send DTMF' };
}

export function getCallStatus(): SIPResponse {
  if (!currentSession) {
    return { status: 'warning', message: 'No active call' };
  }
  return { status: 'success', message: currentSession.state };
}

export async function holdCall(): Promise<SIPResponse> {
  if (!currentSession) {
    return { status: 'error', message: 'No active call to hold' };
  }

  try {
    const options: InviterInviteOptions = {
      sessionDescriptionHandlerOptions: {
        hold: true
      } as CustomSessionDescriptionHandlerOptions
    };
    await currentSession.invite(options);
    return { status: 'success', message: 'Call placed on hold' };
  } catch (error) {
    console.error('Error placing call on hold:', error);
    return { status: 'error', message: 'Failed to place call on hold' };
  }
}

export async function resumeCall(): Promise<SIPResponse> {
  if (!currentSession) {
    return { status: 'error', message: 'No active call to resume' };
  }

  try {
    const options: InviterInviteOptions = {
      sessionDescriptionHandlerOptions: {
        hold: false
      } as CustomSessionDescriptionHandlerOptions
    };
    await currentSession.invite(options);
    return { status: 'success', message: 'Call resumed' };
  } catch (error) {
    console.error('Error resuming call:', error);
    return { status: 'error', message: 'Failed to resume call' };
  }
}

export async function transferCall(targetUri: string): Promise<SIPResponse> {
  if (!currentSession) {
    return { status: 'error', message: 'No active call to transfer' };
  }

  try {
    const target = UserAgent.makeURI(targetUri);
    if (!target) {
      throw new Error('Failed to create target URI for transfer');
    }

    await currentSession.refer(target);
    return { status: 'success', message: 'Call transfer initiated' };
  } catch (error) {
    console.error('Error transferring call:', error);
    return { status: 'error', message: 'Failed to transfer call' };
  }
}

export async function setAudioDevice(deviceId: string): Promise<SIPResponse> {
  if (!currentSession) {
    return { status: 'error', message: 'No active call' };
  }

  try {
    const constraints: MediaStreamConstraints = {
      audio: { deviceId: { exact: deviceId } }
    };

    // Create new stream with the specified audio device
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Get the audio track from the new stream
    const audioTrack = stream.getAudioTracks()[0];

    if (!audioTrack) {
      throw new Error('No audio track found in the new stream');
    }

    // Create new constraints for the reinvite
    const newConstraints: MediaStreamConstraints = {
      audio: true,
      video: false
    };

    // Send reinvite with new constraints
    await currentSession.invite({
      sessionDescriptionHandlerOptions: {
        constraints: newConstraints
      }
    });

    // After successful reinvite, replace the audio track
    if (currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
      const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
      if (peerConnection) {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'audio');
        if (sender) {
          await sender.replaceTrack(audioTrack);
        } else {
          throw new Error('No audio sender found in the peer connection');
        }
      } else {
        throw new Error('Peer connection is not available');
      }
    } else {
      throw new Error('Session description handler is not an instance of Web.SessionDescriptionHandler');
    }

    return { status: 'success', message: 'Audio device set successfully' };
  } catch (error) {
    console.error('Error setting audio device:', error);
    return { status: 'error', message: `Failed to set audio device: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export function setAudioOutputDevice(deviceId: string): SIPResponse {
  if (currentSession) {
    const remoteAudio = document.getElementById('remoteAudio') as HTMLAudioElement;
    if (remoteAudio && 'setSinkId' in remoteAudio) {
      try {
        (remoteAudio as any).setSinkId(deviceId);
        return { status: 'success', message: 'Audio output device set successfully' };
      } catch (error) {
        return { status: 'error', message: 'Failed to set audio output device' };
      }
    }
  }
  return { status: 'warning', message: 'No active call or audio element not found' };
}

export function getCallDuration(): SIPResponse {
  if (!currentSession || currentSession.state !== SessionState.Established) {
    return { status: 'error', message: 'No active call' };
  }

  const startTime = (currentSession as Session & { startTime?: number }).startTime;
  if (!startTime) {
    return { status: 'error', message: 'Call start time not available' };
  }

  const duration = Math.floor((Date.now() - startTime) / 1000); // Duration in seconds
  return { status: 'success', message: `Call duration: ${duration} seconds` };
}

export async function reconnectSIP(): Promise<SIPResponse> {
  if (!userAgent) {
    return { status: 'error', message: 'UserAgent not initialized' };
  }

  try {
    await userAgent.reconnect();
    const registrationResult = await registerUserAgent();
    if (registrationResult.status !== 'success') {
      throw new Error(registrationResult.message);
    }
    return { status: 'success', message: 'Reconnected and re-registered successfully' };
  } catch (error) {
    console.error('Reconnection failed:', error);
    return { status: 'error', message: 'Failed to reconnect and re-register' };
  }
}

export function rejectIncomingCall(invitation: Invitation): SIPResponse {
  try {
    invitation.reject();
    return { status: 'success', message: 'Incoming call rejected' };
  } catch (error) {
    console.error('Error rejecting incoming call:', error);
    return { status: 'error', message: 'Failed to reject incoming call' };
  }
}

export function muteAudio(): SIPResponse {
  if (!currentSession || !(currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler)) {
    return { status: 'error', message: 'No active call or invalid session description handler' };
  }

  try {
    const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
    if (peerConnection) {
      peerConnection.getSenders().forEach(sender => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = false;
        }
      });
      return { status: 'success', message: 'Audio muted' };
    } else {
      return { status: 'error', message: 'Peer connection not available' };
    }
  } catch (error) {
    console.error('Error muting audio:', error);
    return { status: 'error', message: 'Failed to mute audio' };
  }
}

export function unmuteAudio(): SIPResponse {
  if (!currentSession || !(currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler)) {
    return { status: 'error', message: 'No active call or invalid session description handler' };
  }

  try {
    const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
    if (peerConnection) {
      peerConnection.getSenders().forEach(sender => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = true;
        }
      });
      return { status: 'success', message: 'Audio unmuted' };
    } else {
      return { status: 'error', message: 'Peer connection not available' };
    }
  } catch (error) {
    console.error('Error unmuting audio:', error);
    return { status: 'error', message: 'Failed to unmute audio' };
  }
}

export async function getCallStats(): Promise<SIPResponse> {
  if (!currentSession || !(currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler)) {
    return { status: 'error', message: 'No active call or invalid session description handler' };
  }

  try {
    const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
    if (peerConnection) {
      const stats = await peerConnection.getStats();
      const statsObj: Record<string, any> = {};
      stats.forEach(report => {
        statsObj[report.type] = report;
      });
      return { status: 'success', message: 'Call stats retrieved', data: statsObj };
    } else {
      return { status: 'error', message: 'Peer connection not available' };
    }
  } catch (error) {
    console.error('Error getting call stats:', error);
    return { status: 'error', message: 'Failed to get call stats' };
  }
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

export function setDisplayName(displayName: string): SIPResponse {
  if (!userAgent) {
    return { status: 'error', message: 'UserAgent not initialized' };
  }

  try {
    userAgent.configuration.displayName = displayName;
    return { status: 'success', message: 'Display name set successfully' };
  } catch (error) {
    console.error('Error setting display name:', error);
    return { status: 'error', message: 'Failed to set display name' };
  }
}

export function monitorSIPStatus(): SIPResponse {
  if (!userAgent) {
    return { status: 'error', message: 'SIP is no longer initialized' };
  } else if (!isUserAgentRegistered()) {
    return { status: 'error', message: 'SIP is no longer registered' };
  }
  return { status: 'success', message: 'SIP is still initialized and registered' };
}

export function debugAudioState(): void {
  if (currentSession && currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
    const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
    console.log('Current session state:', currentSession.state);
    console.log('Peer connection state:', peerConnection?.connectionState);
    console.log('ICE connection state:', peerConnection?.iceConnectionState);
    console.log('Signaling state:', peerConnection?.signalingState);
    
    peerConnection?.getReceivers().forEach((receiver, index) => {
      console.log(`Receiver ${index}:`, receiver.track ? receiver.track.kind : 'No track');
    });

    if (remoteAudio) {
      console.log('Remote audio element:', remoteAudio);
      console.log('Remote audio srcObject:', remoteAudio.srcObject);
      if (remoteAudio.srcObject instanceof MediaStream) {
        console.log('Remote audio tracks:', remoteAudio.srcObject.getTracks());
      }
    } else {
      console.log('No remote audio element');
    }
  } else {
    console.log('No active session or invalid session description handler');
  }
}