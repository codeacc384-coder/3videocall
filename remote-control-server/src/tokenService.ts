import {
  AuthenticationService,
} from './authentication.js';

import type {
  ControllerRole,
} from './types.js';

/**
 * RemoteControlTokenService
 *
 * Thin compatibility wrapper around AuthenticationService.
 *
 * IMPORTANT:
 * All token signing must use the SAME:
 *
 * REMOTE_SESSION_SECRET
 *
 * as the relay AuthenticationService.
 *
 * Do not duplicate HMAC/token logic here.
 */
export class RemoteControlTokenService {
  private readonly authService:
    AuthenticationService;

  constructor(secret?: string) {
    this.authService =
      new AuthenticationService(secret);
  }

  /**
   * Generate Agent token.
   *
   * Used by Customer Electron Agent for:
   *
   * AGENT_REGISTER
   */
  generateAgentToken(
    remoteSessionId: string,
    meetingId: string,
    customerId: string
  ): string {
    return this.authService
      .generateAgentToken(
        remoteSessionId,
        meetingId,
        customerId
      );
  }

  /**
   * Generate Controller token.
   *
   * Used by Officer / Advisor browser for:
   *
   * CONTROLLER_REGISTER
   */
  generateControllerToken(
    remoteSessionId: string,
    meetingId: string,
    controllerId: string,
    controllerRole: ControllerRole
  ): string {
    return this.authService
      .generateControllerToken(
        remoteSessionId,
        meetingId,
        controllerId,
        controllerRole
      );
  }

  /**
   * Optional verification helper.
   *
   * Useful for debugging/tests.
   */
  verifyToken(token: string) {
    return this.authService
      .verifyToken(token);
  }

  /**
   * Token lifetime in milliseconds.
   */
  getTokenExpiryMs(): number {
    return this.authService
      .getTokenExpiryMs();
  }
}