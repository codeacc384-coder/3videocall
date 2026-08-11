import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
} from 'electron';

import path from 'path';

import http, {
  IncomingMessage,
  ServerResponse,
} from 'http';

import { AgentConnection } from './connection';
import { ControlHandler } from './control';
import { AgentSecurity } from './security';

import type {
  RemoteControlEvent,
} from './types/remoteControl';
/**
 * ============================================================
 * GLOBAL STATE
 * ============================================================
 */

let mainWindow: BrowserWindow | null =
  null;

let tray: Tray | null =
  null;

let agentConnection:
  | AgentConnection
  | null = null;

let controlHandler:
  | ControlHandler
  | null = null;

let security:
  | AgentSecurity
  | null = null;

let localHttpServer:
  | http.Server
  | null = null;

let cleanupTimer:
  | NodeJS.Timeout
  | null = null;

let isQuitting =
  false;

/**
 * Currently registered Render remote session.
 */
let activeRemoteSessionId:
  | string
  | null = null;

/**
 * Pending /register request.
 *
 * Website does:
 *
 * POST localhost:9876/register
 *
 * We wait until:
 *
 * AGENT_REGISTERED
 *
 * before returning HTTP 200.
 */
let pendingRegistration:
  | {
      remoteSessionId: string;

      resolve: () => void;

      reject: (
        error: Error
      ) => void;

      timer:
        NodeJS.Timeout;
    }
  | null = null;

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const LOCAL_AGENT_HOST =
  '127.0.0.1';

const LOCAL_AGENT_PORT =
  9876;

/**
 * Production:
 *
 * REMOTE_CONTROL_WS_URL=
 * wss://threevideocall.onrender.com/remote-control
 */
const RELAY_SERVER_URL =
  process.env.REMOTE_CONTROL_WS_URL ||
  'wss://threevideocall.onrender.com/remote-control';
/**
 * Website origins allowed to access:
 *
 * http://127.0.0.1:9876
 */
const LOCAL_ALLOWED_ORIGINS = (
  process.env
    .LOCAL_ALLOWED_ORIGINS ||
  [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://endearing-smakager-eafdeb.netlify.app',
  ].join(',')
)
  .split(',')
  .map((origin) =>
    origin.trim()
  )
  .filter(Boolean);

const AGENT_VERSION =
  '1.0.0';

const REGISTER_TIMEOUT_MS =
  15000;

/**
 * ============================================================
 * ELECTRON WINDOW
 * ============================================================
 */

function createWindow(): void {
  mainWindow =
    new BrowserWindow({
      width: 420,

      height: 320,

      show: false,

      webPreferences: {
        preload: path.join(
          __dirname,
          'preload.js'
        ),

        nodeIntegration:
          false,

        contextIsolation:
          true,
      },
    });

  void mainWindow.loadFile(
    path.join(
      __dirname,
      'index.html'
    )
  );

  mainWindow.on(
    'closed',
    () => {
      mainWindow =
        null;
    }
  );

  mainWindow.on(
    'minimize',
    (
      event:
        Electron.Event
    ) => {
      event.preventDefault();

      mainWindow?.hide();
    }
  );

  mainWindow.on(
    'close',
    (
      event:
        Electron.Event
    ) => {
      if (
        !isQuitting
      ) {
        event.preventDefault();

        mainWindow?.hide();
      }
    }
  );
}

/**
 * ============================================================
 * TRAY
 * ============================================================
 */

function createTray(): void {
  try {
    const iconPath =
      path.join(
        __dirname,
        'assets',
        'icon.png'
      );

    tray =
      new Tray(iconPath);

    updateTray();

    tray.on(
      'double-click',
      () => {
        mainWindow?.show();
      }
    );
  } catch (err) {
    console.warn(
      '[Agent] Tray initialization failed:',
      err
    );
  }
}

function updateTray(): void {
  if (!tray) {
    return;
  }

  const connected =
    agentConnection
      ?.isConnected() ||
    false;

  const menu =
    Menu.buildFromTemplate([
      {
        label:
          'Show Remote Assistance',

        click: () => {
          mainWindow?.show();
        },
      },

      {
        label:
          connected
            ? 'Relay: Connected'
            : 'Relay: Disconnected',

        enabled: false,
      },

      {
        label:
          activeRemoteSessionId
            ? 'Remote Session: Active'
            : 'Remote Session: None',

        enabled: false,
      },

      {
        type:
          'separator',
      },

      {
        label:
          'Quit',

        click: () => {
          isQuitting =
            true;

          app.quit();
        },
      },
    ]);

  tray.setContextMenu(
    menu
  );

  tray.setToolTip(
    connected
      ? 'InsuranceOne Remote Assistance — Connected'
      : 'InsuranceOne Remote Assistance — Disconnected'
  );
}

