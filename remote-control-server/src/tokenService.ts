import crypto from 'crypto';

/**
 * Token generation service for the website backend
 * This should be used by your existing backend to generate tokens
 * for Agent and Controller registration with the relay server
 */

export interface TokenPayload {
  remoteSessionId: string;
  meetingId: string;
  userId: string;
  role: 'agent' | 'controller';
  controllerRole?: 'officer' | 'adviser';
  iat: number;
  exp: number;
}

export class RemoteControlTokenService {
  private secret: string;
  private tokenExpiryMs: number = 5 * 60 * 1000; // 5 minutes

  constructor(secret?: string) {
    this.secret = secret || process.env.REMOTE_SESSION_SECRET || 'dev-secret-change-in-production';
  }

  /**
   * Generate a token for Agent registration
   * Call this when Customer approves screen sharing
   */
  generateAgentToken(remoteSessionId: string, meetingId: string, customerId: string): string {
    const payload: TokenPayload = {
      remoteSessionId,
      meetingId,
      userId: customerId,
      role: 'agent',
      iat: Date.now(),
      exp: Date.now() + this.tokenExpiryMs,
    };

    return this.signToken(payload);
  }

  /**
   * Generate a token for Controller registration
   * Call this when Customer approves control request
   */
  generateControllerToken(
    remoteSessionId: string,
    meetingId: string,
    controllerId: string,
    controllerRole: 'officer' | 'adviser'
  ): string {
    const payload: TokenPayload = {
      remoteSessionId,
      meetingId,
      userId: controllerId,
      role: 'controller',
      controllerRole,
      iat: Date.now(),
      exp: Date.now() + this.tokenExpiryMs,
    };

    return this.signToken(payload);
  }

  /**
   * Sign a token payload
   */
  private signToken(payload: TokenPayload): string {
    const payloadStr = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payloadStr)
      .digest('hex');

    return `${Buffer.from(payloadStr).toString('base64')}.${signature}`;
  }
}
