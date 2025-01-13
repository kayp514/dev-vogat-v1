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
  SessionDelegate,
} from 'sip.js';
import { IncomingInviteRequest, IncomingRequestMessage, IncomingResponse } from 'sip.js/lib/core/messages';
import { Emitter } from 'sip.js/lib/api/emitter';
import { Transport, TransportOptions } from 'sip.js/lib/platform/web/transport';
import { v4 as uuidv4 } from 'uuid';

const RECONNECTION_ATTEMPTS = 3
const RECONNECTION_DELAY = 4000
const REGISTER_TIMEOUT = 32000;
const MAX_REGISTRATION_RETRIES = 3;

let reconnectionAttempt = 0
let reconnectionTimer: NodeJS.Timeout | null = null
let userAgent: UserAgent | null = null;
let lastSuccessfulRegistration: { callId: string, contact: string } | null = null;
let registerer: Registerer | null = null;
let currentSession: Session | null = null;
let isRegistering = false;
let remoteAudio: HTMLAudioElement | null = null;
let previousSession: Session | null = null;
let localStream: MediaStream | null = null;
let instanceId = uuidv4();

let registrationStateChangeHandler: ((state: RegistrationState) => void) | null = null;
let callState: CallState = 'initial';
let callStateChangeHandler: ((state: CallState) => void) | null = null;
let incomingCallHandler: ((invitation: Invitation) => void) | null = null;

let registrationAttemptInProgress = false;
let registrationRetryCount = 0;


let registrationQueue: (() => Promise<void>)[] = [];
let transportListeners: ((status: TransportStatus) => void)[] = []
let connectionListeners: ((state: ConnectionState) => void)[] = []
let isProcessingQueue = false;


export type RegistrationState = 'Initial' | 'Registered' | 'Unregistered' | 'Terminated';
export type TransportStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
export type SIPStatus = 'uninitialized' | 'initializing' | 'initialized' | 'registering' | 'registered' | 'unregistering' | 'disconnected' | 'error'

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

