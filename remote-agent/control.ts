import { RemoteControlEvent } from '../src/types/remoteControl';
import { MouseController } from './mouse';
import { KeyboardController } from './keyboard';
import { AgentSecurity, SessionContext } from './security';

export class ControlHandler {
  private mouse: MouseController;
  private keyboard: KeyboardController;
  private security: AgentSecurity;
  private currentSession: SessionContext | null = null;
  private controlActive = false;

  constructor(security: AgentSecurity) {
    this.mouse = new MouseController();
    this.keyboard = new KeyboardController();
    this.security = security;
  }

  handleEvent(event: RemoteControlEvent): void {
    // Validate session for all control events
    if (!this.validateEventSession(event)) {
      console.warn('[Control] Unauthorized event:', event.type);
      return;
    }

    switch (event.type) {
      case 'CONTROL_GRANTED':
        this.handleControlGranted(event);
        break;
      case 'CONTROL_STOPPED':
        this.handleControlStopped(event);
        break;
      case 'MOUSE_MOVE':
        this.handleMouseMove(event);
        break;
      case 'MOUSE_CLICK':
        this.handleMouseClick(event);
        break;
      case 'MOUSE_DOUBLE_CLICK':
        this.handleMouseDoubleClick(event);
        break;
      case 'SCROLL':
        this.handleScroll(event);
        break;
      case 'KEY_DOWN':
        this.handleKeyDown(event);
        break;
      case 'KEY_UP':
        this.handleKeyUp(event);
        break;
      default:
        console.log('[Control] Unhandled event type:', event.type);
    }
  }

  private validateEventSession(event: RemoteControlEvent): boolean {
    if (!this.controlActive) {
      return false;
    }

    if (!this.currentSession) {
      return false;
    }

    if (
      event.meetingId !== this.currentSession.meetingId ||
      event.customerId !== this.currentSession.customerId
    ) {
      return false;
    }

    return true;
  }

  private handleControlGranted(event: RemoteControlEvent): void {
    if (!event.remoteSessionId) {
      console.error('[Control] No session ID in CONTROL_GRANTED');
      return;
    }

    const session = this.security.getSession(event.remoteSessionId);
    if (!session) {
      console.error('[Control] Session not found:', event.remoteSessionId);
      return;
    }

    this.currentSession = session;
    this.controlActive = true;
    console.log('[Control] Control granted for session:', event.remoteSessionId);
  }

  private handleControlStopped(event: RemoteControlEvent): void {
    this.controlActive = false;
    this.keyboard.releaseAllKeys();
    this.currentSession = null;
    console.log('[Control] Control stopped');
  }

  private handleMouseMove(event: RemoteControlEvent): void {
    if (!this.controlActive || event.x === undefined || event.y === undefined) return;
    this.mouse.moveMouse(event.x, event.y);
  }

  private handleMouseClick(event: RemoteControlEvent): void {
    if (!this.controlActive || event.x === undefined || event.y === undefined) return;
    this.mouse.moveMouse(event.x, event.y);
    this.mouse.click(event.button || 'left');
  }

  private handleMouseDoubleClick(event: RemoteControlEvent): void {
    if (!this.controlActive || event.x === undefined || event.y === undefined) return;
    this.mouse.moveMouse(event.x, event.y);
    this.mouse.doubleClick();
  }

  private handleScroll(event: RemoteControlEvent): void {
    if (!this.controlActive || event.deltaY === undefined) return;
    this.mouse.scroll(event.deltaY);
  }

  private handleKeyDown(event: RemoteControlEvent): void {
    if (!this.controlActive || !event.code) return;
    this.keyboard.keyDown(event.code);
  }

  private handleKeyUp(event: RemoteControlEvent): void {
    if (!this.controlActive || !event.code) return;
    this.keyboard.keyUp(event.code);
  }

  isControlActive(): boolean {
    return this.controlActive;
  }

  stopControl(): void {
    this.controlActive = false;
    this.keyboard.releaseAllKeys();
    this.currentSession = null;
  }
}
