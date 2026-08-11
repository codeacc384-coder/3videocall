import WebSocket from 'ws';
import { RemoteControlEvent } from '../src/types/remoteControl';

/**
 * Agent WebSocket connection to relay server
 * NOT for local browser detection (that uses localhost:9876)
 */
export class AgentConnection {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 2000;
  private messageHandlers: Map<string, (event: RemoteControlEvent) => void> = new Map();
  private connectionHandlers: ((connected: boolean) => void)[] = [];

  constructor(url?: string) {
    // Use environment variable for relay server URL
    // Development: ws://localhost:8080/remote-control
    // Production: wss://remote.example.com/remote-control
    this.url = url || process.env.REMOTE_CONTROL_WS_URL || 'ws://localhost:8080/remote-control';
    console.log('[AgentConnection] Using relay server:', this.url);
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[Agent] Connected to relay server');
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as RemoteControlEvent;
            const handler = this.messageHandlers.get(data.type);
            if (handler) {
              handler(data);
            }
          } catch (err) {
            console.error('[Agent] Failed to parse message:', err);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[Agent] WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[Agent] Disconnected from relay server');
          this.notifyConnectionHandlers(false);
          this.attemptReconnect();
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`[Agent] Reconnecting in ${Math.round(delay)}ms...`);
      setTimeout(() => this.connect().catch(console.error), delay);
    } else {
      console.error('[Agent] Max reconnection attempts reached');
    }
  }

  send(event: RemoteControlEvent): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('[Agent] WebSocket not connected, cannot send:', event.type);
    }
  }

  on(eventType: string, handler: (event: RemoteControlEvent) => void): void {
    this.messageHandlers.set(eventType, handler);
  }

  off(eventType: string): void {
    this.messageHandlers.delete(eventType);
  }

  onConnectionChange(handler: (connected: boolean) => void): void {
    this.connectionHandlers.push(handler);
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
    this.connectionHandlers = [];
  }
}
