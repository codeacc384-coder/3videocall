import WebSocket from 'ws';

import type {
  RemoteControlEvent,
} from './types/remoteControl';

/**
 * Customer Agent -> Render relay WebSocket connection.
 */
export class AgentConnection {
  private ws: WebSocket | null = null;

  private readonly url: string;

  private reconnectAttempts = 0;

  private readonly maxReconnectAttempts = 10;

  private readonly reconnectDelay = 2000;

  private reconnectTimer:
    | NodeJS.Timeout
    | null = null;

  private isConnecting = false;

  private manualDisconnect = false;

  private messageHandlers:
    Map<
      string,
      Set<
        (
          event:
            RemoteControlEvent
        ) => void
      >
    > = new Map();

  private connectionHandlers:
    Set<
      (
        connected:
          boolean
      ) => void
    > = new Set();

  constructor(url?: string) {
    this.url =
      url ||
      process.env
        .REMOTE_CONTROL_WS_URL ||
      'wss://threevideocall.onrender.com/remote-control';

    if (
      !url &&
      !process.env
        .REMOTE_CONTROL_WS_URL
    ) {
      console.warn(
        '[AgentConnection] REMOTE_CONTROL_WS_URL not configured. Using localhost fallback.'
      );
    }

    console.log(
      '[AgentConnection] Relay:',
      this.url
    );
  }

  /**
   * ------------------------------------------------------------
   * CONNECT
   * ------------------------------------------------------------
   */
  connect(): Promise<void> {
    if (
      this.ws &&
      this.ws.readyState ===
        WebSocket.OPEN
    ) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return new Promise(
        (
          resolve,
          reject
        ) => {
          let attempts = 0;

          const timer =
            setInterval(
              () => {
                attempts++;

                if (
                  this.isConnected()
                ) {
                  clearInterval(
                    timer
                  );

                  resolve();

                  return;
                }

                if (
                  !this.isConnecting
                ) {
                  clearInterval(
                    timer
                  );

                  reject(
                    new Error(
                      'Relay connection failed'
                    )
                  );

                  return;
                }

                if (
                  attempts >= 100
                ) {
                  clearInterval(
                    timer
                  );

                  reject(
                    new Error(
                      'Timed out waiting for relay connection'
                    )
                  );
                }
              },
              100
            );
        }
      );
    }

    this.manualDisconnect =
      false;

    this.clearReconnectTimer();

    this.isConnecting =
      true;

