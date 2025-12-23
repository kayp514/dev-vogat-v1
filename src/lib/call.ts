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
} from 'sip.js';
import { IncomingInviteRequest, IncomingRequestMessage, IncomingResponse } from 'sip.js/lib/core/messages';
import { Emitter } from 'sip.js/lib/api/emitter';
import { Transport, TransportOptions } from 'sip.js/lib/platform/web/transport';
import { v4 as uuidv4 } from 'uuid';
import { RegistrationState, SIPConfig, SIPResponse, UserInfo, SIPStatus, TransportStatus, ConnectionState, CONFIG, CallState } from './type';
import { notifyConnectionState, handleReconnection, setupNetworkMonitoring } from './network';

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
let isProcessingQueue = false;



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


          if (currentSession && peerConnection && !currentSession.sessionDescriptionHandler?.hasDescription('local')) {
            peerConnection.createAnswer().then((answer) => {
              if (answer && answer.sdp) {
                currentSession.sessionDescriptionHandler?.setDescription(answer.sdp)
                  .then(() => {
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
      server: `${sipConfig.socket}://${sipConfig.server}:${sipConfig.port}/ws`,  //wss://your-ip:5061/ws
      //server: `${sipConfig.socket}://${sipConfig.server}:${sipConfig.port}/${sipConfig.socket}/sip/`, //when port is 1443, wss://your-ip:1443/wss/sip/.
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
      sessionDescriptionHandlerFactory: mySessionDescriptionHandlerFactory,
      sessionDescriptionHandlerFactoryOptions: {
        iceGatheringTimeout: 5000,
        constraints: {
          audio: true,
          video: false,
        },
        RTCConstraints: {
          mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: false,
          }
        }
      },
    };


    userAgent = new UserAgent(userAgentOptions);
    setupNetworkMonitoring()


    // Set the contact URI manually after creating the UserAgent
    const contactUri = UserAgent.makeURI(`sip:16472438101@${userAgent.configuration.viaHost}:6051;transport=wss`);
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
        isUserAgentRegistered() ? 'registered' : 'initialized')
    }
    userAgent.transport.onDisconnect = (error?: Error) => {
      console.error('Transport disconnected:', error)
      notifyConnectionState('disconnected', 'disconnected', error)
    }


    await userAgent.start();
    console.log('UserAgent started');

    // Pre-request microphone permission during initialization
    // This ensures browser shows permission prompt early and stream is ready for calls
    try {
      console.log('Requesting microphone permission during initialization...');
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log('Microphone permission granted and stream acquired during initialization');
      console.log('Local stream tracks:', localStream.getTracks().map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled })));
    } catch (error) {
      console.error('Failed to get microphone permission during initialization:', error);
      // Don't fail SIP initialization if mic permission is denied
      // User can still grant it later when making/receiving calls
      console.warn('SIP will continue without pre-acquired media stream. Permission will be requested on first call.');
    }

    const acceptOptions = {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false }
      },
    };

    const registrationResult = await registerUserAgent();
    // Accept both 'success' and 'warning' (already registered) as valid states
    if (registrationResult.status === 'error') {
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
    return () => { };
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

      // Log media stream status from initialization
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        console.log('Local stream available from initialization:', {
          hasStream: !!localStream,
          trackState: audioTrack?.readyState,
          trackEnabled: audioTrack?.enabled
        });
      } else {
        console.log('No local stream from initialization, will request on accept');
      }

      updateCallState('establishing');

      let isAnswered = false;


      const stateChangeHandler = (newState: SessionState) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📞 Incoming call SESSION STATE changed to: ${newState}`);
        console.log(`   Previous call state: ${callState}`);
        console.log(`   Invitation state: ${invitation.state}`);
        console.log(`   Current session exists: ${!!currentSession}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        switch (newState) {
          case SessionState.Initial:
            console.log('State: Initial - invitation created');
            break;
          case SessionState.Establishing:
            console.log('State: Establishing - negotiating connection');
            updateCallState('establishing');
            break;
          case SessionState.Established:
            console.log('✅ State: Established - call is now active!');
            console.log('Setting up session and updating to established state...');
            currentSession = invitation;
            handleSession(invitation);
            updateCallState('established');
            isAnswered = true;
            console.log('Call state updated to established, UI should now show CallUI');
            break;
          case SessionState.Terminating:
            console.log('State: Terminating - call ending');
            updateCallState('terminating');
            break;
          case SessionState.Terminated:
            console.log('State: Terminated - call ended');
            updateCallState('terminated');
            currentSession = null;
            break;
          default:
            console.log(`Unhandled session state: ${newState}`);
        }
      };
      
      invitation.stateChange.addListener(stateChangeHandler);
      console.log('✓ State change listener attached to invitation');

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

  console.log('Accepting incoming call...');
  
  // Check if local stream is available and valid
  const hasValidStream = localStream && localStream.getAudioTracks()[0]?.readyState === 'live';
  console.log('Local stream status:', { hasStream: !!localStream, isValid: hasValidStream });

  const acceptOptions: InvitationAcceptOptions = {
    sessionDescriptionHandlerOptions: {
      constraints: { audio: true, video: false },
    },
  };

  // Ensure we have a valid media stream before accepting
  const ensureMediaStream = hasValidStream 
    ? Promise.resolve(localStream)
    : navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          console.log('Acquired microphone permission on accept');
          localStream = stream;
          return stream;
        });

  return ensureMediaStream
    .then(() => {
      console.log('Media stream ready, accepting invitation');
      console.log('Current invitation state before accept:', invitation.state);
      return invitation.accept(acceptOptions);
    })
    .then(() => {
      console.log('invitation.accept() completed successfully');
      console.log('Invitation state after accept:', invitation.state);
      // Note: State will be updated by the stateChange listener in listenForIncomingCalls
      // Do not manually set state here to avoid conflicts
    })
    .catch((error) => {
      console.error('Error accepting call:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      updateCallState('error');
      throw error; // Re-throw for proper error handling in CallSIPProvider
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
  console.log('MediaStreamFactory called with constraints:', constraints);
  
  // If we already have a local stream from initialization/previous call, reuse it
  if (localStream && constraints.audio && !constraints.video) {
    // Check if the stream is still active
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack && audioTrack.readyState === 'live') {
      console.log('Reusing existing local stream from initialization');
      return Promise.resolve(localStream);
    } else {
      console.log('Existing stream is not live, requesting new stream');
      localStream = null; // Clear invalid stream
    }
  }
  
  // Request new stream if not available or invalid
  console.log('Requesting new media stream');
  return navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      console.log('New media stream obtained successfully');
      localStream = stream; // Store for future reuse
      return stream;
    })
    .catch(error => {
      console.error('Failed to get media stream:', error);
      throw error;
    });
};

