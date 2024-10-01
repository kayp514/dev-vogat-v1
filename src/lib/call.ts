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

import { Transport, TransportOptions } from 'sip.js/lib/platform/web/transport';


let userAgent: UserAgent | null = null;
let registerer: Registerer | null = null;
let currentSession: Session | null = null;
let isRegistering = false;
let remoteAudio: HTMLAudioElement | null = null;

let registrationStateChangeHandler: ((state: RegistrationState) => void) | null = null;
let callStateChangeHandler: ((state: CallState) => void) | null = null

export type RegistrationState = 'Initial' | 'Registered' | 'Unregistered' | 'Terminated';


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
}

export type CallState = 'idle' | 'establishing' | 'established' | 'terminating' | 'terminated' | 'error'

interface CustomSessionDescriptionHandlerOptions extends SessionDescriptionHandlerOptions {
  hold?: boolean;
}


class CustomTransport extends Transport {
  constructor(logger: any, options: any) {
    super(logger, options);
  }

  public send(message: string): Promise<void> {
    console.log('Sending message:', message);
    return super.send(message);
  }

  public async connect(): Promise<void> {
    console.log('Connecting transport');
    await super.connect();
  }

  public async disconnect(): Promise<void> {
    console.log('Disconnecting transport');
    await super.disconnect();
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
      return { status: 'error', message: 'Failed to create SIP URI' };
    }

    
    const transportOptions = {
      server: `${sipConfig.socket}://${sipConfig.server}:${sipConfig.port}/${sipConfig.socket}`,
      connectionTimeout: 10000,
    };

    const userAgentOptions: UserAgentOptions = {
      uri,
      transportConstructor: CustomTransport,
      transportOptions,
      authorizationUsername: sipConfig.username,
      authorizationPassword: sipConfig.password,
      userAgentString: 'Vogat/1.0',
    };

    userAgent = new UserAgent(userAgentOptions);

    await userAgent.start();

    const registerOptions: RegistererOptions = {
      registrar: uri,
    };

    registerer = new Registerer(userAgent, registerOptions);
    handleRegistrationStateChange((state) => {
      console.log(`Registration state changed to ${state}`);
    });

    await registerUserAgent();

    userAgent.delegate = {
      onInvite: (invitation: Invitation) => {
        console.log('Incoming call received');
        handleIncomingCall(invitation);
      }
    };