/**
 * ============================================================
 * INITIALIZE AGENT
 * ============================================================
 */

function initializeAgent(): void {
  security =
    new AgentSecurity();

  controlHandler =
    new ControlHandler(
      security
    );

  agentConnection =
    new AgentConnection(
      RELAY_SERVER_URL
    );

  /**
   * ----------------------------------------------------------
   * MOUSE EVENTS
   * ----------------------------------------------------------
   */

  agentConnection.on(
    'MOUSE_MOVE',
    (
      event:
        RemoteControlEvent
    ) => {
      controlHandler
        ?.handleEvent(event);
    }
  );

  agentConnection.on(
    'MOUSE_DOWN',
    (
      event:
        RemoteControlEvent
    ) => {
      controlHandler
        ?.handleEvent(event);
    }
  );

  agentConnection.on(
    'MOUSE_UP',
    (
      event:
        RemoteControlEvent
    ) => {
      controlHandler
        ?.handleEvent(event);
    }
  );

  agentConnection.on(
    'MOUSE_CLICK',
    (
      event:
        RemoteControlEvent
    ) => {
      controlHandler
        ?.handleEvent(event);
    }
  );

  agentConnection.on(
    'MOUSE_DOUBLE_CLICK',
    (
      event:
        RemoteControlEvent
    ) => {
      controlHandler
        ?.handleEvent(event);
    }
  );

  agentConnection.on(
    'SCROLL',
    (
      event:
        RemoteControlEvent
    ) => {
      controlHandler
        ?.handleEvent(event);
    }
  );

  /**
   * ----------------------------------------------------------
   * KEYBOARD EVENTS
   * ----------------------------------------------------------
   */

  agentConnection.on(
    'KEY_DOWN',
    (
      event:
        RemoteControlEvent
    ) => {
      controlHandler
        ?.handleEvent(event);
    }
  );

  agentConnection.on(
    'KEY_UP',
    (
      event:
        RemoteControlEvent
    ) => {
      controlHandler
        ?.handleEvent(event);
    }
  );

  /**
   * ----------------------------------------------------------
   * AGENT REGISTERED
   * ----------------------------------------------------------
   *
   * This is the important security transition:
   *
   * pending
   *   ↓
   * Render validates token
   *   ↓
   * AGENT_REGISTERED
   *   ↓
   * active local session
   */
  agentConnection.on(
    'AGENT_REGISTERED',
    (
      event:
        RemoteControlEvent
    ) => {
      const remoteSessionId =
        event.remoteSessionId;

      if (
        !remoteSessionId
      ) {
        console.error(
          '[Agent] AGENT_REGISTERED missing remoteSessionId'
        );

        rejectPendingRegistration(
          new Error(
            'Render returned AGENT_REGISTERED without session ID'
          )
        );

        return;
      }

      console.log(
        '[Agent] AGENT_REGISTERED:',
        remoteSessionId
      );

      /**
       * Activate pending local security session.
       */
      const localSession =
        security
          ?.activateSession(
            remoteSessionId
          );

      if (
        !localSession
      ) {
        console.error(
          '[Agent] Could not activate local Agent session'
        );

        rejectPendingRegistration(
          new Error(
            'Local Agent session activation failed'
          )
        );

        return;
      }

      /**
       * Refresh physical screen size before control begins.
       */
      controlHandler
        ?.startControl(
          remoteSessionId
        );

      activeRemoteSessionId =
        remoteSessionId;

      updateTray();

      /**
       * Complete website's:
       *
       * POST /register
       */
      if (
        pendingRegistration &&
        pendingRegistration
          .remoteSessionId ===
          remoteSessionId
      ) {
        clearTimeout(
          pendingRegistration
            .timer
        );

        const resolve =
          pendingRegistration
            .resolve;

        pendingRegistration =
          null;

        resolve();
      }

      mainWindow
        ?.webContents
        .send(
          'agent-registered',
          event
        );
    }
  );

  /**
   * ----------------------------------------------------------
   * CONTROL STOPPED
   * ----------------------------------------------------------
   */

  agentConnection.on(
    'CONTROL_STOPPED',
    (
      event:
        RemoteControlEvent
    ) => {
      console.log(
        '[Agent] CONTROL_STOPPED:',
        event.reason ||
          'stopped'
      );

      const sessionId =
        event.remoteSessionId ||
        activeRemoteSessionId;

      controlHandler
        ?.stopControl();

      if (
        sessionId
      ) {
        security
          ?.unregisterSession(
            sessionId
          );
      }

      activeRemoteSessionId =
        null;

      updateTray();

      mainWindow
        ?.webContents
        .send(
          'control-stopped',
          event
        );
    }
  );

  /**
   * ----------------------------------------------------------
   * INVALID TOKEN
   * ----------------------------------------------------------
   */

  agentConnection.on(
    'INVALID_TOKEN',
    (
      event:
        RemoteControlEvent
    ) => {
      console.error(
        '[Agent] INVALID_TOKEN:',
        event.reason ||
          'Invalid Agent token'
      );

      const sessionId =
        event.remoteSessionId ||
        pendingRegistration
          ?.remoteSessionId ||
        activeRemoteSessionId;

      if (
        sessionId
      ) {
        security
          ?.unregisterSession(
            sessionId
          );
      }

      controlHandler
        ?.stopControl();

      activeRemoteSessionId =
        null;

      rejectPendingRegistration(
        new Error(
          event.reason ||
            'Render rejected Agent token'
        )
      );

      updateTray();
    }
  );

  /**
   * ----------------------------------------------------------
   * SESSION EXPIRED
   * ----------------------------------------------------------
   */

  agentConnection.on(
    'SESSION_EXPIRED',
    (
      event:
        RemoteControlEvent
    ) => {
      console.warn(
        '[Agent] SESSION_EXPIRED:',
        event.reason ||
          'Session expired'
      );

      const sessionId =
        event.remoteSessionId ||
        pendingRegistration
          ?.remoteSessionId ||
        activeRemoteSessionId;

      if (
        sessionId
      ) {
        security
          ?.unregisterSession(
            sessionId
          );
      }

      controlHandler
        ?.stopControl();

      activeRemoteSessionId =
        null;

      rejectPendingRegistration(
        new Error(
          event.reason ||
            'Remote session expired'
        )
      );

      updateTray();
    }
  );

  /**
   * ----------------------------------------------------------
   * CONTROL DENIED
   * ----------------------------------------------------------
   */

  agentConnection.on(
    'CONTROL_DENIED',
    (
      event:
        RemoteControlEvent
    ) => {
      console.warn(
        '[Agent] CONTROL_DENIED:',
        event.reason ||
          'Control denied'
      );

      controlHandler
        ?.stopControl();
    }
  );

  /**
   * ----------------------------------------------------------
   * CONNECTION STATUS
   * ----------------------------------------------------------
   */

  agentConnection
    .onConnectionChange(
      (
        connected:
          boolean
      ) => {
        console.log(
          '[Agent] Relay connection status:',
          connected
        );

        updateTray();

        mainWindow
          ?.webContents
          .send(
            'relay-connection-status',
            {
              connected,
            }
          );
      }
    );

  /**
   * Initial Render WebSocket.
   */
  agentConnection
    .connect()
    .catch(
      (
        err
      ) => {
        console.error(
          '[Agent] Initial relay connection failed:',
          err
        );
      }
    );
}

