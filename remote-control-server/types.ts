import WebSocket from 'ws';

export type ControllerRole = 'officer' | 'adviser';

export interface ActiveRemoteSession {
  remoteSessionId: string;
  meetingId: string;
  customerId: string;
  controllerId: string | null;
  controllerRole: ControllerRole | null;
  agentSocket: WebSocket | null;
  controllerSocket: WebSocket | null;
  controlAllowed: boolean;
  expiresAt: number;
  createdAt: number;
  lastHeartbeat: number;
}

export interface AgentRegisterMessage {
  type: 'AGENT_REGISTER';
  meetingId: string;
  remoteSessionId: string;
  customerId: string;
  token: string;
}

export interface ControllerRegisterMessage {
  type: 'CONTROLLER_REGISTER';
  meetingId: string;
  remoteSessionId: string;
  controllerId: string;
  controllerRole: ControllerRole;
  token: string;
}

export interface ControlEventMessage {
  type: 'CONTROL_EVENT';
  remoteSessionId: string;
  event: {
    type: 'MOUSE_MOVE' | 'MOUSE_DOWN' | 'MOUSE_UP' | 'MOUSE_CLICK' | 'MOUSE_DOUBLE_CLICK' | 'SCROLL' | 'KEY_DOWN' | 'KEY_UP';
    x?: number;
    y?: number;
    button?: 'left' | 'right' | 'middle';
    code?: string;
    deltaY?: number;
  };
}

export interface ControlStopMessage {
  type: 'CONTROL_STOP';
  remoteSessionId: string;
  reason: 'customer_stopped' | 'controller_released' | 'session_expired' | 'disconnect';
}

export interface PingMessage {
  type: 'PING';
  timestamp: number;
}

export interface PongMessage {
  type: 'PONG';
  timestamp: number;
}

export interface ServerMessage {
  type: 'AGENT_REGISTERED' | 'CONTROLLER_REGISTERED' | 'CONTROL_DENIED' | 'CONTROL_STOPPED' | 'SESSION_EXPIRED' | 'INVALID_TOKEN' | 'UNAUTHORIZED';
  reason?: string;
  remoteSessionId?: string;
}

export type IncomingMessage = 
  | AgentRegisterMessage 
  | ControllerRegisterMessage 
  | ControlEventMessage 
  | ControlStopMessage 
  | PingMessage;
