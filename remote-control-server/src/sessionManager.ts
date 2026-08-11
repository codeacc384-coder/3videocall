import WebSocket from 'ws';
import {
  ActiveRemoteSession,
  ControllerRole,
} from './types.js';

export class SessionManager {
  private sessions: Map<string, ActiveRemoteSession> =
    new Map();

  /**
   * Relay-side active session lifetime.
   *
   * Authorization tokens expire much sooner.
   * This is only the in-memory relay session lifetime.
   */
  private readonly sessionExpiryMs =
    30 * 60 * 1000;

  private readonly cleanupIntervalMs =
    60 * 1000;

  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(
      () => this.cleanupExpiredSessions(),
      this.cleanupIntervalMs
    );
  }

  /**
   * ------------------------------------------------------------
   * CREATE SESSION
   * ------------------------------------------------------------
   *
   * Normally created when Customer Agent registers.
   */
  createSession(
    remoteSessionId: string,
    meetingId: string,
    customerId: string
  ): ActiveRemoteSession {
    if (!remoteSessionId) {
      throw new Error(
        '[SessionManager] remoteSessionId is required'
      );
    }

    if (!meetingId) {
      throw new Error(
        '[SessionManager] meetingId is required'
      );
    }

    if (!customerId) {
      throw new Error(
        '[SessionManager] customerId is required'
      );
    }

    const existing =
      this.sessions.get(remoteSessionId);

    if (existing) {
      /**
       * Do not silently overwrite a session belonging
       * to another meeting/customer.
       */
      if (
        existing.meetingId !== meetingId ||
        existing.customerId !== customerId
      ) {
        throw new Error(
          '[SessionManager] Session identity mismatch'
        );
      }

      existing.expiresAt =
        Date.now() + this.sessionExpiryMs;

      existing.lastHeartbeat =
        Date.now();

      return existing;
    }

    const now = Date.now();

    const session: ActiveRemoteSession = {
      remoteSessionId,
      meetingId,
      customerId,

      controllerId: null,
      controllerRole: null,

      agentSocket: null,
      controllerSocket: null,

      /**
       * Must remain false until:
       *
       * Agent registered
       * Controller registered
       * Customer approval has been authorized
       */
      controlAllowed: false,

      expiresAt:
        now + this.sessionExpiryMs,

      createdAt: now,
      lastHeartbeat: now,
    };

    this.sessions.set(
      remoteSessionId,
      session
    );

    console.log(
      `[SessionManager] Session created: ${remoteSessionId}`
    );

    return session;
  }

  /**
   * ------------------------------------------------------------
   * GET SESSION
   * ------------------------------------------------------------
   */
  getSession(
    remoteSessionId: string
  ): ActiveRemoteSession | undefined {
    const session =
      this.sessions.get(remoteSessionId);

    if (!session) {
      return undefined;
    }

    if (
      session.expiresAt <= Date.now()
    ) {
      this.expireSession(remoteSessionId);

      return undefined;
    }

    return session;
  }

  /**
   * ------------------------------------------------------------
   * REGISTER CUSTOMER AGENT
   * ------------------------------------------------------------
   */
  registerAgent(
    remoteSessionId: string,
    ws: WebSocket
  ): boolean {
    const session =
      this.getSession(remoteSessionId);

    if (!session) {
      console.warn(
        `[SessionManager] Session not found for agent: ${remoteSessionId}`
      );

      return false;
    }

    /**
     * Close/replace a stale previous agent socket.
     */
    if (
      session.agentSocket &&
      session.agentSocket !== ws &&
      session.agentSocket.readyState ===
        WebSocket.OPEN
    ) {
      try {
        session.agentSocket.close(
          1000,
          'Agent replaced'
        );
      } catch {
        // Ignore cleanup error.
      }
    }

    session.agentSocket = ws;
    session.lastHeartbeat = Date.now();

    this.refreshExpiry(session);

    console.log(
      `[SessionManager] Agent registered: ${remoteSessionId}`
    );

    return true;
  }

  /**
   * ------------------------------------------------------------
   * REGISTER OFFICER / ADVISOR CONTROLLER
   * ------------------------------------------------------------
   */
  registerController(
    remoteSessionId: string,
    controllerId: string,
    controllerRole: ControllerRole,
    ws: WebSocket
  ): boolean {
    const session =
      this.getSession(remoteSessionId);

    if (!session) {
      console.warn(
        `[SessionManager] Session not found for controller: ${remoteSessionId}`
      );

      return false;
    }

    if (!controllerId) {
      console.warn(
        '[SessionManager] Missing controllerId'
      );

      return false;
    }

    /**
     * Prevent Officer and Advisor controlling simultaneously.
     */
    if (
      session.controllerId &&
      session.controllerId !== controllerId
    ) {
      console.warn(
        `[SessionManager] Another controller already owns session: ${remoteSessionId}`
      );

      return false;
    }

    /**
     * Replace stale socket for same controller.
     */
    if (
      session.controllerSocket &&
      session.controllerSocket !== ws &&
      session.controllerSocket.readyState ===
        WebSocket.OPEN
    ) {
      try {
        session.controllerSocket.close(
          1000,
          'Controller replaced'
        );
      } catch {
        // Ignore cleanup error.
      }
    }

    session.controllerId = controllerId;
    session.controllerRole =
      controllerRole;
    session.controllerSocket = ws;
    session.lastHeartbeat = Date.now();

    this.refreshExpiry(session);

    console.log(
      `[SessionManager] Controller registered: ${remoteSessionId} (${controllerRole})`
    );

    return true;
  }

  /**
   * ------------------------------------------------------------
   * APPROVE / ACTIVATE CONTROL
   * ------------------------------------------------------------
   *
   * This should only be called after:
   *
   * 1. Customer approved the request.
   * 2. Customer Agent registered.
   * 3. Officer/Advisor registered.
   */
  approveControl(
    remoteSessionId: string
  ): boolean {
    const session =
      this.getSession(remoteSessionId);

    if (!session) {
      console.warn(
        `[SessionManager] Cannot approve missing session: ${remoteSessionId}`
      );

      return false;
    }

    if (!this.isAgentConnected(session)) {
      console.warn(
        `[SessionManager] Cannot approve: Agent not connected (${remoteSessionId})`
      );

      return false;
    }

    if (!this.isControllerConnected(session)) {
      console.warn(
        `[SessionManager] Cannot approve: Controller not connected (${remoteSessionId})`
      );

      return false;
    }

    if (
      !session.controllerId ||
      !session.controllerRole
    ) {
      console.warn(
        `[SessionManager] Cannot approve: Controller identity missing (${remoteSessionId})`
      );

      return false;
    }

    session.controlAllowed = true;
    session.lastHeartbeat = Date.now();

    this.refreshExpiry(session);

    console.log(
      `[SessionManager] Control active: ${remoteSessionId}`
    );

    return true;
  }

  /**
   * ------------------------------------------------------------
   * STOP CONTROL
   * ------------------------------------------------------------
   *
   * Keep Agent attached so another request may be started
   * without restarting the Agent.
   */
  stopControl(
    remoteSessionId: string
  ): boolean {
    const session =
      this.getSession(remoteSessionId);

    if (!session) {
      return false;
    }

    session.controlAllowed = false;

    /**
     * Controller ownership is released.
     */
    session.controllerId = null;
    session.controllerRole = null;
    session.controllerSocket = null;

    session.lastHeartbeat = Date.now();

    this.refreshExpiry(session);

    console.log(
      `[SessionManager] Control stopped: ${remoteSessionId}`
    );

    return true;
  }

  /**
   * ------------------------------------------------------------
   * UNREGISTER CUSTOMER AGENT
   * ------------------------------------------------------------
   */
  unregisterAgent(
    remoteSessionId: string
  ): void {
    const session =
      this.getSession(remoteSessionId);

    if (!session) return;

    session.agentSocket = null;
    session.controlAllowed = false;
    session.lastHeartbeat = Date.now();

    console.log(
      `[SessionManager] Agent unregistered: ${remoteSessionId}`
    );
  }

  /**
   * ------------------------------------------------------------
   * UNREGISTER CONTROLLER
   * ------------------------------------------------------------
   */
  unregisterController(
    remoteSessionId: string
  ): void {
    const session =
      this.getSession(remoteSessionId);

    if (!session) return;

    session.controllerSocket = null;
    session.controllerId = null;
    session.controllerRole = null;
    session.controlAllowed = false;
    session.lastHeartbeat = Date.now();

    console.log(
      `[SessionManager] Controller unregistered: ${remoteSessionId}`
    );
  }

  /**
   * ------------------------------------------------------------
   * SOCKET ACCESSORS
   * ------------------------------------------------------------
   */
  getAgentSocket(
    remoteSessionId: string
  ): WebSocket | null {
    return (
      this.getSession(
        remoteSessionId
      )?.agentSocket || null
    );
  }

  getControllerSocket(
    remoteSessionId: string
  ): WebSocket | null {
    return (
      this.getSession(
        remoteSessionId
      )?.controllerSocket || null
    );
  }

  /**
   * ------------------------------------------------------------
   * SESSION STATE HELPERS
   * ------------------------------------------------------------
   */
  isControlAllowed(
    remoteSessionId: string
  ): boolean {
    const session =
      this.getSession(remoteSessionId);

    return Boolean(
      session &&
      session.controlAllowed &&
      this.isAgentConnected(session) &&
      this.isControllerConnected(session)
    );
  }

  isControllerAuthorized(
    remoteSessionId: string,
    controllerId: string
  ): boolean {
    const session =
      this.getSession(remoteSessionId);

    if (!session) return false;

    return (
      session.controllerId ===
        controllerId &&
      session.controlAllowed &&
      this.isControllerConnected(
        session
      )
    );
  }

  isAgentRegistered(
    remoteSessionId: string
  ): boolean {
    const session =
      this.getSession(remoteSessionId);

    if (!session) return false;

    return this.isAgentConnected(
      session
    );
  }

  isControllerRegistered(
    remoteSessionId: string
  ): boolean {
    const session =
      this.getSession(remoteSessionId);

    if (!session) return false;

    return this.isControllerConnected(
      session
    );
  }

  /**
   * Returns true only when the relay is ready
   * to activate remote control.
   */
  isSessionReady(
    remoteSessionId: string
  ): boolean {
    const session =
      this.getSession(remoteSessionId);

    if (!session) return false;

    return (
      this.isAgentConnected(session) &&
      this.isControllerConnected(
        session
      ) &&
      Boolean(session.controllerId) &&
      Boolean(session.controllerRole)
    );
  }

  /**
   * ------------------------------------------------------------
   * HEARTBEAT
   * ------------------------------------------------------------
   */
  updateHeartbeat(
    remoteSessionId: string
  ): void {
    const session =
      this.getSession(remoteSessionId);

    if (!session) return;

    session.lastHeartbeat =
      Date.now();

    this.refreshExpiry(session);
  }

  /**
   * ------------------------------------------------------------
   * DELETE SESSION
   * ------------------------------------------------------------
   */
  deleteSession(
    remoteSessionId: string
  ): void {
    const session =
      this.sessions.get(remoteSessionId);

    if (session) {
      this.closeSocket(
        session.agentSocket,
        'Session deleted'
      );

      this.closeSocket(
        session.controllerSocket,
        'Session deleted'
      );
    }

    this.sessions.delete(
      remoteSessionId
    );

    console.log(
      `[SessionManager] Session deleted: ${remoteSessionId}`
    );
  }

  /**
   * ------------------------------------------------------------
   * READ-ONLY SESSION ITERATION
   * ------------------------------------------------------------
   *
   * Used by server cleanup logic.
   *
   * This avoids accessing private "sessions"
   * through `(this.sessionManager as any)`.
   */
  getSessions(): ReadonlyMap<
    string,
    ActiveRemoteSession
  > {
    return this.sessions;
  }

  /**
   * ------------------------------------------------------------
   * METRICS
   * ------------------------------------------------------------
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  getActiveControlCount(): number {
    let count = 0;

    for (
      const session of
      this.sessions.values()
    ) {
      if (
        session.controlAllowed &&
        this.isAgentConnected(
          session
        ) &&
        this.isControllerConnected(
          session
        )
      ) {
        count++;
      }
    }

    return count;
  }

  /**
   * ------------------------------------------------------------
   * CLEANUP
   * ------------------------------------------------------------
   */
  private cleanupExpiredSessions(): void {
    let cleaned = 0;

    const now = Date.now();

    for (
      const [
        remoteSessionId,
        session,
      ] of this.sessions.entries()
    ) {
      if (
        session.expiresAt <= now
      ) {
        this.expireSession(
          remoteSessionId
        );

        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(
        `[SessionManager] Cleaned up ${cleaned} expired session(s)`
      );
    }
  }

  private expireSession(
    remoteSessionId: string
  ): void {
    const session =
      this.sessions.get(
        remoteSessionId
      );

    if (!session) return;

    this.closeSocket(
      session.agentSocket,
      'Session expired'
    );

    this.closeSocket(
      session.controllerSocket,
      'Session expired'
    );

    this.sessions.delete(
      remoteSessionId
    );

    console.log(
      `[SessionManager] Session expired: ${remoteSessionId}`
    );
  }

  private refreshExpiry(
    session: ActiveRemoteSession
  ): void {
    session.expiresAt =
      Date.now() +
      this.sessionExpiryMs;
  }

  private isAgentConnected(
    session: ActiveRemoteSession
  ): boolean {
    return Boolean(
      session.agentSocket &&
      session.agentSocket.readyState ===
        WebSocket.OPEN
    );
  }

  private isControllerConnected(
    session: ActiveRemoteSession
  ): boolean {
    return Boolean(
      session.controllerSocket &&
      session.controllerSocket.readyState ===
        WebSocket.OPEN
    );
  }

  private closeSocket(
    socket: WebSocket | null,
    reason: string
  ): void {
    if (
      !socket ||
      socket.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }

    try {
      socket.close(
        1000,
        reason
      );
    } catch {
      // Ignore cleanup errors.
    }
  }

  /**
   * Useful for graceful server shutdown.
   */
  destroy(): void {
    clearInterval(
      this.cleanupTimer
    );

    for (
      const remoteSessionId of
      this.sessions.keys()
    ) {
      this.deleteSession(
        remoteSessionId
      );
    }
  }
}