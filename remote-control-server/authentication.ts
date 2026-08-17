import crypto from 'crypto';

export interface TokenPayload {
  remoteSessionId: string;
  meetingId: string;
  userId: string;
  role: 'agent' | 'controller';
  controllerRole?: 'officer' | 'advisor';
  iat: number;
  exp: number;
}

export class AuthenticationService {
  private secret: string;
  private tokenExpiryMs: number = 5 * 60 * 1000; // 5 minutes

  constructor(secret?: string) {
    this.secret = secret || process.env.REMOTE_SESSION_SECRET || 'dev-secret-change-in-production';
  }

  /**
   * Generate a signed token for Agent or Controller
   */
  generateToken(
    remoteSessionId: string,
    meetingId: string,
    userId: string,
    role: 'agent' | 'controller',
    controllerRole?: 'officer' | 'advisor'
  ): string {
    const payload: TokenPayload = {
      remoteSessionId,
      meetingId,
      userId,
      role,
      controllerRole,
      iat: Date.now(),
      exp: Date.now() + this.tokenExpiryMs,
    };

    const payloadStr = JSON.stringify(payload);
    const signature = this.sign(payloadStr);
    return `${Buffer.from(payloadStr).toString('base64')}.${signature}`;
  }

  /**
   * Verify and decode a token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const [payloadB64, signature] = token.split('.');
      if (!payloadB64 || !signature) return null;

      const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf-8');
      const expectedSignature = this.sign(payloadStr);

      // Constant-time comparison to prevent timing attacks
      if (!this.constantTimeCompare(signature, expectedSignature)) {
        return null;
      }

      const payload: TokenPayload = JSON.parse(payloadStr);

      // Check expiry
      if (payload.exp < Date.now()) {
        return null;
      }

      return payload;
    } catch (err) {
      console.error('[Auth] Token verification failed:', err);
      return null;
    }
  }

  /**
   * Sign a payload
   */
  private sign(payload: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Constant-time string comparison
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Validate Agent registration token
   */
  validateAgentToken(token: string, remoteSessionId: string, customerId: string): boolean {
    const payload = this.verifyToken(token);
    if (!payload) return false;

    return (
      payload.role === 'agent' &&
      payload.remoteSessionId === remoteSessionId &&
      payload.userId === customerId
    );
  }

  /**
   * Validate Controller registration token
   */
  validateControllerToken(
    token: string,
    remoteSessionId: string,
    controllerId: string,
    controllerRole: 'officer' | 'advisor'
  ): boolean {
    const payload = this.verifyToken(token);
    if (!payload) return false;

    return (
      payload.role === 'controller' &&
      payload.remoteSessionId === remoteSessionId &&
      payload.userId === controllerId &&
      payload.controllerRole === controllerRole
    );
  }
}
