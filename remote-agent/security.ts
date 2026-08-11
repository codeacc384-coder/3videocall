/**
 * ------------------------------------------------------------
 * LOCAL AGENT SESSION CONTEXT
 * ------------------------------------------------------------
 *
 * IMPORTANT:
 *
 * This is NOT the source of authentication.
 *
 * Authentication happens on the Render relay:
 *
 * agentToken
 *    ↓
 * AGENT_REGISTER
 *    ↓
 * Render validates HMAC
 *    ↓
 * AGENT_REGISTERED
 *
 * Only after AGENT_REGISTERED do we create a local
 * SessionContext here.
 */
export interface SessionContext {
  /**
   * Render remote session ID.
   */
  remoteSessionId: string;

  /**
   * Video consultation / meeting ID.
   */
  meetingId: string;

  /**
   * Customer UUID.
   */
  customerId: string;

  /**
   * Local Customer user ID.
   *
   * Normally equal to customerId.
   * Kept separately for compatibility.
   */
  userId: string;

  /**
   * When this local session was registered.
   */
  registeredAt: number;

  /**
   * Local relay-session expiry.
   *
   * This is NOT the authorization token expiry.
   *
   * The HMAC token is used only during registration.
   */
  expiresAt: number;
}

/**
 * Pending session metadata saved before AGENT_REGISTER.
 *
 * It does NOT mean the session is authenticated yet.
 */
export interface PendingSessionContext {
  remoteSessionId: string;

  meetingId: string;

  customerId: string;

  userId: string;

  createdAt: number;

  expiresAt: number;
}

export class AgentSecurity {
  /**
   * Sessions confirmed by:
   *
   * AGENT_REGISTERED
   */
  private activeSessions:
    Map<
      string,
      SessionContext
    > = new Map();

  /**
   * Temporary session metadata while waiting for Render
   * to validate AGENT_REGISTER.
   */
  private pendingSessions:
    Map<
      string,
      PendingSessionContext
    > = new Map();

  /**
   * Local active session lifetime.
   *
   * Render still remains the real authority.
   */
  private readonly defaultSessionExpiryMs =
    30 * 60 * 1000;

  /**
   * Pending authorization should never sit forever.
   */
  private readonly pendingExpiryMs =
    5 * 60 * 1000;

  /**
   * ------------------------------------------------------------
   * REGISTER PENDING SESSION
   * ------------------------------------------------------------
   *
   * Called BEFORE sending:
   *
   * AGENT_REGISTER
   *
   * to Render.
   *
   * This does NOT activate remote input.
   */
  registerPendingSession(
    remoteSessionId: string,
    meetingId: string,
    customerId: string,
    userId?: string
  ): void {
    this.validateRequiredFields(
      remoteSessionId,
      meetingId,
      customerId
    );

    const now =
      Date.now();

    const pending:
      PendingSessionContext =
      {
        remoteSessionId,

        meetingId,

        customerId,

        userId:
          userId ||
          customerId,

        createdAt:
          now,

        expiresAt:
          now +
          this.pendingExpiryMs,
      };

    this.pendingSessions.set(
      remoteSessionId,
      pending
    );

    console.log(
      '[Security] Pending session registered:',
      remoteSessionId
    );
  }

  /**
   * ------------------------------------------------------------
   * ACTIVATE SESSION
   * ------------------------------------------------------------
   *
   * Call ONLY after Render sends:
   *
   * AGENT_REGISTERED
   */
  activateSession(
    remoteSessionId: string,
    sessionExpiryMs:
      number =
      this.defaultSessionExpiryMs
  ): SessionContext | null {
    const pending =
      this.pendingSessions.get(
        remoteSessionId
      );

    if (!pending) {
      console.warn(
        '[Security] Cannot activate unknown pending session:',
        remoteSessionId
      );

      return null;
    }

    if (
      pending.expiresAt <=
      Date.now()
    ) {
      console.warn(
        '[Security] Pending session expired:',
        remoteSessionId
      );

      this.pendingSessions.delete(
        remoteSessionId
      );

      return null;
    }

    const now =
      Date.now();

    const session:
      SessionContext =
      {
        remoteSessionId:
          pending.remoteSessionId,

        meetingId:
          pending.meetingId,

        customerId:
          pending.customerId,

        userId:
          pending.userId,

        registeredAt:
          now,

        expiresAt:
          now +
          Math.max(
            60_000,
            sessionExpiryMs
          ),
      };

    this.activeSessions.set(
      remoteSessionId,
      session
    );

    this.pendingSessions.delete(
      remoteSessionId
    );

    console.log(
      '[Security] Session activated after AGENT_REGISTERED:',
      remoteSessionId
    );

    return session;
  }