/**
 * ============================================================
 * AGENT REGISTRATION
 * ============================================================
 */

async function registerAgentWithRelay(
  data: {
    remoteSessionId: string;

    meetingId: string;

    customerId: string;

    token: string;
  }
): Promise<void> {
  if (
    !agentConnection ||
    !security
  ) {
    throw new Error(
      'Remote Agent is not initialized'
    );
  }

  validateRegistrationData(
    data
  );

  /**
   * Prevent overlapping registrations.
   */
  if (
    pendingRegistration
  ) {
    if (
      pendingRegistration
        .remoteSessionId ===
      data.remoteSessionId
    ) {
      throw new Error(
        'Agent registration already in progress'
      );
    }

    rejectPendingRegistration(
      new Error(
        'Registration replaced by another request'
      )
    );
  }

  /**
   * Save non-secret session metadata locally.
   *
   * IMPORTANT:
   * token is NOT stored.
   */
  security.registerPendingSession(
    data.remoteSessionId,

    data.meetingId,

    data.customerId,

    data.customerId
  );

  /**
   * Make sure relay is connected.
   */
  if (
    !agentConnection
      .isConnected()
  ) {
    console.log(
      '[Agent] Connecting to Render before Agent registration...'
    );

    await agentConnection
      .connect();
  }

  /**
   * Create response waiter before sending registration.
   */
  const registrationPromise =
    new Promise<void>(
      (
        resolve,
        reject
      ) => {
        const timer =
          setTimeout(
            () => {
              if (
                pendingRegistration
                  ?.remoteSessionId ===
                data.remoteSessionId
              ) {
                pendingRegistration =
                  null;
              }

              security
                ?.unregisterSession(
                  data.remoteSessionId
                );

              reject(
                new Error(
                  'Timed out waiting for AGENT_REGISTERED from Render'
                )
              );
            },
            REGISTER_TIMEOUT_MS
          );

        pendingRegistration =
          {
            remoteSessionId:
              data.remoteSessionId,

            resolve,

            reject,

            timer,
          };
      }
    );

  console.log(
    '[Agent] Sending AGENT_REGISTER:',
    data.remoteSessionId
  );

  /**
   * Never log token.
   */
  try {
    agentConnection.send({
      type:
        'AGENT_REGISTER',

      meetingId:
        data.meetingId,

      remoteSessionId:
        data.remoteSessionId,

      customerId:
        data.customerId,

      token:
        data.token,
    });
  } catch (err) {
    security
      .unregisterSession(
        data.remoteSessionId
      );

    rejectPendingRegistration(
      err instanceof Error
        ? err
        : new Error(
            'Unable to send AGENT_REGISTER'
          )
    );

    throw err;
  }

  await registrationPromise;
}