const mySessionDescriptionHandlerFactory: Web.SessionDescriptionHandlerFactory = Web.defaultSessionDescriptionHandlerFactory(
  myMediaStreamFactory
);

function updateCallState(newState: CallState) {
  const previousState = callState;
  callState = newState;
  
  console.log('═════════════════════════════════════════════════════');
  console.log('📡 CALL STATE UPDATE');
  console.log(`   Previous: ${previousState}`);
  console.log(`   New:      ${newState}`);
  console.log(`   Handler exists: ${!!callStateChangeHandler}`);
  console.log('═════════════════════════════════════════════════════');
  
  if (callStateChangeHandler) {
    console.log('🔔 Notifying CallSIPProvider of state change...');
    callStateChangeHandler(newState);
    console.log('✅ CallSIPProvider notified');
  } else {
    console.warn('⚠️ No callStateChangeHandler registered! State change not propagated to UI.');
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
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎧 handleSession called');
  console.log('   Session state:', session.state);
  console.log('   Session type:', session instanceof Invitation ? 'Invitation (incoming)' : 'Inviter (outgoing)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  currentSession = session;

  if (!remoteAudio) {
    console.log('Creating new remote audio element');
    remoteAudio = new Audio();
    remoteAudio.autoplay = true;
  } else {
    console.log('Reusing existing remote audio element');
  }

  if (session.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
    const sessionDescriptionHandler = session.sessionDescriptionHandler;
    console.log('Session has valid SessionDescriptionHandler');



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

  // Note: We keep localStream active for the next call
  // It will only be cleaned up when SIP is completely shut down
  // This allows immediate call handling without requesting permission again
  console.log('Call cleanup complete. Local stream preserved for future calls.');
  
  window.removeEventListener('unload', cleanupCall); // No need to remove if not added

  updateCallState('initial');
}

// Function to completely cleanup SIP and release all resources including local stream
export function shutdownSIP(): void {
  console.log('Shutting down SIP and releasing all resources');
  
  // Clean up any active call first
  if (currentSession) {
    cleanupCall();
  }
  
  // Stop and release local stream
  if (localStream) {
    console.log('Releasing local media stream');
    localStream.getTracks().forEach(track => {
      console.log(`Stopping track: ${track.kind}, id: ${track.id}`);
      track.stop();
    });
    localStream = null;
  }
  
  // Unregister if registered
  if (registerer && isUserAgentRegistered()) {
    unregisterUserAgent();
  }
  
  // Stop user agent
  if (userAgent) {
    userAgent.stop();
    userAgent = null;
  }
  
  console.log('SIP shutdown complete');
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