    return new Promise(
      (
        resolve,
        reject
      ) => {
        let settled =
          false;

        try {
          console.log(
            '[AgentConnection] Connecting...'
          );

          const socket =
            new WebSocket(
              this.url
            );

          this.ws =
            socket;

          /**
           * ws package uses EventEmitter-style events.
           */
          socket.on(
            'open',
            () => {
              if (
                this.ws !==
                  socket
              ) {
                try {
                  socket.close();
                } catch {}

                return;
              }

              console.log(
                '[AgentConnection] Connected'
              );

              this.isConnecting =
                false;

              this.reconnectAttempts =
                0;

              this.notifyConnectionHandlers(
                true
              );

              if (
                !settled
              ) {
                settled =
                  true;

                resolve();
              }
            }
          );

          /**
           * IMPORTANT FIX:
           *
           * Node "ws" gives RawData directly:
           *
           * (data) => ...
           *
           * NOT:
           *
           * (event) => event.data
           */
          socket.on(
            'message',
            (
              data:
                WebSocket.RawData
            ) => {
              this.handleIncomingMessage(
                data
              );
            }
          );

          socket.on(
            'error',
            (
              error
            ) => {
              console.error(
                '[AgentConnection] WebSocket error:',
                error
              );

              if (
                !settled &&
                !this.isConnected()
              ) {
                settled =
                  true;

                this.isConnecting =
                  false;

                reject(
                  new Error(
                    'WebSocket connection failed'
                  )
                );
              }
            }
          );

          socket.on(
            'close',
            (
              code,
              reason
            ) => {
              if (
                this.ws !==
                  socket
              ) {
                return;
              }

              console.log(
                `[AgentConnection] Disconnected (${code}) ${reason.toString()}`
              );

              this.ws =
                null;

              this.isConnecting =
                false;

              this.notifyConnectionHandlers(
                false
              );

              if (
                !settled
              ) {
                settled =
                  true;

                reject(
                  new Error(
                    `Connection closed before ready (${code})`
                  )
                );
              }

              if (
                !this.manualDisconnect
              ) {
                this.attemptReconnect();
              }
            }
          );
        } catch (err) {
          this.isConnecting =
            false;

          if (
            !settled
          ) {
            settled =
              true;

            reject(err);
          }
        }
      }
    );
  }

  /**
   * ------------------------------------------------------------
   * INCOMING MESSAGE
   * ------------------------------------------------------------
   */
  private handleIncomingMessage(
    rawData:
      WebSocket.RawData
  ): void {
    try {
      let raw: string;

      /**
       * ws RawData can be:
       *
       * Buffer
       * ArrayBuffer
       * Buffer[]
       */
      if (
        Buffer.isBuffer(
          rawData
        )
      ) {
        raw =
          rawData.toString(
            'utf8'
          );
      } else if (
        rawData instanceof
        ArrayBuffer
      ) {
        raw =
          Buffer.from(
            rawData
          ).toString(
            'utf8'
          );
      } else if (
        Array.isArray(
          rawData
        )
      ) {
        raw =
          Buffer.concat(
            rawData
          ).toString(
            'utf8'
          );
      } else {
        /**
         * Defensive fallback.
         */
        raw =
          Buffer.from(
            rawData as any
          ).toString(
            'utf8'
          );
      }

      const parsed =
        JSON.parse(
          raw
        ) as RemoteControlEvent;

      if (
        !parsed ||
        typeof parsed !==
          'object' ||
        typeof parsed.type !==
          'string'
      ) {
        console.warn(
          '[AgentConnection] Invalid relay message ignored'
        );

        return;
      }

      const handlers =
        this.messageHandlers.get(
          parsed.type
        );

      if (
        !handlers ||
        handlers.size ===
          0
      ) {
        console.log(
          '[AgentConnection] No handler for:',
          parsed.type
        );

        return;
      }

      handlers.forEach(
        (
          handler
        ) => {
          try {
            handler(
              parsed
            );
          } catch (err) {
            console.error(
              `[AgentConnection] Handler failed for ${parsed.type}:`,
              err
            );
          }
        }
      );
    } catch (err) {
      console.error(
        '[AgentConnection] Failed to parse relay message:',
        err
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * RECONNECT
   * ------------------------------------------------------------
   */
  private attemptReconnect(): void {
    if (
      this.manualDisconnect
    ) {
      return;
    }

    if (
      this.isConnected() ||
      this.isConnecting
    ) {
      return;
    }

    if (
      this.reconnectAttempts >=
      this.maxReconnectAttempts
    ) {
      console.error(
        '[AgentConnection] Maximum reconnect attempts reached'
      );

      return;
    }

    this.reconnectAttempts++;

    const delay =
      Math.min(
        this.reconnectDelay *
          Math.pow(
            1.5,
            this.reconnectAttempts -
              1
          ),
        30000
      );

    console.log(
      `[AgentConnection] Reconnecting in ${Math.round(
        delay
      )}ms`
    );

    this.clearReconnectTimer();

    this.reconnectTimer =
      setTimeout(
        () => {
          this.reconnectTimer =
            null;

          if (
            this.manualDisconnect
          ) {
            return;
          }

          this.connect()
            .catch(
              (
                err
              ) => {
                console.warn(
                  '[AgentConnection] Reconnect failed:',
                  err instanceof
                    Error
                    ? err.message
                    : err
                );

                if (
                  !this.isConnected() &&
                  !this.isConnecting &&
                  !this
                    .reconnectTimer &&
                  !this
                    .manualDisconnect
                ) {
                  this.attemptReconnect();
                }
              }
            );
        },
        delay
      );
  }

  private clearReconnectTimer(): void {
    if (
      this.reconnectTimer
    ) {
      clearTimeout(
        this.reconnectTimer
      );

      this.reconnectTimer =
        null;
    }
  }

  /**
   * ------------------------------------------------------------
   * SEND
   * ------------------------------------------------------------
   */
  send(
    event:
      RemoteControlEvent |
      Record<
        string,
        unknown
      >
  ): void {
    if (
      !this.ws ||
      this.ws.readyState !==
        WebSocket.OPEN
    ) {
      throw new Error(
        'Relay WebSocket is not connected'
      );
    }

    this.ws.send(
      JSON.stringify(
        event
      )
    );
  }

  /**
   * ------------------------------------------------------------
   * MESSAGE LISTENERS
   * ------------------------------------------------------------
   */
  on(
    eventType: string,
    handler: (
      event:
        RemoteControlEvent
    ) => void
  ): void {
    let handlers =
      this.messageHandlers.get(
        eventType
      );

    if (!handlers) {
      handlers =
        new Set();

      this.messageHandlers.set(
        eventType,
        handlers
      );
    }

    handlers.add(
      handler
    );
  }

  off(
    eventType: string,
    handler?: (
      event:
        RemoteControlEvent
    ) => void
  ): void {
    if (!handler) {
      this.messageHandlers.delete(
        eventType
      );

      return;
    }

    const handlers =
      this.messageHandlers.get(
        eventType
      );

    if (!handlers) {
      return;
    }

    handlers.delete(
      handler
    );

    if (
      handlers.size === 0
    ) {
      this.messageHandlers.delete(
        eventType
      );
    }
  }

  /**
   * ------------------------------------------------------------
   * CONNECTION LISTENERS
   * ------------------------------------------------------------
   */
  onConnectionChange(
    handler: (
      connected:
        boolean
    ) => void
  ): () => void {
    this.connectionHandlers.add(
      handler
    );

    try {
      handler(
        this.isConnected()
      );
    } catch {}

    return () => {
      this.connectionHandlers.delete(
        handler
      );
    };
  }

  private notifyConnectionHandlers(
    connected:
      boolean
  ): void {
    this.connectionHandlers.forEach(
      (
        handler
      ) => {
        try {
          handler(
            connected
          );
        } catch {}
      }
    );
  }

  /**
   * ------------------------------------------------------------
   * STATUS
   * ------------------------------------------------------------
   */
  isConnected(): boolean {
    return Boolean(
      this.ws &&
      this.ws.readyState ===
        WebSocket.OPEN
    );
  }

  /**
   * ------------------------------------------------------------
   * DISCONNECT
   * ------------------------------------------------------------
   */
  disconnect(): void {
    console.log(
      '[AgentConnection] Manual disconnect'
    );

    this.manualDisconnect =
      true;

    this.clearReconnectTimer();

    this.reconnectAttempts =
      0;

    this.isConnecting =
      false;

    const socket =
      this.ws;

    this.ws =
      null;

    if (socket) {
      try {
        socket.removeAllListeners();

        if (
          socket.readyState ===
            WebSocket.OPEN ||
          socket.readyState ===
            WebSocket.CONNECTING
        ) {
          socket.close(
            1000,
            'Agent shutdown'
          );
        }
      } catch {}
    }

    this.notifyConnectionHandlers(
      false
    );
  }

  destroy(): void {
    this.disconnect();

    this.messageHandlers.clear();

    this.connectionHandlers.clear();
  }
}