function notifyConnectionState(transport: TransportStatus, sip: SIPStatus, error?: Error) {
  const state: ConnectionState = { transport, sip, lastError: error, reconnectionAttempt }
  connectionListeners.forEach(listener => listener(state))
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

export type CallState = 
  'initial' | 
  'initiating' | 
  'establishing' | 
  'established' | 
  'terminating' | 
  'terminated' | 
  'error';


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

function handleEarlyMedia(inviter: Inviter, response: IncomingResponse) {
  const sessionDescriptionHandler = inviter.sessionDescriptionHandler;

  if (sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
      const body = response.message.body;
      if (body) {

          sessionDescriptionHandler
          .setDescription(body)
          .then(() => {
              console.log('Early media description set successfully');


              // Access currentSession within this callback
              const peerConnection = sessionDescriptionHandler.peerConnection;
              const currentSession = getCurrentSession(); // Get current session inside the promise chain.


                  if (currentSession && peerConnection && !currentSession.sessionDescriptionHandler?.hasDescription('local') ) {
                    peerConnection.createAnswer().then((answer) => {
                      if(answer &&answer.sdp){
                        currentSession.sessionDescriptionHandler?.setDescription(answer.sdp)
                        .then(() =>{
                          peerConnection.setLocalDescription(answer).catch(error => {
                            console.error('Failed to set local description:', error);
                            peerConnection.close();
                            cleanupCall();
                            updateCallState("terminated")
                          }); 
                      })
                    } else {
                      console.error('SDP is undefined in answer');
                      peerConnection.close();
                      cleanupCall();
                      updateCallState("terminated")
                    }
                    }).catch((error) => {
                      console.error('Failed to create answer:', error);
                      peerConnection.close();
                      cleanupCall();
                      updateCallState("terminated")
                    });
                  }

          })
          .catch(error => console.error('Error setting early media description:', error));

      } else {
          console.log('No SDP in 183 Session Progress');
      }
  }
}

function isInviterOrInvitation(session: Session): session is Inviter | Invitation {
  return 'terminate' in session && typeof session.terminate === 'function';
}

function mapSessionStateToCallState(sessionState: SessionState): CallState {
  switch (sessionState) {
    case SessionState.Initial:
      return 'initiating';
    case SessionState.Establishing:
      return 'establishing';
    case SessionState.Established:
      return 'established';
    case SessionState.Terminating:
    case SessionState.Terminated:
      return 'terminated';
    default:
      return 'error';
  }
}

function createRemoteAudio(): HTMLAudioElement {
  const audio = new Audio();
  audio.autoplay = true;
  return audio;
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
      server: `${sipConfig.socket}://${sipConfig.server}:${sipConfig.port}/${sipConfig.socket}`,
      connectionTimeout: 15000,
      keepAliveInterval: 30000,
      traceSip: true,
    };
  
    const userAgentOptions: UserAgentOptions = {
      uri,
      transportConstructor: CustomTransport,
      transportOptions,
      delegate: {
        onInvite: (invitation: Invitation) => {
          console.log('Incoming call accepted');
          console.log('From:', invitation.remoteIdentity.uri.toString());
          console.log('To:', invitation.localIdentity.uri.toString());
        },
        onConnect: () => {
          console.log('callTS: UserAgent Connected')
          reconnectionAttempt = 0
          notifyConnectionState('connected', 'initialized')
        }, 
        onDisconnect: async (error?: Error) => {
          console.log('CallTS: UserAgent Disconnected:', error)

          if (navigator.onLine) {
            await handleReconnection()
          } else {
            notifyConnectionState('disconnected', 'disconnected', error)
          }
        }
      },
      authorizationUsername: sipConfig.username,
      authorizationPassword: sipConfig.password,
      displayName: sipConfig.username,
      contactName: sipConfig.username,
      logLevel: 'debug',
      logConfiguration: true,
      hackAllowUnregisteredOptionTags: true,
      hackViaTcp: true,
      forceRport: true,
      hackIpInContact: true,
      logBuiltinEnabled: true,
      instanceId: instanceId,
      contactParams: { transport: sipConfig.socket },
      allowLegacyNotifications: true,
      noAnswerTimeout: 60,
      viaHost: await getViaHost(),
      userAgentString: 'Vogat/1.0',
      sendInitialProvisionalResponse: true,
      sessionDescriptionHandlerFactoryOptions:  {
        iceGatheringTimeout: 5000,
        constraints: {
          audio: true,
          video: false,
        },
        RTCConstraints: {
          mandatory:{
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: false,
          }
        }
      },
    };


userAgent = new UserAgent(userAgentOptions);
setupNetworkMonitoring()


// Set the contact URI manually after creating the UserAgent
const contactUri = UserAgent.makeURI(`sip:6472438101@${userAgent.configuration.viaHost}:6051;transport=wss`);
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
  userAgent.transport.onConnect = () => {
    console.log('Transport connected')
    notifyConnectionState('connected',
      isUserAgentRegistered() ? 'registered' : 'initialized' )
  }
  userAgent.transport.onDisconnect = (error?: Error) => {
    console.error('Transport disconnected:', error)
    notifyConnectionState('disconnected', 'disconnected', error)
  }


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
    notifyConnectionState('error', 'error', error instanceof Error ? error : new Error('Unknown error'))
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

  //if (registerer?.state === RegistererState.Registered) {
   // return { status: 'success', message: 'User already registered' };
  //}

  if (isUserAgentRegistered()) {
    return { status: 'warning', message: 'Already registered' }
  }

  if (isRegistering) {
    return { status: 'warning', message: 'Registration already in progress' };
  }

  isRegistering = true;

  try {
    if (!registerer) {
      const sipConfig = getSavedSIPConfig();
      const registerOptions: RegistererOptions = {
        registrar: userAgent.configuration.uri,
        logConfiguration: true,
        //instanceId: instanceId,

      };
      registerer = new Registerer(userAgent, registerOptions);
      
      registerer.stateChange.addListener((newState) => {
        console.log(`Registration state changed to: ${newState}`);
        if (registrationStateChangeHandler) {
          registrationStateChangeHandler(getRegistrationState());
        }
      });
    }
        await registerer.register();
        console.log('Registration successful');
        return { status: 'success', message: 'User registered successfully' };
      } catch (error) {
        console.error('Registration failed:', error);
        return { status: 'error', message: 'Failed to register user' };
      } finally {
        isRegistering = false;
      }
    };

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

 // if (registerer.state === RegistererState.Terminated) {
  //  return { status: 'success', message: 'User agent already unregistered' };
 // }

  if (isUserAgentRegistered()) {
    return { status: 'warning', message: 'Already registered' }
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
      notifyConnectionState('connected', 'initialized');
      return 'Initial';
    case RegistererState.Registered:
      notifyConnectionState('connected', 'registered');
      return 'Registered';
    case RegistererState.Unregistered:
      notifyConnectionState('connected', 'initialized');
      return 'Unregistered';
    case RegistererState.Terminated:
      notifyConnectionState('disconnected', 'disconnected'); 
      return 'Terminated';
    default:
      notifyConnectionState('error', 'error', new Error('Unknown registration state'))
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

  const myMediaStreamFactory: Web.MediaStreamFactory = (
    constraints: MediaStreamConstraints,
    sessionDescriptionHandler: Web.SessionDescriptionHandler
  ): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia(constraints);
  };
  
  const mySessionDescriptionHandlerFactory: Web.SessionDescriptionHandlerFactory = Web.defaultSessionDescriptionHandlerFactory(
    myMediaStreamFactory
  );

  function updateCallState(newState: CallState) {
    console.log("New state: ", newState);
    callState = newState;
    if (callStateChangeHandler) {
      callStateChangeHandler(newState);
    }
  }

