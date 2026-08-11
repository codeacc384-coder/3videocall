import robot from '@jitsi/robotjs';
export class KeyboardController {
  /**
   * Browser KeyboardEvent.code
   *              ↓
   * RobotJS key name
   */
  private readonly keyMap: Record<string, string> = {
    KeyA: 'a',
    KeyB: 'b',
    KeyC: 'c',
    KeyD: 'd',
    KeyE: 'e',
    KeyF: 'f',
    KeyG: 'g',
    KeyH: 'h',
    KeyI: 'i',
    KeyJ: 'j',
    KeyK: 'k',
    KeyL: 'l',
    KeyM: 'm',
    KeyN: 'n',
    KeyO: 'o',
    KeyP: 'p',
    KeyQ: 'q',
    KeyR: 'r',
    KeyS: 's',
    KeyT: 't',
    KeyU: 'u',
    KeyV: 'v',
    KeyW: 'w',
    KeyX: 'x',
    KeyY: 'y',
    KeyZ: 'z',

    Digit0: '0',
    Digit1: '1',
    Digit2: '2',
    Digit3: '3',
    Digit4: '4',
    Digit5: '5',
    Digit6: '6',
    Digit7: '7',
    Digit8: '8',
    Digit9: '9',

    Numpad0: 'numpad_0',
    Numpad1: 'numpad_1',
    Numpad2: 'numpad_2',
    Numpad3: 'numpad_3',
    Numpad4: 'numpad_4',
    Numpad5: 'numpad_5',
    Numpad6: 'numpad_6',
    Numpad7: 'numpad_7',
    Numpad8: 'numpad_8',
    Numpad9: 'numpad_9',

    Space: 'space',

    Enter: 'enter',
    NumpadEnter: 'enter',

    Tab: 'tab',

    Backspace: 'backspace',

    Delete: 'delete',

    Insert: 'insert',

    Escape: 'escape',

    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',

    Home: 'home',
    End: 'end',

    PageUp: 'pageup',
    PageDown: 'pagedown',

    F1: 'f1',
    F2: 'f2',
    F3: 'f3',
    F4: 'f4',
    F5: 'f5',
    F6: 'f6',
    F7: 'f7',
    F8: 'f8',
    F9: 'f9',
    F10: 'f10',
    F11: 'f11',
    F12: 'f12',

    Minus: '-',
    Equal: '=',

    BracketLeft: '[',
    BracketRight: ']',

    Semicolon: ';',
    Quote: "'",
    Backquote: '`',
    Backslash: '\\',

    Comma: ',',
    Period: '.',
    Slash: '/',

    ControlLeft: 'control',
    ControlRight: 'control',

    ShiftLeft: 'shift',
    ShiftRight: 'shift',

    AltLeft: 'alt',
    AltRight: 'alt',

    /**
     * RobotJS calls the Command/Windows modifier "command"
     * in supported builds.
     */
    MetaLeft: 'command',
    MetaRight: 'command',

    CapsLock: 'capslock',

    NumLock: 'numlock',

    ScrollLock: 'scrolllock',

    PrintScreen: 'printscreen',

    Pause: 'pause',
  };

  /**
   * Track BROWSER codes instead of only mapped RobotJS keys.
   *
   * This matters because:
   *
   * ControlLeft
   * ControlRight
   *
   * both map to:
   *
   * control
   */
  private readonly pressedCodes =
    new Set<string>();

  /**
   * Number of browser keys currently holding each RobotJS key.
   *
   * Example:
   *
   * ControlLeft  -> control count = 1
   * ControlRight -> control count = 2
   *
   * Releasing ControlLeft:
   *
   * count = 1
   *
   * so RobotJS still keeps CTRL down.
   */
  private readonly robotKeyHoldCounts =
    new Map<string, number>();

