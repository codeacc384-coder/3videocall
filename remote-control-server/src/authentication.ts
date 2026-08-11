import crypto from 'crypto';
import type { ControllerRole } from './types.js';

/**
 * Payload embedded inside short-lived signed relay tokens.
 *
 * These tokens are generated ONLY by the Render backend.
 *
 * Never generate these tokens in the React frontend.
 * Never expose REMOTE_SESSION_SECRET to the frontend.
 */
export interface TokenPayload {
  remoteSessionId: string;
  meetingId: string;
  userId: string;

  role: 'agent' | 'controller';

  /**
   * Present only when role === "controller".
   */
  controllerRole?: ControllerRole;

  /**
   * Unix timestamp in milliseconds.
   */
  iat: number;

  /**
   * Unix timestamp in milliseconds.
   */
  exp: number;
}

export class AuthenticationService {
  private readonly secret: string;

  /**
   * Remote-control authorization token lifetime.
   *
   * 5 minutes is enough for:
   *
   * Customer Accept
   * ↓
   * Agent registration
   * ↓
   * Controller registration
   *
   * The active remote-control session itself can live longer.
   */
  private readonly tokenExpiryMs = 5 * 60 * 1000;

  constructor(secret?: string) {
    const configuredSecret =
      secret ||
      process.env.REMOTE_SESSION_SECRET ||
      '';

    /**
     * Never silently use a predictable production secret.
     */
    if (!configuredSecret) {
      throw new Error(
        '[Auth] REMOTE_SESSION_SECRET is not configured'
      );
    }

    /**
     * Require a reasonable minimum length.
     */
    if (configuredSecret.length < 32) {
      throw new Error(
        '[Auth] REMOTE_SESSION_SECRET must be at least 32 characters long'
      );
    }

    this.secret = configuredSecret;
  }

  /**
   * Token lifetime exposed for:
   *
   * POST /remote-control/authorize
   *
   * response:
   *
   * {
   *   expiresInMs: ...
   * }
   */
  getTokenExpiryMs(): number {
    return this.tokenExpiryMs;
  }

  /**
   * ------------------------------------------------------------
   * GENERIC TOKEN GENERATION
   * ------------------------------------------------------------
   */
  generateToken(
    remoteSessionId: string,
    meetingId: string,
    userId: string,
    role: 'agent' | 'controller',
    controllerRole?: ControllerRole
  ): string {
    if (!remoteSessionId) {
      throw new Error(
        '[Auth] remoteSessionId is required'
      );
    }

    if (!meetingId) {
      throw new Error(
        '[Auth] meetingId is required'
      );
    }

    if (!userId) {
      throw new Error(
        '[Auth] userId is required'
      );
    }

    /**
     * Controller tokens MUST contain a valid role.
     */
    if (
      role === 'controller' &&
      !controllerRole
    ) {
      throw new Error(
        '[Auth] controllerRole is required for controller token'
      );
    }

    const now = Date.now();

    const payload: TokenPayload = {
      remoteSessionId,
      meetingId,
      userId,
      role,
      controllerRole:
        role === 'controller'
          ? controllerRole
          : undefined,
      iat: now,
      exp: now + this.tokenExpiryMs,
    };

    return this.signToken(payload);
  }

  /**
   * ------------------------------------------------------------
   * AGENT TOKEN
   * ------------------------------------------------------------
   *
   * Used by Customer Electron Agent:
   *
   * AGENT_REGISTER
   */
  generateAgentToken(
    remoteSessionId: string,
    meetingId: string,
    customerId: string
  ): string {
    return this.generateToken(
      remoteSessionId,
      meetingId,
      customerId,
      'agent'
    );
  }

  /**
   * ------------------------------------------------------------
   * CONTROLLER TOKEN
   * ------------------------------------------------------------
   *
   * Used by Officer / Advisor browser:
   *
   * CONTROLLER_REGISTER
   */
  generateControllerToken(
    remoteSessionId: string,
    meetingId: string,
    controllerId: string,
    controllerRole: ControllerRole
  ): string {
    return this.generateToken(
      remoteSessionId,
      meetingId,
      controllerId,
      'controller',
      controllerRole
    );
  }

