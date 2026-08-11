import type {
  RemoteControlEvent,
} from './types/remoteControl';
import {
  MouseController,
} from './mouse';

import {
  KeyboardController,
} from './keyboard';

import {
  AgentSecurity,
} from './security';

/**
 * Handles native mouse / keyboard execution on the
 * Customer computer.
 *
 * Security flow:
 *
 * Browser
 *   ↓
 * Render validates Controller
 *   ↓
 * Render verifies controlAllowed
 *   ↓
 * Render forwards approved input event
 *   ↓
 * Electron Agent
 *   ↓
 * ControlHandler
 *   ↓
 * RobotJS
 */
export class ControlHandler {
  private readonly mouse:
    MouseController;

  private readonly keyboard:
    KeyboardController;

  private readonly security:
    AgentSecurity;

  private activeRemoteSessionId:
    string | null = null;

  private controlActive =
    false;

  constructor(
    security:
      AgentSecurity
  ) {
    this.mouse =
      new MouseController();

    this.keyboard =
      new KeyboardController();

    this.security =
      security;
  }

  /**
   * ------------------------------------------------------------
   * START CONTROL
   * ------------------------------------------------------------
   *
   * Called only after Render returns:
   *
   * AGENT_REGISTERED
   */
  startControl(
    remoteSessionId: string
  ): void {
    if (
      !remoteSessionId
    ) {
      console.error(
        '[Control] Cannot start without remoteSessionId'
      );

      return;
    }

    /**
     * Make sure this session was activated locally
     * after successful Render authentication.
     */
    if (
      !this.security.hasActiveSession(
        remoteSessionId
      )
    ) {
      console.error(
        '[Control] Cannot start unauthorized local session:',
        remoteSessionId
      );

      return;
    }

    /**
     * Clean previous keyboard state if switching sessions.
     */
    if (
      this.controlActive &&
      this.activeRemoteSessionId &&
      this.activeRemoteSessionId !==
        remoteSessionId
    ) {
      try {
        this.keyboard
          .releaseAllKeys();
      } catch {
        // Best effort.
      }
    }

    /**
     * Customer may have:
     *
     * changed resolution
     * connected/disconnected monitor
     * changed display scaling
     *
     * Refresh RobotJS screen bounds.
     */
    this.mouse
      .updateScreenSize();

    this.activeRemoteSessionId =
      remoteSessionId;

    this.controlActive =
      true;

    console.log(
      '[Control] Native control ready:',
      remoteSessionId
    );
  }

  /**
   * ------------------------------------------------------------
   * HANDLE EVENT
   * ------------------------------------------------------------
   */
  handleEvent(
    event:
      RemoteControlEvent
  ): void {
    if (
      !event ||
      typeof event !==
        'object' ||
      typeof event.type !==
        'string'
    ) {
      console.warn(
        '[Control] Invalid event ignored'
      );

      return;
    }

    /**
     * Lifecycle stop is always accepted.
     */
    if (
      event.type ===
      'CONTROL_STOPPED'
    ) {
      this.stopControl();

      return;
    }

    /**
     * Render already authorized the actual input,
     * but Agent still requires a locally active session.
     */
    if (
      !this.isControlActive()
    ) {
      console.warn(
        '[Control] Input ignored because session is not active:',
        event.type
      );

      return;
    }

    try {
      switch (
        event.type
      ) {
        case 'MOUSE_MOVE':
          this.handleMouseMove(
            event
          );
          break;

        case 'MOUSE_DOWN':
          this.handleMouseDown(
            event
          );
          break;

        case 'MOUSE_UP':
          this.handleMouseUp(
            event
          );
          break;

        case 'MOUSE_CLICK':
          this.handleMouseClick(
            event
          );
          break;

        case 'MOUSE_DOUBLE_CLICK':
          this.handleMouseDoubleClick(
            event
          );
          break;

        case 'SCROLL':
          this.handleScroll(
            event
          );
          break;

        case 'KEY_DOWN':
          this.handleKeyDown(
            event
          );
          break;

        case 'KEY_UP':
          this.handleKeyUp(
            event
          );
          break;

        default:
          console.warn(
            '[Control] Unsupported input event:',
            event.type
          );
      }
    } catch (err) {
      console.error(
        `[Control] ${event.type} failed:`,
        err
      );

      /**
       * Avoid leaving keyboard modifiers stuck.
       */
      if (
        event.type ===
          'KEY_DOWN' ||
        event.type ===
          'KEY_UP'
      ) {
        try {
          this.keyboard
            .releaseAllKeys();
        } catch {}
      }
    }
  }

  /**
   * ------------------------------------------------------------
   * MOUSE MOVE
   * ------------------------------------------------------------
   */
  private handleMouseMove(
    event:
      RemoteControlEvent
  ): void {
    if (
      !this.hasCoordinates(
        event
      )
    ) {
      return;
    }

    this.mouse.moveMouse(
      this.clamp01(
        event.x!
      ),

      this.clamp01(
        event.y!
      )
    );
  }

  /**
   * ------------------------------------------------------------
   * MOUSE DOWN
   * ------------------------------------------------------------
   *
   * Required for:
   *
   * drag-and-drop
   * range sliders
   * selecting text
   */
  private handleMouseDown(
    event:
      RemoteControlEvent
  ): void {
    if (
      this.hasCoordinates(
        event
      )
    ) {
      this.mouse.moveMouse(
        this.clamp01(
          event.x!
        ),

        this.clamp01(
          event.y!
        )
      );
    }

    this.mouse.mouseDown(
      this.getMouseButton(
        event.button
      )
    );
  }

