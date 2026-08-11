# Internet-Based Remote Control - Implementation Guide

## ✅ ARCHITECTURE FIXED

The remote control system has been completely rebuilt for internet-based communication between different laptops.

---

## 📋 EXACT FILES CREATED

### Relay Server (5 files)
```
remote-control-server/
├── src/
│   ├── server.ts                    ← Main WebSocket relay server
│   ├── sessionManager.ts            ← Session tracking & lifecycle
│   ├── authentication.ts            ← Token generation & validation
│   ├── messageRouter.ts             ← Event routing & validation
│   ├── types.ts                     ← TypeScript interfaces
│   └── tokenService.ts              ← Token generation for backend
├── package.json                     ← Dependencies
├── tsconfig.json                    ← TypeScript config
└── .env.example                     ← Environment variables
```

### Browser Socket (UPDATED)
```
src/services/remoteControlSocket.ts
├── Uses: import.meta.env.VITE_REMOTE_CONTROL_WS_URL
├── Development: ws://localhost:8080/remote-control
└── Production: wss://remote.example.com/remote-control
```

### Agent Connection (UPDATED)
```
remote-agent/connection.ts
├── Uses: process.env.REMOTE_CONTROL_WS_URL
├── Development: ws://localhost:8080/remote-control
└── Production: wss://remote.example.com/remote-control
```

### Agent Main (UPDATED)
```
remote-agent/main.ts
├── Registers with relay server
├── Handles control events from relay
├── Local health check: 127.0.0.1:9876 (ONLY)
└── Relay connection: wss://remote.example.com:8080
```

### Environment Files (NEW)
```
.env.remote-control
├── VITE_REMOTE_CONTROL_WS_URL=ws://localhost:8080/remote-control

remote-control-server/.env.example
├── PORT=8080
├── ALLOWED_ORIGINS=https://your-site.netlify.app
├── REMOTE_SESSION_SECRET=<strong-random>
└── NODE_ENV=development
```

---

## 🔍 LOCALHOST USAGE VERIFICATION

### ✅ CORRECT: Local Agent Detection ONLY
```typescript
// src/hooks/useRemoteAgent.ts
const response = await fetch('http://localhost:9876/health', {
  signal: controller.signal,
});

PURPOSE: Check if Agent is installed/running locally
NEVER carries remote-control commands
```

### ✅ CORRECT: Relay Server (Internet)
```typescript
// src/services/remoteControlSocket.ts (Officer Browser)
this.url = import.meta.env.VITE_REMOTE_CONTROL_WS_URL || 'ws://localhost:8080/remote-control';
// Production: wss://remote.example.com/remote-control

// remote-agent/connection.ts (Customer Agent)
this.url = process.env.REMOTE_CONTROL_WS_URL || 'ws://localhost:8080/remote-control';
// Production: wss://remote.example.com/remote-control
```

### ❌ REMOVED: Old localhost connections
```
DELETED:
- ws://localhost:9876 for remote control (was WRONG)
- ws://localhost:3000 for agent (was WRONG)

NOW:
- localhost:9876 ONLY for health check (127.0.0.1)
- All remote control via relay server (wss:// in production)
```

---

## 🚀 DEVELOPMENT SETUP

### Step 1: Start Relay Server
```bash
cd remote-control-server
npm install
npm run dev

# Output:
# [Server] Remote Control Relay Server listening on port 8080
# [Server] WebSocket endpoint: ws://localhost:8080/remote-control
# [Server] Allowed origins: http://localhost:5173,http://localhost:3000
```

### Step 2: Start Website
```bash
# In project root
npm run dev

# Uses: VITE_REMOTE_CONTROL_WS_URL=ws://localhost:8080/remote-control
# Runs on: http://localhost:5173
```

### Step 3: Start Agent
```bash
cd remote-agent
npm install
npm run dev

# Connects to: ws://localhost:8080/remote-control
# Health check: 127.0.0.1:9876
```

---

## 🌍 PRODUCTION SETUP