export function setCallStateChangeHandler(handler: ((state: CallState) => void) | null) {
  callStateChangeHandler = handler;
}

function compareURIs(uri1: URI, uri2: URI): boolean {
  return uri1.user === uri2.user && uri1.host === uri2.host;
}

export async function makeOutgoingCall(phoneNumber: string, onStateChange: (state: CallState) => void): Promise<SIPResponse> {

  if (!userAgent) {
    updateCallState('error');
    return { status: 'error', message: 'UserAgent not initialized' };
  }

  if (currentSession) {
    console.log('Already in a call, cannot make a new outgoing call');
    return { status: 'error', message: 'Already in a call' };
  }

  const target = UserAgent.makeURI(`sip:${phoneNumber}@${getSavedSIPConfig()?.server}`);
  if (!target) {
    updateCallState('error');
    throw new Error('Failed to create target URI');
  }

  const sessionDescriptionHandlerOptions: SessionDescriptionHandlerOptions = {
    constraints: { audio: true, video: false },

  };

  const inviterOptions: InviterOptions = {
    earlyMedia: true,
    params: {
      fromDisplayName: userAgent.configuration.displayName,
      fromUri: userAgent.configuration.uri.toString(),
      toUri: target.toString()
    },
    sessionDescriptionHandlerOptions,
  };

  //const remoteAudio = new Audio()
  //remoteAudio.autoplay = true

  const inviter = new Inviter(userAgent, target, inviterOptions);
  setCurrentSession(inviter);


  inviter.delegate = {
    onRefer(referral) {
      // Handle incoming REFER request if needed
      console.log('Received REFER request:', referral);
    },
  };


  updateCallState('initiating');
  callStateChangeHandler = onStateChange;


  const inviteOptions: InviterInviteOptions = {
    requestDelegate: {
      onTrying: (response) => {
        console.log('Received 100 Trying:', response);
        updateCallState('establishing');
      },
      onProgress: (response) => {
        console.log('Received progress response:', response.message);
        updateCallState('establishing');
        if (response.message.statusCode === 183) {
          console.log('Received 183 Session Progress');
          // Handle early media if needed
          const sessionDescription = response.message.getHeader('Content-Type') === 'application/sdp'
            ? response.message.body
            : undefined;
          if (sessionDescription) {
            console.log('Received SDP in 183 response:', sessionDescription);
            // Set up early media if required
          }
        }
        handleSession(inviter);
      },
      onAccept: (response) => {
        console.log('Call Accepted:', response.message);
        updateCallState('established');
      },
      onReject: (response) => {
        console.log('Call Rejected:', response.message);
        updateCallState('terminated');
        cleanupCall();
        setCurrentSession(null);
      }
    }
  };


  inviter.stateChange.addListener((newState: SessionState) => {
    console.log(`[${new Date().toISOString()}] Outgoing call state changed to ${newState}`);
    const mappedState = mapSessionStateToCallState(newState);
    updateCallState(mappedState);

    switch (newState) {
      case SessionState.Establishing:
        break;
      case SessionState.Established:
       // handleSession(inviter);
        break;
      case SessionState.Terminated:
        cleanupCall();
        setCurrentSession(null);
        break;
      default:
        break;
    }
  });

    //inviter.invite(inviteOptions)
    try {
      await inviter.invite(inviteOptions);
      return { status: 'success', message: 'Outgoing call initiated' };
    } catch (error) {
      console.error('Error initiating call:', error);
      updateCallState('error');
      cleanupCall();
      setCurrentSession(null);
      return { status: 'error', message: 'Failed to initiate outgoing call' };
    }
  }

  export function handleSession(session: Session): void {
    console.log('Handling new session');
    currentSession = session;
    
    if (!remoteAudio) {
      remoteAudio = new Audio();
      remoteAudio.autoplay = true;
    }
  
    if (session.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
      const sessionDescriptionHandler = session.sessionDescriptionHandler;


  
      // Listen for track additions and removals
      sessionDescriptionHandler.remoteMediaStream.onaddtrack = (event) => {
        console.log('Track added:', event.track.kind);
        updateAudioStream(sessionDescriptionHandler.remoteMediaStream);
      };
  
      sessionDescriptionHandler.remoteMediaStream.onremovetrack = (event) => {
        console.log('Track removed:', event.track.kind);
        updateAudioStream(sessionDescriptionHandler.remoteMediaStream);
      };
  
      // Initial setup of audio stream
      updateAudioStream(sessionDescriptionHandler.remoteMediaStream);
  
      // Listen for peer connection state changes
      sessionDescriptionHandler.peerConnectionDelegate = {
        onconnectionstatechange: () => {
          console.log('PeerConnection state changed:', sessionDescriptionHandler.peerConnection?.connectionState);
          if (sessionDescriptionHandler.peerConnection?.connectionState === 'connected') {
            updateAudioStream(sessionDescriptionHandler.remoteMediaStream);
          }
        }
      };
    }
  
    session.stateChange.addListener((state: SessionState) => {
      console.log(`Session state changed to ${state}`);
      switch (state) {
        case SessionState.Establishing:
          console.log('Call is being established');
          break;
        case SessionState.Established:
          console.log('Call established, ensuring audio is playing');
          remoteAudio?.play().catch(error => console.error('Error playing remote audio:', error));
          break;
        case SessionState.Terminating:
          console.log('Call is terminating');
          break;
        case SessionState.Terminated:
          console.log('Call has been terminated');
          cleanupCall();
          break;
      }
    });
  }

  function updateAudioStream(stream: MediaStream) {
    if (remoteAudio) {
      remoteAudio.srcObject = stream;
      remoteAudio.load(); // Needed for Safari
      remoteAudio.play().catch(error => console.error('Error playing remote audio:', error));
    }
  }


