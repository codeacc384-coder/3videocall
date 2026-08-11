export interface SessionContext {
  meetingId: string;
  customerId: string;
  userId: string;
  remoteSessionId: string;
  authToken: string;
  expiresAt: number;
}

export class AgentSecurity {
  private activeSessions: Map<string, SessionContext> = new Map();

  validateSession(
    remoteSessionId: string,
    authToken: string,
    meetingId: string,
    customerId: string
  ): boolean {
    const session = this.activeSessions.get(remoteSessionId);

    if (!session) {
      console.log('[Security] Session not found:', remoteSessionId);
      return false;
    }

    if (session.authToken !== authToken) {
      console.log('[Security] Invalid auth token');
      return false;
    }

    if (session.expiresAt < Date.now()) {
      console.log('[Security] Session expired');
      this.activeSessions.delete(remoteSessionId);
      return false;
    }

    if (session.meetingId !== meetingId || session.customerId !== customerId) {
      console.log('[Security] Meeting/Customer mismatch');
      return false;
    }

    return true;
  }

  registerSession(
    remoteSessionId: string,
    authToken: string,
    meetingId: string,
    customerId: string,
    userId: string,
    tokenExpiryMs: number = 5 * 60 * 1000 // 5 minutes
  ): void {
    this.activeSessions.set(remoteSessionId, {
      remoteSessionId,
      authToken,
      meetingId,
      customerId,
      userId,
      expiresAt: Date.now() + tokenExpiryMs,
    });

    console.log('[Security] Session registered:', remoteSessionId);
  }

  unregisterSession(remoteSessionId: string): void {
    this.activeSessions.delete(remoteSessionId);
    console.log('[Security] Session unregistered:', remoteSessionId);
  }

  getSession(remoteSessionId: string): SessionContext | undefined {
    return this.activeSessions.get(remoteSessionId);
  }

  clearExpiredSessions(): void {
    const now = Date.now();
    let cleared = 0;

    for (const [key, session] of this.activeSessions.entries()) {
      if (session.expiresAt < now) {
        this.activeSessions.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log('[Security] Cleared', cleared, 'expired sessions');
    }
  }
}