    return { status: 'success', message: 'UserAgent initiated and registered' };
  } catch (error) {
    console.error("SIP initialization failed:", error);
    return { status: 'error', message: `SIP initialization failed` };
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

  if (isUserAgentRegistered()) {
    return { status: 'success', message: 'User agent already registered' };
  }

  if (isRegistering) {
    return { status: 'error', message: 'Registration already in progress' };
  }

  try {
    isRegistering = true;
    if (!registerer) {
      registerer = new Registerer(userAgent);
    }
    await registerer.register();
    return { status: 'success', message: 'User agent registered successfully' };
  } catch (error) {
    return { status: 'error', message: 'Failed to register user agent' };
  } finally {
    isRegistering = false;
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

function handleIncomingCall(invitation: Invitation): void {
  if (!isUserAgentRegistered()) {
    console.warn('Received incoming call while not registered. Rejecting.');
    invitation.reject();
    return;
  }

  console.log('Handling incoming call');
  
  const acceptOptions: InvitationAcceptOptions = {
    sessionDescriptionHandlerOptions: {
      constraints: { audio: true, video: false }
    }
  };

  invitation.accept(acceptOptions)
    .then(() => {
      console.log('Call accepted');
      currentSession = invitation;
      handleSession(invitation);
    })
    .catch((error: Error) => {
      console.error('Error accepting call:', error);
    });

  invitation.stateChange.addListener((newState: SessionState) => {
    console.log(`Incoming call session state changed to: ${newState}`);
    switch (newState) {
      case SessionState.Establishing:
        console.log('Incoming call is being established...');
        // Add any specific logic for the establishing state
        break;
      case SessionState.Established:
        console.log('Incoming call has been established');
        // Add any specific logic for the established state
        break;
      case SessionState.Terminating:
        console.log('Incoming call is terminating...');
        // Add any cleanup logic for the terminating state
        break;
      case SessionState.Terminated:
        console.log('Incoming call has been terminated');
        currentSession = null;
        // Add any final cleanup logic
        break;
      default:
        console.log(`Unhandled session state: ${newState}`);
    }
  });
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
    let currentCallState : CallState = 'establishing';
    onStateChange(currentCallState);

    inviter.stateChange.addListener((state: SessionState) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Outgoing call state changed to ${state}`);
      currentCallState = mapSessionStateToCallState(state);
      onStateChange(currentCallState);

      if (callStateChangeHandler) {
        callStateChangeHandler(currentCallState);
      }

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

    await inviter.invite();
    return { status: 'success', message: currentCallState };
  } catch (error) {
    console.error('Error making outgoing call:', error);
    return { status: 'error', message: 'Failed to make outgoing call' };
  }
}

function handleSession(session: Session): void {
  console.log('Handling new session');
  const audio = createRemoteAudio();

  if (session.sessionDescriptionHandler) {
    const peerConnectionDelegate = {
      ontrack: (event: RTCTrackEvent) => {
        console.log('Received remote track:', event.track.kind);
        const [remoteStream] = event.streams;
        if (audio && remoteStream) {
          audio.srcObject = remoteStream;
        }
      }
    };

    if ('peerConnectionDelegate' in session.sessionDescriptionHandler) {
      (session.sessionDescriptionHandler as any).peerConnectionDelegate = peerConnectionDelegate;
    } else {
      console.warn('peerConnectionDelegate not available on sessionDescriptionHandler');
    }

    if (session.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
      const peerConnection = session.sessionDescriptionHandler.peerConnection;

      peerConnection?.addEventListener('connectionstatechange', () => {
        console.log('PeerConnection state changed:', peerConnection?.connectionState);
        if (peerConnection?.connectionState === 'connected') {
          const remoteStream = new MediaStream(
            peerConnection.getReceivers().map((receiver) => receiver.track)
          );
          if (audio) {
            audio.srcObject = remoteStream;
          }
        }
      });

      peerConnection?.addEventListener('track', (event: RTCTrackEvent) => {
        console.log('Received track directly on peerConnection:', event.track.kind);
        const [remoteStream] = event.streams;
        if (audio && remoteStream) {
          audio.srcObject = remoteStream;
        }
      });
    }
  }

  session.stateChange.addListener((state: SessionState) => {
    console.log(`Session state changed to ${state}`);
    switch (state) {
      case SessionState.Established:
        console.log('Call established, ensuring audio is playing');
        audio.play().catch(error => console.error('Error playing remote audio:', error));
        break;
      case SessionState.Terminated:
        console.log('Session has been terminated');
        if (audio.srcObject) {
          const tracks = (audio.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
        audio.srcObject = null;
        break;
    }
  });
}

export function terminateCall(): SIPResponse {
  if (currentSession) {
    if (currentSession.state === SessionState.Established) {
      currentSession.bye()
        .then(() => {
          console.log('Call terminated successfully');
          cleanupCall();
        })
        .catch((error: Error) => {
          console.error('Error terminating call:', error);
          cleanupCall();
        });
    } else if (isInviterOrInvitation(currentSession)) {
      currentSession.dispose();
      cleanupCall();
    } else {
      console.warn('Unable to terminate the current session');
      cleanupCall();
      return { status: 'error', message: 'Unable to terminate the current session' };
    }
    return { status: 'success', message: 'Call termination initiated' };
  } else {
    console.log('No active call to terminate');
    return { status: 'warning', message: 'No active call to terminate' };
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

function cleanupCall() {
  currentSession = null;
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
    callStateChangeHandler('idle');
  }
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

export async function reconnect(): Promise<SIPResponse> {
  if (!userAgent) {
    return { status: 'error', message: 'UserAgent not initialized' };
  }

  try {
    await userAgent.reconnect();
    return { status: 'success', message: 'Reconnected successfully' };
  } catch (error) {
    console.error('Error reconnecting:', error);
    return { status: 'error', message: 'Failed to reconnect' };
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