import WebSocket, { Server as WebSocketServer } from 'ws';
import http from 'http';
import url from 'url';
import { SessionManager } from './sessionManager';
import { AuthenticationService } from './authentication';
import { MessageRouter } from './messageRouter';

const PORT = parseInt(process.env.PORT || '8080', 10);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

class RemoteControlServer {
  private httpServer: http.Server;
  private wss: WebSocketServer;
  private sessionManager: SessionManager;
  private authService: AuthenticationService;
  private messageRouter: MessageRouter;
  private clientHeartbeats: Map<WebSocket, NodeJS.Timeout> = new Map();

  constructor() {
    this.httpServer = http.createServer(this.handleHttpRequest.bind(this));
    this.sessionManager = new SessionManager();
    this.authService = new AuthenticationService();
    this.messageRouter = new MessageRouter(this.sessionManager, this.authService);

    this.wss = new WebSocketServer({ server: this.httpServer });
    this.setupWebSocketServer();
  }

  /**
   * Setup WebSocket server
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      const clientIp = this.getClientIp(req);
      console.log(`[Server] New WebSocket connection from ${clientIp}`);

      // Validate origin
      const origin = req.headers.origin || '';
      if (!this.isOriginAllowed(origin)) {
        console.warn(`[Server] Connection rejected: invalid origin ${origin}`);
        ws.close(1008, 'Invalid origin');
        return;
      }

      // Setup heartbeat
      this.setupHeartbeat(ws);

      // Handle messages
      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = data.toString();
          // Determine if this is agent or controller based on message content
          const isAgent = message.includes('"type":"AGENT_REGISTER"');
          this.messageRouter.routeMessage(ws, message, isAgent);
        } catch (err) {
          console.error('[Server] Message handling error:', err);
        }
      });

      // Handle close
      ws.on('close', () => {
        console.log(`[Server] WebSocket closed from ${clientIp}`);
        this.cleanupConnection(ws);
      });

      // Handle error
      ws.on('error', (err) => {
        console.error(`[Server] WebSocket error from ${clientIp}:`, err);
      });
    });

    console.log(`[Server] WebSocket server initialized on port ${PORT}`);
  }

  /**
   * Setup heartbeat for connection
   */
  private setupHeartbeat(ws: WebSocket): void {
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(heartbeat);
        this.clientHeartbeats.delete(ws);
      }
    }, HEARTBEAT_INTERVAL);

    this.clientHeartbeats.set(ws, heartbeat);

    ws.on('pong', () => {
      // Connection is alive
    });
  }

  /**
   * Cleanup connection
   */
  private cleanupConnection(ws: WebSocket): void {
    // Clear heartbeat
    const heartbeat = this.clientHeartbeats.get(ws);
    if (heartbeat) {
      clearInterval(heartbeat);
      this.clientHeartbeats.delete(ws);
    }

    // Find and cleanup session
    for (const [remoteSessionId, session] of (this.sessionManager as any).sessions.entries()) {
      if (session.agentSocket === ws) {
        this.sessionManager.unregisterAgent(remoteSessionId);
        // Notify controller
        if (session.controllerSocket && session.controllerSocket.readyState === WebSocket.OPEN) {
          session.controllerSocket.send(
            JSON.stringify({
              type: 'CONTROL_STOPPED',
              reason: 'agent_disconnected',
              remoteSessionId,
            })
          );
        }
      } else if (session.controllerSocket === ws) {
        this.sessionManager.unregisterController(remoteSessionId);
        // Notify agent
        if (session.agentSocket && session.agentSocket.readyState === WebSocket.OPEN) {
          session.agentSocket.send(
            JSON.stringify({
              type: 'CONTROL_STOPPED',
              reason: 'controller_disconnected',
              remoteSessionId,
            })
          );
        }
      }
    }
  }

  /**
   * Handle HTTP requests (health check, metrics)
   */
  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const parsedUrl = url.parse(req.url || '', true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          sessions: this.sessionManager.getSessionCount(),
          activeControl: this.sessionManager.getActiveControlCount(),
        })
      );
    } else if (pathname === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          sessions: this.sessionManager.getSessionCount(),
          activeControl: this.sessionManager.getActiveControlCount(),
          connections: this.wss.clients.size,
        })
      );
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  /**
   * Validate origin
   */
  private isOriginAllowed(origin: string): boolean {
    if (!origin) return true; // Allow requests without origin (e.g., from Electron)

    return ALLOWED_ORIGINS.some((allowed) => {
      const allowedTrimmed = allowed.trim();
      return origin === allowedTrimmed || origin.startsWith(allowedTrimmed);
    });
  }

  /**
   * Get client IP
   */
  private getClientIp(req: http.IncomingMessage): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Start server
   */
  start(): void {
    this.httpServer.listen(PORT, () => {
      console.log(`[Server] Remote Control Relay Server listening on port ${PORT}`);
      console.log(`[Server] WebSocket endpoint: ws://localhost:${PORT}/remote-control`);
      console.log(`[Server] Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }

  /**
   * Stop server
   */
  stop(): void {
    console.log('[Server] Shutting down...');
    this.wss.close();
    this.httpServer.close();
  }
}

// Start server
const server = new RemoteControlServer();
server.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  server.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully');
  server.stop();
  process.exit(0);
});
