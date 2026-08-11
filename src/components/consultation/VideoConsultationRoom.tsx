import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
} from '@videosdk.live/react-sdk';
import {
  Video, VideoOff, Mic, MicOff,
  Users, Edit3, FileText, X, Send, Download, CheckCircle2, PhoneOff, Loader, Paperclip
} from 'lucide-react';
import { VIDEOSDK_TOKEN } from '../../lib/videosdk';
import { supabase } from '../../lib/supabase';
import { uploadAttachment } from '../../lib/uploadAttachment';
import { PortalRole } from '../../types/insurance';
import { useRemoteControl } from '../../hooks/useRemoteControl';
import { RemoteControlButton } from './RemoteControlButton';
import { RequestControlButton } from './RequestControlButton';
import { ReleaseControlButton } from './ReleaseControlButton';
import { RemoteControlRequestModal } from './RemoteControlBanner';
import { RemoteControlBanner } from './RemoteControlBannerComponent';
import { SharedScreenView } from './SharedScreenView';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  text: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
}

interface SharedForm {
  id: string;
  room_id: string;
  policy_type: string;
  sum_assured: string;
  remarks: string;
  submitted_by: string;
  created_at: string;
}

// ─── Role helpers ────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; color: string; textColor: string; borderColor: string }> = {
  customer: { label: 'Customer', color: 'bg-blue-600/90',     textColor: 'text-blue-400',    borderColor: 'border-blue-500' },
  advisor:  { label: 'Advisor',  color: 'bg-emerald-600/90',  textColor: 'text-emerald-400', borderColor: 'border-emerald-500' },
  officer:  { label: 'Officer',  color: 'bg-purple-600/90',   textColor: 'text-purple-400',  borderColor: 'border-purple-500' },
};

