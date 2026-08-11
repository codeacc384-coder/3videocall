import { RemoteControlEvent } from '../types/remoteControl';

/**
 * Browser WebSocket client for Officer/Adviser to connect to relay server.
 * Remote-control traffic flows: Officer Browser → Render Relay → Customer Agent.
 * NOT for local agent detection (that uses http://127.0.0.1:9876/health only).
 * 
 * Singleton pattern to prevent duplicate connections on React re-renders.
 */

export type RelayConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

let socketInstance: RemoteControlSocket | null = null;

export class RemoteControlSocket {
  private ws: WebSocket | null = null;
  private relayUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, Set<(event: RemoteControlEvent) => void>> = new Map();
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private stateHandlers: ((state: RelayConnectionState) => void)[] = [];
  private manualDisconnect = false;
  private _state: RelayConnectionState = 'disconnected';
  private isConnecting = false;

  private constructor(url?: string) {
    const envUrl = import.meta.env.VITE_REMOTE_CONTROL_WS_URL as string | undefined;
    this.relayUrl = url || envUrl || '';

    if (!this.relayUrl) {
      throw new Error(
        '[RemoteControl] VITE_REMOTE_CONTROL_WS_URL is not configured. ' +
        'Set it in .env.production to wss://threevideocall.onrender.com/remote-control'
      );
    }

    console.log('[RemoteControl] Relay URL configured:', this.relayUrl);
  }

  static getInstance(url?: string): RemoteControlSocket {
    if (!socketInstance) {
      socketInstance = new RemoteControlSocket(url);
    }
    return socketInstance;
  }

  static resetInstance(): void {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  }

  get connectionState(): RelayConnectionState {
    return this._state;
  }

  private setState(state: RelayConnectionState): void {
    if (this._state === state) return;
    this._state = state;
    this.stateHandlers.forEach(h => h(state));
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error('[RemoteControl] Connection already in progress'));
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.isConnecting = true;
        console.log('[RemoteControl] Connecting to relay');
        this.setState('connecting');
        this.ws = new WebSocket(this.relayUrl);

        this.ws.onopen = () => {
          console.log('[RemoteControl] Relay connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.setState('connected');
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string) as RemoteControlEvent;
            const handlers = this.messageHandlers.get(data.type);
            if (handlers) {
              handlers.forEach(h => h(data));
            }
          } catch (err) {
            console.error('[RemoteControl] Failed to parse message:', err);
          }
        };

        this.ws.onerror = () => {
          console.error('[RemoteControl] WebSocket error');
          this.isConnecting = false;
          this.setState('error');
          reject(new Error('[RemoteControl] WebSocket error'));
        };

        this.ws.onclose = () => {
          console.log('[RemoteControl] Relay disconnected');
          this.isConnecting = false;
          this.setState('disconnected');
          this.notifyConnectionHandlers(false);
          if (!this.manualDisconnect) this.attemptReconnect();
        };
      } catch (err) {
        this.isConnecting = false;
        this.setState('error');
        reject(err);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[RemoteControl] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect().catch(() => {}), delay);
    } else {
      console.warn('[RemoteControl] Max reconnect attempts reached');
    }
  }

  send(event: RemoteControlEvent | any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[RemoteControl] Relay is not connected, dropping event:', event.type);
      return;
    }
    this.ws.send(JSON.stringify(event));
  }

  on(eventType: string, handler: (event: RemoteControlEvent) => void): void {
    let set = this.messageHandlers.get(eventType);
    if (!set) {
      set = new Set();
      this.messageHandlers.set(eventType, set);
    }
    set.add(handler);
  }

  off(eventType: string, handler?: (event: RemoteControlEvent) => void): void {
    if (!handler) {
      this.messageHandlers.delete(eventType);
      return;
    }
    const set = this.messageHandlers.get(eventType);
    if (set) {
      set.delete(handler);
      if (set.size === 0) this.messageHandlers.delete(eventType);
    }
  }

  onConnectionChange(handler: (connected: boolean) => void): void {
    this.connectionHandlers.push(handler);
  }

  onStateChange(handler: (state: RelayConnectionState) => void): void {
    this.stateHandlers.push(handler);
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(h => h(connected));
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    this.manualDisconnect = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState('disconnected');
    this.messageHandlers.clear();
    this.connectionHandlers = [];
    this.stateHandlers = [];
  }
}
