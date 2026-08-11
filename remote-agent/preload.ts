import {
  contextBridge,
  ipcRenderer,
} from 'electron';

/**
 * ------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------
 */

export interface AgentStatus {
  agentRunning: boolean;

  relayConnected: boolean;

  activeSession: boolean;

  remoteSessionId:
    | string
    | null;

  version: string;

  relayServer: string;

  localBridge?: string;
}

export interface RelayConnectionStatus {
  connected: boolean;
}

export interface AgentRegisteredEvent {
  type:
    'AGENT_REGISTERED';

  remoteSessionId?: string;

  reason?: string;
}

export interface ControlStoppedEvent {
  type:
    'CONTROL_STOPPED';

  remoteSessionId?: string;

  reason?: string;
}

export interface RegisterWithRelayData {
  remoteSessionId: string;

  meetingId: string;

  customerId: string;

  token: string;
}

/**
 * ------------------------------------------------------------
 * SAFE CALLBACK WRAPPER
 * ------------------------------------------------------------
 */

function safeCallback<T>(
  callback:
    (data: T) => void,
  data: T
): void {
  try {
    callback(data);
  } catch (err) {
    console.error(
      '[Preload] Callback failed:',
      err
    );
  }
}

/**
 * ------------------------------------------------------------
 * EXPOSE AGENT API
 * ------------------------------------------------------------
 */

contextBridge.exposeInMainWorld(
  'agentAPI',
  {
    /**
     * ----------------------------------------------------------
     * GET CURRENT AGENT STATUS
     * ----------------------------------------------------------
     */
    getStatus:
      (): Promise<AgentStatus> =>
        ipcRenderer.invoke(
          'get-agent-status'
        ),

    /**
     * ----------------------------------------------------------
     * REGISTER AGENT WITH RENDER
     * ----------------------------------------------------------
     *
     * This is mainly useful for the Electron renderer itself.
     *
     * The Netlify browser uses:
     *
     * POST http://127.0.0.1:9876/register
     *
     * instead.
     */
    registerWithRelay:
      (
        data:
          RegisterWithRelayData
      ) =>
        ipcRenderer.invoke(
          'register-with-relay',
          data
        ),

    /**
     * ----------------------------------------------------------
     * STOP ACTIVE CONTROL
     * ----------------------------------------------------------
     */
    stopControl:
      () =>
        ipcRenderer.invoke(
          'stop-control'
        ),

    /**
     * ----------------------------------------------------------
     * AGENT REGISTERED EVENT
     * ----------------------------------------------------------
     */
    onAgentRegistered:
      (
        callback:
          (
            event:
              AgentRegisteredEvent
          ) => void
      ) => {
        const handler = (
          _event:
            Electron.IpcRendererEvent,
          data:
            AgentRegisteredEvent
        ) => {
          safeCallback(
            callback,
            data
          );
        };

        ipcRenderer.on(
          'agent-registered',
          handler
        );

        /**
         * Return unsubscribe function.
         */
        return () => {
          ipcRenderer.removeListener(
            'agent-registered',
            handler
          );
        };
      },

    /**
     * ----------------------------------------------------------
     * RELAY CONNECTION STATUS
     * ----------------------------------------------------------
     *
     * IMPORTANT:
     *
     * main.ts sends:
     *
     * relay-connection-status
     *
     * not:
     *
     * agent-connection-status
     */
    onConnectionStatusChange:
      (
        callback:
          (
            status:
              RelayConnectionStatus
          ) => void
      ) => {
        const handler = (
          _event:
            Electron.IpcRendererEvent,
          data:
            RelayConnectionStatus
        ) => {
          safeCallback(
            callback,
            data
          );
        };

        ipcRenderer.on(
          'relay-connection-status',
          handler
        );

        return () => {
          ipcRenderer.removeListener(
            'relay-connection-status',
            handler
          );
        };
      },

    /**
     * ----------------------------------------------------------
     * CONTROL STOPPED EVENT
     * ----------------------------------------------------------
     */
    onControlStopped:
      (
        callback:
          (
            event:
              ControlStoppedEvent
          ) => void
      ) => {
        const handler = (
          _event:
            Electron.IpcRendererEvent,
          data:
            ControlStoppedEvent
        ) => {
          safeCallback(
            callback,
            data
          );
        };

        ipcRenderer.on(
          'control-stopped',
          handler
        );

        return () => {
          ipcRenderer.removeListener(
            'control-stopped',
            handler
          );
        };
      },

    /**
     * ----------------------------------------------------------
     * REMOVE ALL AGENT LISTENERS
     * ----------------------------------------------------------
     *
     * Useful when Electron renderer is destroyed/reloaded.
     */
    removeAllListeners:
      () => {
        ipcRenderer.removeAllListeners(
          'agent-registered'
        );

        ipcRenderer.removeAllListeners(
          'relay-connection-status'
        );

        ipcRenderer.removeAllListeners(
          'control-stopped'
        );
      },
  }
);