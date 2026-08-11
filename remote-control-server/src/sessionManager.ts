import WebSocket from 'ws';
import { ActiveRemoteSession, ControllerRole } from './types.js';

export class SessionManager {
  private sessions: Map<string, ActiveRemoteSession> = new Map();
  private sessionExpiryMs: number = 30 * 60 * 1000; // 30 minutes
  private cleanupIntervalMs: number = 60 * 1000; // 1 minute

  constructor() {
    // Cleanup expired sessions every minute
    setInterval(() => this.cleanupExpiredSessions(), this.cleanupIntervalMs);
  }

  /**
   * Create a new remote control session
   */
  createSession(remoteSessionId: string, meetingId: string, customerId: string): ActiveRemoteSession {
    const session: ActiveRemoteSession = {
      remoteSessionId,
      meetingId,
      customerId,
      controllerId: null,
      controllerRole: null,
      agentSocket: null,
      controllerSocket: null,
      controlAllowed: false,
      expiresAt: Date.now() + this.sessionExpiryMs,
      createdAt: Date.now(),
      lastHeartbeat: Date.now(),
    };

    this.sessions.set(remoteSessionId, session);
    console.log(`[SessionManager] Session created: ${remoteSessionId}`);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(remoteSessionId: string): ActiveRemoteSession | undefined {
    const session = this.sessions.get(remoteSessionId);
    if (session && session.expiresAt < Date.now()) {
      this.sessions.delete(remoteSessionId);
      console.log(`[SessionManager] Session expired: ${remoteSessionId}`);
      return undefined;
    }
    return session;
  }

  /**
   * Register agent socket
   */
  registerAgent(remoteSessionId: string, ws: WebSocket): boolean {
    const session = this.getSession(remoteSessionId);
    if (!session) {
      console.warn(`[SessionManager] Session not found for agent: ${remoteSessionId}`);
      return false;
    }

    session.agentSocket = ws;
    session.lastHeartbeat = Date.now();
    console.log(`[SessionManager] Agent registered: ${remoteSessionId}`);
    return true;
  }

  /**
   * Register controller socket
   */
  registerController(
    remoteSessionId: string,
    controllerId: string,
    controllerRole: ControllerRole,
    ws: WebSocket
  ): boolean {
    const session = this.getSession(remoteSessionId);
    if (!session) {
      console.warn(`[SessionManager] Session not found for controller: ${remoteSessionId}`);
      return false;
    }

    // Check if another controller already has control
    if (session.controllerId && session.controllerId !== controllerId) {
      console.warn(`[SessionManager] Another controller already has control: ${remoteSessionId}`);
      return false;
    }

    session.controllerId = controllerId;
    session.controllerRole = controllerRole;
    session.controllerSocket = ws;
    session.lastHeartbeat = Date.now();
    console.log(`[SessionManager] Controller registered: ${remoteSessionId} (${controllerRole})`);
    return true;
  }

  /**
   * Approve control
   */
  approveControl(remoteSessionId: string): boolean {
    const session = this.getSession(remoteSessionId);
    if (!session) return false;

    session.controlAllowed = true;
    session.lastHeartbeat = Date.now();
    console.log(`[SessionManager] Control approved: ${remoteSessionId}`);
    return true;
  }

  /**
   * Stop control
   */
  stopControl(remoteSessionId: string): boolean {
    const session = this.getSession(remoteSessionId);
    if (!session) return false;

    session.controlAllowed = false;
    session.controllerId = null;
    session.controllerRole = null;
    session.controllerSocket = null;
    session.lastHeartbeat = Date.now();
    console.log(`[SessionManager] Control stopped: ${remoteSessionId}`);
    return true;
  }

  /**
   * Unregister agent
   */
  unregisterAgent(remoteSessionId: string): void {
    const session = this.getSession(remoteSessionId);
    if (!session) return;

    session.agentSocket = null;
    session.controlAllowed = false;
    console.log(`[SessionManager] Agent unregistered: ${remoteSessionId}`);
  }

  /**
   * Unregister controller
   */
  unregisterController(remoteSessionId: string): void {
    const session = this.getSession(remoteSessionId);
    if (!session) return;

    session.controllerSocket = null;
    session.controlAllowed = false;
    console.log(`[SessionManager] Controller unregistered: ${remoteSessionId}`);
  }

  /**
   * Get agent socket for session
   */
  getAgentSocket(remoteSessionId: string): WebSocket | null {
    const session = this.getSession(remoteSessionId);
    return session?.agentSocket || null;
  }

  /**
   * Get controller socket for session
   */
  getControllerSocket(remoteSessionId: string): WebSocket | null {
    const session = this.getSession(remoteSessionId);
    return session?.controllerSocket || null;
  }

  /**
   * Check if control is allowed
   */
  isControlAllowed(remoteSessionId: string): boolean {
    const session = this.getSession(remoteSessionId);
    return session?.controlAllowed || false;
  }

  /**
   * Check if controller matches
   */
  isControllerAuthorized(remoteSessionId: string, controllerId: string): boolean {
    const session = this.getSession(remoteSessionId);
    return session?.controllerId === controllerId && session?.controlAllowed;
  }

  /**
   * Update heartbeat
   */
  updateHeartbeat(remoteSessionId: string): void {
    const session = this.getSession(remoteSessionId);
    if (session) {
      session.lastHeartbeat = Date.now();
    }
  }

  /**
   * Delete session
   */
  deleteSession(remoteSessionId: string): void {
    this.sessions.delete(remoteSessionId);
    console.log(`[SessionManager] Session deleted: ${remoteSessionId}`);
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    let cleaned = 0;
    for (const [remoteSessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < Date.now()) {
        // Close sockets
        if (session.agentSocket && session.agentSocket.readyState === WebSocket.OPEN) {
          session.agentSocket.close(1000, 'Session expired');
        }
        if (session.controllerSocket && session.controllerSocket.readyState === WebSocket.OPEN) {
          session.controllerSocket.close(1000, 'Session expired');
        }
        this.sessions.delete(remoteSessionId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[SessionManager] Cleaned up ${cleaned} expired sessions`);
    }
  }

  /**
   * Get session count (for monitoring)
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get active control count
   */
  getActiveControlCount(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.controlAllowed && session.agentSocket && session.controllerSocket) {
        count++;
      }
    }
    return count;
  }
}
