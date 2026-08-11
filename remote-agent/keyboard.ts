import robot from 'robotjs';

export class KeyboardController {
  private keyMap: Record<string, string> = {
    'KeyA': 'a',
    'KeyB': 'b',
    'KeyC': 'c',
    'KeyD': 'd',
    'KeyE': 'e',
    'KeyF': 'f',
    'KeyG': 'g',
    'KeyH': 'h',
    'KeyI': 'i',
    'KeyJ': 'j',
    'KeyK': 'k',
    'KeyL': 'l',
    'KeyM': 'm',
    'KeyN': 'n',
    'KeyO': 'o',
    'KeyP': 'p',
    'KeyQ': 'q',
    'KeyR': 'r',
    'KeyS': 's',
    'KeyT': 't',
    'KeyU': 'u',
    'KeyV': 'v',
    'KeyW': 'w',
    'KeyX': 'x',
    'KeyY': 'y',
    'KeyZ': 'z',
    'Digit0': '0',
    'Digit1': '1',
    'Digit2': '2',
    'Digit3': '3',
    'Digit4': '4',
    'Digit5': '5',
    'Digit6': '6',
    'Digit7': '7',
    'Digit8': '8',
    'Digit9': '9',
    'Space': 'space',
    'Enter': 'return',
    'Tab': 'tab',
    'Backspace': 'backspace',
    'Delete': 'delete',
    'Escape': 'escape',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'Home': 'home',
    'End': 'end',
    'PageUp': 'pageup',
    'PageDown': 'pagedown',
    'F1': 'f1',
    'F2': 'f2',
    'F3': 'f3',
    'F4': 'f4',
    'F5': 'f5',
    'F6': 'f6',
    'F7': 'f7',
    'F8': 'f8',
    'F9': 'f9',
    'F10': 'f10',
    'F11': 'f11',
    'F12': 'f12',
    'Minus': 'minus',
    'Equal': 'equal',
    'BracketLeft': 'bracketleft',
    'BracketRight': 'bracketright',
    'Semicolon': 'semicolon',
    'Quote': 'quote',
    'Backquote': 'backquote',
    'Backslash': 'backslash',
    'Comma': 'comma',
    'Period': 'period',
    'Slash': 'slash',
    'ControlLeft': 'ctrl',
    'ControlRight': 'ctrl',
    'ShiftLeft': 'shift',
    'ShiftRight': 'shift',
    'AltLeft': 'alt',
    'AltRight': 'alt',
    'MetaLeft': 'cmd',
    'MetaRight': 'cmd',
  };

  private pressedKeys: Set<string> = new Set();

  keyDown(code: string): void {
    try {
      const key = this.keyMap[code];
      if (!key) {
        console.warn('[Keyboard] Unknown key code:', code);
        return;
      }

      this.pressedKeys.add(key);
      robot.keyToggle(key, 'down');
    } catch (err) {
      console.error('[Keyboard] Key down failed:', err);
    }
  }

  keyUp(code: string): void {
    try {
      const key = this.keyMap[code];
      if (!key) return;

      this.pressedKeys.delete(key);
      robot.keyToggle(key, 'up');
    } catch (err) {
      console.error('[Keyboard] Key up failed:', err);
    }
  }

  typeText(text: string): void {
    try {
      robot.typeString(text);
    } catch (err) {
      console.error('[Keyboard] Type text failed:', err);
    }
  }

  releaseAllKeys(): void {
    try {
      for (const key of this.pressedKeys) {
        robot.keyToggle(key, 'up');
      }
      this.pressedKeys.clear();
    } catch (err) {
      console.error('[Keyboard] Release all keys failed:', err);
    }
  }

  hotkey(modifiers: string[], key: string): void {
    try {
      robot.hotkey(modifiers, key);
    } catch (err) {
      console.error('[Keyboard] Hotkey failed:', err);
    }
  }
}
