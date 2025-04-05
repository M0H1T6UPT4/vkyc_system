// components/vkyc/jitsi-meeting.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { User } from '@prisma/client';

// JitsiMeetExternalAPI Type Definitions
interface JitsiMeetExternalAPIOptions {
  roomName: string;
  width: string | number;
  height: string | number;
  parentNode: HTMLElement;
  configOverwrite?: {
    prejoinPageEnabled?: boolean;
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    disableDeepLinking?: boolean;
    disableFocusIndicator?: boolean;
    websocket?: string;
    bosh?: string;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    [key: string]: any;
  };
  interfaceConfigOverwrite?: {
    TOOLBAR_BUTTONS?: string[];
    SHOW_JITSI_WATERMARK?: boolean;
    SHOW_WATERMARK_FOR_GUESTS?: boolean;
    DEFAULT_REMOTE_DISPLAY_NAME?: string;
    TOOLBAR_ALWAYS_VISIBLE?: boolean;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    [key: string]: any;
  };
  userInfo?: {
    displayName?: string;
    email?: string;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    [key: string]: any;
  };
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any;
}

interface JitsiMeetCommands {
  displayName: string;
  toggleAudio: string;
  toggleVideo: string;
  toggleFilmStrip: string;
  toggleChat: string;
  hangup: string;
  email: string;
  subject: string;
  avatarUrl: string;
  [key: string]: string;
}

interface JitsiMeetEvents {
  videoConferenceJoined: string;
  videoConferenceLeft: string;
  participantJoined: string;
  participantLeft: string;
  recordingStatusChanged: string;
  [key: string]: string;
}

interface JitsiMeetExternalAPI {
  // biome-ignore lint/suspicious/noMisleadingInstantiator: <explanation>
  new(domain: string, options: JitsiMeetExternalAPIOptions): JitsiMeetExternalAPI;
  addEventListeners: (listeners: Record<string, (event: JitsiMeetEventData) => void>) => void;
  removeEventListeners: (listeners: Record<string, (event: JitsiMeetEventData) => void>) => void;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  executeCommand: (command: string, ...args: any[]) => void;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  executeCommands: (commands: Record<string, any>) => void;
  dispose: () => void;
  isAudioMuted: () => Promise<boolean>;
  isVideoMuted: () => Promise<boolean>;
  getNumberOfParticipants: () => number;
  getParticipantsInfo: () => JitsiParticipant[];
  getVideoQuality: () => string;
  getAvatarURL: (participantId: string) => string;
  startRecording: (options: JitsiRecordingOptions) => void;
  stopRecording: (mode: 'file' | 'stream') => void;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any;
}

interface JitsiMeetEventData {
  roomName?: string;
  id?: string;
  displayName?: string;
  avatarURL?: string;
  formattedDisplayName?: string;
  mode?: 'file' | 'stream';
  status?: 'on' | 'off';
  error?: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any;
}

interface JitsiParticipant {
  id: string;
  displayName: string;
  avatarURL: string;
  formattedDisplayName: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any;
}

interface JitsiRecordingOptions {
  mode: 'file' | 'stream';
  dropboxToken?: string;
  shouldShare?: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: JitsiMeetExternalAPI;
  }
}

interface JitsiMeetingProps {
  roomId: string;
  user: User;
  isAgent: boolean;
  onMeetingEnd?: () => void;
}

export const JitsiMeeting = ({ roomId, user, isAgent, onMeetingEnd }: JitsiMeetingProps) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<JitsiMeetExternalAPI | null>(null);

  useEffect(() => {
    // Load the Jitsi script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;

    script.onload = () => initJitsi();
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, []);

  const initJitsi = () => {
    if (!jitsiContainerRef.current) return;
    if (typeof window.JitsiMeetExternalAPI !== 'function') return;

    // Use your local Jitsi Meet instance
    const domain = 'meet.example.com'; // Replace with your actual domain

    const options: JitsiMeetExternalAPIOptions = {
      roomName: `vkyc-session-${roomId}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: `${isAgent ? '👨‍💼 ' : ''}${user.name}`,
        email: user.email,
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        // For self-signed certificates in testing environment
        disableFocusIndicator: true,
        // Connection to local Jitsi server settings
        websocket: `wss://${domain}/xmpp-websocket`,
        bosh: `https://${domain}/http-bind`,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'videoquality', 'filmstrip', 'feedback', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'tileview'
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_REMOTE_DISPLAY_NAME: 'Customer',
        TOOLBAR_ALWAYS_VISIBLE: true,
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    jitsiApiRef.current = api;

    // Setup event handlers
    api.addEventListeners({
      videoConferenceJoined: handleConferenceJoined,
      videoConferenceLeft: handleConferenceLeft,
      participantJoined: handleParticipantJoined,
      participantLeft: handleParticipantLeft,
      recordingStatusChanged: handleRecordingStatusChanged,
    });

    if (isAgent) {
      // For agent, add recording options
      api.executeCommand('overwriteConfig', {
        toolbarButtons: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'videoquality', 'filmstrip', 'feedback', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'tileview'
        ],
      });
    } else {
      // For customer, add flip camera option if on mobile
      if (isMobileDevice()) {
        api.executeCommand('overwriteConfig', {
          toolbarButtons: [
            'microphone', 'camera', 'hangup', 'chat', 'raisehand', 'tileview', 'filmstrip'
          ],
        });
      }
    }
  };

  const handleConferenceJoined = (eventData: JitsiMeetEventData) => {
    console.log('Conference joined', eventData);
  };

  const handleConferenceLeft = (eventData: JitsiMeetEventData) => {
    console.log('Conference left', eventData);
    if (onMeetingEnd) {
      onMeetingEnd();
    }
  };

  const handleParticipantJoined = (eventData: JitsiMeetEventData) => {
    console.log('Participant joined:', eventData);
  };

  const handleParticipantLeft = (eventData: JitsiMeetEventData) => {
    console.log('Participant left:', eventData);
  };

  const handleRecordingStatusChanged = (eventData: JitsiMeetEventData) => {
    console.log('Recording status changed:', eventData);
    // Here you can update your database with recording status
  };

  const isMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={jitsiContainerRef} className="w-full h-full" />
    </div>
  );
};