  /**
   * ------------------------------------------------------------
   * VERIFY TOKEN
   * ------------------------------------------------------------
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      if (
        !token ||
        typeof token !== 'string'
      ) {
        return null;
      }

      const parts = token.split('.');

      if (parts.length !== 2) {
        return null;
      }

      const [payloadB64, providedSignature] =
        parts;

      if (
        !payloadB64 ||
        !providedSignature
      ) {
        return null;
      }

      let payloadStr: string;

      try {
        payloadStr = Buffer.from(
          payloadB64,
          'base64'
        ).toString('utf8');
      } catch {
        return null;
      }

      const expectedSignature =
        this.sign(payloadStr);

      if (
        !this.constantTimeCompare(
          providedSignature,
          expectedSignature
        )
      ) {
        return null;
      }

      const payload =
        JSON.parse(payloadStr) as TokenPayload;

      if (
        !this.isValidPayload(payload)
      ) {
        return null;
      }

      /**
       * Expired token.
       */
      if (payload.exp <= Date.now()) {
        return null;
      }

      return payload;
    } catch (err) {
      console.error(
        '[Auth] Token verification failed:',
        err
      );

      return null;
    }
  }

  /**
   * ------------------------------------------------------------
   * AGENT TOKEN VALIDATION
   * ------------------------------------------------------------
   */
  validateAgentToken(
    token: string,
    remoteSessionId: string,
    customerId: string,
    meetingId?: string
  ): boolean {
    const payload =
      this.verifyToken(token);

    if (!payload) {
      return false;
    }

    if (
      payload.role !== 'agent'
    ) {
      return false;
    }

    if (
      payload.remoteSessionId !==
      remoteSessionId
    ) {
      return false;
    }

    if (
      payload.userId !== customerId
    ) {
      return false;
    }

    if (
      meetingId &&
      payload.meetingId !== meetingId
    ) {
      return false;
    }

    return true;
  }

  /**
   * ------------------------------------------------------------
   * CONTROLLER TOKEN VALIDATION
   * ------------------------------------------------------------
   */
  validateControllerToken(
    token: string,
    remoteSessionId: string,
    controllerId: string,
    controllerRole: ControllerRole,
    meetingId?: string
  ): boolean {
    const payload =
      this.verifyToken(token);

    if (!payload) {
      return false;
    }

    if (
      payload.role !== 'controller'
    ) {
      return false;
    }

    if (
      payload.remoteSessionId !==
      remoteSessionId
    ) {
      return false;
    }

    if (
      payload.userId !== controllerId
    ) {
      return false;
    }

    if (
      payload.controllerRole !==
      controllerRole
    ) {
      return false;
    }

    if (
      meetingId &&
      payload.meetingId !== meetingId
    ) {
      return false;
    }

    return true;
  }

  /**
   * ------------------------------------------------------------
   * TOKEN PAYLOAD VALIDATION
   * ------------------------------------------------------------
   */
  private isValidPayload(
    payload: unknown
  ): payload is TokenPayload {
    if (
      !payload ||
      typeof payload !== 'object'
    ) {
      return false;
    }

    const value =
      payload as Partial<TokenPayload>;

    if (
      typeof value.remoteSessionId !==
        'string' ||
      value.remoteSessionId.length === 0
    ) {
      return false;
    }

    if (
      typeof value.meetingId !==
        'string' ||
      value.meetingId.length === 0
    ) {
      return false;
    }

    if (
      typeof value.userId !==
        'string' ||
      value.userId.length === 0
    ) {
      return false;
    }

    if (
      value.role !== 'agent' &&
      value.role !== 'controller'
    ) {
      return false;
    }

    if (
      typeof value.iat !== 'number' ||
      typeof value.exp !== 'number'
    ) {
      return false;
    }

    /**
     * Reject obviously malformed timestamps.
     */
    if (
      value.exp <= value.iat
    ) {
      return false;
    }

    if (
      value.role === 'controller'
    ) {
      if (
        value.controllerRole !==
          'officer' &&
        value.controllerRole !==
          'advisor'
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * ------------------------------------------------------------
   * SIGN TOKEN
   * ------------------------------------------------------------
   */
  private signToken(
    payload: TokenPayload
  ): string {
    const payloadStr =
      JSON.stringify(payload);

    const signature =
      this.sign(payloadStr);

    const encodedPayload =
      Buffer.from(
        payloadStr,
        'utf8'
      ).toString('base64');

    return `${encodedPayload}.${signature}`;
  }

  /**
   * Generate HMAC-SHA256 signature.
   */
  private sign(
    payload: string
  ): string {
    return crypto
      .createHmac(
        'sha256',
        this.secret
      )
      .update(payload)
      .digest('hex');
  }

  /**
   * Constant-time signature comparison.
   */
  private constantTimeCompare(
    a: string,
    b: string
  ): boolean {
    try {
      const aBuffer =
        Buffer.from(a, 'utf8');

      const bBuffer =
        Buffer.from(b, 'utf8');

      if (
        aBuffer.length !==
        bBuffer.length
      ) {
        return false;
      }

      return crypto.timingSafeEqual(
        aBuffer,
        bBuffer
      );
    } catch {
      return false;
    }
  }
}