/**
 * ============================================================
 * REGISTRATION BODY VALIDATION
 * ============================================================
 */

function validateRegistrationData(
  data: any
): asserts data is {
  remoteSessionId: string;

  meetingId: string;

  customerId: string;

  token: string;
} {
  if (
    !data ||
    typeof data !==
      'object'
  ) {
    throw new Error(
      'Registration body is required'
    );
  }

  if (
    typeof data.remoteSessionId !==
      'string' ||
    !data.remoteSessionId
  ) {
    throw new Error(
      'remoteSessionId is required'
    );
  }

  if (
    typeof data.meetingId !==
      'string' ||
    !data.meetingId
  ) {
    throw new Error(
      'meetingId is required'
    );
  }

  if (
    typeof data.customerId !==
      'string' ||
    !data.customerId
  ) {
    throw new Error(
      'customerId is required'
    );
  }

  if (
    typeof data.token !==
      'string' ||
    !data.token
  ) {
    throw new Error(
      'Agent token is required'
    );
  }
}

/**
 * ============================================================
 * PENDING REGISTRATION FAILURE
 * ============================================================
 */

function rejectPendingRegistration(
  error: Error
): void {
  if (
    !pendingRegistration
  ) {
    return;
  }

  const remoteSessionId =
    pendingRegistration
      .remoteSessionId;

  clearTimeout(
    pendingRegistration
      .timer
  );

  const reject =
    pendingRegistration
      .reject;

  pendingRegistration =
    null;

  security
    ?.unregisterSession(
      remoteSessionId
    );

  reject(error);
}

/**
 * ============================================================
 * LOCAL BROWSER BRIDGE
 * ============================================================
 */

function startLocalHttpServer(): void {
  if (
    localHttpServer
  ) {
    return;
  }

  localHttpServer =
    http.createServer(
      (
        req,
        res
      ) => {
        void handleLocalRequest(
          req,
          res
        );
      }
    );

  localHttpServer.on(
    'error',
    (
      err
    ) => {
      console.error(
        '[Agent] Local bridge error:',
        err
      );
    }
  );

  localHttpServer.listen(
    LOCAL_AGENT_PORT,
    LOCAL_AGENT_HOST,
    () => {
      console.log(
        `[Agent] Local bridge: http://${LOCAL_AGENT_HOST}:${LOCAL_AGENT_PORT}`
      );

      console.log(
        `[Agent] Relay: ${RELAY_SERVER_URL}`
      );
    }
  );
}

/**
 * ============================================================
 * LOCAL HTTP ROUTES
 * ============================================================
 */