  /**
   * ------------------------------------------------------------
   * MOUSE UP
   * ------------------------------------------------------------
   */
  private handleMouseUp(
    event:
      RemoteControlEvent
  ): void {
    if (
      this.hasCoordinates(
        event
      )
    ) {
      this.mouse.moveMouse(
        this.clamp01(
          event.x!
        ),

        this.clamp01(
          event.y!
        )
      );
    }

    this.mouse.mouseUp(
      this.getMouseButton(
        event.button
      )
    );
  }

  /**
   * ------------------------------------------------------------
   * CLICK
   * ------------------------------------------------------------
   */
  private handleMouseClick(
    event:
      RemoteControlEvent
  ): void {
    if (
      !this.hasCoordinates(
        event
      )
    ) {
      return;
    }

    this.mouse.moveMouse(
      this.clamp01(
        event.x!
      ),

      this.clamp01(
        event.y!
      )
    );

    this.mouse.click(
      this.getMouseButton(
        event.button
      )
    );
  }

  /**
   * ------------------------------------------------------------
   * DOUBLE CLICK
   * ------------------------------------------------------------
   */
  private handleMouseDoubleClick(
    event:
      RemoteControlEvent
  ): void {
    if (
      !this.hasCoordinates(
        event
      )
    ) {
      return;
    }

    this.mouse.moveMouse(
      this.clamp01(
        event.x!
      ),

      this.clamp01(
        event.y!
      )
    );

    this.mouse.doubleClick(
      this.getMouseButton(
        event.button
      )
    );
  }

  /**
   * ------------------------------------------------------------
   * SCROLL
   * ------------------------------------------------------------
   */
  private handleScroll(
    event:
      RemoteControlEvent
  ): void {
    if (
      typeof event.deltaY !==
        'number' ||
      !Number.isFinite(
        event.deltaY
      )
    ) {
      return;
    }

    const safeDelta =
      Math.max(
        -2000,
        Math.min(
          2000,
          event.deltaY
        )
      );

    this.mouse.scroll(
      safeDelta
    );
  }

  /**
   * ------------------------------------------------------------
   * KEY DOWN
   * ------------------------------------------------------------
   */
  private handleKeyDown(
    event:
      RemoteControlEvent
  ): void {
    if (
      !this.isValidKeyCode(
        event.code
      )
    ) {
      return;
    }

    this.keyboard.keyDown(
      event.code!
    );
  }

  /**
   * ------------------------------------------------------------
   * KEY UP
   * ------------------------------------------------------------
   */
  private handleKeyUp(
    event:
      RemoteControlEvent
  ): void {
    if (
      !this.isValidKeyCode(
        event.code
      )
    ) {
      return;
    }

    this.keyboard.keyUp(
      event.code!
    );
  }

  /**
   * ------------------------------------------------------------
   * ACTIVE STATE
   * ------------------------------------------------------------
   */
  isControlActive():
    boolean {
    if (
      !this.controlActive ||
      !this.activeRemoteSessionId
    ) {
      return false;
    }

    /**
     * Local security context must still exist.
     */
    return this.security.hasActiveSession(
      this.activeRemoteSessionId
    );
  }

  getActiveSessionId():
    string | null {
    return this.activeRemoteSessionId;
  }

  /**
   * ------------------------------------------------------------
   * STOP CONTROL
   * ------------------------------------------------------------
   */
  stopControl(): void {
    const sessionId =
      this.activeRemoteSessionId;

    if (
      this.controlActive
    ) {
      console.log(
        '[Control] Native control stopped:',
        sessionId
      );
    }

    this.controlActive =
      false;

    this.activeRemoteSessionId =
      null;

    /**
     * Release all held keyboard modifiers.
     */
    try {
      this.keyboard
        .releaseAllKeys();
    } catch (
      err
    ) {
      console.warn(
        '[Control] Keyboard cleanup failed:',
        err
      );
    }

    /**
     * Also release mouse buttons in case the controller
     * disconnected during drag-and-drop.
     */
    try {
      this.mouse.mouseUp(
        'left'
      );
    } catch {}

    try {
      this.mouse.mouseUp(
        'right'
      );
    } catch {}

    try {
      this.mouse.mouseUp(
        'middle'
      );
    } catch {}
  }

  /**
   * ------------------------------------------------------------
   * COORDINATE HELPERS
   * ------------------------------------------------------------
   */
  private hasCoordinates(
    event:
      RemoteControlEvent
  ): boolean {
    return (
      typeof event.x ===
        'number' &&
      typeof event.y ===
        'number' &&
      Number.isFinite(
        event.x
      ) &&
      Number.isFinite(
        event.y
      )
    );
  }

  private clamp01(
    value:
      number
  ): number {
    return Math.max(
      0,
      Math.min(
        1,
        value
      )
    );
  }

  /**
   * ------------------------------------------------------------
   * BUTTON VALIDATION
   * ------------------------------------------------------------
   */
  private getMouseButton(
    button:
      RemoteControlEvent['button']
  ):
    | 'left'
    | 'right'
    | 'middle' {
    if (
      button === 'right' ||
      button === 'middle'
    ) {
      return button;
    }

    return 'left';
  }

  /**
   * ------------------------------------------------------------
   * KEY VALIDATION
   * ------------------------------------------------------------
   */
  private isValidKeyCode(
    code:
      string |
      undefined
  ): code is string {
    if (
      !code ||
      typeof code !==
        'string'
    ) {
      return false;
    }

    if (
      code.length >
      64
    ) {
      return false;
    }

    return /^[A-Za-z0-9]+$/.test(
      code
    );
  }
}