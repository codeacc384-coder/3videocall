import { RemoteControlEvent } from '../types/remoteControl';

export class RemoteControlProtocol {
  static createRequestControlEvent(
    meetingId: string,
    customerId: string,
    requesterId: string,
    requesterRole: 'officer' | 'adviser',
    requesterName: string
  ): RemoteControlEvent {
    return {
      type: 'REQUEST_CONTROL',
      meetingId,
      customerId,
      requesterId,
      requesterRole,
      timestamp: Date.now(),
    };
  }

  static createControlGrantedEvent(
    meetingId: string,
    customerId: string,
    controllerId: string,
    controllerRole: 'officer' | 'adviser',
    remoteSessionId: string
  ): RemoteControlEvent {
    return {
      type: 'CONTROL_GRANTED',
      meetingId,
      customerId,
      controllerId,
      controllerRole,
      remoteSessionId,
      timestamp: Date.now(),
    };
  }

  static createControlRejectedEvent(
    meetingId: string,
    customerId: string,
    requesterId: string
  ): RemoteControlEvent {
    return {
      type: 'CONTROL_REJECTED',
      meetingId,
      customerId,
      requesterId,
      timestamp: Date.now(),
    };
  }

  static createControlStoppedEvent(
    meetingId: string,
    customerId: string,
    controllerId: string
  ): RemoteControlEvent {
    return {
      type: 'CONTROL_STOPPED',
      meetingId,
      customerId,
      controllerId,
      timestamp: Date.now(),
    };
  }

  static createMouseMoveEvent(
    meetingId: string,
    customerId: string,
    controllerId: string,
    x: number,
    y: number
  ): RemoteControlEvent {
    return {
      type: 'MOUSE_MOVE',
      meetingId,
      customerId,
      controllerId,
      x,
      y,
      timestamp: Date.now(),
    };
  }

  static createMouseClickEvent(
    meetingId: string,
    customerId: string,
    controllerId: string,
    x: number,
    y: number,
    button: 'left' | 'right' | 'middle' = 'left'
  ): RemoteControlEvent {
    return {
      type: 'MOUSE_CLICK',
      meetingId,
      customerId,
      controllerId,
      x,
      y,
      button,
      timestamp: Date.now(),
    };
  }

  static createMouseDoubleClickEvent(
    meetingId: string,
    customerId: string,
    controllerId: string,
    x: number,
    y: number
  ): RemoteControlEvent {
    return {
      type: 'MOUSE_DOUBLE_CLICK',
      meetingId,
      customerId,
      controllerId,
      x,
      y,
      timestamp: Date.now(),
    };
  }

  static createScrollEvent(
    meetingId: string,
    customerId: string,
    controllerId: string,
    deltaY: number
  ): RemoteControlEvent {
    return {
      type: 'SCROLL',
      meetingId,
      customerId,
      controllerId,
      deltaY,
      timestamp: Date.now(),
    };
  }

  static createKeyDownEvent(
    meetingId: string,
    customerId: string,
    controllerId: string,
    code: string
  ): RemoteControlEvent {
    return {
      type: 'KEY_DOWN',
      meetingId,
      customerId,
      controllerId,
      code,
      timestamp: Date.now(),
    };
  }

  static createKeyUpEvent(
    meetingId: string,
    customerId: string,
    controllerId: string,
    code: string
  ): RemoteControlEvent {
    return {
      type: 'KEY_UP',
      meetingId,
      customerId,
      controllerId,
      code,
      timestamp: Date.now(),
    };
  }

  static isControlEvent(event: RemoteControlEvent): boolean {
    return [
      'MOUSE_MOVE',
      'MOUSE_DOWN',
      'MOUSE_UP',
      'MOUSE_CLICK',
      'MOUSE_DOUBLE_CLICK',
      'SCROLL',
      'KEY_DOWN',
      'KEY_UP',
    ].includes(event.type);
  }

  static isSignalingEvent(event: RemoteControlEvent): boolean {
    return [
      'REQUEST_CONTROL',
      'CONTROL_GRANTED',
      'CONTROL_REJECTED',
      'CONTROL_STARTED',
      'CONTROL_STOPPED',
      'CONTROLLER_CHANGED',
    ].includes(event.type);
  }
}