### Relay Server Deployment
```bash
# Build
cd remote-control-server
npm run build

# Deploy to VPS/Cloud
# Example: AWS EC2, DigitalOcean, Heroku, etc.

# Environment variables:
PORT=8080
ALLOWED_ORIGINS=https://app.example.com
REMOTE_SESSION_SECRET=<generate-strong-random-value>
NODE_ENV=production

# Behind reverse proxy (Nginx/Cloudflare):
# wss://remote.example.com/remote-control
#   ↓ (TLS)
# localhost:8080 (internal)
```

### Website Deployment (Netlify)
```bash
# Build
npm run build

# Deploy to Netlify
# Environment variables:
VITE_REMOTE_CONTROL_WS_URL=wss://remote.example.com/remote-control

# Result: https://app.example.com
```

### Agent Deployment
```bash
# Build installer
cd remote-agent
npm run build

# Distribute: InsuranceOne Remote Assistance.exe

# Customer sets environment:
REMOTE_CONTROL_WS_URL=wss://remote.example.com/remote-control

# Agent connects outbound to relay
# No incoming internet required
```

---

## 🔐 AUTHENTICATION FLOW

### 1. Generate Agent Token (Backend)
```typescript
// Your backend (Node.js/Express)
import { RemoteControlTokenService } from './remote-control-server/tokenService';

const tokenService = new RemoteControlTokenService(process.env.REMOTE_SESSION_SECRET);

// When Customer approves screen share:
const agentToken = tokenService.generateAgentToken(
  remoteSessionId,  // UUID
  meetingId,        // From VideoSDK
  customerId        // Current user
);

// Send to Customer Agent
```

### 2. Agent Registers with Relay
```typescript
// remote-agent/main.ts
const registerMessage = {
  type: 'AGENT_REGISTER',
  meetingId: 'meeting-456',
  remoteSessionId: 'uuid-123',
  customerId: 'customer-789',
  token: agentToken  // From backend
};

agentConnection.send(registerMessage);

// Relay validates token and stores:
// sessions.set('uuid-123', {
//   agentSocket: ws,
//   controlAllowed: false,
//   ...
// })
```

### 3. Generate Controller Token (Backend)
```typescript
// When Customer approves control request:
const controllerToken = tokenService.generateControllerToken(
  remoteSessionId,  // Same UUID
  meetingId,        // Same meeting
  controllerId,     // Officer/Adviser ID
  'officer'         // or 'adviser'
);

// Send to Officer Browser
```

### 4. Controller Registers with Relay
```typescript
// src/services/remoteControlSocket.ts (Officer)
const registerMessage = {
  type: 'CONTROLLER_REGISTER',
  meetingId: 'meeting-456',
  remoteSessionId: 'uuid-123',
  controllerId: 'officer-111',
  controllerRole: 'officer',
  token: controllerToken  // From backend
};

socket.send(registerMessage);

// Relay validates token and updates:
// sessions.get('uuid-123').controllerId = 'officer-111'
// sessions.get('uuid-123').controlAllowed = true
```

---

## 🖱️ CONTROL EVENT FLOW

### Officer Sends Mouse Movement
```
Officer Browser
  ↓
Captures mouse position relative to screen viewer
  ↓
Normalizes to 0-1 range
  ↓
Sends to relay:
{
  type: "CONTROL_EVENT",
  remoteSessionId: "uuid-123",
  event: {
    type: "MOUSE_MOVE",
    x: 0.52,
    y: 0.38
  }
}
  ↓
Relay validates:
  ✓ Session exists
  ✓ Control allowed
  ✓ Controller socket matches
  ✓ Coordinates in [0-1]
  ↓
Relay forwards ONLY event to Agent:
{
  type: "MOUSE_MOVE",
  x: 0.52,
  y: 0.38
}
  ↓
Agent denormalizes:
  actualX = 0.52 * screenWidth
  actualY = 0.38 * screenHeight
  ↓
Agent calls robotjs:
  robot.moveMouse(actualX, actualY)
  ↓
Windows mouse moves
```