// ─── Participant Tile ─────────────────────────────────────────────────────────
const ParticipantTile: React.FC<{ participantId: string; role: PortalRole; isLocal?: boolean }> = ({
  participantId, role, isLocal = false
}) => {
  const meta = ROLE_META[role] ?? { label: 'Participant', color: 'bg-slate-600/90', textColor: 'text-slate-400', borderColor: 'border-slate-500' };
  const { webcamStream, micStream, webcamOn, micOn, displayName } = useParticipant(participantId);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const audioRef  = useRef<HTMLAudioElement>(null);
  const { label, color } = meta;

  useEffect(() => {
    if (videoRef.current && webcamStream) {
      const ms = new MediaStream();
      ms.addTrack(webcamStream.track);
      videoRef.current.srcObject = ms;
      videoRef.current.play().catch(() => {});
    }
  }, [webcamStream]);

  useEffect(() => {
    if (audioRef.current && micStream && !isLocal) {
      const ms = new MediaStream();
      ms.addTrack(micStream.track);
      audioRef.current.srcObject = ms;
      audioRef.current.play().catch(() => {});
    }
  }, [micStream, isLocal]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col justify-between p-4 shadow-lg min-h-[200px]">
      {!isLocal && <audio ref={audioRef} autoPlay />}
      {webcamOn && webcamStream ? (
        <video ref={videoRef} autoPlay muted={isLocal} className="absolute inset-0 w-full h-full object-cover opacity-90" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className={`w-16 h-16 rounded-full ${color} flex items-center justify-center text-white text-2xl font-bold`}>
            {displayName?.charAt(0) || '?'}
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
      <div className="relative z-10 flex justify-between items-center">
        <span className={`${color} text-white text-[11px] font-bold px-2.5 py-1 rounded-md capitalize`}>{label}</span>
        <div className={`p-1.5 rounded-full ${micOn ? 'bg-slate-900/80 text-green-400' : 'bg-red-600/80 text-white'}`}>
          {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </div>
      </div>
      <div className="relative z-10">
        <p className="font-bold text-sm text-white drop-shadow">{displayName}</p>
      </div>
    </div>
  );
};

// ─── Meeting Room Inner ───────────────────────────────────────────────────────
const MeetingRoom: React.FC<{
  roomId: string;
  title: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: PortalRole;
  onClose: () => void;
}> = ({ roomId, title, currentUserId, currentUserName, currentUserRole, onClose }) => {
  const meetingApi = useMeeting({
    onMeetingJoined: () => setJoined(true),
    onMeetingLeft: () => {
      setJoined(false);
      onClose();
    },
  }) as any;

  const {
    join,
    leave,
    toggleMic,
    toggleWebcam,
    participants,
    localMicOn,
    localWebcamOn,
    localParticipant,
    enableScreenShare,
    disableScreenShare,
  } = meetingApi as any;

  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'notes' | 'forms'>('chat');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [customerParticipantId, setCustomerParticipantId] = useState<string | null>(null);
  const [customerUserId, setCustomerUserId] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [remoteAssistError, setRemoteAssistError] = useState<string | null>(null);

  const remoteControl = useRemoteControl(
    roomId,
    currentUserId,
    currentUserRole as 'customer' | 'officer' | 'advisor',
    () => {
      setRemoteAssistError(null);
      setShowRequestModal(true);
    },
    (controllerName) => {
      console.log('[RemoteControl] Control active for:', controllerName || currentUserName);
    },
    () => {
      console.log('[RemoteControl] Control stopped');
    }
  );

  const REMOTE_CONTROL_TOPIC = 'REMOTE_CONTROL_SIGNAL';

  const publishSignal = useCallback(
    async (payload: any, sendOnly: string[] = []) => {
      const pubSub = meetingApi?.pubSub;

      if (!pubSub?.publish) {
        throw new Error('[PubSub] VideoSDK pubSub.publish is not available');
      }

      await pubSub.publish(
        REMOTE_CONTROL_TOPIC,
        JSON.stringify(payload),
        {
          persist: false,
          sendOnly,
        },
        payload
      );
    },
    [meetingApi]
  );

  // ── Shared chat (Supabase realtime) ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Shared forms (Supabase) ──
  const [forms, setForms] = useState<SharedForm[]>([]);
  const [formPolicyType, setFormPolicyType] = useState('Term Insurance');
  const [formSumAssured, setFormSumAssured] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // ── Personal notes (local only) ──
  const [meetingNotes, setMeetingNotes] = useState('My Notes:\n');

  const participantList = [...participants.values()];

  const participantInfo = useMemo(() => {
    const roles: Record<string, PortalRole> = {};
    const userIds: Record<string, string> = {};
    let resolvedCustomerParticipantId: string | null = null;
    let resolvedCustomerUserId: string | null = null;

    participantList.forEach((p: any) => {
      const metadata = p?.metaData || p?.metadata || {};
      const participantId = p.id as string;

      let role = metadata?.role as PortalRole | undefined;
      let userId = metadata?.userId as string | undefined;

      if (participantId === localParticipant?.id || participantId === currentUserId) {
        role = currentUserRole;
        userId = currentUserId;
      }

      if (role) {
        roles[participantId] = role;
      }

      if (userId) {
        userIds[participantId] = userId;
      }

      if (role === 'customer') {
        resolvedCustomerParticipantId = participantId;
        resolvedCustomerUserId = userId || participantId;
      }
    });

    if (currentUserRole === 'customer') {
      const localId = localParticipant?.id || currentUserId;
      roles[localId] = 'customer';
      userIds[localId] = currentUserId;
      resolvedCustomerParticipantId = localId;
      resolvedCustomerUserId = currentUserId;
    }

    return {
      roles,
      userIds,
      customerParticipantId: resolvedCustomerParticipantId,
      customerUserId: resolvedCustomerUserId,
    };
  }, [
    participantList.map((p: any) => p.id).join('|'),
    localParticipant?.id,
    currentUserId,
    currentUserRole,
  ]);

  const participantRoles = participantInfo.roles;

  useEffect(() => {
    if (participantInfo.customerParticipantId) {
      setCustomerParticipantId(participantInfo.customerParticipantId);
    }

    if (participantInfo.customerUserId) {
      setCustomerUserId(participantInfo.customerUserId);
      remoteControl.setCustomerId(participantInfo.customerUserId);
    }
  }, [
    participantInfo.customerParticipantId,
    participantInfo.customerUserId,
  ]);

  const getParticipantIdByUserId = useCallback(
    (userId?: string | null): string | null => {
      if (!userId) return null;

      for (const [participantId, mappedUserId] of Object.entries(participantInfo.userIds)) {
        if (mappedUserId === userId) {
          return participantId;
        }
      }

      const direct = participantList.find((p: any) => p.id === userId);
      return direct?.id || null;
    },
    [participantInfo.userIds, participantList]
  );

  useEffect(() => {
    if (!joined) return;

    const pubSub = meetingApi?.pubSub;
    if (!pubSub?.subscribe || !pubSub?.unsubscribe) {
      console.error('[PubSub] VideoSDK pubSub subscribe API is unavailable');
      return;
    }

    const onRemoteControlMessage = (message: any) => {
      try {
        let payload = message?.payload;

        if (!payload || typeof payload !== 'object') {
          const raw = message?.message;
          if (typeof raw === 'string') {
            payload = JSON.parse(raw);
          }
        }

        if (!payload || typeof payload !== 'object') {
          return;
        }

        void remoteControl.handleSignalingEvent(payload as any);
      } catch (err) {
        console.error('[PubSub] Failed to process remote-control signal:', err);
      }
    };

    let cancelled = false;

    void pubSub
      .subscribe(REMOTE_CONTROL_TOPIC, onRemoteControlMessage)
      .then(() => {
        if (!cancelled) {
          console.log('[PubSub] Subscribed:', REMOTE_CONTROL_TOPIC);
        }
      })
      .catch((err: unknown) => {
        console.error('[PubSub] Subscribe failed:', err);
      });

    return () => {
      cancelled = true;
      void pubSub.unsubscribe(REMOTE_CONTROL_TOPIC, onRemoteControlMessage).catch(() => {});
    };
  }, [joined, meetingApi, remoteControl.handleSignalingEvent]);

  // Presenter view: only rendered when presenterId is non-null.
  const PresenterScreenView: React.FC<{ presenterId: string }> = ({ presenterId }) => {
    const participant = useParticipant(presenterId) as any;
    const screenShareOn = Boolean(participant?.screenShareOn);
    const screenShareStream = participant?.screenShareStream;

    const mediaStream = useMemo(() => {
      const track = screenShareStream?.track;
      if (!screenShareOn || !track) return null;
      return new MediaStream([track]);
    }, [screenShareOn, screenShareStream?.track]);

    return (
      <SharedScreenView
        screenStream={mediaStream}
        isControlActive={
          remoteControl.state.status === 'active' &&
          remoteControl.state.controlAllowed &&
          currentUserRole !== 'customer'
        }
        meetingId={roomId}
        customerId={customerUserId || ''}
        controllerId={remoteControl.state.controllerId || ''}
        onSendEvent={(event) => remoteControl.sendControlEvent(event as any)}
      />
    );
  };

  // Fetch existing chat messages
  const fetchMessages = async () => {
    const { data } = await supabase
      .from('consultation_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
  };

  // Load messages when joined
  useEffect(() => {
    if (joined) {
      fetchMessages().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined]);

  // Send chat message handler (used by the chat form)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage || !inputMessage.trim()) return;

    const payload = {
      room_id: roomId,
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_role: currentUserRole,
      text: inputMessage.trim(),
    } as any;

    try {
      const { data, error } = await supabase
        .from('consultation_messages')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages(prev => [...prev, data as ChatMessage]);
        setInputMessage('');
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch (err) {
      console.error('Send message failed', err);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSumAssured) return;
    setFormSubmitting(true);
    await supabase.from('consultation_forms').insert({
      room_id: roomId,
      policy_type: formPolicyType,
      sum_assured: formSumAssured,
      remarks: formRemarks,
      submitted_by: currentUserName,
    });
    setFormSumAssured('');
    setFormRemarks('');
    setFormSubmitting(false);
  };

  const exportNotes = () => {
    const blob = new Blob([meetingNotes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'my-meeting-notes.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  

  const handleToggleScreenShare = async () => {
    if (currentUserRole !== 'customer') return;

    if (isScreenSharing) {
      try {
        await disableScreenShare?.();
      } catch (err) {
        console.warn('Stop screen share warning:', err);
      }

      setIsScreenSharing(false);
      remoteControl.setScreenShareActive(false);
      return;
    }

    try {
      await enableScreenShare?.();
      setIsScreenSharing(true);
      remoteControl.setScreenShareActive(true);
    } catch (err) {
      console.error('Screen share failed:', err);
    }
  };

  const registerCustomerAgent = async (params: {
    remoteSessionId: string;
    meetingId: string;
    customerId: string;
    token: string;
  }): Promise<void> => {
    let response: Response;

    try {
      response = await fetch('http://127.0.0.1:9876/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
    } catch {
      throw new Error(
        'Remote Assistance Agent is not running on the Customer laptop. Start the Agent and try again.'
      );
    }

    let body: any = null;
    try {
      body = await response.json();
    } catch {}

    if (!response.ok) {
      throw new Error(
        body?.message ||
          body?.error ||
          `Remote Agent registration failed (HTTP ${response.status})`
      );
    }

    if (body?.registered === false) {
      throw new Error(body?.message || 'Remote Agent could not register with relay');
    }
  };

  const handleRequestControl = async () => {
    if (currentUserRole === 'customer') return;

    setRemoteAssistError(null);

    try {
      if (!customerUserId) {
        throw new Error('Customer identity is not available yet');
      }

      const session = await remoteControl.requestControl(currentUserName);

      const customerVideoParticipantId =
        customerParticipantId || getParticipantIdByUserId(customerUserId);

      const payload = {
        type: 'REQUEST_CONTROL',
        meetingId: roomId,
        customerId: customerUserId,
        requesterId: currentUserId,
        requesterName: currentUserName,
        requesterRole: currentUserRole,
        databaseSessionId: session.id,
        remoteSessionId: session.remote_session_id,
        timestamp: Date.now(),
      };

      await publishSignal(
        payload,
        customerVideoParticipantId ? [customerVideoParticipantId] : []
      );

      console.log('[RemoteControl] REQUEST_CONTROL published');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Request control failed';

      setRemoteAssistError(message);
      console.error('Request control failed', err);
    }
  };

  const handleApproveControl = async () => {
    setRemoteAssistError(null);

    try {
      const result = await remoteControl.approveControl(
        remoteControl.state.databaseSessionId || undefined
      );

      if (!result) {
        throw new Error('Approve returned no authorization result');
      }

      const { session, authorization } = result;

      const customerId = session.customer_id || customerUserId || currentUserId;
      const controllerId =
        session.requester_id || remoteControl.state.requesterId || '';
      const controllerRole =
        session.requester_role || remoteControl.state.requesterRole || 'officer';

      if (!controllerId) {
        throw new Error('Approved controller ID is missing');
      }

      await registerCustomerAgent({
        remoteSessionId: authorization.remoteSessionId,
        meetingId: roomId,
        customerId,
        token: authorization.agentToken,
      });

      remoteControl.setAgentRegistered(true);

      const controllerParticipantId = getParticipantIdByUserId(controllerId);

      await publishSignal(
        {
          type: 'CONTROL_GRANTED',
          meetingId: roomId,
          customerId,
          controllerId,
          controllerName: remoteControl.state.requesterName || '',
          controllerRole,
          databaseSessionId: session.id,
          remoteSessionId: authorization.remoteSessionId,
          controllerToken: authorization.controllerToken,
          timestamp: Date.now(),
        },
        controllerParticipantId ? [controllerParticipantId] : []
      );

      setShowRequestModal(false);

      console.log(
        '[RemoteControl] Agent registered; CONTROL_GRANTED sent to approved controller'
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Approve control failed';

      setRemoteAssistError(message);
      console.error('Approve control failed', err);
    }
  };

  const handleRejectControl = async () => {
    setRemoteAssistError(null);

    try {
      const requesterId = remoteControl.state.requesterId;

      await remoteControl.rejectControl(
        remoteControl.state.databaseSessionId || undefined
      );

      const requesterParticipantId = getParticipantIdByUserId(requesterId);

      await publishSignal(
        {
          type: 'CONTROL_REJECTED',
          meetingId: roomId,
          customerId: customerUserId || currentUserId,
          requesterId: requesterId || '',
          databaseSessionId: remoteControl.state.databaseSessionId,
          remoteSessionId: remoteControl.state.remoteSessionId,
          timestamp: Date.now(),
        },
        requesterParticipantId ? [requesterParticipantId] : []
      );

      setShowRequestModal(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Reject control failed';

      setRemoteAssistError(message);
      console.error('Reject control failed', err);
    }
  };

  const publishStoppedSignal = async (
    reason: 'customer_stopped' | 'controller_released' | 'screen_share_stopped'
  ) => {
    const otherUserId =
      currentUserRole === 'customer'
        ? remoteControl.state.controllerId
        : remoteControl.state.customerId;

    const otherParticipantId = getParticipantIdByUserId(otherUserId);

    await publishSignal(
      {
        type: 'CONTROL_STOPPED',
        meetingId: roomId,
        remoteSessionId: remoteControl.state.remoteSessionId,
        databaseSessionId: remoteControl.state.databaseSessionId,
        reason,
        timestamp: Date.now(),
      },
      otherParticipantId ? [otherParticipantId] : []
    );
  };

  const handleCustomerStop = async () => {
    try {
      await remoteControl.stopControl(
        remoteControl.state.databaseSessionId || undefined,
        'customer_stopped'
      );

      await publishStoppedSignal('customer_stopped');
    } catch (err) {
      console.error('Customer stop control failed', err);
    }
  };

  const handleStopControl = handleCustomerStop;

  const handleReleaseControl = async () => {
    try {
      await remoteControl.stopControl(
        remoteControl.state.databaseSessionId || undefined,
        'controller_released'
      );

      await publishStoppedSignal('controller_released');
    } catch (err) {
      console.error('Release control failed', err);
    }
  };

  const roleColor: Record<PortalRole, string> = {
    customer: 'text-blue-400',
    advisor: 'text-emerald-400',
    officer: 'text-purple-400',
    admin: 'text-slate-400',
  };

  // Pre-join screen
  if (!joined) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center mx-auto">
            <Video className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-slate-400 text-sm mt-1">Ready to join the 3-way consultation?</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={onClose}
              className="px-6 py-3 border border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800">
              Cancel
            </button>
            <button
              onClick={() => { setJoining(true); join(); }}
              disabled={joining}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-60"
            >
              {joining ? <Loader className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              {joining ? 'Joining...' : 'Join Now'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = ['chat', 'participants', 'notes', 'forms'] as const;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      {remoteAssistError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[80] max-w-xl w-[calc(100%-2rem)] bg-red-950 border border-red-700 text-red-100 rounded-xl px-4 py-3 shadow-2xl flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold">Remote Assistance Error</p>
            <p className="text-xs text-red-200 mt-1">{remoteAssistError}</p>
          </div>
          <button
            onClick={() => setRemoteAssistError(null)}
            className="text-red-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <RemoteControlBanner
        isActive={remoteControl.state.status === 'active'}
        controllerName={remoteControl.state.controllerName || ''}
        controllerRole={remoteControl.state.controllerRole || 'officer'}
        onStop={handleStopControl}
        isCustomer={currentUserRole === 'customer'}
      />
      <RemoteControlRequestModal
        isOpen={showRequestModal && remoteControl.state.status === 'requested'}
        requesterName={remoteControl.state.requesterName || ''}
        requesterRole={remoteControl.state.requesterRole || 'officer'}
        onAllow={handleApproveControl}
        onReject={handleRejectControl}
      />
      {/* Top Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="bg-blue-950/80 border border-blue-800 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
            🔒 Encrypted 3-Way Consultation
          </span>
          <span className="bg-red-950/80 border border-red-800 text-red-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> LIVE
          </span>
        </div>
        <p className="text-sm font-bold text-slate-200 hidden md:block truncate max-w-xs">{title}</p>
        <button onClick={() => leave()} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video + Controls */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          {/* If any participant is screen-sharing, render the shared screen as the main view */}
          {(() => {
            const presenterId = (meetingApi as any)?.presenterId || (meetingApi as any)?.activePresenterId || null;
            if (presenterId) {
              return (
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                  <div className="flex-1 min-h-0">
                    <PresenterScreenView presenterId={presenterId} />
                  </div>

                  {/* Smaller participant thumbnails below the shared screen */}
                  <div className="grid gap-4 mt-4 grid-cols-3">
                    {participantList.map((p) => (
                      <ParticipantTile
                        key={p.id}
                        participantId={p.id}
                        role={participantRoles[p.id] || 'customer'}
                        isLocal={p.id === localParticipant?.id}
                      />
                    ))}
                  </div>
                </div>
              );
            }

            // No screen share: show participant tiles in grid
            return (
              <div className={`grid gap-4 flex-1 min-h-0 ${
                participantList.length <= 1 ? 'grid-cols-1' :
                participantList.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
              }`}>
                {participantList.map((p) => (
                  <ParticipantTile
                    key={p.id}
                    participantId={p.id}
                    role={participantRoles[p.id] || 'customer'}
                    isLocal={p.id === localParticipant?.id}
                  />
                ))}
                {participantList.length === 0 && (
                  <div className="flex items-center justify-center text-slate-500 text-sm col-span-3">
                    Waiting for others to join...
                  </div>
                )}
              </div>
            );
          })()}

          {/* Controls bar */}
          <div className="h-16 bg-slate-900/90 border border-slate-800 rounded-2xl px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => toggleMic()}
                className={`p-3 rounded-xl ${localMicOn ? 'bg-slate-800' : 'bg-red-600'}`}>
                {localMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button onClick={() => toggleWebcam()}
                className={`p-3 rounded-xl ${localWebcamOn ? 'bg-slate-800' : 'bg-red-600'}`}>
                {localWebcamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <RemoteControlButton
                isSharing={isScreenSharing}
                isCustomer={currentUserRole === 'customer'}
                onToggleShare={handleToggleScreenShare}
              />
            </div>

            {/* Tab switcher in controls */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}>
                  {tab === 'notes' ? '📝 Notes (Private)' : tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
                {(() => {
                  const presenterId = (meetingApi as any)?.presenterId || (meetingApi as any)?.activePresenterId || null;
                  const customerScreenShareActive = presenterId !== null && presenterId === customerParticipantId;
                  return (
                    <RequestControlButton
                      isScreenSharing={customerScreenShareActive}
                      isCustomer={currentUserRole === 'customer'}
                      isControlActive={remoteControl.state.status === 'active'}
                      onRequestControl={handleRequestControl}
                    />
                  );
                })()}
              <ReleaseControlButton
                isControlActive={remoteControl.state.status === 'active'}
                isCustomer={currentUserRole === 'customer'}
                onReleaseControl={handleReleaseControl}
              />
              <button onClick={() => leave()}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-2">
                <PhoneOff className="w-4 h-4" /> Leave
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
          {/* Tab headers */}
          <div className="grid grid-cols-4 border-b border-slate-800 text-[10px] font-semibold text-slate-400">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`py-3 flex items-center justify-center border-b-2 transition-all capitalize ${
                  activeTab === tab ? 'border-blue-500 text-blue-400 bg-slate-800/50' : 'border-transparent hover:text-slate-200'
                }`}>
                {tab === 'notes' ? '📝' : tab === 'chat' ? '💬' : tab === 'forms' ? '📋' : '👥'}
                <span className="ml-1 hidden sm:inline">{tab}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden p-4">

            {/* ── CHAT (shared via Supabase) ── */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <p className="text-[10px] text-slate-500 mb-2 font-semibold uppercase tracking-wider">
                  Shared with all participants
                </p>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {messages.length === 0 && (
                    <p className="text-xs text-slate-500 text-center mt-6">No messages yet.</p>
                  )}
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                      <div key={msg.id}
                        className={`p-3 rounded-xl text-xs space-y-0.5 max-w-[90%] ${
                          isMe
                            ? 'bg-blue-600 text-white ml-auto'
                            : 'bg-slate-950 border border-slate-800 text-slate-200'
                        }`}>
                        <div className="flex justify-between items-center gap-2">
                          <span className={`font-bold text-[10px] ${isMe ? 'text-blue-100' : roleColor[msg.sender_role as PortalRole] || 'text-slate-400'}`}>
                            {msg.sender_name}
                          </span>
                          <span className="text-[9px] opacity-60">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{msg.text}</p>
                        {msg.attachment_url && (
                          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline text-[10px] flex items-center gap-1">
                            <Paperclip className="w-3 h-3" /> {msg.attachment_name || 'Attachment'}
                          </a>
                        )}
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <label className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer">
                    <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          await uploadAttachment(file, roomId, currentUserId, currentUserName, currentUserRole);
                        } catch (err) { console.error('Upload failed:', err); }
                      }
                    }} />
                    <Paperclip className="w-4 h-4" />
                  </label>
                  <button type="submit" className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* ── PARTICIPANTS ── */}
            {activeTab === 'participants' && (
              <div className="flex-1 overflow-y-auto space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Active ({participantList.length})
                </p>
                {participantList.map((p) => {
                  const role = participantRoles[p.id] || 'customer';
                  const roleColors: Record<PortalRole, string> = {
                    customer: 'border-blue-500 text-blue-400',
                    advisor: 'border-emerald-500 text-emerald-400',
                    officer: 'border-purple-500 text-purple-400',
                    admin: 'border-slate-500 text-slate-400',
                  };
                  const [borderColor, textColor] = roleColors[role].split(' ');
                  return (
                    <div key={p.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full border-2 ${borderColor} flex items-center justify-center font-bold text-sm text-white bg-slate-800`}>
                          {p.displayName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{p.displayName}</p>
                          <p className={`text-[10px] ${textColor}`}>
                            {ROLE_META[role].label}
                          </p>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  );
                })}
                {participantList.length === 0 && (
                  <p className="text-xs text-slate-500 text-center mt-4">Waiting for participants...</p>
                )}
              </div>
            )}

            {/* ── NOTES (personal/local only) ── */}
            {activeTab === 'notes' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <p className="text-[10px] text-slate-500 mb-2 font-semibold uppercase tracking-wider">
                  Private — only visible to you
                </p>
                <textarea
                  value={meetingNotes}
                  onChange={e => setMeetingNotes(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono resize-none focus:outline-none focus:border-blue-500"
                  placeholder="Take personal notes here..."
                />
                <button onClick={exportNotes}
                  className="mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Export My Notes
                </button>
              </div>
            )}

            {/* ── FORMS (shared via Supabase) ── */}
            {activeTab === 'forms' && (
              <div className="flex-1 flex flex-col overflow-hidden gap-3">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Shared with all participants
                </p>

                {/* Submitted forms list */}
                <div className="flex-1 overflow-y-auto space-y-2">
                  {forms.length === 0 && (
                    <p className="text-xs text-slate-500 text-center mt-4">No forms submitted yet.</p>
                  )}
                  {forms.map(f => (
                    <div key={f.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-blue-300">{f.policy_type}</span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300">Sum Assured: <strong>₹{Number(f.sum_assured).toLocaleString('en-IN')}</strong></p>
                      {f.remarks && <p className="text-slate-400 italic">{f.remarks}</p>}
                      <p className="text-[10px] text-emerald-400">Submitted by {f.submitted_by}</p>
                    </div>
                  ))}
                </div>

                {/* Submit new form */}
                <form onSubmit={handleSubmitForm} className="space-y-2 border-t border-slate-800 pt-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Submit Proposal Form</p>
                  <select
                    value={formPolicyType}
                    onChange={e => setFormPolicyType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                  >
                    <option>Term Insurance</option>
                    <option>Health Insurance</option>
                    <option>ULIP</option>
                    <option>Savings Plan</option>
                    <option>Critical Illness</option>
                  </select>
                  <input
                    type="number"
                    required
                    value={formSumAssured}
                    onChange={e => setFormSumAssured(e.target.value)}
                    placeholder="Sum Assured (₹)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                  />
                  <textarea
                    rows={2}
                    value={formRemarks}
                    onChange={e => setFormRemarks(e.target.value)}
                    placeholder="Remarks (optional)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs resize-none"
                  />
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {formSubmitting ? 'Submitting...' : 'Submit to All'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Public Export ────────────────────────────────────────────────────────────
interface VideoConsultationRoomProps {
  roomId?: string;
  title?: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: PortalRole;
  onClose?: () => void;
}

export const VideoConsultationRoom: React.FC<VideoConsultationRoomProps> = ({
  roomId,
  title = 'Video Consultation',
  currentUserId = '',
  currentUserName = 'User',
  currentUserRole = 'customer',
  onClose = () => {},
}) => {
  if (!roomId) return null;

  return (
    <MeetingProvider
      config={{
        meetingId: roomId,
        micEnabled: true,
        webcamEnabled: true,
        name: currentUserName,
        participantId: currentUserId || undefined,
        // Include participant metadata so other participants can map roles/userIds reliably
        metadata: { userId: currentUserId, role: currentUserRole, name: currentUserName },
        metaData: { userId: currentUserId, role: currentUserRole, name: currentUserName },
        debugMode: false,
      }}
      token={VIDEOSDK_TOKEN}
    >
      <MeetingRoom
        roomId={roomId}
        title={title}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
        onClose={onClose}
      />
    </MeetingProvider>
  );
};