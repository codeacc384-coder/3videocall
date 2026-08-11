import { supabase } from '../lib/supabase';
import type {
  RemoteControlSession,
  ControllerRole,
} from '../types/remoteControl';

/**
 * Response from Render:
 *
 * POST /remote-control/authorize
 */
export interface RemoteControlAuthorization {
  remoteSessionId: string;
  agentToken: string;
  controllerToken: string;
  expiresInMs: number;
}

export class RemoteControlService {
  /**
   * ------------------------------------------------------------
   * CREATE CONTROL REQUEST
   * ------------------------------------------------------------
   *
   * Officer / Advisor clicks:
   *
   * Take Control
   *
   * This creates the Supabase request.
   *
   * IMPORTANT:
   * No HMAC/security token is generated in the browser.
   */
  static async createControlRequest(
    meetingId: string,
    customerId: string,
    requesterId: string,
    requesterRole: ControllerRole
  ): Promise<RemoteControlSession> {
    if (!meetingId) {
      throw new Error(
        '[RemoteControl] meetingId is required'
      );
    }

    if (!customerId) {
      throw new Error(
        '[RemoteControl] customerId is required'
      );
    }

    if (!requesterId) {
      throw new Error(
        '[RemoteControl] requesterId is required'
      );
    }

    if (
      requesterRole !== 'officer' &&
      requesterRole !== 'advisor'
    ) {
      throw new Error(
        `[RemoteControl] Invalid requester role: ${requesterRole}`
      );
    }

    /**
     * This ID will be shared between:
     *
     * Supabase
     * Render relay
     * Customer Agent
     * Officer / Advisor browser
     */
    const remoteSessionId =
      crypto.randomUUID();

    console.log(
      '[RemoteControl] Creating control request',
      {
        meetingId,
        customerId,
        requesterId,
        requesterRole,
        remoteSessionId,
      }
    );

    const { data, error } =
      await supabase
        .from(
          'remote_control_sessions'
        )
        .insert({
          meeting_id: meetingId,

          customer_id: customerId,

          requester_id: requesterId,

          requester_role:
            requesterRole,

          remote_session_id:
            remoteSessionId,

          status: 'requested',
        })
        .select('*')
        .single();

    if (error) {
      this.logSupabaseError(
        'Create control request',
        error
      );

      throw error;
    }

    if (!data) {
      throw new Error(
        '[RemoteControl] Supabase returned no session'
      );
    }

    console.log(
      '[RemoteControl] Request created:',
      data.id
    );

    return data as RemoteControlSession;
  }

