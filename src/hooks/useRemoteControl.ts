import { useState, useCallback, useEffect, useRef } from 'react';
import {
  RemoteControlState,
  RemoteControlEvent,
  ControllerRole,
} from '../types/remoteControl';
import { RemoteControlService } from '../services/remoteControlService';
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

type SignalingEvent = RemoteControlEvent & {
  requesterName?: string;
  controllerName?: string;
  controllerToken?: string;
  remoteSessionId?: string;
  reason?: string;
};

export function useRemoteControl(
  meetingId: string,
  currentUserId: string,
  currentUserRole: 'customer' | 'officer' | 'adviser',
  onRequestReceived?: (
    requesterName: string,
    requesterRole: ControllerRole
  ) => void,
  onControlGranted?: (
    controllerName: string,
    controllerRole: ControllerRole
  ) => void,
  onControlStopped?: () => void
) {
  const [state, setState] =
    useState<RemoteControlState>(initialState);

  const socketRef =
    useRef<RemoteControlSocket | null>(null);

  const initRef = useRef(false);

  /**
   * Keep latest state available inside WebSocket callbacks.
   * This avoids stale React closure values.
   */
  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * ------------------------------------------------------------
   * RELAY SOCKET INITIALIZATION
   * ------------------------------------------------------------
   *
   * The Render relay is ONLY used for:
   *
   * CONTROLLER_REGISTER
   * CONTROL_EVENT
   * CONTROL_STOP
   *
   * REQUEST_CONTROL / CONTROL_GRANTED / CONTROL_REJECTED /
   * CONTROL_STOPPED should come from VideoSDK PubSub and be passed
   * to handleSignalingEvent().
   */
  useEffect(() => {
    if (initRef.current) return;

    initRef.current = true;

    try {
      const socket = RemoteControlSocket.getInstance();

      socketRef.current = socket;

      /**
       * Render has accepted controller registration.
       *
       * Important:
       * The current Render implementation may only return:
       *
       * {
       *   type: "CONTROLLER_REGISTERED",
       *   remoteSessionId
       * }
       *
       * Therefore do NOT require event.controllerId here.
       */
      socket.on(
        'CONTROLLER_REGISTERED',
        (event: RemoteControlEvent) => {
          if (currentUserRole === 'customer') return;

          const currentSessionId =
            stateRef.current.remoteSessionId;

          if (
            event.remoteSessionId &&
            currentSessionId &&
            event.remoteSessionId !== currentSessionId
          ) {
            return;
          }

          setState((prev) => ({
            ...prev,
            status: 'active',
            controlAllowed: true,
            controllerId: currentUserId,
            controllerRole:
              currentUserRole as ControllerRole,
          }));

          onControlGranted?.(
            stateRef.current.controllerName || '',
            currentUserRole as ControllerRole
          );

          console.log(
            '[RemoteControl] Controller registered with relay'
          );
        }
      );

      /**
       * Render rejected controller/control request.
       */
      socket.on(
        'CONTROL_DENIED',
        (event: RemoteControlEvent) => {
          if (currentUserRole === 'customer') return;

          const currentSessionId =
            stateRef.current.remoteSessionId;

          if (
            event.remoteSessionId &&
            currentSessionId &&
            event.remoteSessionId !== currentSessionId
          ) {
            return;
          }

          console.warn(
            '[RemoteControl] Control denied by relay'
          );

          setState((prev) => ({
            ...prev,
            status: 'rejected',
            controlAllowed: false,
          }));

          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              status: 'idle',
            }));
          }, 2000);
        }
      );

      /**
       * Invalid controller token.
       */
      socket.on('INVALID_TOKEN', () => {
        console.error(
          '[RemoteControl] Relay rejected token'
        );

        setState((prev) => ({
          ...prev,
          status: 'ended',
          controlAllowed: false,
        }));
      });

      /**
       * Remote session expired.
       */
      socket.on('SESSION_EXPIRED', () => {
        console.warn(
          '[RemoteControl] Remote session expired'
        );

        setState((prev) => ({
          ...prev,
          status: 'ended',
          controlAllowed: false,
          controllerId: null,
          controllerName: null,
          controllerRole: null,
        }));

        onControlStopped?.();

        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            status: 'idle',
          }));
        }, 1000);
      });

      /**
       * Relay tells us remote control stopped.
       */
      socket.on(
        'CONTROL_STOPPED',
        (event: RemoteControlEvent) => {
          const currentSessionId =
            stateRef.current.remoteSessionId;

          if (
            event.remoteSessionId &&
            currentSessionId &&
            event.remoteSessionId !== currentSessionId
          ) {
            return;
          }

          console.log(
            '[RemoteControl] Control stopped by relay'
          );

          setState((prev) => ({
            ...prev,
            status: 'ended',
            controlAllowed: false,
            controllerId: null,
            controllerName: null,
            controllerRole: null,
          }));

          onControlStopped?.();

          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              status: 'idle',
            }));
          }, 1000);
        }
      );

      socket.connect().catch(() => {
        console.log(
          '[RemoteControl] Could not connect to relay'
        );
      });
    } catch (err) {
      console.warn(
        '[RemoteControl] Relay not configured:',
        (err as Error).message
      );
    }

    // Socket is a shared singleton.
    // Do not disconnect it here on ordinary component rerenders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ------------------------------------------------------------
   * VIDEOSDK PUBSUB SIGNALING EVENTS
   * ------------------------------------------------------------
   *
   * VideoConsultationRoom should subscribe to:
   *
   * REMOTE_CONTROL_SIGNAL
   *
   * and feed incoming messages here.
   */
  const handleSignalingEvent = useCallback(
    (event: SignalingEvent) => {
      try {
        /**
         * Officer/Adviser asks Customer for permission.
         */
        if (event.type === 'REQUEST_CONTROL') {
          if (currentUserRole !== 'customer') return;

          setState((prev) => ({
            ...prev,
            status: 'requested',
            requesterId: event.requesterId || null,
            requesterName:
              event.requesterName || null,
            requesterRole:
              event.requesterRole || null,
            remoteSessionId:
              event.remoteSessionId || null,
          }));

          onRequestReceived?.(
            event.requesterName || '',
            event.requesterRole || 'officer'
          );

          return;
        }

        /**
         * Customer approved the request.
         *
         * Do NOT set active here.
         *
         * Officer/Adviser still needs to register with Render.
         * Active state is set only after CONTROLLER_REGISTERED.
         */
        if (event.type === 'CONTROL_GRANTED') {
          if (currentUserRole === 'customer') return;

          if (
            event.controllerId &&
            event.controllerId !== currentUserId
          ) {
            return;
          }

          setState((prev) => ({
            ...prev,
            status: 'requested',
            controllerId:
              event.controllerId || currentUserId,
            controllerName:
              event.controllerName ||
              prev.controllerName,
            controllerRole:
              event.controllerRole ||
              (currentUserRole as ControllerRole),
            remoteSessionId:
              event.remoteSessionId ||
              prev.remoteSessionId,
            controlAllowed: false,
          }));

          console.log(
            '[RemoteControl] Control granted; waiting for relay registration'
          );

          return;
        }

        /**
         * Customer rejected control request.
         */
        if (event.type === 'CONTROL_REJECTED') {
          if (currentUserRole === 'customer') return;

          if (
            event.requesterId &&
            event.requesterId !== currentUserId
          ) {
            return;
          }

          setState((prev) => ({
            ...prev,
            status: 'rejected',
            controlAllowed: false,
          }));

          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              status: 'idle',
            }));
          }, 2000);

          return;
        }

        /**
         * Meeting-level notification that control stopped.
         */
        if (event.type === 'CONTROL_STOPPED') {
          setState((prev) => ({
            ...prev,
            status: 'ended',
            controlAllowed: false,
            controllerId: null,
            controllerName: null,
            controllerRole: null,
          }));

          onControlStopped?.();

          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              status: 'idle',
            }));
          }, 1000);
        }
      } catch (err) {
        console.error(
          '[RemoteControl] handleSignalingEvent failed:',
          err
        );
      }
    },
    [
      currentUserId,
      currentUserRole,
      onRequestReceived,
      onControlStopped,
    ]
  );

  /**
   * ------------------------------------------------------------
   * REQUEST CONTROL
   * ------------------------------------------------------------
   *
   * Officer / Adviser creates the DB request.
   *
   * The caller must then publish REQUEST_CONTROL using
   * VideoSDK PubSub.
   */
  const requestControl = useCallback(
    async (requesterName: string) => {
      if (currentUserRole === 'customer') {
        return;
      }

      const { customerId } = stateRef.current;

      if (!customerId) {
        throw new Error(
          'Customer ID is not available'
        );
      }

      try {
        setState((prev) => ({
          ...prev,
          status: 'requesting',
        }));

        const session =
          await RemoteControlService.createControlRequest(
            meetingId,
            customerId,
            currentUserId,
            currentUserRole as ControllerRole
          );

        setState((prev) => ({
          ...prev,
          status: 'requested',
          requesterId: currentUserId,
          requesterName,
          requesterRole:
            currentUserRole as ControllerRole,
          /**
           * This may initially be the DB request/session row ID.
           * Customer approval can later replace it with the final
           * remote_session_id.
           */
          remoteSessionId: session.id,
        }));

        return session;
      } catch (err) {
        console.error(
          '[RemoteControl] Request failed:',
          err
        );

        setState((prev) => ({
          ...prev,
          status: 'idle',
        }));

        throw err;
      }
    },
    [
      meetingId,
      currentUserId,
      currentUserRole,
    ]
  );

  /**
   * ------------------------------------------------------------
   * APPROVE CONTROL
   * ------------------------------------------------------------
   *
   * THIS was the corrupted section in your uploaded file.
   *
   * Customer approves the request in the database.
   *
   * Caller should then publish CONTROL_GRANTED using VideoSDK
   * PubSub and provide the controller with its short-lived token.
   */
  const approveControl = useCallback(
    async (sessionId: string) => {
      if (currentUserRole !== 'customer') {
        return;
      }

      const {
        requesterId,
        requesterName,
        requesterRole,
      } = stateRef.current;

      if (!requesterId) {
        throw new Error(
          'No requester is available to approve'
        );
      }

      try {
        const session =
          await RemoteControlService.approveControlRequest(
            sessionId,
            requesterId
          );

        /**
         * Customer has approved.
         *
         * We keep controlAllowed false until the controller
         * successfully registers with the relay.
         *
         * UI/PubSub can use this returned session to publish
         * CONTROL_GRANTED.
         */
        setState((prev) => ({
          ...prev,
          status: 'requested',
          controllerId: requesterId,
          controllerName: requesterName,
          controllerRole: requesterRole,
          controlAllowed: false,
          remoteSessionId:
            session.remote_session_id ||
            prev.remoteSessionId,
        }));

        console.log(
          '[RemoteControl] Customer approved control request'
        );

        return session;
      } catch (err) {
        console.error(
          '[RemoteControl] Approval failed:',
          err
        );

        throw err;
      }
    },
    [currentUserRole]
  );

  /**
   * ------------------------------------------------------------
   * REJECT CONTROL
   * ------------------------------------------------------------
   */
  const rejectControl = useCallback(
    async (sessionId: string) => {
      if (currentUserRole !== 'customer') {
        return false;
      }

      try {
        await RemoteControlService.rejectControlRequest(
          sessionId
        );

        setState((prev) => ({
          ...prev,
          status: 'rejected',
          controlAllowed: false,
        }));

        /**
         * Caller should publish CONTROL_REJECTED through
         * VideoSDK PubSub.
         */
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            status: 'idle',
            requesterId: null,
            requesterName: null,
            requesterRole: null,
          }));
        }, 2000);

        return true;
      } catch (err) {
        console.error(
          '[RemoteControl] Rejection failed:',
          err
        );

        return false;
      }
    },
    [currentUserRole]
  );

  /**
   * ------------------------------------------------------------
   * STOP / RELEASE CONTROL
   * ------------------------------------------------------------
   *
   * Can be called by:
   *
   * Customer -> STOP CONTROL
   * Officer/Adviser -> RELEASE CONTROL
   */
  const stopControl = useCallback(
    async (
      sessionId: string,
      reason: string = 'stopped'
    ) => {
      try {
        /**
         * Update persisted DB session where possible.
         */
        if (sessionId) {
          await RemoteControlService.stopControl(
            sessionId
          ).catch(() => {
            // We still stop relay/UI state even if DB update fails.
          });
        }

        /**
         * Notify Render relay.
         */
        const relaySessionId =
          stateRef.current.remoteSessionId;

        const socket = socketRef.current;

        if (
          relaySessionId &&
          socket?.isConnected()
        ) {
          socket.send({
            type: 'CONTROL_STOP',
            remoteSessionId: relaySessionId,
            reason,
          } as any);
        }

        setState((prev) => ({
          ...prev,
          status: 'ended',
          controlAllowed: false,
          controllerId: null,
          controllerName: null,
          controllerRole: null,
        }));

        onControlStopped?.();

        /**
         * Caller should also publish CONTROL_STOPPED using
         * VideoSDK PubSub so all participants update their UI.
         */
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            status: 'idle',
          }));
        }, 1000);
      } catch (err) {
        console.error(
          '[RemoteControl] Stop failed:',
          err
        );
      }
    },
    [onControlStopped]
  );

  /**
   * ------------------------------------------------------------
   * REGISTER OFFICER / ADVISER WITH RENDER RELAY
   * ------------------------------------------------------------
   *
   * Called after CONTROL_GRANTED is received through VideoSDK
   * PubSub and the controller has its short-lived token.
   */
  const registerControllerWithRelay =
    useCallback(
      async (
        remoteSessionId: string,
        controllerToken: string,
        controllerId: string,
        controllerRole: ControllerRole
      ) => {
        const socket = socketRef.current;

        if (!socket) {
          throw new Error(
            'Remote-control relay socket is unavailable'
          );
        }

        if (!socket.isConnected()) {
          await socket.connect();
        }

        const message = {
          type: 'CONTROLLER_REGISTER',
          remoteSessionId,
          meetingId,
          controllerId,
          controllerRole,
          token: controllerToken,
        };

        /**
         * Store pending session locally BEFORE sending.
         *
         * CONTROLLER_REGISTERED may only return
         * remoteSessionId.
         */
        setState((prev) => ({
          ...prev,
          status: 'requested',
          remoteSessionId,
          controllerId,
          controllerRole,
          controlAllowed: false,
        }));

        socket.send(message as any);

        console.log(
          '[RemoteControl] Controller registration sent'
        );

        /**
         * Do not set active here.
         *
         * socket.on("CONTROLLER_REGISTERED") does that.
         */
      },
      [meetingId]
    );

  /**
   * ------------------------------------------------------------
   * SEND MOUSE / KEYBOARD EVENT
   * ------------------------------------------------------------
   *
   * Render expects:
   *
   * {
   *   type: "CONTROL_EVENT",
   *   remoteSessionId,
   *   event: {...}
   * }
   */
  const sendControlEvent = useCallback(
    (inputEvent: RemoteControlEvent) => {
      const remoteSessionId =
        stateRef.current.remoteSessionId;

      if (!remoteSessionId) {
        return;
      }

      /**
       * Only the active controller should send input.
       */
      if (
        !stateRef.current.controlAllowed ||
        stateRef.current.status !== 'active'
      ) {
        return;
      }

      const socket = socketRef.current;

      if (!socket?.isConnected()) {
        console.warn(
          '[RemoteControl] Cannot send input: relay not connected'
        );

        return;
      }

      socket.send({
        type: 'CONTROL_EVENT',
        remoteSessionId,
        event: inputEvent,
      } as any);
    },
    []
  );

  /**
   * ------------------------------------------------------------
   * SET REAL CUSTOMER USER ID
   * ------------------------------------------------------------
   */
  const setCustomerId = useCallback(
    (customerId: string) => {
      if (!customerId) return;

      setState((prev) => {
        if (prev.customerId === customerId) {
          return prev;
        }

        return {
          ...prev,
          customerId,
        };
      });
    },
    []
  );

  /**
   * ------------------------------------------------------------
   * SCREEN SHARE STATE
   * ------------------------------------------------------------
   *
   * If Customer stops screen sharing while remote control is
   * active, immediately stop relay control as well.
   */
  const setScreenShareActive = useCallback(
    (active: boolean) => {
      const previousState = stateRef.current;

      setState((prev) => ({
        ...prev,
        screenShareActive: active,
      }));

      if (
        active ||
        !previousState.controlAllowed
      ) {
        return;
      }

      const remoteSessionId =
        previousState.remoteSessionId;

      const socket = socketRef.current;

      if (
        remoteSessionId &&
        socket?.isConnected()
      ) {
        socket.send({
          type: 'CONTROL_STOP',
          remoteSessionId,
          reason: 'screen_share_stopped',
        } as any);
      }

      setState((prev) => ({
        ...prev,
        screenShareActive: false,
        controlAllowed: false,
        status: 'ended',
        controllerId: null,
        controllerName: null,
        controllerRole: null,
      }));

      onControlStopped?.();
    },
    [onControlStopped]
  );

  return {
    state,

    requestControl,
    approveControl,
    rejectControl,
    stopControl,

    registerControllerWithRelay,
    sendControlEvent,

    setCustomerId,
    setScreenShareActive,

    handleSignalingEvent,
  };
}