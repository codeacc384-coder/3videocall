import robot from '@jitsi/robotjs';
export type MouseButton =
  | 'left'
  | 'right'
  | 'middle';

export class MouseController {
  private screenWidth = 1;
  private screenHeight = 1;

  constructor() {
    this.updateScreenSize();
  }

  /**
   * ------------------------------------------------------------
   * MOVE MOUSE
   * ------------------------------------------------------------
   *
   * Input coordinates are normalized:
   *
   * x = 0.0 -> left edge
   * x = 1.0 -> right edge
   *
   * y = 0.0 -> top
   * y = 1.0 -> bottom
   */
  moveMouse(
    normalizedX: number,
    normalizedY: number
  ): void {
    try {
      const xRatio =
        this.clamp01(normalizedX);

      const yRatio =
        this.clamp01(normalizedY);

      /**
       * Pixel indexes are:
       *
       * 0 .. width - 1
       * 0 .. height - 1
       */
      const x =
        Math.round(
          xRatio *
            Math.max(
              0,
              this.screenWidth - 1
            )
        );

      const y =
        Math.round(
          yRatio *
            Math.max(
              0,
              this.screenHeight - 1
            )
        );

      robot.moveMouse(
        x,
        y
      );
    } catch (err) {
      console.error(
        '[Mouse] Move failed:',
        err
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * SINGLE CLICK
   * ------------------------------------------------------------
   */
  click(
    button: MouseButton =
      'left'
  ): void {
    try {
      robot.mouseClick(
        button
      );
    } catch (err) {
      console.error(
        '[Mouse] Click failed:',
        err
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * DOUBLE CLICK
   * ------------------------------------------------------------
   */
  doubleClick(
    button: MouseButton =
      'left'
  ): void {
    try {
      robot.mouseClick(
        button,
        true
      );
    } catch (err) {
      console.error(
        '[Mouse] Double click failed:',
        err
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * MOUSE DOWN
   * ------------------------------------------------------------
   *
   * Needed for:
   *
   * drag & drop
   * sliders
   * selecting text
   */
  mouseDown(
    button: MouseButton =
      'left'
  ): void {
    try {
      robot.mouseToggle(
        'down',
        button
      );
    } catch (err) {
      console.error(
        '[Mouse] Mouse down failed:',
        err
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * MOUSE UP
   * ------------------------------------------------------------
   */
  mouseUp(
    button: MouseButton =
      'left'
  ): void {
    try {
      robot.mouseToggle(
        'up',
        button
      );
    } catch (err) {
      console.error(
        '[Mouse] Mouse up failed:',
        err
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * SCROLL
   * ------------------------------------------------------------
   *
   * Browser wheel:
   *
   * positive deltaY = down
   * negative deltaY = up
   *
   * RobotJS uses positive vertical values for up,
   * negative values for down.
   */
  scroll(
    deltaY: number
  ): void {
    try {
      if (
        !Number.isFinite(
          deltaY
        )
      ) {
        return;
      }

      if (
        deltaY === 0
      ) {
        return;
      }

      /**
       * Convert browser wheel amount to
       * a reasonable native scroll amount.
       *
       * Avoid looping hundreds of times.
       */
      const magnitude =
        Math.max(
          1,
          Math.min(
            20,
            Math.round(
              Math.abs(
                deltaY
              ) / 100
            )
          )
        );

      const direction =
        deltaY > 0
          ? -magnitude
          : magnitude;

      robot.scrollMouse(
        0,
        direction
      );
    } catch (err) {
      /**
       * Some RobotJS builds expose robot.scroll()
       * instead of scrollMouse().
       *
       * Fall back safely.
       */
      try {
        const magnitude =
          Math.max(
            1,
            Math.min(
              20,
              Math.round(
                Math.abs(
                  deltaY
                ) / 100
              )
            )
          );

        const direction =
          deltaY > 0
            ? -magnitude
            : magnitude;

        const legacyRobot =
          robot as any;

        if (
          typeof legacyRobot.scroll ===
          'function'
        ) {
          legacyRobot.scroll(
            0,
            direction
          );

          return;
        }
      } catch {
        // Continue to final log.
      }

      console.error(
        '[Mouse] Scroll failed:',
        err
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * SCREEN SIZE
   * ------------------------------------------------------------
   *
   * Call before beginning a new remote-control session.
   *
   * Useful if Customer:
   *
   * - changes resolution
   * - connects another monitor
   * - disconnects a monitor
   */
  updateScreenSize(): void {
    try {
      const size =
        robot.getScreenSize();

      if (
        size.width <= 0 ||
        size.height <= 0
      ) {
        throw new Error(
          'Invalid screen dimensions'
        );
      }

      this.screenWidth =
        size.width;

      this.screenHeight =
        size.height;

      console.log(
        `[Mouse] Screen size: ${this.screenWidth}x${this.screenHeight}`
      );
    } catch (err) {
      console.error(
        '[Mouse] Failed to update screen size:',
        err
      );
    }
  }

  getScreenSize(): {
    width: number;
    height: number;
  } {
    return {
      width:
        this.screenWidth,

      height:
        this.screenHeight,
    };
  }

  /**
   * ------------------------------------------------------------
   * HELPERS
   * ------------------------------------------------------------
   */
  private clamp01(
    value: number
  ): number {
    if (
      !Number.isFinite(
        value
      )
    ) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        1,
        value
      )
    );
  }
}