---

## 🛑 STOP CONTROL FLOW

### Customer Stops
```
Customer clicks "STOP CONTROL"
  ↓
Website calls: sessionManager.stopControl(remoteSessionId)
  ↓
Session updated:
  controlAllowed = false
  controllerId = null
  ↓
Relay notifies Officer:
{
  type: "CONTROL_STOPPED",
  reason: "customer_stopped"
}
  ↓
Officer UI updates
```

### Officer Releases
```
Officer clicks "Release Control"
  ↓
Officer Browser sends:
{
  type: "CONTROL_STOP",
  remoteSessionId: "uuid-123",
  reason: "controller_released"
}
  ↓
Relay updates session
  ↓
Relay notifies Agent
  ↓
Agent stops accepting input
```

---

## 🔌 DISCONNECT HANDLING

### Agent Disconnects
```
Agent WebSocket closes
  ↓
Relay detects disconnect
  ↓
Relay notifies Officer:
{
  type: "CONTROL_STOPPED",
  reason: "agent_disconnected"
}
  ↓
Officer UI updates
```

### Officer Disconnects
```
Officer WebSocket closes
  ↓
Relay detects disconnect
  ↓
Relay notifies Agent:
{
  type: "CONTROL_STOPPED",
  reason: "controller_disconnected"
}
  ↓
Agent stops accepting input
```

### Session Expires
```
Session created with 30-minute expiry
  ↓
Relay cleanup runs every 1 minute
  ↓
If session.expiresAt < now():
  ↓
Relay closes both sockets
  ↓
Both sides receive:
{
  type: "CONTROL_STOPPED",
  reason: "session_expired"
}
```

---

## 📊 SESSION MANAGER

### Active Session Structure
```typescript
interface ActiveRemoteSession {
  remoteSessionId: string;           // UUID
  meetingId: string;                 // From VideoSDK
  customerId: string;                // Customer ID
  controllerId: string | null;       // Officer/Adviser ID
  controllerRole: 'officer' | 'adviser' | null;
  agentSocket: WebSocket | null;     // Agent connection
  controllerSocket: WebSocket | null; // Officer/Adviser connection
  controlAllowed: boolean;           // Can control?
  expiresAt: number;                 // Timestamp
  createdAt: number;                 // Timestamp
  lastHeartbeat: number;             // Timestamp
}
```

### Session Map
```typescript
// In relay server memory
const sessions = new Map<string, ActiveRemoteSession>();

// Key: remoteSessionId (UUID)
// Value: Session object

// Example:
sessions.set('uuid-123', {
  remoteSessionId: 'uuid-123',
  meetingId: 'meeting-456',
  customerId: 'customer-789',
  controllerId: 'officer-111',
  controllerRole: 'officer',
  agentSocket: ws1,
  controllerSocket: ws2,
  controlAllowed: true,
  expiresAt: 1704067200000,
  createdAt: 1704066600000,
  lastHeartbeat: 1704066900000
});
```

---

## 🔒 SECURITY FEATURES

### Token Validation
```typescript
// Relay validates every registration:
1. Token signature (HMAC-SHA256)
2. Token expiry (5 minutes)
3. Session ID match
4. User ID match
5. Role match (agent vs controller)
```

### Input Validation
```typescript
// Relay validates every control event:
1. Session exists
2. Control allowed
3. Controller socket matches
4. Event type valid
5. Coordinates in [0-1] range
6. Key codes valid (no shell commands)
```

### One Controller Limit
```typescript
// Only one Officer/Adviser can control at a time
if (session.controllerId && session.controllerId !== newControllerId) {
  return {
    type: 'CONTROL_DENIED',
    reason: 'Another participant currently has control'
  };
}
```

