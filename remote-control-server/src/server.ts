import WebSocket, { WebSocketServer } from 'ws';
import type { WebSocketServer as WSSType } from 'ws';
import http from 'http';
import url from 'url';

import { SessionManager } from './sessionManager.js';
import { AuthenticationService } from './authentication.js';
import { MessageRouter } from './messageRouter.js';

import type {
  AuthorizeRemoteControlRequest,
  AuthorizeRemoteControlResponse,
  ControllerRole,
} from './types.js';

const PORT = parseInt(process.env.PORT || '8080', 10);

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const HEARTBEAT_INTERVAL = 30 * 1000;

class RemoteControlServer {
  private httpServer: http.Server;
  private wss: WSSType;

  private sessionManager: SessionManager;
  private authService: AuthenticationService;
  private messageRouter: MessageRouter;

  private clientHeartbeats:
    Map<WebSocket, NodeJS.Timeout> =
    new Map();

  constructor() {
    /**
     * AuthenticationService intentionally throws if
     * REMOTE_SESSION_SECRET is missing or too short.
     */
    this.authService =
      new AuthenticationService();

    this.sessionManager =
      new SessionManager();

    this.messageRouter =
      new MessageRouter(
        this.sessionManager,
        this.authService
      );

    this.httpServer =
      http.createServer(
        this.handleHttpRequest.bind(this)
      );

    /**
     * WebSocket server shares the same Render HTTP server.
     */
    this.wss =
      new WebSocketServer({
        server: this.httpServer,
        path: '/remote-control',
      });

    this.setupWebSocketServer();
  }

  /**
   * ------------------------------------------------------------
   * WEBSOCKET SERVER
   * ------------------------------------------------------------
   */
  private setupWebSocketServer(): void {
    this.wss.on(
      'connection',
      (
        ws: WebSocket,
        req: http.IncomingMessage
      ) => {
        const clientIp =
          this.getClientIp(req);

        const origin =
          req.headers.origin || '';

        console.log(
          `[Server] WebSocket connection from ${clientIp}`
        );

        /**
         * Browser connections must come from an allowed origin.
         *
         * Electron/Node clients may not send Origin, so empty origin
         * is allowed intentionally.
         */
        if (
          !this.isOriginAllowed(origin)
        ) {
          console.warn(
            `[Server] WebSocket rejected. Invalid origin: ${origin}`
          );

          try {
            ws.close(
              1008,
              'Invalid origin'
            );
          } catch {
            // Ignore close errors.
          }

          return;
        }

        this.setupHeartbeat(ws);

        /**
         * Track whether this specific socket is an Agent.
         *
         * The previous implementation recalculated "isAgent"
         * for every message by searching the JSON string.
         *
         * We keep the same router API for now but identify Agent
         * based on the registration message.
         */
        let isAgentConnection = false;

        ws.on(
          'message',
          (data: WebSocket.RawData) => {
            try {
              const message =
                data.toString();

              /**
               * If this socket sends AGENT_REGISTER,
               * mark it as an Agent connection from now on.
               */
              try {
                const parsed =
                  JSON.parse(message);

                if (
                  parsed?.type ===
                  'AGENT_REGISTER'
                ) {
                  isAgentConnection =
                    true;
                }
              } catch {
                /**
                 * MessageRouter will handle malformed JSON.
                 */
              }

              void this.messageRouter.routeMessage(
                ws,
                message,
                isAgentConnection
              );
            } catch (err) {
              console.error(
                '[Server] Message handling error:',
                err
              );
            }
          }
        );

        ws.on('close', () => {
          console.log(
            `[Server] WebSocket closed from ${clientIp}`
          );

          this.cleanupConnection(ws);
        });

        ws.on('error', (err) => {
          console.error(
            `[Server] WebSocket error from ${clientIp}:`,
            err
          );
        });
      }
    );

    console.log(
      `[Server] WebSocket endpoint initialized: /remote-control`
    );
  }