  /**
   * ------------------------------------------------------------
   * DIRECT LOCAL SESSION REGISTRATION
   * ------------------------------------------------------------
   *
   * Compatibility helper.
   *
   * Do not use this before Render authentication.
   *
   * Prefer:
   *
   * registerPendingSession()
   *       ↓
   * AGENT_REGISTERED
   *       ↓
   * activateSession()
   */
  registerSession(
    remoteSessionId: string,
    meetingId: string,
    customerId: string,
    userId?: string,
    sessionExpiryMs:
      number =
      this.defaultSessionExpiryMs
  ): SessionContext {
    this.validateRequiredFields(
      remoteSessionId,
      meetingId,
      customerId
    );

    const now =
      Date.now();

    const session:
      SessionContext =
      {
        remoteSessionId,

        meetingId,

        customerId,

        userId:
          userId ||
          customerId,

        registeredAt:
          now,

        expiresAt:
          now +
          Math.max(
            60_000,
            sessionExpiryMs
          ),
      };

    this.activeSessions.set(
      remoteSessionId,
      session
    );

    console.log(
      '[Security] Local session registered:',
      remoteSessionId
    );

    return session;
  }

  /**
   * ------------------------------------------------------------
   * CHECK ACTIVE SESSION
   * ------------------------------------------------------------
   */
  validateSession(
    remoteSessionId: string,
    meetingId?: string,
    customerId?: string
  ): boolean {
    const session =
      this.getSession(
        remoteSessionId
      );

    if (!session) {
      return false;
    }

    if (
      meetingId &&
      session.meetingId !==
        meetingId
    ) {
      console.warn(
        '[Security] Meeting mismatch:',
        remoteSessionId
      );

      return false;
    }

    if (
      customerId &&
      session.customerId !==
        customerId
    ) {
      console.warn(
        '[Security] Customer mismatch:',
        remoteSessionId
      );

      return false;
    }

    return true;
  }

  /**
   * ------------------------------------------------------------
   * GET ACTIVE SESSION
   * ------------------------------------------------------------
   */
  getSession(
    remoteSessionId: string
  ): SessionContext | undefined {
    const session =
      this.activeSessions.get(
        remoteSessionId
      );

    if (!session) {
      return undefined;
    }

    if (
      session.expiresAt <=
      Date.now()
    ) {
      console.warn(
        '[Security] Active session expired:',
        remoteSessionId
      );

      this.activeSessions.delete(
        remoteSessionId
      );

      return undefined;
    }

    return session;
  }

  /**
   * ------------------------------------------------------------
   * GET PENDING SESSION
   * ------------------------------------------------------------
   */
  getPendingSession(
    remoteSessionId: string
  ):
    | PendingSessionContext
    | undefined {
    const session =
      this.pendingSessions.get(
        remoteSessionId
      );

    if (!session) {
      return undefined;
    }

    if (
      session.expiresAt <=
      Date.now()
    ) {
      this.pendingSessions.delete(
        remoteSessionId
      );

      return undefined;
    }

    return session;
  }

  /**
   * ------------------------------------------------------------
   * ACTIVE CHECK
   * ------------------------------------------------------------
   */
  hasActiveSession(
    remoteSessionId: string
  ): boolean {
    return Boolean(
      this.getSession(
        remoteSessionId
      )
    );
  }

  /**
   * ------------------------------------------------------------
   * UNREGISTER SESSION
   * ------------------------------------------------------------
   */
  unregisterSession(
    remoteSessionId: string
  ): void {
    const hadActive =
      this.activeSessions.delete(
        remoteSessionId
      );

    const hadPending =
      this.pendingSessions.delete(
        remoteSessionId
      );

    if (
      hadActive ||
      hadPending
    ) {
      console.log(
        '[Security] Session removed:',
        remoteSessionId
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * CLEAR ALL
   * ------------------------------------------------------------
   */
  clearAllSessions(): void {
    this.activeSessions.clear();

    this.pendingSessions.clear();

    console.log(
      '[Security] All sessions cleared'
    );
  }

  /**
   * ------------------------------------------------------------
   * CLEANUP EXPIRED
   * ------------------------------------------------------------
   */
  clearExpiredSessions(): void {
    const now =
      Date.now();

    let activeCleared =
      0;

    let pendingCleared =
      0;

    for (
      const [
        remoteSessionId,
        session,
      ] of this.activeSessions
        .entries()
    ) {
      if (
        session.expiresAt <=
        now
      ) {
        this.activeSessions.delete(
          remoteSessionId
        );

        activeCleared++;
      }
    }

    for (
      const [
        remoteSessionId,
        session,
      ] of this.pendingSessions
        .entries()
    ) {
      if (
        session.expiresAt <=
        now
      ) {
        this.pendingSessions.delete(
          remoteSessionId
        );

        pendingCleared++;
      }
    }

    if (
      activeCleared > 0 ||
      pendingCleared > 0
    ) {
      console.log(
        `[Security] Cleared ${activeCleared} active and ${pendingCleared} pending expired session(s)`
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * COUNTS
   * ------------------------------------------------------------
   */
  getActiveSessionCount():
    number {
    return this.activeSessions
      .size;
  }

  getPendingSessionCount():
    number {
    return this.pendingSessions
      .size;
  }

  /**
   * ------------------------------------------------------------
   * VALIDATION
   * ------------------------------------------------------------
   */
  private validateRequiredFields(
    remoteSessionId: string,
    meetingId: string,
    customerId: string
  ): void {
    if (
      !remoteSessionId
    ) {
      throw new Error(
        '[Security] remoteSessionId is required'
      );
    }

    if (
      !meetingId
    ) {
      throw new Error(
        '[Security] meetingId is required'
      );
    }

    if (
      !customerId
    ) {
      throw new Error(
        '[Security] customerId is required'
      );
    }
  }
}