export async function terminateCall(): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
      try {
          if (currentSession) {
              console.log(`Terminating call in state ${currentSession.state}`);

              switch (currentSession.state) {
                  case SessionState.Initial:
                  case SessionState.Establishing:
                      if (currentSession instanceof Inviter) {
                          currentSession.cancel();
                      } else {
                          currentSession.dispose(); 
                      }
                      break;
                  case SessionState.Established:
                      await currentSession.bye();
                      break;
                  case SessionState.Terminating:
                  case SessionState.Terminated:
                      // Already terminating/terminated, sometimes redundant but ensures cleanup
                      currentSession.dispose();
                      cleanupCall(); // Ensure disposal even if already terminating
                      break;  
              }

              cleanupCall();  // Crucial: Clean up regardless of termination method
              resolve();

          } else {
              console.warn('No active call to terminate.');
              resolve();
          }
      } catch (error) {
          console.error("Error terminating call:", error);
          cleanupCall(); // Always clean up, even on error
          reject(error);
      }
  });
}


export function cleanupCall() {
  console.log("Cleaning up call");


  if (currentSession) {
      const peerConnection = currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler
          ? currentSession.sessionDescriptionHandler.peerConnection
          : null;

      if (peerConnection) {
         peerConnection.getSenders().forEach(sender => {
              sender.track?.stop();
              peerConnection.removeTrack(sender);
          });


          peerConnection.onicecandidate = null;
          peerConnection.ontrack = null;


          // Important to close the peer connection
          try {
            peerConnection.close();
          } catch (error) {
            console.warn("Error closing peer connection:", error);
          }

        currentSession.sessionDescriptionHandler?.close(); 

      }


      if (currentSession.stateChange) {
          currentSession.stateChange.removeListener((newState: SessionState) => updateCallState(mapSessionStateToCallState(newState)));
      }


      // Stop audio and detach stream
      if (remoteAudio && remoteAudio.srcObject) {
          remoteAudio.srcObject = null;
          remoteAudio.pause();

      }


      currentSession = null;
  }
  if (previousSession && previousSession.stateChange) { // Corrected listener removal
    previousSession.stateChange.removeListener((newState: SessionState) => updateCallState(mapSessionStateToCallState(newState))); // Use correct listener function
    previousSession = null;
  }

  window.removeEventListener('unload', cleanupCall); // No need to remove if not added

  updateCallState('initial');
}


export function getCurrentSession(): Session | null {
  return currentSession;
}

export function setCurrentSession(session: Session | null): void {
  currentSession = session;
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

async function handleReconnection() {
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

function setupNetworkMonitoring() {
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