async function handleLocalRequest(
  req:
    IncomingMessage,

  res:
    ServerResponse
): Promise<void> {
  const origin =
    req.headers.origin ||
    '';

  if (
    origin &&
    !isLocalOriginAllowed(
      origin
    )
  ) {
    sendJson(
      res,
      403,
      {
        error:
          'ORIGIN_NOT_ALLOWED',

        message:
          'Website is not allowed to access Remote Assistance Agent.',
      }
    );

    return;
  }

  applyCors(
    res,
    origin
  );

  /**
   * CORS preflight.
   */
  if (
    req.method ===
    'OPTIONS'
  ) {
    res.writeHead(
      204
    );

    res.end();

    return;
  }

  const requestUrl =
    new URL(
      req.url || '/',

      `http://${LOCAL_AGENT_HOST}:${LOCAL_AGENT_PORT}`
    );

  /**
   * ----------------------------------------------------------
   * HEALTH
   * ----------------------------------------------------------
   */

  if (
    req.method ===
      'GET' &&
    requestUrl.pathname ===
      '/health'
  ) {
    sendJson(
      res,
      200,
      {
        status: 'ok',

        agentRunning:
          true,

        version:
          AGENT_VERSION,

        relayConnected:
          agentConnection
            ?.isConnected() ||
          false,

        activeSession:
          Boolean(
            activeRemoteSessionId
          ),

        remoteSessionId:
          activeRemoteSessionId,

        relayServer:
          RELAY_SERVER_URL,
      }
    );

    return;
  }

  /**
   * ----------------------------------------------------------
   * REGISTER
   * ----------------------------------------------------------
   */

  if (
    req.method ===
      'POST' &&
    requestUrl.pathname ===
      '/register'
  ) {
    try {
      const body =
        await readJsonBody(
          req
        );

      validateRegistrationData(
        body
      );

      await registerAgentWithRelay(
        body
      );

      sendJson(
        res,
        200,
        {
          status: 'ok',

          registered:
            true,

          remoteSessionId:
            body.remoteSessionId,

          relayConnected:
            agentConnection
              ?.isConnected() ||
            false,
        }
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Agent registration failed';

      console.error(
        '[Agent] /register:',
        message
      );

      sendJson(
        res,
        503,
        {
          status:
            'error',

          registered:
            false,

          error:
            'AGENT_REGISTRATION_FAILED',

          message,
        }
      );
    }

    return;
  }

  /**
   * ----------------------------------------------------------
   * STOP
   * ----------------------------------------------------------
   */

  if (
    req.method ===
      'POST' &&
    requestUrl.pathname ===
      '/stop'
  ) {
    try {
      const sessionId =
        activeRemoteSessionId;

      controlHandler
        ?.stopControl();

      if (
        sessionId
      ) {
        security
          ?.unregisterSession(
            sessionId
          );

        if (
          agentConnection
            ?.isConnected()
        ) {
          agentConnection.send({
            type:
              'CONTROL_STOP',

            remoteSessionId:
              sessionId,

            reason:
              'customer_stopped',
          });
        }
      }

      activeRemoteSessionId =
        null;

      updateTray();

      sendJson(
        res,
        200,
        {
          status: 'ok',

          stopped:
            true,

          remoteSessionId:
            sessionId,
        }
      );
    } catch (err) {
      sendJson(
        res,
        500,
        {
          error:
            'STOP_FAILED',

          message:
            err instanceof Error
              ? err.message
              : 'Unable to stop remote control',
        }
      );
    }

    return;
  }

  sendJson(
    res,
    404,
    {
      error:
        'NOT_FOUND',
    }
  );
}

/**
 * ============================================================
 * CORS
 * ============================================================
 */

function isLocalOriginAllowed(
  origin: string
): boolean {
  if (!origin) {
    return true;
  }

  return LOCAL_ALLOWED_ORIGINS
    .includes(origin);
}

function applyCors(
  res:
    ServerResponse,

  origin: string
): void {
  if (
    origin &&
    isLocalOriginAllowed(
      origin
    )
  ) {
    res.setHeader(
      'Access-Control-Allow-Origin',
      origin
    );

    res.setHeader(
      'Vary',
      'Origin'
    );
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  res.setHeader(
    'Access-Control-Max-Age',
    '86400'
  );

  res.setHeader(
    'Cache-Control',
    'no-store'
  );
}

/**
 * ============================================================
 * READ JSON
 * ============================================================
 */

function readJsonBody(
  req:
    IncomingMessage
): Promise<any> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const chunks:
        Buffer[] = [];

      let total =
        0;

      const MAX_SIZE =
        32 * 1024;

      req.on(
        'data',
        (
          chunk:
            Buffer
        ) => {
          total +=
            chunk.length;

          if (
            total >
            MAX_SIZE
          ) {
            reject(
              new Error(
                'Request body too large'
              )
            );

            req.destroy();

            return;
          }

          chunks.push(
            chunk
          );
        }
      );

      req.on(
        'end',
        () => {
          try {
            const raw =
              Buffer.concat(
                chunks
              ).toString(
                'utf8'
              );

            if (!raw) {
              resolve({});

              return;
            }

            resolve(
              JSON.parse(
                raw
              )
            );
          } catch {
            reject(
              new Error(
                'Invalid JSON'
              )
            );
          }
        }
      );

      req.on(
        'error',
        reject
      );
    }
  );
}

