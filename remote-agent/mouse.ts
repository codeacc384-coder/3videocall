import robot from 'robotjs';

export class MouseController {
  private screenWidth: number;
  private screenHeight: number;

  constructor() {
    const size = robot.getScreenSize();
    this.screenWidth = size.width;
    this.screenHeight = size.height;
  }

  moveMouse(normalizedX: number, normalizedY: number): void {
    try {
      const x = Math.round(normalizedX * this.screenWidth);
      const y = Math.round(normalizedY * this.screenHeight);

      // Clamp to screen bounds
      const clampedX = Math.max(0, Math.min(x, this.screenWidth - 1));
      const clampedY = Math.max(0, Math.min(y, this.screenHeight - 1));

      robot.moveMouse(clampedX, clampedY);
    } catch (err) {
      console.error('[Mouse] Move failed:', err);
    }
  }

  click(button: 'left' | 'right' | 'middle' = 'left'): void {
    try {
      robot.mouseClick(button);
    } catch (err) {
      console.error('[Mouse] Click failed:', err);
    }
  }

  doubleClick(): void {
    try {
      robot.mouseClick('left', true);
    } catch (err) {
      console.error('[Mouse] Double click failed:', err);
    }
  }

  scroll(deltaY: number): void {
    try {
      // Positive deltaY = scroll down, negative = scroll up
      const direction = deltaY > 0 ? 'down' : 'up';
      const amount = Math.abs(Math.round(deltaY / 3));

      for (let i = 0; i < amount; i++) {
        robot.scroll(0, direction === 'down' ? -1 : 1);
      }
    } catch (err) {
      console.error('[Mouse] Scroll failed:', err);
    }
  }

  mouseDown(button: 'left' | 'right' | 'middle' = 'left'): void {
    try {
      robot.mouseToggle('down', button);
    } catch (err) {
      console.error('[Mouse] Mouse down failed:', err);
    }
  }

  mouseUp(button: 'left' | 'right' | 'middle' = 'left'): void {
    try {
      robot.mouseToggle('up', button);
    } catch (err) {
      console.error('[Mouse] Mouse up failed:', err);
    }
  }

  updateScreenSize(): void {
    try {
      const size = robot.getScreenSize();
      this.screenWidth = size.width;
      this.screenHeight = size.height;
      console.log('[Mouse] Screen size updated:', this.screenWidth, 'x', this.screenHeight);
    } catch (err) {
      console.error('[Mouse] Failed to update screen size:', err);
    }
  }
}