### No Data Logging
```typescript
// DO NOT log:
- Keystrokes
- Text typed
- Passwords
- Mouse movement history
- Customer form contents

// DO log:
- AGENT_CONNECTED
- CONTROLLER_CONNECTED
- CONTROL_STARTED
- CONTROL_STOPPED
- AGENT_DISCONNECTED
- CONTROLLER_DISCONNECTED
- SESSION_EXPIRED
- AUTH_FAILED
```

---

## 📝 ENVIRONMENT VARIABLES

### Website (.env.remote-control)
```
VITE_REMOTE_CONTROL_WS_URL=ws://localhost:8080/remote-control
# Production: wss://remote.example.com/remote-control
```

### Relay Server (remote-control-server/.env)
```
PORT=8080
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
REMOTE_SESSION_SECRET=dev-secret-change-in-production
NODE_ENV=development
```

### Agent (Electron)
```
REMOTE_CONTROL_WS_URL=ws://localhost:8080/remote-control
# Production: wss://remote.example.com/remote-control
```

---

## 🧪 TESTING SCENARIO

### Setup
```
Laptop A: Customer
Laptop B: Officer
Different internet connections
```

### Test Steps
```
1. Customer logs into https://app.netlify.app
2. Customer joins VideoSDK call
3. Officer logs into same website
4. Officer joins same call
5. Video/audio/chat works
6. Customer launches Remote Assistance Agent.exe
7. Website shows "Agent Connected"
8. Customer clicks "Share Screen"
9. Officer sees Customer screen
10. Officer clicks "Request Control"
11. Customer receives permission modal
12. Customer clicks "Allow Control"
13. Officer WebSocket connects to relay
14. Customer Agent already connected to relay
15. Relay binds both via remoteSessionId
16. Officer moves mouse
17. Relay sends event to Agent
18. Customer Agent moves Windows mouse
19. Officer types into Customer form
20. Customer clicks "STOP CONTROL"
21. Control ends
22. VideoSDK call continues
```

---

## ✅ VERIFICATION CHECKLIST

### Localhost Usage
- [x] localhost:9876 ONLY for health check (127.0.0.1)
- [x] localhost:9876 NEVER carries remote-control commands
- [x] Officer Browser connects to relay (not localhost:9876)
- [x] Agent connects to relay (not localhost:3000)
- [x] All remote control via relay server

### Relay Server
- [x] Listens on port 8080 (configurable)
- [x] Validates tokens on registration
- [x] Routes events correctly
- [x] Handles disconnects
- [x] Cleans up expired sessions
- [x] Implements heartbeat/ping-pong

### Browser Socket
- [x] Uses VITE_REMOTE_CONTROL_WS_URL
- [x] Development: ws://localhost:8080/remote-control
- [x] Production: wss://remote.example.com/remote-control
- [x] No hardcoded localhost for remote control

### Agent Connection
- [x] Uses REMOTE_CONTROL_WS_URL
- [x] Development: ws://localhost:8080/remote-control
- [x] Production: wss://remote.example.com/remote-control
- [x] No hardcoded localhost for remote control

### Security
- [x] Tokens validated
- [x] One controller limit
- [x] Input validation
- [x] No data logging
- [x] Session expiry

---

## 🚀 COMMANDS

### Development
```bash
# Terminal 1: Relay Server
cd remote-control-server
npm install
npm run dev

# Terminal 2: Website
npm run dev

# Terminal 3: Agent
cd remote-agent
npm install
npm run dev
```

### Production Build
```bash
# Relay Server
cd remote-control-server
npm run build
# Deploy dist/ to VPS

# Website
npm run build
# Deploy to Netlify

# Agent
cd remote-agent
npm run build
# Distribute .exe
```

---

## 📞 SUPPORT

For questions about:
- **Network flow:** See NETWORK_FLOW_INTERNET.md
- **Token generation:** See remote-control-server/tokenService.ts
- **Session management:** See remote-control-server/sessionManager.ts
- **Message routing:** See remote-control-server/messageRouter.ts

---

**Status:** ✅ Internet-based architecture complete
**Version:** 1.0.0
**Last Updated:** 2024
