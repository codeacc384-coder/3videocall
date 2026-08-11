import { app, BrowserWindow, Menu, Tray, ipcMain } from 'electron';
import path from 'path';
import { AgentConnection } from './connection';
import { ControlHandler } from './control';
import { AgentSecurity } from './security';
import { RemoteControlEvent } from '../src/types/remoteControl';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let agentConnection: AgentConnection | null = null;
let controlHandler: ControlHandler | null = null;
let security: AgentSecurity | null = null;

// Local health check port (ONLY for local detection)
const LOCAL_HEALTH_PORT = 9876;

// Relay server configuration
const RELAY_SERVER_URL = process.env.REMOTE_CONTROL_WS_URL || 'ws://localhost:8080/remote-control';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('minimize', (event: any) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('close', (event: any) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      },
    },
    {
      label: 'Status',
      enabled: false,
      click: () => {},
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

function initializeAgent() {
  security = new AgentSecurity();
  controlHandler = new ControlHandler(security);
  agentConnection = new AgentConnection(RELAY_SERVER_URL);

  // Handle control events from relay server
  agentConnection.on('MOUSE_MOVE', (event: RemoteControlEvent) => {
    if (controlHandler) {
      controlHandler.handleEvent(event);
    }
  });

  agentConnection.on('MOUSE_CLICK', (event: RemoteControlEvent) => {
    if (controlHandler) {
      controlHandler.handleEvent(event);
    }
  });

  agentConnection.on('MOUSE_DOUBLE_CLICK', (event: RemoteControlEvent) => {
    if (controlHandler) {
      controlHandler.handleEvent(event);
    }
  });

  agentConnection.on('SCROLL', (event: RemoteControlEvent) => {
    if (controlHandler) {
      controlHandler.handleEvent(event);
    }
  });

  agentConnection.on('KEY_DOWN', (event: RemoteControlEvent) => {
    if (controlHandler) {
      controlHandler.handleEvent(event);
    }
  });

  agentConnection.on('KEY_UP', (event: RemoteControlEvent) => {
    if (controlHandler) {
      controlHandler.handleEvent(event);
    }
  });

  agentConnection.on('CONTROL_STOPPED', (event: RemoteControlEvent) => {
    if (controlHandler) {
      controlHandler.stopControl();
    }
    if (mainWindow) {
      mainWindow.webContents.send('control-stopped', event);
    }
  });

  agentConnection.on('AGENT_REGISTERED', (event: RemoteControlEvent) => {
    console.log('[Agent] AGENT_REGISTERED', event);
    if (mainWindow) mainWindow.webContents.send('agent-registered', event);
  });

  agentConnection.onConnectionChange((connected: boolean) => {
    console.log('[Agent] Relay connection status:', connected);
    if (mainWindow) {
      mainWindow.webContents.send('relay-connection-status', { connected });
    }
  });

  // Connect to relay server
  agentConnection.connect().catch((err) => {
    console.error('[Agent] Failed to connect to relay server:', err);
  });
}

// IPC Handlers
ipcMain.handle('get-agent-status', () => {
  return {
    relayConnected: agentConnection?.isConnected() || false,
    version: '1.0.0',
    relayServer: RELAY_SERVER_URL,
  };
});

ipcMain.handle('stop-control', () => {
  if (controlHandler) {
    controlHandler.stopControl();
  }
});

ipcMain.handle('register-with-relay', async (event, data) => {
  // This is called when Customer approves control
  // data contains: { remoteSessionId, token, meetingId, customerId }
  if (agentConnection) {
    const registerMessage = {
      type: 'AGENT_REGISTER',
      meetingId: data.meetingId,
      remoteSessionId: data.remoteSessionId,
      customerId: data.customerId,
      token: data.token,
    };
    agentConnection.send(registerMessage as any);
  }
});

app.on('ready', () => {
  createWindow();
  createTray();
  initializeAgent();

  // Cleanup expired sessions every minute
  setInterval(() => {
    if (security) {
      security.clearExpiredSessions();
    }
  }, 60000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  if (agentConnection) {
    agentConnection.disconnect();
  }
});