  /**
   * ------------------------------------------------------------
   * WEBSOCKET HEARTBEAT
   * ------------------------------------------------------------
   */
  private setupHeartbeat(
    ws: WebSocket
  ): void {
    const heartbeat =
      setInterval(() => {
        if (
          ws.readyState ===
          WebSocket.OPEN
        ) {
          try {
            ws.ping();
          } catch {
            clearInterval(heartbeat);

            this.clientHeartbeats.delete(
              ws
            );
          }
        } else {
          clearInterval(heartbeat);

          this.clientHeartbeats.delete(
            ws
          );
        }
      }, HEARTBEAT_INTERVAL);

    this.clientHeartbeats.set(
      ws,
      heartbeat
    );

    ws.on('pong', () => {
      /**
       * Transport is alive.
       */
    });
  }

  /**
   * ------------------------------------------------------------
   * CLEANUP SOCKET
   * ------------------------------------------------------------
   */
  private cleanupConnection(
    ws: WebSocket
  ): void {
    const heartbeat =
      this.clientHeartbeats.get(ws);

    if (heartbeat) {
      clearInterval(heartbeat);

      this.clientHeartbeats.delete(ws);
    }

    /**
     * SessionManager now exposes getSessions(),
     * so we no longer access its private Map through "as any".
     */
    for (
      const [
        remoteSessionId,
        session,
      ] of this.sessionManager
        .getSessions()
        .entries()
    ) {
      if (
        session.agentSocket === ws
      ) {
        const controllerSocket =
          session.controllerSocket;

        this.sessionManager.unregisterAgent(
          remoteSessionId
        );

        if (
          controllerSocket &&
          controllerSocket.readyState ===
            WebSocket.OPEN
        ) {
          this.safeSend(
            controllerSocket,
            {
              type: 'CONTROL_STOPPED',
              reason:
                'agent_disconnected',
              remoteSessionId,
            }
          );
        }

        continue;
      }

      if (
        session.controllerSocket ===
        ws
      ) {
        const agentSocket =
          session.agentSocket;

        this.sessionManager.unregisterController(
          remoteSessionId
        );

        if (
          agentSocket &&
          agentSocket.readyState ===
            WebSocket.OPEN
        ) {
          this.safeSend(
            agentSocket,
            {
              type: 'CONTROL_STOPPED',
              reason:
                'controller_disconnected',
              remoteSessionId,
            }
          );
        }
      }
    }
  }

  /**
   * ------------------------------------------------------------
   * HTTP ROUTER
   * ------------------------------------------------------------
   */
  private async handleHttpRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const parsedUrl =
      url.parse(req.url || '', true);

    const pathname =
      parsedUrl.pathname || '/';

    /**
     * CORS headers for browser HTTP requests.
     */
    this.applyCorsHeaders(
      req,
      res
    );

    if (
      req.method === 'OPTIONS'
    ) {
      res.writeHead(204);
      res.end();
      return;
    }

    /**
     * Health landing route.
     */
    if (
      req.method === 'GET' &&
      pathname === '/'
    ) {
      this.sendJson(
        res,
        200,
        {
          status: 'ok',
          service:
            'InsuranceOne Remote Control Relay',
          websocket:
            '/remote-control',
          authorize:
            '/remote-control/authorize',
        }
      );

      return;
    }

    /**
     * Health endpoint.
     */
    if (
      req.method === 'GET' &&
      pathname === '/health'
    ) {
      this.sendJson(
        res,
        200,
        {
          status: 'ok',
          timestamp:
            new Date().toISOString(),
          sessions:
            this.sessionManager
              .getSessionCount(),
          activeControl:
            this.sessionManager
              .getActiveControlCount(),
        }
      );

      return;
    }

    /**
     * Metrics endpoint.
     */
    if (
      req.method === 'GET' &&
      pathname === '/metrics'
    ) {
      this.sendJson(
        res,
        200,
        {
          sessions:
            this.sessionManager
              .getSessionCount(),

          activeControl:
            this.sessionManager
              .getActiveControlCount(),

          connections:
            this.wss.clients.size,
        }
      );

      return;
    }

