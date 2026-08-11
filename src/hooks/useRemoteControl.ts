import { useState, useCallback, useEffect, useRef } from 'react';
import { RemoteControlState, RemoteControlEvent, ControllerRole } from '../types/remoteControl';
import { RemoteControlService } from '../services/remoteControlService';
import { RemoteControlProtocol } from '../services/remoteControlProtocol';
import { RemoteControlSocket } from '../services/remoteControlSocket';

const initialState: RemoteControlState = {
  status: 'idle',
  customerId: null,
  requesterId: null,
  requesterName: null,
  requesterRole: null,
  controllerId: null,
  controllerName: null,
  controllerRole: null,
  controlAllowed: false,
  remoteSessionId: null,
  screenShareActive: false,
};

export function useRemoteControl(
  meetingId: string,
  currentUserId: string,
  currentUserRole: 'customer' | 'officer' | 'adviser',
  onRequestReceived?: (requesterName: string, requesterRole: ControllerRole) => void,
  onControlGranted?: (controllerName: string, controllerRole: ControllerRole) => void,
  onControlStopped?: () => void
) {
  const [state, setState] = useState<RemoteControlState>(initialState);
  const socketRef = useRef<RemoteControlSocket | null>(null);
  const pubsubRef = useRef<any>(null);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = new RemoteControlSocket();
    socketRef.current.connect().catch(() => {
      console.log('[RemoteControl] Agent not available');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Request control (Officer/Adviser only)
  const requestControl = useCallback(
    async (requesterName: string) => {
      if (currentUserRole === 'customer') return;

      try {
        setState(prev => ({ ...prev, status: 'requesting' }));

        const session = await RemoteControlService.createControlRequest(
          meetingId,
          state.customerId || '',
          currentUserId,
          currentUserRole as ControllerRole
        );

        setState(prev => ({
          ...prev,
          status: 'requested',
          requesterId: currentUserId,
          requesterName,
          requesterRole: currentUserRole as ControllerRole,
          remoteSessionId: session.remote_session_id,
        }));

        // Send via PubSub
        if (pubsubRef.current) {
          const event = RemoteControlProtocol.createRequestControlEvent(
            meetingId,
            state.customerId || '',
            currentUserId,
            currentUserRole as ControllerRole,
            requesterName
          );
          pubsubRef.current.publish({
            topic: `remote-control-${meetingId}`,
            message: JSON.stringify(event),
          });
        }
      } catch (err) {
        console.error('[RemoteControl] Request failed:', err);
        setState(prev => ({ ...prev, status: 'idle' }));
      }
    },
    [meetingId, currentUserId, currentUserRole, state.customerId]
  );

  // Approve control (Customer only)
  const approveControl = useCallback(
    async (sessionId: string) => {
      if (currentUserRole !== 'customer') return;

      try {
        const session = await RemoteControlService.approveControlRequest(
          sessionId,
          state.requesterId || ''
        );

        setState(prev => ({
          ...prev,
          status: 'approved',
          controllerId: state.requesterId,
          controllerName: state.requesterName,
          controllerRole: state.requesterRole,
          controlAllowed: true,
          remoteSessionId: session.remote_session_id,
        }));

        // Send via PubSub
        if (pubsubRef.current) {
          const event = RemoteControlProtocol.createControlGrantedEvent(
            meetingId,
            currentUserId,
            state.requesterId || '',
            state.requesterRole || 'officer',
            session.remote_session_id
          );
          pubsubRef.current.publish({
            topic: `remote-control-${meetingId}`,
            message: JSON.stringify(event),
          });
        }

        onControlGranted?.(state.requesterName || '', state.requesterRole || 'officer');
      } catch (err) {
        console.error('[RemoteControl] Approval failed:', err);
      }
    },
    [meetingId, currentUserId, currentUserRole, state, onControlGranted]
  );

  // Reject control (Customer only)
  const rejectControl = useCallback(
    async (sessionId: string) => {
      if (currentUserRole !== 'customer') return;

      try {
        await RemoteControlService.rejectControlRequest(sessionId);

        setState(prev => ({
          ...prev,
          status: 'rejected',
          controlAllowed: false,
        }));

        // Send via PubSub
        if (pubsubRef.current) {
          const event = RemoteControlProtocol.createControlRejectedEvent(
            meetingId,
            currentUserId,
            state.requesterId || ''
          );
          pubsubRef.current.publish({
            topic: `remote-control-${meetingId}`,
            message: JSON.stringify(event),
          });
        }

        // Reset after 2 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, status: 'idle', requesterId: null, requesterName: null }));
        }, 2000);
      } catch (err) {
        console.error('[RemoteControl] Rejection failed:', err);
      }
    },
    [meetingId, currentUserId, currentUserRole, state]
  );

  // Stop control
  const stopControl = useCallback(
    async (sessionId: string) => {
      try {
        await RemoteControlService.stopControl(sessionId);

        setState(prev => ({
          ...prev,
          status: 'ended',
          controlAllowed: false,
          controllerId: null,
          controllerName: null,
          controllerRole: null,
        }));

        // Send via PubSub
        if (pubsubRef.current) {
          const event = RemoteControlProtocol.createControlStoppedEvent(
            meetingId,
            state.customerId || '',
            state.controllerId || ''
          );
          pubsubRef.current.publish({
            topic: `remote-control-${meetingId}`,
            message: JSON.stringify(event),
          });
        }

        onControlStopped?.();

        // Reset after 1 second
        setTimeout(() => {
          setState(prev => ({ ...prev, status: 'idle' }));
        }, 1000);
      } catch (err) {
        console.error('[RemoteControl] Stop failed:', err);
      }
    },
    [meetingId, state, onControlStopped]
  );

  // Send control event via socket
  const sendControlEvent = useCallback(
    (event: RemoteControlEvent) => {
      if (socketRef.current?.isConnected()) {
        socketRef.current.send(event);
      }
    },
    []
  );

  // Set customer ID (called when customer joins)
  const setCustomerId = useCallback((customerId: string) => {
    setState(prev => ({ ...prev, customerId }));
  }, []);

  // Set screen share state
  const setScreenShareActive = useCallback((active: boolean) => {
    setState(prev => ({ ...prev, screenShareActive: active }));
    if (!active && state.controlAllowed) {
      // Auto-stop control when screen sharing stops
      setState(prev => ({
        ...prev,
        controlAllowed: false,
        status: 'ended',
      }));
    }
  }, [state.controlAllowed]);

  // Set PubSub reference (called from VideoConsultationRoom)
  const setPubSub = useCallback((pubsub: any) => {
    pubsubRef.current = pubsub;
  }, []);

  return {
    state,
    requestControl,
    approveControl,
    rejectControl,
    stopControl,
    sendControlEvent,
    setCustomerId,
    setScreenShareActive,
    setPubSub,
    socket: socketRef.current,
  };
}
