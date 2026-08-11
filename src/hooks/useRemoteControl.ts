import {
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import type {
  RemoteControlState,
  RemoteControlEvent,
  ControllerRole,
  RemoteControlSession,
  RemoteControlAuthorization,
  ControlStopRelayMessage,
  ControlEventRelayMessage,
  ControllerRegisterRelayMessage,
} from '../types/remoteControl';

import {
  RemoteControlService,
} from '../services/remoteControlService';

import {
  RemoteControlSocket,
} from '../services/remoteControlSocket';

/**
 * ------------------------------------------------------------
 * INITIAL STATE
 * ------------------------------------------------------------
 */
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

  /**
   * Render relay remote_session_id.
   */
  remoteSessionId: null,

  /**
   * Supabase remote_control_sessions.id.
   */
  databaseSessionId: null,

  screenShareActive: false,

  agentRegistered: false,
  controllerRegistered: false,
};

/**
 * Meeting signaling payload.
 *
 * This is passed from VideoConsultationRoom after receiving
 * VideoSDK onData signaling messages.
 */
export type RemoteControlSignalingEvent =
  RemoteControlEvent & {
    /**
     * Supabase DB row ID.
     *
     * Customer needs this when clicking Accept / Reject.
     */
    databaseSessionId?: string;

    requesterName?: string;

    controllerName?: string;

    controllerToken?: string;

    agentToken?: string;

    reason?: string;
  };

/**
 * Result returned after Customer approves a request.
 *
 * VideoConsultationRoom will use:
 *
 * session
 * authorization.agentToken
 * authorization.controllerToken
 */
export interface ApproveControlResult {
  session: RemoteControlSession;

  authorization:
    RemoteControlAuthorization;
}

