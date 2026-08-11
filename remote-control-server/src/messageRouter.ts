import WebSocket from 'ws';
import { SessionManager } from './sessionManager.js';
import { AuthenticationService } from './authentication.js';
import {
  IncomingMessage,
  ControlEventMessage,
  AgentRegisterMessage,
  ControllerRegisterMessage,
  ControlStopMessage,
  ServerMessage,
} from './types.js';

export class MessageRouter {
  constructor(
    private sessionManager: SessionManager,
    private authService: AuthenticationService
  ) {}

  /**
   * Route incoming message from agent or controller
   */
  async routeMessage(
    ws: WebSocket,
    data: string,
    isAgent: boolean
  ): Promise<void> {
    try {
      const message: IncomingMessage = JSON.parse(data);

      switch (message.type) {
        case 'AGENT_REGISTER':
          this.handleAgentRegister(ws, message as AgentRegisterMessage);
          break;

        case 'CONTROLLER_REGISTER':
          this.handleControllerRegister(ws, message as ControllerRegisterMessage);
          break;

        case 'CONTROL_EVENT':
          this.handleControlEvent(ws, message as ControlEventMessage, isAgent);
          break;

        case 'CONTROL_STOP':
          this.handleControlStop(ws, message as ControlStopMessage);
          break;

        case 'PING':
          this.handlePing(ws);
          break;

        default:
          console.warn('[MessageRouter] Unknown message type:', (message as any).type);
      }
    } catch (err) {
      console.error('[MessageRouter] Failed to parse message:', err);
      this.sendError(ws, 'INVALID_MESSAGE');
    }
  }

  /**
   * Handle agent registration
   */
  private handleAgentRegister(ws: WebSocket, message: AgentRegisterMessage): void {
    const { remoteSessionId, meetingId, customerId, token } = message;

    // Validate token
    if (!this.authService.validateAgentToken(token, remoteSessionId, customerId)) {
      console.warn('[MessageRouter] Agent registration failed: invalid token');
      this.sendError(ws, 'INVALID_TOKEN');
      ws.close(1008, 'Invalid token');
      return;
    }

    // Get or create session
    let session = this.sessionManager.getSession(remoteSessionId);
    if (!session) {
      session = this.sessionManager.createSession(remoteSessionId, meetingId, customerId);
    }

    // Verify session belongs to this customer
    if (session.customerId !== customerId) {
      console.warn('[MessageRouter] Agent registration failed: customer mismatch');
      this.sendError(ws, 'UNAUTHORIZED');
      ws.close(1008, 'Unauthorized');
      return;
    }

    // Register agent
    if (!this.sessionManager.registerAgent(remoteSessionId, ws)) {
      console.warn('[MessageRouter] Agent registration failed: session not found');
      this.sendError(ws, 'SESSION_EXPIRED');
      ws.close(1008, 'Session expired');
      return;
    }

    // Send confirmation
    const response: ServerMessage = {
      type: 'AGENT_REGISTERED',
      remoteSessionId,
    };
    ws.send(JSON.stringify(response));

    console.log(`[MessageRouter] Agent registered successfully: ${remoteSessionId}`);
  }

  /**
   * Handle controller registration
   */
  private handleControllerRegister(ws: WebSocket, message: ControllerRegisterMessage): void {
    const { remoteSessionId, meetingId, controllerId, controllerRole, token } = message;

    // Validate token
    if (!this.authService.validateControllerToken(token, remoteSessionId, controllerId, controllerRole)) {
      console.warn('[MessageRouter] Controller registration failed: invalid token');
      this.sendError(ws, 'INVALID_TOKEN');
      ws.close(1008, 'Invalid token');
      return;
    }

    // Get session
    const session = this.sessionManager.getSession(remoteSessionId);
    if (!session) {
      console.warn('[MessageRouter] Controller registration failed: session not found');
      this.sendError(ws, 'SESSION_EXPIRED');
      ws.close(1008, 'Session expired');
      return;
    }

    // Verify meeting ID
    if (session.meetingId !== meetingId) {
      console.warn('[MessageRouter] Controller registration failed: meeting mismatch');
      this.sendError(ws, 'UNAUTHORIZED');
      ws.close(1008, 'Unauthorized');
      return;
    }

    // Check if another controller already has control
    if (session.controllerId && session.controllerId !== controllerId) {
      console.warn('[MessageRouter] Controller registration denied: another controller has control');
      const response: ServerMessage = {
        type: 'CONTROL_DENIED',
        reason: 'Another participant currently has control',
        remoteSessionId,
      };
      ws.send(JSON.stringify(response));
      return;
    }

    // Register controller
    if (!this.sessionManager.registerController(remoteSessionId, controllerId, controllerRole, ws)) {
      console.warn('[MessageRouter] Controller registration failed');
      this.sendError(ws, 'UNAUTHORIZED');
      ws.close(1008, 'Unauthorized');
      return;
    }

    // Send confirmation
    const response: ServerMessage = {
      type: 'CONTROLLER_REGISTERED',
      remoteSessionId,
    };
    ws.send(JSON.stringify(response));

    console.log(`[MessageRouter] Controller registered successfully: ${remoteSessionId} (${controllerRole})`);
  }

