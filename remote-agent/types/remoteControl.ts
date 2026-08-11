export type ControllerRole =
  | 'officer'
  | 'advisor';

export type RemoteInputEventType =
  | 'MOUSE_MOVE'
  | 'MOUSE_DOWN'
  | 'MOUSE_UP'
  | 'MOUSE_CLICK'
  | 'MOUSE_DOUBLE_CLICK'
  | 'SCROLL'
  | 'KEY_DOWN'
  | 'KEY_UP';

export interface RemoteControlEvent {
  type:
    | RemoteInputEventType
    | 'AGENT_REGISTERED'
    | 'CONTROLLER_REGISTERED'
    | 'CONTROL_DENIED'
    | 'CONTROL_STOPPED'
    | 'SESSION_EXPIRED'
    | 'INVALID_TOKEN'
    | 'UNAUTHORIZED'
    | 'PONG';

  remoteSessionId?: string;

  meetingId?: string;

  customerId?: string;

  controllerId?: string;

  controllerRole?: ControllerRole;

  reason?: string;

  timestamp?: number;

  x?: number;

  y?: number;

  button?:
    | 'left'
    | 'right'
    | 'middle';

  code?: string;

  key?: string;

  deltaY?: number;

  ctrlKey?: boolean;

  shiftKey?: boolean;

  altKey?: boolean;

  metaKey?: boolean;
}