/**
 * ============================================================
 * JSON RESPONSE
 * ============================================================
 */

function sendJson(
  res:
    ServerResponse,

  statusCode:
    number,

  data:
    unknown
): void {
  if (
    res.headersSent
  ) {
    return;
  }

  res.writeHead(
    statusCode,
    {
      'Content-Type':
        'application/json; charset=utf-8',

      'Cache-Control':
        'no-store',
    }
  );

  res.end(
    JSON.stringify(
      data
    )
  );
}

/**
 * ============================================================
 * IPC
 * ============================================================
 */

ipcMain.handle(
  'get-agent-status',
  () => {
    return {
      agentRunning:
        true,

      relayConnected:
        agentConnection
          ?.isConnected() ||
        false,

      activeSession:
        Boolean(
          activeRemoteSessionId
        ),

      remoteSessionId:
        activeRemoteSessionId,

      version:
        AGENT_VERSION,

      relayServer:
        RELAY_SERVER_URL,

      localBridge:
        `http://${LOCAL_AGENT_HOST}:${LOCAL_AGENT_PORT}`,
    };
  }
);

ipcMain.handle(
  'register-with-relay',
  async (
    _event,
    data
  ) => {
    await registerAgentWithRelay(
      data
    );

    return {
      success:
        true,

      remoteSessionId:
        data.remoteSessionId,
    };
  }
);

ipcMain.handle(
  'stop-control',
  () => {
    const sessionId =
      activeRemoteSessionId;

    controlHandler
      ?.stopControl();

    if (
      sessionId
    ) {
      security
        ?.unregisterSession(
          sessionId
        );

      if (
        agentConnection
          ?.isConnected()
      ) {
        agentConnection.send({
          type:
            'CONTROL_STOP',

          remoteSessionId:
            sessionId,

          reason:
            'customer_stopped',
        });
      }
    }

    activeRemoteSessionId =
      null;

    updateTray();

    return {
      success: true,
    };
  }
);

/**
 * ============================================================
 * APP STARTUP
 * ============================================================
 */

app.whenReady().then(
  () => {
    createWindow();

    initializeAgent();

    createTray();

    startLocalHttpServer();

    cleanupTimer =
      setInterval(
        () => {
          security
            ?.clearExpiredSessions();
        },
        60000
      );
  }
);

/**
 * Keep the tray Agent alive.
 */
app.on(
  'window-all-closed',
  () => {
    /**
     * Do nothing.
     *
     * Agent continues running in tray.
     */
  }
);

app.on(
  'activate',
  () => {
    if (
      !mainWindow
    ) {
      createWindow();
    }

    mainWindow
      ?.show();
  }
);

/**
 * ============================================================
 * SHUTDOWN
 * ============================================================
 */

app.on(
  'before-quit',
  () => {
    isQuitting =
      true;

    if (
      cleanupTimer
    ) {
      clearInterval(
        cleanupTimer
      );

      cleanupTimer =
        null;
    }

    rejectPendingRegistration(
      new Error(
        'Remote Agent is shutting down'
      )
    );

    const sessionId =
      activeRemoteSessionId;

    if (
      sessionId &&
      agentConnection
        ?.isConnected()
    ) {
      try {
        agentConnection.send({
          type:
            'CONTROL_STOP',

          remoteSessionId:
            sessionId,

          reason:
            'disconnect',
        });
      } catch {
        // Best effort only.
      }
    }

    controlHandler
      ?.stopControl();

    if (
      sessionId
    ) {
      security
        ?.unregisterSession(
          sessionId
        );
    }

    security
      ?.clearAllSessions();

    activeRemoteSessionId =
      null;

    agentConnection
      ?.disconnect();

    try {
      localHttpServer
        ?.close();
    } catch {
      // Ignore shutdown error.
    }

    localHttpServer =
      null;
  }
);