  /**
   * Handle control event (mouse/keyboard)
   */
  private handleControlEvent(ws: WebSocket, message: ControlEventMessage, isAgent: boolean): void {
    const { remoteSessionId, event } = message;

    // Only controller should send control events
    if (isAgent) {
      console.warn('[MessageRouter] Agent attempted to send control event');
      this.sendError(ws, 'UNAUTHORIZED');
      return;
    }

    // Validate session
    const session = this.sessionManager.getSession(remoteSessionId);
    if (!session) {
      console.warn('[MessageRouter] Control event: session not found');
      this.sendError(ws, 'SESSION_EXPIRED');
      return;
    }

    // Validate control is allowed
    if (!session.controlAllowed) {
      console.warn('[MessageRouter] Control event: control not allowed');
      this.sendError(ws, 'CONTROL_DENIED');
      return;
    }

    // Validate controller socket matches
    if (session.controllerSocket !== ws) {
      console.warn('[MessageRouter] Control event: controller socket mismatch');
      this.sendError(ws, 'UNAUTHORIZED');
      return;
    }

    // Validate event
    if (!this.validateControlEvent(event)) {
      console.warn('[MessageRouter] Control event: invalid event data');
      this.sendError(ws, 'INVALID_MESSAGE');
      return;
    }

    // Get agent socket
    const agentSocket = this.sessionManager.getAgentSocket(remoteSessionId);
    if (!agentSocket || agentSocket.readyState !== WebSocket.OPEN) {
      console.warn('[MessageRouter] Control event: agent not connected');
      this.sendError(ws, 'CONTROL_DENIED', 'Agent disconnected');
      return;
    }

    // Forward event to agent
    agentSocket.send(JSON.stringify(event));
    this.sessionManager.updateHeartbeat(remoteSessionId);

    console.log(`[MessageRouter] Control event forwarded: ${remoteSessionId} (${event.type})`);
  }

  /**
   * Handle control stop
   */
  private handleControlStop(ws: WebSocket, message: ControlStopMessage): void {
    const { remoteSessionId, reason } = message;

    const session = this.sessionManager.getSession(remoteSessionId);
    if (!session) {
      console.warn('[MessageRouter] Control stop: session not found');
      return;
    }

    // Stop control
    this.sessionManager.stopControl(remoteSessionId);

    // Notify other side
    const otherSocket = session.agentSocket === ws ? session.controllerSocket : session.agentSocket;
    if (otherSocket && otherSocket.readyState === WebSocket.OPEN) {
      const stopMessage: ServerMessage = {
        type: 'CONTROL_STOPPED',
        reason,
        remoteSessionId,
      };
      otherSocket.send(JSON.stringify(stopMessage));
    }

    console.log(`[MessageRouter] Control stopped: ${remoteSessionId} (${reason})`);
  }

  /**
   * Handle ping
   */
  private handlePing(ws: WebSocket): void {
    const pong = {
      type: 'PONG',
      timestamp: Date.now(),
    };
    ws.send(JSON.stringify(pong));
  }

  /**
   * Validate control event data
   */
  private validateControlEvent(event: any): boolean {
    const { type, x, y, button, code, deltaY } = event;

    // Validate event type
    const validTypes = [
      'MOUSE_MOVE',
      'MOUSE_DOWN',
      'MOUSE_UP',
      'MOUSE_CLICK',
      'MOUSE_DOUBLE_CLICK',
      'SCROLL',
      'KEY_DOWN',
      'KEY_UP',
    ];
    if (!validTypes.includes(type)) {
      return false;
    }

    // Validate mouse events
    if (type.startsWith('MOUSE')) {
      if (type === 'MOUSE_MOVE' || type === 'MOUSE_CLICK' || type === 'MOUSE_DOUBLE_CLICK') {
        if (typeof x !== 'number' || typeof y !== 'number') return false;
        if (x < 0 || x > 1 || y < 0 || y > 1) return false;
      }
      if (type === 'MOUSE_CLICK' || type === 'MOUSE_DOWN' || type === 'MOUSE_UP') {
        if (button && !['left', 'right', 'middle'].includes(button)) return false;
      }
      if (type === 'SCROLL') {
        if (typeof deltaY !== 'number') return false;
      }
    }

    // Validate keyboard events
    if (type === 'KEY_DOWN' || type === 'KEY_UP') {
      if (typeof code !== 'string' || code.length === 0) return false;
      // Validate key code format (e.g., KeyA, Digit1, etc.)
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(code)) return false;
    }

    return true;
  }

  /**
   * Send error response
   */
  private sendError(ws: WebSocket, type: string, reason?: string): void {
    const response: ServerMessage = {
      type: type as any,
      reason,
    };
    try {
      ws.send(JSON.stringify(response));
    } catch (err) {
      console.error('[MessageRouter] Failed to send error:', err);
    }
  }
}