  /**
   * ------------------------------------------------------------
   * KEY DOWN
   * ------------------------------------------------------------
   */
  keyDown(code: string): void {
    try {
      const key =
        this.getMappedKey(code);

      if (!key) {
        console.warn(
          '[Keyboard] Unknown key code:',
          code
        );

        return;
      }

      /**
       * Browser may repeatedly fire keydown while key is held.
       *
       * Do not repeatedly call RobotJS keyToggle("down").
       */
      if (
        this.pressedCodes.has(code)
      ) {
        return;
      }

      this.pressedCodes.add(code);

      const previousCount =
        this.robotKeyHoldCounts.get(
          key
        ) || 0;

      const nextCount =
        previousCount + 1;

      this.robotKeyHoldCounts.set(
        key,
        nextCount
      );

      /**
       * Only physically press RobotJS key when
       * first browser code mapped to it becomes active.
       */
      if (
        previousCount === 0
      ) {
        robot.keyToggle(
          key,
          'down'
        );
      }
    } catch (err) {
      console.error(
        '[Keyboard] Key down failed:',
        err
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * KEY UP
   * ------------------------------------------------------------
   */
  keyUp(code: string): void {
    try {
      const key =
        this.getMappedKey(code);

      if (!key) {
        return;
      }

      /**
       * Ignore keyup if we never recorded keydown.
       */
      if (
        !this.pressedCodes.has(code)
      ) {
        return;
      }

      this.pressedCodes.delete(code);

      const previousCount =
        this.robotKeyHoldCounts.get(
          key
        ) || 0;

      const nextCount =
        Math.max(
          0,
          previousCount - 1
        );

      if (
        nextCount === 0
      ) {
        this.robotKeyHoldCounts.delete(
          key
        );

        robot.keyToggle(
          key,
          'up'
        );
      } else {
        this.robotKeyHoldCounts.set(
          key,
          nextCount
        );
      }
    } catch (err) {
      console.error(
        '[Keyboard] Key up failed:',
        err
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * TAP KEY
   * ------------------------------------------------------------
   *
   * Useful for non-held keys if needed later.
   */
  keyTap(code: string): void {
    try {
      const key =
        this.getMappedKey(code);

      if (!key) {
        console.warn(
          '[Keyboard] Unknown key code:',
          code
        );

        return;
      }

      robot.keyTap(key);
    } catch (err) {
      console.error(
        '[Keyboard] Key tap failed:',
        err
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * TYPE TEXT
   * ------------------------------------------------------------
   *
   * Currently not used by the remote-control protocol.
   *
   * Keyboard control should normally use KEY_DOWN / KEY_UP.
   */
  typeText(text: string): void {
    try {
      if (
        typeof text !== 'string' ||
        text.length === 0
      ) {
        return;
      }

      /**
       * Prevent accidentally attempting extremely large input.
       */
      const safeText =
        text.slice(0, 2000);

      robot.typeString(
        safeText
      );
    } catch (err) {
      console.error(
        '[Keyboard] Type text failed:',
        err
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * RELEASE EVERYTHING
   * ------------------------------------------------------------
   *
   * Very important when:
   *
   * Customer stops control
   * Controller disconnects
   * Agent disconnects
   * Session expires
   *
   * Otherwise Ctrl/Shift/Alt may remain physically held.
   */
  releaseAllKeys(): void {
    /**
     * Make a copy because we modify the Maps during cleanup.
     */
    const keys =
      Array.from(
        this.robotKeyHoldCounts.keys()
      );

    for (
      const key of keys
    ) {
      try {
        robot.keyToggle(
          key,
          'up'
        );
      } catch (err) {
        console.warn(
          `[Keyboard] Failed releasing ${key}:`,
          err
        );
      }
    }

    this.pressedCodes.clear();

    this.robotKeyHoldCounts.clear();

    console.log(
      '[Keyboard] All pressed keys released'
    );
  }

  /**
   * ------------------------------------------------------------
   * HOTKEY
   * ------------------------------------------------------------
   *
   * Example:
   *
   * hotkey(
   *   ['ControlLeft'],
   *   'KeyC'
   * )
   *
   * produces:
   *
   * Ctrl + C
   *
   * without depending on a robot.hotkey() function.
   */
  hotkey(
    modifierCodes: string[],
    keyCode: string
  ): void {
    const pressedModifiers:
      string[] = [];

    try {
      /**
       * Press modifiers.
       */
      for (
        const modifierCode of modifierCodes
      ) {
        const modifier =
          this.getMappedKey(
            modifierCode
          );

        if (!modifier) {
          continue;
        }

        robot.keyToggle(
          modifier,
          'down'
        );

        pressedModifiers.push(
          modifier
        );
      }

      /**
       * Tap main key.
       */
      const key =
        this.getMappedKey(
          keyCode
        );

      if (!key) {
        throw new Error(
          `Unknown hotkey key: ${keyCode}`
        );
      }

      robot.keyTap(key);
    } catch (err) {
      console.error(
        '[Keyboard] Hotkey failed:',
        err
      );
    } finally {
      /**
       * Release modifiers in reverse order.
       */
      for (
        let i =
          pressedModifiers.length -
          1;
        i >= 0;
        i--
      ) {
        try {
          robot.keyToggle(
            pressedModifiers[i],
            'up'
          );
        } catch {
          // Best-effort cleanup.
        }
      }
    }
  }

  /**
   * ------------------------------------------------------------
   * STATUS
   * ------------------------------------------------------------
   */
  isKeyPressed(
    code: string
  ): boolean {
    return this.pressedCodes.has(
      code
    );
  }

  getPressedKeyCount(): number {
    return this.pressedCodes.size;
  }

  /**
   * ------------------------------------------------------------
   * KEY MAPPING
   * ------------------------------------------------------------
   */
  private getMappedKey(
    code: string
  ): string | null {
    if (
      !code ||
      typeof code !==
        'string'
    ) {
      return null;
    }

    const key =
      this.keyMap[code];

    return key || null;
  }
}