  /**
   * ------------------------------------------------------------
   * CUSTOMER APPROVES REQUEST
   * ------------------------------------------------------------
   */
  static async approveControlRequest(
    sessionId: string,
    controllerId: string
  ): Promise<RemoteControlSession> {
    if (!sessionId) {
      throw new Error(
        '[RemoteControl] sessionId is required'
      );
    }

    if (!controllerId) {
      throw new Error(
        '[RemoteControl] controllerId is required'
      );
    }

    const { data, error } =
      await supabase
        .from(
          'remote_control_sessions'
        )
        .update({
          controller_id:
            controllerId,

          status: 'approved',

          approved_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          sessionId
        )
        .select('*')
        .single();

    if (error) {
      this.logSupabaseError(
        'Approve control request',
        error
      );

      throw error;
    }

    if (!data) {
      throw new Error(
        '[RemoteControl] Approval returned no session'
      );
    }

    console.log(
      '[RemoteControl] Customer approved request:',
      sessionId
    );

    return data as RemoteControlSession;
  }

  /**
   * ------------------------------------------------------------
   * SECURE SERVER AUTHORIZATION
   * ------------------------------------------------------------
   *
   * Called AFTER Customer clicks Accept.
   *
   * Render generates:
   *
   * agentToken
   * controllerToken
   *
   * The React application NEVER knows
   * REMOTE_SESSION_SECRET.
   */
  static async authorizeRemoteControl(
    remoteSessionId: string,
    meetingId: string,
    customerId: string,
    controllerId: string,
    controllerRole: ControllerRole
  ): Promise<RemoteControlAuthorization> {
    if (!remoteSessionId) {
      throw new Error(
        '[RemoteControl] remoteSessionId is required for authorization'
      );
    }

    if (!meetingId) {
      throw new Error(
        '[RemoteControl] meetingId is required for authorization'
      );
    }

    if (!customerId) {
      throw new Error(
        '[RemoteControl] customerId is required for authorization'
      );
    }

    if (!controllerId) {
      throw new Error(
        '[RemoteControl] controllerId is required for authorization'
      );
    }

    if (
      controllerRole !==
        'officer' &&
      controllerRole !==
        'advisor'
    ) {
      throw new Error(
        `[RemoteControl] Invalid controller role: ${controllerRole}`
      );
    }

    const apiUrl =
      this.getRemoteControlApiUrl();

    console.log(
      '[RemoteControl] Requesting relay authorization'
    );

    const response =
      await fetch(
        `${apiUrl}/remote-control/authorize`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            remoteSessionId,
            meetingId,
            customerId,
            controllerId,
            controllerRole,
          }),
        }
      );

    let responseBody: any = null;

    try {
      responseBody =
        await response.json();
    } catch {
      // Response may not contain JSON.
    }

    if (!response.ok) {
      console.error(
        '[RemoteControl] Authorization API failed',
        {
          status:
            response.status,

          error:
            responseBody?.error,

          message:
            responseBody?.message,
        }
      );

      throw new Error(
        responseBody?.message ||
          responseBody?.error ||
          `Authorization failed with HTTP ${response.status}`
      );
    }

    if (
      !responseBody ||
      !responseBody.agentToken ||
      !responseBody.controllerToken ||
      !responseBody.remoteSessionId
    ) {
      throw new Error(
        '[RemoteControl] Invalid authorization response'
      );
    }

    /**
     * Never log actual token values.
     */
    console.log(
      '[RemoteControl] Relay authorization successful'
    );

    return {
      remoteSessionId:
        responseBody.remoteSessionId,

      agentToken:
        responseBody.agentToken,

      controllerToken:
        responseBody.controllerToken,

      expiresInMs:
        Number(
          responseBody.expiresInMs ||
            0
        ),
    };
  }

  /**
   * ------------------------------------------------------------
   * REJECT REQUEST
   * ------------------------------------------------------------
   */
  static async rejectControlRequest(
    sessionId: string
  ): Promise<RemoteControlSession> {
    if (!sessionId) {
      throw new Error(
        '[RemoteControl] sessionId is required'
      );
    }

    const { data, error } =
      await supabase
        .from(
          'remote_control_sessions'
        )
        .update({
          status: 'rejected',

          ended_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          sessionId
        )
        .select('*')
        .single();

    if (error) {
      this.logSupabaseError(
        'Reject control request',
        error
      );

      throw error;
    }

    if (!data) {
      throw new Error(
        '[RemoteControl] Rejection returned no session'
      );
    }

    return data as RemoteControlSession;
  }

  /**
   * ------------------------------------------------------------
   * MARK CONTROL ACTIVE
   * ------------------------------------------------------------
   *
   * Call after Render sends:
   *
   * CONTROLLER_REGISTERED
   */
  static async startControl(
    sessionId: string
  ): Promise<RemoteControlSession> {
    if (!sessionId) {
      throw new Error(
        '[RemoteControl] sessionId is required'
      );
    }

    const { data, error } =
      await supabase
        .from(
          'remote_control_sessions'
        )
        .update({
          status: 'active',

          started_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          sessionId
        )
        .select('*')
        .single();

    if (error) {
      this.logSupabaseError(
        'Start control',
        error
      );

      throw error;
    }

    if (!data) {
      throw new Error(
        '[RemoteControl] Start returned no session'
      );
    }

    return data as RemoteControlSession;
  }

  /**
   * ------------------------------------------------------------
   * STOP CONTROL
   * ------------------------------------------------------------
   */
  static async stopControl(
    sessionId: string
  ): Promise<RemoteControlSession> {
    if (!sessionId) {
      throw new Error(
        '[RemoteControl] sessionId is required'
      );
    }

    const { data, error } =
      await supabase
        .from(
          'remote_control_sessions'
        )
        .update({
          status: 'ended',

          ended_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          sessionId
        )
        .select('*')
        .single();

    if (error) {
      this.logSupabaseError(
        'Stop control',
        error
      );

      throw error;
    }

    if (!data) {
      throw new Error(
        '[RemoteControl] Stop returned no session'
      );
    }

    return data as RemoteControlSession;
  }

  /**
   * ------------------------------------------------------------
   * GET ACTIVE / PENDING SESSION
   * ------------------------------------------------------------
   */
  static async getActiveSession(
    meetingId: string,
    customerId: string
  ): Promise<RemoteControlSession | null> {
    const { data, error } =
      await supabase
        .from(
          'remote_control_sessions'
        )
        .select('*')
        .eq(
          'meeting_id',
          meetingId
        )
        .eq(
          'customer_id',
          customerId
        )
        .in(
          'status',
          [
            'requested',
            'approved',
            'active',
          ]
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

    if (error) {
      this.logSupabaseError(
        'Get active session',
        error
      );

      throw error;
    }

    return (
      data as RemoteControlSession | null
    );
  }

  /**
   * ------------------------------------------------------------
   * GET SESSION BY DATABASE ID
   * ------------------------------------------------------------
   */
  static async getSessionById(
    sessionId: string
  ): Promise<RemoteControlSession | null> {
    if (!sessionId) {
      return null;
    }

    const { data, error } =
      await supabase
        .from(
          'remote_control_sessions'
        )
        .select('*')
        .eq(
          'id',
          sessionId
        )
        .maybeSingle();

    if (error) {
      this.logSupabaseError(
        'Get session',
        error
      );

      throw error;
    }

    return (
      data as RemoteControlSession | null
    );
  }

  /**
   * ------------------------------------------------------------
   * GET SESSION BY RELAY ID
   * ------------------------------------------------------------
   */
  static async getSessionByRemoteId(
    remoteSessionId: string
  ): Promise<RemoteControlSession | null> {
    if (!remoteSessionId) {
      return null;
    }

    const { data, error } =
      await supabase
        .from(
          'remote_control_sessions'
        )
        .select('*')
        .eq(
          'remote_session_id',
          remoteSessionId
        )
        .maybeSingle();

    if (error) {
      this.logSupabaseError(
        'Get remote session',
        error
      );

      throw error;
    }

    return (
      data as RemoteControlSession | null
    );
  }

  /**
   * ------------------------------------------------------------
   * CONTROL EVENT AUDIT
   * ------------------------------------------------------------
   *
   * Do not log keyboard contents.
   */
  static async logControlEvent(
    sessionId: string,
    eventType: string,
    details?: Record<
      string,
      unknown
    >
  ): Promise<void> {
    console.log(
      `[RemoteControl] ${eventType}`,
      {
        sessionId,
        ...(details || {}),
      }
    );
  }

  /**
   * ------------------------------------------------------------
   * RENDER API URL
   * ------------------------------------------------------------
   *
   * Preferred:
   *
   * VITE_REMOTE_CONTROL_API_URL=
   * https://threevideocall.onrender.com
   *
   * If missing, derive it from the WSS URL.
   */
  private static getRemoteControlApiUrl(): string {
    const configured =
      import.meta.env
        .VITE_REMOTE_CONTROL_API_URL as
        | string
        | undefined;

    if (configured) {
      return configured.replace(
        /\/+$/,
        ''
      );
    }

    const wsUrl =
      import.meta.env
        .VITE_REMOTE_CONTROL_WS_URL as
        | string
        | undefined;

    if (!wsUrl) {
      throw new Error(
        '[RemoteControl] Neither VITE_REMOTE_CONTROL_API_URL nor VITE_REMOTE_CONTROL_WS_URL is configured'
      );
    }

    try {
      const parsed =
        new URL(wsUrl);

      parsed.protocol =
        parsed.protocol === 'wss:'
          ? 'https:'
          : 'http:';

      parsed.pathname = '';
      parsed.search = '';
      parsed.hash = '';

      return parsed
        .toString()
        .replace(
          /\/+$/,
          ''
        );
    } catch {
      throw new Error(
        '[RemoteControl] Invalid remote control server URL'
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * SUPABASE ERROR LOGGING
   * ------------------------------------------------------------
   */
  private static logSupabaseError(
    action: string,
    error: any
  ): void {
    console.error(
      `[RemoteControl] ${action} failed`,
      {
        message:
          error?.message,

        details:
          error?.details,

        hint:
          error?.hint,

        code:
          error?.code,
      }
    );
  }
}