export function useRemoteControl(
  meetingId: string,

  currentUserId: string,

  currentUserRole:
    | 'customer'
    | 'officer'
    | 'advisor',

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
    useState<RemoteControlState>(
      initialState
    );

  /**
   * Always keep latest state accessible inside
   * WebSocket callbacks.
   */
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /**
   * Shared singleton Render relay connection.
   */
  const socketRef =
    useRef<RemoteControlSocket | null>(
      null
    );

  /**
   * Prevent duplicate initialization.
   */
  const initializedRef =
    useRef(false);

  /**
   * ------------------------------------------------------------
   * RESET ACTIVE CONTROL STATE
   * ------------------------------------------------------------
   */
  const resetActiveControl =
    useCallback(() => {
      setState((prev) => ({
        ...prev,

        status: 'idle',

        controllerId: null,
        controllerName: null,
        controllerRole: null,

        controlAllowed: false,

        controllerRegistered: false,
        agentRegistered: false,

        requesterId: null,
        requesterName: null,
        requesterRole: null,

        /**
         * Keep customer ID because meeting remains active.
         */
        customerId: prev.customerId,

        remoteSessionId: null,
        databaseSessionId: null,
      }));
    }, []);

  /**
   * ------------------------------------------------------------
   * RENDER RELAY INITIALIZATION
   * ------------------------------------------------------------
   */
  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    let socket:
      | RemoteControlSocket
      | null = null;

    /**
     * ----------------------------------------------------------
     * CONTROLLER_REGISTERED
     * ----------------------------------------------------------
     *
     * Render sends this ONLY after:
     *
     * Agent registered
     * Controller registered
     * controlAllowed = true
     */
    const handleControllerRegistered = (
      event: RemoteControlEvent
    ) => {
      if (
        currentUserRole ===
        'customer'
      ) {
        return;
      }

      const expectedSession =
        stateRef.current
          .remoteSessionId;

      if (
        expectedSession &&
        event.remoteSessionId &&
        expectedSession !==
          event.remoteSessionId
      ) {
        return;
      }

      console.log(
        '[RemoteControl] Controller registered and control active'
      );

      setState((prev) => ({
        ...prev,

        status: 'active',

        controlAllowed: true,

        controllerRegistered: true,

        controllerId:
          prev.controllerId ||
          currentUserId,

        controllerRole:
          prev.controllerRole ||
          (currentUserRole as ControllerRole),
      }));

      /**
       * Update Supabase session to ACTIVE.
       *
       * Do not block UI if this DB update fails.
       */
      const databaseSessionId =
        stateRef.current
          .databaseSessionId;

      if (databaseSessionId) {
        void RemoteControlService
          .startControl(
            databaseSessionId
          )
          .catch((err) => {
            console.warn(
              '[RemoteControl] Could not mark Supabase session active:',
              err
            );
          });
      }

      onControlGranted?.(
        stateRef.current
          .controllerName || '',
        (stateRef.current
          .controllerRole ||
          currentUserRole) as ControllerRole
      );
    };

    /**
     * ----------------------------------------------------------
     * CONTROL_DENIED
     * ----------------------------------------------------------
     */
    const handleControlDenied = (
      event: RemoteControlEvent
    ) => {
      console.warn(
        '[RemoteControl] Relay denied control:',
        event.reason ||
          'Unknown reason'
      );

      setState((prev) => ({
        ...prev,

        status: 'error',

        controlAllowed: false,

        controllerRegistered: false,
      }));
    };

    /**
     * ----------------------------------------------------------
     * INVALID_TOKEN
     * ----------------------------------------------------------
     */
    const handleInvalidToken = (
      event: RemoteControlEvent
    ) => {
      console.error(
        '[RemoteControl] Relay rejected authorization token:',
        event.reason ||
          'Invalid token'
      );

      setState((prev) => ({
        ...prev,

        status: 'error',

        controlAllowed: false,

        controllerRegistered: false,
      }));
    };

    /**
     * ----------------------------------------------------------
     * SESSION_EXPIRED
     * ----------------------------------------------------------
     */
    const handleSessionExpired = (
      event: RemoteControlEvent
    ) => {
      console.warn(
        '[RemoteControl] Relay session expired:',
        event.remoteSessionId
      );

      setState((prev) => ({
        ...prev,

        status: 'ended',

        controlAllowed: false,

        controllerRegistered: false,
        agentRegistered: false,

        controllerId: null,
        controllerName: null,
        controllerRole: null,
      }));

      onControlStopped?.();

      window.setTimeout(
        resetActiveControl,
        800
      );
    };

    /**
     * ----------------------------------------------------------
     * CONTROL_STOPPED
     * ----------------------------------------------------------
     */
    const handleControlStopped = (
      event: RemoteControlEvent
    ) => {
      const expectedSession =
        stateRef.current
          .remoteSessionId;

      if (
        expectedSession &&
        event.remoteSessionId &&
        event.remoteSessionId !==
          expectedSession
      ) {
        return;
      }

      console.log(
        '[RemoteControl] Control stopped:',
        event.reason ||
          'stopped'
      );

      setState((prev) => ({
        ...prev,

        status: 'ended',

        controlAllowed: false,

        controllerRegistered: false,

        controllerId: null,
        controllerName: null,
        controllerRole: null,
      }));

      onControlStopped?.();

      window.setTimeout(
        resetActiveControl,
        800
      );
    };

    try {
      socket =
        RemoteControlSocket
          .getInstance();

      socketRef.current =
        socket;

      socket.on(
        'CONTROLLER_REGISTERED',
        handleControllerRegistered
      );

      socket.on(
        'CONTROL_DENIED',
        handleControlDenied
      );

      socket.on(
        'INVALID_TOKEN',
        handleInvalidToken
      );

      socket.on(
        'SESSION_EXPIRED',
        handleSessionExpired
      );

      socket.on(
        'CONTROL_STOPPED',
        handleControlStopped
      );

      /**
       * Establish initial connection.
       */
      socket
        .connect()
        .catch((err) => {
          console.warn(
            '[RemoteControl] Initial relay connection failed:',
            err
          );
        });
    } catch (err) {
      console.error(
        '[RemoteControl] Relay initialization failed:',
        err
      );
    }

    /**
     * IMPORTANT:
     *
     * Do not disconnect the singleton socket here.
     *
     * Other call components may still use it.
     *
     * Only remove this hook's handlers.
     */
    return () => {
      if (!socket) {
        return;
      }

      socket.off(
        'CONTROLLER_REGISTERED',
        handleControllerRegistered
      );

      socket.off(
        'CONTROL_DENIED',
        handleControlDenied
      );

      socket.off(
        'INVALID_TOKEN',
        handleInvalidToken
      );

      socket.off(
        'SESSION_EXPIRED',
        handleSessionExpired
      );

      socket.off(
        'CONTROL_STOPPED',
        handleControlStopped
      );
    };
  }, [
    currentUserId,
    currentUserRole,
    onControlGranted,
    onControlStopped,
    resetActiveControl,
  ]);

  /**
   * ------------------------------------------------------------
   * HANDLE MEETING SIGNALING
   * ------------------------------------------------------------
   *
   * These messages come from VideoSDK meeting signaling.
   *
   * They do NOT come directly from the Render WebSocket.
   */
  const handleSignalingEvent =
    useCallback(
      async (
        event:
          RemoteControlSignalingEvent
      ) => {
        try {
          /**
           * ----------------------------------------------------
           * REQUEST_CONTROL
           * ----------------------------------------------------
           */
          if (
            event.type ===
            'REQUEST_CONTROL'
          ) {
            if (
              currentUserRole !==
              'customer'
            ) {
              return;
            }

            /**
             * Ignore request intended for another customer.
             */
            if (
              event.customerId &&
              event.customerId !==
                currentUserId
            ) {
              return;
            }

            console.log(
              '[RemoteControl] Customer received control request'
            );

            setState(
              (prev) => ({
                ...prev,

                status:
                  'requested',

                customerId:
                  event.customerId ||
                  currentUserId,

                requesterId:
                  event.requesterId ||
                  null,

                requesterName:
                  event.requesterName ||
                  null,

                requesterRole:
                  event.requesterRole ||
                  null,

                /**
                 * Correct distinction:
                 */
                databaseSessionId:
                  event.databaseSessionId ||
                  null,

                remoteSessionId:
                  event.remoteSessionId ||
                  null,

                controlAllowed:
                  false,

                controllerRegistered:
                  false,

                agentRegistered:
                  false,
              })
            );

            onRequestReceived?.(
              event.requesterName ||
                '',

              event.requesterRole ||
                'officer'
            );

            return;
          }

          /**
           * ----------------------------------------------------
           * CONTROL_GRANTED
           * ----------------------------------------------------
           *
           * Customer approved.
           *
           * Officer/Advisor receives Controller token and
           * registers with Render.
           */
          if (
            event.type ===
            'CONTROL_GRANTED'
          ) {
            if (
              currentUserRole ===
              'customer'
            ) {
              return;
            }

            /**
             * Only intended controller handles it.
             */
            if (
              event.controllerId &&
              event.controllerId !==
                currentUserId
            ) {
              return;
            }

            if (
              !event.remoteSessionId
            ) {
              console.error(
                '[RemoteControl] CONTROL_GRANTED missing remoteSessionId'
              );

              return;
            }

            if (
              !event.controllerToken
            ) {
              console.error(
                '[RemoteControl] CONTROL_GRANTED missing controllerToken'
              );

              setState(
                (prev) => ({
                  ...prev,
                  status: 'error',
                })
              );

              return;
            }

            const controllerRole =
              event.controllerRole ||
              (currentUserRole as ControllerRole);

            setState(
              (prev) => ({
                ...prev,

                status:
                  'registering',

                remoteSessionId:
                  event.remoteSessionId!,

                databaseSessionId:
                  event.databaseSessionId ||
                  prev.databaseSessionId,

                controllerId:
                  currentUserId,

                controllerName:
                  event.controllerName ||
                  prev.controllerName,

                controllerRole,

                controlAllowed:
                  false,

                controllerRegistered:
                  false,
              })
            );

            /**
             * Register controller with Render.
             */
            await registerControllerInternal(
              event.remoteSessionId,
              event.controllerToken,
              currentUserId,
              controllerRole
            );

            return;
          }

          /**
           * ----------------------------------------------------
           * CONTROL_REJECTED
           * ----------------------------------------------------
           */
          if (
            event.type ===
            'CONTROL_REJECTED'
          ) {
            if (
              currentUserRole ===
              'customer'
            ) {
              return;
            }

            if (
              event.requesterId &&
              event.requesterId !==
                currentUserId
            ) {
              return;
            }

            console.log(
              '[RemoteControl] Customer rejected control request'
            );

            setState(
              (prev) => ({
                ...prev,

                status:
                  'rejected',

                controlAllowed:
                  false,

                controllerRegistered:
                  false,
              })
            );

            window.setTimeout(
              resetActiveControl,
              1200
            );

            return;
          }

          /**
           * ----------------------------------------------------
           * CONTROL_STOPPED
           * ----------------------------------------------------
           */
          if (
            event.type ===
            'CONTROL_STOPPED'
          ) {
            const expected =
              stateRef.current
                .remoteSessionId;

            if (
              expected &&
              event.remoteSessionId &&
              expected !==
                event.remoteSessionId
            ) {
              return;
            }

            setState(
              (prev) => ({
                ...prev,

                status:
                  'ended',

                controlAllowed:
                  false,

                controllerRegistered:
                  false,

                controllerId:
                  null,

                controllerName:
                  null,

                controllerRole:
                  null,
              })
            );

            onControlStopped?.();

            window.setTimeout(
              resetActiveControl,
              800
            );
          }
        } catch (err) {
          console.error(
            '[RemoteControl] Signaling handler failed:',
            err
          );
        }
      },
      [
        currentUserId,
        currentUserRole,
        onRequestReceived,
        onControlStopped,
        resetActiveControl,
      ]
    );

  /**
   * ------------------------------------------------------------
   * INTERNAL CONTROLLER REGISTRATION
   * ------------------------------------------------------------
   */
  const registerControllerInternal =
    async (
      remoteSessionId: string,

      controllerToken: string,

      controllerId: string,

      controllerRole:
        ControllerRole
    ): Promise<void> => {
      const socket =
        socketRef.current;

      if (!socket) {
        throw new Error(
          '[RemoteControl] Relay socket unavailable'
        );
      }

      if (
        !socket.isConnected()
      ) {
        await socket.connect();
      }

      const message:
        ControllerRegisterRelayMessage =
        {
          type:
            'CONTROLLER_REGISTER',

          remoteSessionId,

          meetingId,

          controllerId,

          controllerRole,

          token:
            controllerToken,
        };

      setState(
        (prev) => ({
          ...prev,

          status:
            'registering',

          remoteSessionId,

          controllerId,

          controllerRole,

          controlAllowed:
            false,

          controllerRegistered:
            false,
        })
      );

      socket.send(message);

      console.log(
        '[RemoteControl] CONTROLLER_REGISTER sent'
      );
    };

  /**
   * Public wrapper.
   */
  const registerControllerWithRelay =
    useCallback(
      async (
        remoteSessionId: string,

        controllerToken: string,

        controllerId: string,

        controllerRole:
          ControllerRole
      ) => {
        await registerControllerInternal(
          remoteSessionId,
          controllerToken,
          controllerId,
          controllerRole
        );
      },
      [meetingId]
    );

  /**
   * ------------------------------------------------------------
   * REQUEST CONTROL
   * ------------------------------------------------------------
   *
   * Officer / Advisor:
   *
   * Take Control
   *      ↓
   * create Supabase row
   */
  const requestControl =
    useCallback(
      async (
        requesterName: string
      ) => {
        if (
          currentUserRole ===
          'customer'
        ) {
          throw new Error(
            'Customer cannot request control'
          );
        }

        const customerId =
          stateRef.current
            .customerId;

        if (!customerId) {
          throw new Error(
            'Customer ID is not available'
          );
        }

        try {
          setState(
            (prev) => ({
              ...prev,

              status:
                'requesting',
            })
          );

          const requesterRole: ControllerRole =
            currentUserRole;

          const session =
            await RemoteControlService
              .createControlRequest(
                meetingId,
                customerId,
                currentUserId,
                requesterRole
              );

          /**
           * IMPORTANT:
           *
           * session.id
           *     =
           * Supabase DB row.
           *
           * session.remote_session_id
           *     =
           * Render relay session.
           */
          setState(
            (prev) => ({
              ...prev,

              status:
                'requested',

              requesterId:
                currentUserId,

              requesterName,

              requesterRole,

              databaseSessionId:
                session.id,

              remoteSessionId:
                session
                  .remote_session_id,

              controlAllowed:
                false,

              controllerRegistered:
                false,

              agentRegistered:
                false,
            })
          );

          return session;
        } catch (err) {
          console.error(
            '[RemoteControl] Request failed:',
            err
          );

          setState(
            (prev) => ({
              ...prev,

              status: 'idle',
            })
          );

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
   * CUSTOMER APPROVES CONTROL
   * ------------------------------------------------------------
   *
   * Flow:
   *
   * Supabase approve
   *      ↓
   * Render /authorize
   *      ↓
   * agentToken + controllerToken
   */
  const approveControl =
    useCallback(
      async (
        databaseSessionId?: string
      ): Promise<
        ApproveControlResult | undefined
      > => {
        if (
          currentUserRole !==
          'customer'
        ) {
          return;
        }

        const current =
          stateRef.current;

        const dbSessionId =
          databaseSessionId ||
          current.databaseSessionId;

        if (!dbSessionId) {
          throw new Error(
            'Database session ID is unavailable'
          );
        }

        if (
          !current.requesterId
        ) {
          throw new Error(
            'Requester ID is unavailable'
          );
        }

        if (
          !current.requesterRole
        ) {
          throw new Error(
            'Requester role is unavailable'
          );
        }

        const customerId =
          current.customerId ||
          currentUserId;

        try {
          setState(
            (prev) => ({
              ...prev,

              status:
                'approved',
            })
          );

          /**
           * 1. Approve Supabase request.
           */
          const session =
            await RemoteControlService
              .approveControlRequest(
                dbSessionId,

                current.requesterId
              );

          /**
           * 2. Ask Render to issue secure short-lived tokens.
           */
          const authorization =
            await RemoteControlService
              .authorizeRemoteControl(
                session
                  .remote_session_id,

                meetingId,

                customerId,

                current.requesterId,

                current.requesterRole
              );

          setState(
            (prev) => ({
              ...prev,

              status:
                'approved',

              customerId,

              databaseSessionId:
                session.id,

              remoteSessionId:
                session
                  .remote_session_id,

              controllerId:
                current.requesterId,

              controllerName:
                current.requesterName,

              controllerRole:
                current.requesterRole,

              controlAllowed:
                false,

              agentRegistered:
                false,

              controllerRegistered:
                false,
            })
          );

          console.log(
            '[RemoteControl] Customer approved and Render authorization created'
          );

          /**
           * IMPORTANT:
           *
           * VideoConsultationRoom must:
           *
           * 1. Send authorization.agentToken locally to Customer Agent.
           * 2. Wait/allow Agent to register.
           * 3. Send CONTROL_GRANTED to controller with controllerToken.
           *
           * Do not broadcast agentToken to other meeting participants.
           */
          return {
            session,
            authorization,
          };
        } catch (err) {
          console.error(
            '[RemoteControl] Approval failed:',
            err
          );

          setState(
            (prev) => ({
              ...prev,

              status:
                'error',

              controlAllowed:
                false,
            })
          );

          throw err;
        }
      },
      [
        currentUserId,
        currentUserRole,
        meetingId,
      ]
    );

  /**
   * ------------------------------------------------------------
   * CUSTOMER REJECTS CONTROL
   * ------------------------------------------------------------
   */
  const rejectControl =
    useCallback(
      async (
        databaseSessionId?: string
      ) => {
        if (
          currentUserRole !==
          'customer'
        ) {
          return false;
        }

        const dbSessionId =
          databaseSessionId ||
          stateRef.current
            .databaseSessionId;

        if (!dbSessionId) {
          console.warn(
            '[RemoteControl] Cannot reject: missing database session ID'
          );

          return false;
        }

        try {
          await RemoteControlService
            .rejectControlRequest(
              dbSessionId
            );

          setState(
            (prev) => ({
              ...prev,

              status:
                'rejected',

              controlAllowed:
                false,
            })
          );

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
   */
  const stopControl =
    useCallback(
      async (
        databaseSessionId?: string,

        reason:
          ControlStopRelayMessage['reason'] =
          'stopped'
      ) => {
        const current =
          stateRef.current;

        const dbSessionId =
          databaseSessionId ||
          current.databaseSessionId;

        /**
         * Persist ended state in Supabase.
         */
        if (dbSessionId) {
          try {
            await RemoteControlService
              .stopControl(
                dbSessionId
              );
          } catch (err) {
            console.warn(
              '[RemoteControl] Supabase stop failed:',
              err
            );
          }
        }

        /**
         * Tell Render relay.
         */
        if (
          current.remoteSessionId
        ) {
          const socket =
            socketRef.current;

          if (
            socket?.isConnected()
          ) {
            const stopMessage:
              ControlStopRelayMessage =
              {
                type:
                  'CONTROL_STOP',

                remoteSessionId:
                  current.remoteSessionId,

                reason,
              };

            socket.send(
              stopMessage
            );
          }
        }

        setState(
          (prev) => ({
            ...prev,

            status:
              'ended',

            controlAllowed:
              false,

            controllerRegistered:
              false,

            controllerId:
              null,

            controllerName:
              null,

            controllerRole:
              null,
          })
        );

        onControlStopped?.();

        window.setTimeout(
          resetActiveControl,
          800
        );
      },
      [
        onControlStopped,
        resetActiveControl,
      ]
    );

  /**
   * ------------------------------------------------------------
   * SEND MOUSE / KEYBOARD EVENTS
   * ------------------------------------------------------------
   */
  const sendControlEvent =
    useCallback(
      (
        inputEvent:
          RemoteControlEvent
      ) => {
        const current =
          stateRef.current;

        /**
         * Never send input before Render confirmed control.
         */
        if (
          current.status !==
            'active' ||
          !current.controlAllowed ||
          !current
            .controllerRegistered
        ) {
          return;
        }

        if (
          !current.remoteSessionId
        ) {
          return;
        }

        const socket =
          socketRef.current;

        if (
          !socket?.isConnected()
        ) {
          console.warn(
            '[RemoteControl] Relay unavailable; input event dropped'
          );

          return;
        }

        const message:
          ControlEventRelayMessage =
          {
            type:
              'CONTROL_EVENT',

            remoteSessionId:
              current
                .remoteSessionId,

            event:
              inputEvent,
          };

        socket.send(message);
      },
      []
    );

  /**
   * ------------------------------------------------------------
   * SET REAL CUSTOMER ID
   * ------------------------------------------------------------
   */
  const setCustomerId =
    useCallback(
      (
        customerId: string
      ) => {
        if (!customerId) {
          return;
        }

        setState(
          (prev) => {
            if (
              prev.customerId ===
              customerId
            ) {
              return prev;
            }

            return {
              ...prev,
              customerId,
            };
          }
        );
      },
      []
    );

  /**
   * ------------------------------------------------------------
   * MARK AGENT REGISTERED
   * ------------------------------------------------------------
   *
   * VideoConsultationRoom / local Agent health logic can call
   * this after Customer Agent confirms AGENT_REGISTERED.
   */
  const setAgentRegistered =
    useCallback(
      (
        registered: boolean
      ) => {
        setState(
          (prev) => ({
            ...prev,

            agentRegistered:
              registered,
          })
        );
      },
      []
    );

  /**
   * ------------------------------------------------------------
   * SCREEN SHARE STATE
   * ------------------------------------------------------------
   *
   * Stopping customer screen share immediately stops
   * any active remote-control session.
   */
  const setScreenShareActive =
    useCallback(
      (
        active: boolean
      ) => {
        const previous =
          stateRef.current;

        setState(
          (prev) => ({
            ...prev,

            screenShareActive:
              active,
          })
        );

        if (active) {
          return;
        }

        if (
          !previous
            .controlAllowed
        ) {
          return;
        }

        /**
         * Fire and forget.
         */
        void stopControl(
          previous
            .databaseSessionId ||
            undefined,

          'screen_share_stopped'
        );
      },
      [stopControl]
    );

  return {
    state,

    /**
     * Meeting signaling receiver.
     */
    handleSignalingEvent,

    /**
     * Request lifecycle.
     */
    requestControl,
    approveControl,
    rejectControl,

    /**
     * Relay registration.
     */
    registerControllerWithRelay,

    /**
     * Active remote-control actions.
     */
    stopControl,
    sendControlEvent,

    /**
     * Shared meeting state.
     */
    setCustomerId,
    setAgentRegistered,
    setScreenShareActive,
  };
}