export type RemoteControlStatus = 
  | 'idle' 
  | 'requesting' 
  | 'requested' 
  | 'approved' 
  | 'active' 
  | 'rejected' 
  | 'ended';

export type ControllerRole = 'officer' | 'adviser';

export interface RemoteControlState {
  status: RemoteControlStatus;
  customerId: string | null;
  requesterId: string | null;
  requesterName: string | null;
  requesterRole: ControllerRole | null;
  controllerId: string | null;
  controllerName: string | null;
  controllerRole: ControllerRole | null;
  controlAllowed: boolean;
  remoteSessionId: string | null;
  screenShareActive: boolean;
}

export interface RemoteControlSession {
  id: string;
  meeting_id: string;
  customer_id: string;
  requester_id: string;
  requester_role: ControllerRole;
  controller_id: string | null;
  status: RemoteControlStatus;
  remote_session_id: string;
  auth_token: string;
  requested_at: string;
  approved_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RemoteControlEvent {
  type: 
    | 'REQUEST_CONTROL' 
    | 'CONTROL_GRANTED' 
    | 'CONTROL_REJECTED' 
    | 'CONTROL_STARTED' 
    | 'CONTROL_STOPPED' 
    | 'CONTROLLER_CHANGED'
    | 'MOUSE_MOVE'
    | 'MOUSE_DOWN'
    | 'MOUSE_UP'
    | 'MOUSE_CLICK'
    | 'MOUSE_DOUBLE_CLICK'
    | 'SCROLL'
    | 'KEY_DOWN'
    | 'KEY_UP';
  meetingId: string;
  customerId: string;
  requesterId?: string;
  controllerId?: string;
  requesterRole?: ControllerRole;
  controllerRole?: ControllerRole;
  remoteSessionId?: string;
  timestamp?: number;
  // For input events
  x?: number;
  y?: number;
  button?: 'left' | 'right' | 'middle';
  code?: string;
  key?: string;
  deltaY?: number;
}

export interface AgentConnectionStatus {
  connected: boolean;
  agentVersion?: string;
  lastHeartbeat?: number;
}

export interface ScreenShareState {
  active: boolean;
  screenId?: string;
  displayName?: string;
  startedAt?: number;
}