    /**
     * ----------------------------------------------------------
     * REMOTE CONTROL AUTHORIZATION
     * ----------------------------------------------------------
     *
     * Customer calls this AFTER clicking Accept Control.
     *
     * Render generates:
     *
     * agentToken
     * controllerToken
     *
     * REMOTE_SESSION_SECRET never leaves Render.
     */
    if (
      req.method === 'POST' &&
      pathname ===
        '/remote-control/authorize'
    ) {
      await this.handleAuthorizeRequest(
        req,
        res
      );

      return;
    }

    this.sendJson(
      res,
      404,
      {
        error: 'NOT_FOUND',
      }
    );
  }

  /**
   * ------------------------------------------------------------
   * AUTHORIZE REMOTE CONTROL
   * ------------------------------------------------------------
   */
  private async handleAuthorizeRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    try {
      /**
       * Only allow browser calls from configured frontend.
       */
      const origin =
        req.headers.origin || '';

      if (
        origin &&
        !this.isOriginAllowed(origin)
      ) {
        this.sendJson(
          res,
          403,
          {
            error:
              'ORIGIN_NOT_ALLOWED',
          }
        );

        return;
      }

      const body =
        await this.readJsonBody<
          AuthorizeRemoteControlRequest
        >(req);

      if (!body) {
        this.sendJson(
          res,
          400,
          {
            error:
              'INVALID_REQUEST',
            message:
              'Missing JSON request body',
          }
        );

        return;
      }

      const {
        remoteSessionId,
        meetingId,
        customerId,
        controllerId,
        controllerRole,
      } = body;

      if (
        !remoteSessionId ||
        !meetingId ||
        !customerId ||
        !controllerId ||
        !controllerRole
      ) {
        this.sendJson(
          res,
          400,
          {
            error:
              'INVALID_REQUEST',
            message:
              'remoteSessionId, meetingId, customerId, controllerId and controllerRole are required',
          }
        );

        return;
      }

      if (
        !this.isControllerRole(
          controllerRole
        )
      ) {
        this.sendJson(
          res,
          400,
          {
            error:
              'INVALID_CONTROLLER_ROLE',
            message:
              'controllerRole must be officer or advisor',
          }
        );

        return;
      }

      /**
       * Generate signed short-lived Agent token.
       */
      const agentToken =
        this.authService
          .generateAgentToken(
            remoteSessionId,
            meetingId,
            customerId
          );

      /**
       * Generate signed short-lived Controller token.
       */
      const controllerToken =
        this.authService
          .generateControllerToken(
            remoteSessionId,
            meetingId,
            controllerId,
            controllerRole
          );

      const response:
        AuthorizeRemoteControlResponse =
        {
          remoteSessionId,

          agentToken,
          controllerToken,

          expiresInMs:
            this.authService
              .getTokenExpiryMs(),
        };

      /**
       * IMPORTANT:
       *
       * Never log actual tokens.
       */
      console.log(
        `[Server] Remote control authorized: session=${remoteSessionId}, controller=${controllerId}, role=${controllerRole}`
      );

      this.sendJson(
        res,
        200,
        response
      );
    } catch (err) {
      console.error(
        '[Server] Authorization endpoint failed:',
        err
      );

      this.sendJson(
        res,
        500,
        {
          error:
            'AUTHORIZATION_FAILED',
        }
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * JSON BODY READER
   * ------------------------------------------------------------
   */
  private readJsonBody<T>(
    req: http.IncomingMessage
  ): Promise<T | null> {
    return new Promise(
      (resolve, reject) => {
        const chunks: Buffer[] = [];

        let size = 0;

        /**
         * Authorization body should be tiny.
         * Limit to 32KB.
         */
        const MAX_BODY_SIZE =
          32 * 1024;

        req.on(
          'data',
          (chunk: Buffer) => {
            size += chunk.length;

            if (
              size >
              MAX_BODY_SIZE
            ) {
              reject(
                new Error(
                  'Request body too large'
                )
              );

              req.destroy();

              return;
            }

            chunks.push(chunk);
          }
        );

        req.on('end', () => {
          try {
            const raw =
              Buffer.concat(
                chunks
              ).toString('utf8');

            if (!raw) {
              resolve(null);

              return;
            }

            resolve(
              JSON.parse(raw) as T
            );
          } catch (err) {
            reject(err);
          }
        });

        req.on(
          'error',
          reject
        );
      }
    );
  }

  /**
   * ------------------------------------------------------------
   * CORS
   * ------------------------------------------------------------
   */
  private applyCorsHeaders(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    const origin =
      req.headers.origin || '';

    if (
      origin &&
      this.isOriginAllowed(origin)
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
      'Content-Type,Authorization'
    );

    res.setHeader(
      'Access-Control-Max-Age',
      '86400'
    );
  }

  /**
   * ------------------------------------------------------------
   * ORIGIN VALIDATION
   * ------------------------------------------------------------
   */
  private isOriginAllowed(
    origin: string
  ): boolean {
    /**
     * Electron / Node clients generally do not send Origin.
     */
    if (!origin) {
      return true;
    }

    return ALLOWED_ORIGINS.includes(
      origin
    );
  }

  /**
   * ------------------------------------------------------------
   * ROLE VALIDATION
   * ------------------------------------------------------------
   */
  private isControllerRole(
    role: unknown
  ): role is ControllerRole {
    return (
      role === 'officer' ||
      role === 'advisor'
    );
  }

  /**
   * ------------------------------------------------------------
   * JSON RESPONSE
   * ------------------------------------------------------------
   */
  private sendJson(
    res: http.ServerResponse,
    statusCode: number,
    data: unknown
  ): void {
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
      JSON.stringify(data)
    );
  }

  /**
   * ------------------------------------------------------------
   * SAFE WEBSOCKET SEND
   * ------------------------------------------------------------
   */
  private safeSend(
    ws: WebSocket,
    message: object
  ): void {
    if (
      ws.readyState !==
      WebSocket.OPEN
    ) {
      return;
    }

    try {
      ws.send(
        JSON.stringify(message)
      );
    } catch (err) {
      console.error(
        '[Server] Failed to send WebSocket message:',
        err
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * CLIENT IP
   * ------------------------------------------------------------
   */
  private getClientIp(
    req: http.IncomingMessage
  ): string {
    const forwarded =
      req.headers[
        'x-forwarded-for'
      ];

    if (
      typeof forwarded ===
      'string'
    ) {
      return (
        forwarded
          .split(',')[0]
          ?.trim() ||
        'unknown'
      );
    }

    return (
      req.socket
        .remoteAddress ||
      'unknown'
    );
  }

  /**
   * ------------------------------------------------------------
   * START
   * ------------------------------------------------------------
   */
  start(): void {
    const bindAddress =
      process.env.HOST ||
      '0.0.0.0';

    this.httpServer.listen(
      PORT,
      bindAddress,
      () => {
        console.log(
          `[Server] Remote Control Relay listening on ${bindAddress}:${PORT}`
        );

        console.log(
          '[Server] WebSocket endpoint: /remote-control'
        );

        console.log(
          '[Server] Authorization endpoint: POST /remote-control/authorize'
        );

        console.log(
          `[Server] Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`
        );

        console.log(
          `[Server] Environment: ${
            process.env.NODE_ENV ||
            'development'
          }`
        );
      }
    );
  }

  /**
   * ------------------------------------------------------------
   * STOP
   * ------------------------------------------------------------
   */
  stop(): void {
    console.log(
      '[Server] Shutting down...'
    );

    for (
      const heartbeat of
      this.clientHeartbeats.values()
    ) {
      clearInterval(
        heartbeat
      );
    }

    this.clientHeartbeats.clear();

    this.sessionManager.destroy();

    try {
      this.wss.close();
    } catch {
      // Ignore shutdown error.
    }

    this.httpServer.close();
  }
}

/**
 * --------------------------------------------------------------
 * START SERVER
 * --------------------------------------------------------------
 */
const server =
  new RemoteControlServer();

server.start();

/**
 * --------------------------------------------------------------
 * GRACEFUL SHUTDOWN
 * --------------------------------------------------------------
 */
process.on(
  'SIGTERM',
  () => {
    console.log(
      '[Server] SIGTERM received'
    );

    server.stop();

    process.exit(0);
  }
);

process.on(
  'SIGINT',
  () => {
    console.log(
      '[Server] SIGINT received'
    );

    server.stop();

    process.exit(0);
  }
);