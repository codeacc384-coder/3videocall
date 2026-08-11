# Remote Control Network Flow - Internet Architecture

## 🌐 Complete Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INTERNET-BASED ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────┘

LAPTOP B (Officer)                    RELAY SERVER                  LAPTOP A (Customer)
┌──────────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│  Officer Browser     │          │  Remote Control  │          │  Customer Agent  │
│  (Netlify)           │          │  Relay Server    │          │  (Electron)      │
│                      │          │                  │          │                  │
│ https://app.         │          │ wss://remote.    │          │ Connects to:     │
│ netlify.app          │          │ example.com:8080 │          │ wss://remote.    │
│                      │          │                  │          │ example.com:8080 │
│ ┌──────────────────┐ │          │ ┌──────────────┐ │          │ ┌──────────────┐ │
│ │ Remote Control   │ │          │ │ Session      │ │          │ │ Local Health │ │
│ │ Socket           │ │          │ │ Manager      │ │          │ │ Check        │ │
│ │                  │ │          │ │              │ │          │ │              │ │
│ │ wss://remote.    │◄──────────►│ ├──────────────┤ │          │ │ 127.0.0.1:   │ │
│ │ example.com:8080 │ │          │ │ Message      │ │          │ │ 9876/health  │ │
│ │                  │ │          │ │ Router       │ │          │ │              │ │
│ │ (Officer)        │ │          │ │              │ │          │ │ (ONLY local) │ │
│ └──────────────────┘ │          │ ├──────────────┤ │          │ └──────────────┘ │
│                      │          │ │ Auth Service │ │          │                  │
│ ┌──────────────────┐ │          │ │              │ │          │ ┌──────────────┐ │
│ │ Control Events   │ │          │ │ Validates    │ │          │ │ Mouse/       │ │
│ │                  │ │          │ │ tokens       │ │          │ │ Keyboard     │ │
│ │ MOUSE_MOVE       │ │          │ │              │ │          │ │ Control      │ │
│ │ MOUSE_CLICK      │ │          │ └──────────────┘ │          │ │              │ │
│ │ KEY_DOWN         │ │          │                  │          │ │ robotjs      │ │
│ │ etc.             │ │          │ ┌──────────────┐ │          │ │              │ │
│ └──────────────────┘ │          │ │ Active       │ │          │ └──────────────┘ │
│                      │          │ │ Sessions Map │ │          │                  │
│                      │          │ │              │ │          │ ┌──────────────┐ │
│                      │          │ │ remoteSession│ │          │ │ Windows      │ │
│                      │          │ │ Id → {       │ │          │ │ Input        │ │
│                      │          │ │   agent,    │ │          │ │              │ │
│                      │          │ │   controller │ │          │ │ Mouse        │ │
│                      │          │ │ }            │ │          │ │ Keyboard     │ │
│                      │          │ └──────────────┘ │          │ └──────────────┘ │
└──────────────────────┘          └──────────────────┘          └──────────────────┘
```

---

## 📋 Connection Types

### Connection A: Local Agent Detection (ONLY)
```
Customer Browser (http://localhost:5173)
    ↓
    HTTP GET
    ↓
127.0.0.1:9876/health
    ↓
Customer Agent (Electron)

Response:
{
  "running": true,
  "version": "1.0.0",
  "ready": true
}

PURPOSE ONLY:
✓ Is Agent installed?
✓ Is Agent running?
✓ Agent version
✓ Local readiness

NEVER carries remote-control commands
```

### Connection B: Internet Remote Control (RELAY)
```
Officer Browser (https://app.netlify.app)
    ↓
    WebSocket (wss://)
    ↓
Remote Control Relay Server (wss://remote.example.com:8080)
    ↓
    WebSocket (wss://)
    ↓
Customer Agent (Electron)

PURPOSE:
✓ Session registration
✓ Authentication
✓ Control request state
✓ Mouse movements
✓ Mouse clicks
✓ Scrolling
✓ Keyboard commands
✓ Disconnect handling
✓ Release control
```

---

## 🔐 Authentication Flow

### Step 1: Customer Approves Screen Share
```
Customer clicks "Share Screen"
    ↓
Website backend generates:
{
  remoteSessionId: "uuid-123",
  meetingId: "meeting-456",
  customerId: "customer-789",
  token: "SIGNED_TOKEN_AGENT"
}
    ↓
Token sent to Customer Agent (Electron)
```

### Step 2: Agent Registers with Relay
```
Customer Agent receives token
    ↓
Agent connects to relay server:
wss://remote.example.com:8080/remote-control
    ↓
Agent sends:
{
  type: "AGENT_REGISTER",
  meetingId: "meeting-456",
  remoteSessionId: "uuid-123",
  customerId: "customer-789",
  token: "SIGNED_TOKEN_AGENT"
}
    ↓
Relay validates token (HMAC-SHA256)
    ↓
Relay stores:
sessions.set("uuid-123", {
  remoteSessionId: "uuid-123",
  meetingId: "meeting-456",
  customerId: "customer-789",
  agentSocket: ws,
  controlAllowed: false,
  ...
})
    ↓
Relay responds:
{
  type: "AGENT_REGISTERED",
  remoteSessionId: "uuid-123"
}
```

### Step 3: Customer Approves Control Request
```
Officer clicks "Request Control"
    ↓
Customer receives modal
    ↓
Customer clicks "Allow Control"
    ↓
Website backend generates:
{
  remoteSessionId: "uuid-123",
  meetingId: "meeting-456",
  controllerId: "officer-111",
  controllerRole: "officer",
  token: "SIGNED_TOKEN_CONTROLLER"
}
    ↓
Token sent to Officer Browser
```

### Step 4: Controller Registers with Relay
```
Officer Browser receives token
    ↓
Officer connects to relay server:
wss://remote.example.com:8080/remote-control
    ↓
Officer sends:
{
  type: "CONTROLLER_REGISTER",
  meetingId: "meeting-456",
  remoteSessionId: "uuid-123",
  controllerId: "officer-111",
  controllerRole: "officer",
  token: "SIGNED_TOKEN_CONTROLLER"
}
    ↓
Relay validates token (HMAC-SHA256)
    ↓
Relay updates session:
sessions.get("uuid-123").controllerId = "officer-111"
sessions.get("uuid-123").controllerSocket = ws
sessions.get("uuid-123").controlAllowed = true
    ↓
Relay responds:
{
  type: "CONTROLLER_REGISTERED",
  remoteSessionId: "uuid-123"
}
```

---

## 🖱️ Control Event Flow

### Mouse Movement Example
```
Officer moves mouse over shared screen viewer
    ↓
Browser captures mouse position relative to screen element
    ↓
Normalize coordinates (0-1 range):
{
  x: 0.52,  // 52% across screen
  y: 0.38   // 38% down screen
}
    ↓
Officer Browser sends to relay:
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
✓ Coordinates in range [0-1]
    ↓
Relay forwards ONLY event payload to Agent:
{
  type: "MOUSE_MOVE",
  x: 0.52,
  y: 0.38
}
    ↓
Agent receives event
    ↓
Agent denormalizes coordinates:
actualX = 0.52 * screenWidth
actualY = 0.38 * screenHeight
    ↓
Agent calls robotjs:
robot.moveMouse(actualX, actualY)
    ↓
Windows mouse moves
```

### Keyboard Input Example
```
Officer clicks in screen viewer (focus)
    ↓
Officer types "hello"
    ↓
Browser captures KEY_DOWN events:
{
  type: "CONTROL_EVENT",
  remoteSessionId: "uuid-123",
  event: {
    type: "KEY_DOWN",
    code: "KeyH"
  }
}
    ↓
Relay validates and forwards to Agent
    ↓
Agent maps code to robotjs:
KeyH → 'h'
    ↓
Agent calls:
robot.keyToggle('h', 'down')
    ↓
Browser captures KEY_UP:
{
  type: "KEY_UP",
  code: "KeyH"
}
    ↓
Agent calls:
robot.keyToggle('h', 'up')
    ↓
Windows receives keystrokes
```

---

## 🛑 Stop Control Flow

### Customer Stops Control
```
Customer clicks "STOP CONTROL" banner
    ↓
Website calls:
sessionManager.stopControl(remoteSessionId)
    ↓
Session updated:
controlAllowed = false
controllerId = null
controllerSocket = null
    ↓
Relay notifies Officer:
{
  type: "CONTROL_STOPPED",
  reason: "customer_stopped",
  remoteSessionId: "uuid-123"
}
    ↓
Officer Browser receives notification
    ↓
Officer UI updates:
- "Request Control" button reappears
- "Release Control" button disappears
- Control banner disappears
```

### Officer Releases Control
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
Relay updates session:
controlAllowed = false
controllerId = null
    ↓
Relay notifies Agent:
{
  type: "CONTROL_STOPPED",
  reason: "controller_released",
  remoteSessionId: "uuid-123"
}
    ↓
Agent stops accepting input
```

---

## 🔌 Disconnect Handling

### Agent Disconnects
```
Customer Agent closes WebSocket
    ↓
Relay detects disconnect
    ↓
Relay finds session with this agent
    ↓
Relay notifies Officer:
{
  type: "CONTROL_STOPPED",
  reason: "agent_disconnected",
  remoteSessionId: "uuid-123"
}
    ↓
Officer Browser receives notification
    ↓
Officer UI updates:
- Control stops
- Error message shown
- "Request Control" button reappears
```

### Officer Disconnects
```
Officer Browser closes WebSocket
    ↓
Relay detects disconnect
    ↓
Relay finds session with this controller
    ↓
Relay notifies Agent:
{
  type: "CONTROL_STOPPED",
  reason: "controller_disconnected",
  remoteSessionId: "uuid-123"
}
    ↓
Agent stops accepting input
    ↓
Customer sees control ended
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
Relay deletes session
    ↓
Both sides receive:
{
  type: "CONTROL_STOPPED",
  reason: "session_expired"
}
```

---

## 📁 File Locations

### Relay Server
```
remote-control-server/
├── src/
│   ├── server.ts              ← Main WebSocket server
│   ├── sessionManager.ts      ← Session tracking
│   ├── authentication.ts      ← Token validation
│   ├── messageRouter.ts       ← Event routing
│   ├── types.ts               ← Type definitions
│   └── tokenService.ts        ← Token generation
├── package.json
├── tsconfig.json
└── .env.example
```

### Browser Socket (Officer)
```
src/services/remoteControlSocket.ts
├── Uses: import.meta.env.VITE_REMOTE_CONTROL_WS_URL
├── Development: ws://localhost:8080/remote-control
└── Production: wss://remote.example.com/remote-control
```

### Agent Connection
```
remote-agent/connection.ts
├── Uses: process.env.REMOTE_CONTROL_WS_URL
├── Development: ws://localhost:8080/remote-control
└── Production: wss://remote.example.com/remote-control
```

### Agent Main Process
```
remote-agent/main.ts
├── Registers with relay server
├── Handles control events
├── Local health check: 127.0.0.1:9876
└── Relay connection: wss://remote.example.com:8080
```

---

## 🚀 Development Setup

### Terminal 1: Relay Server
```bash
cd remote-control-server
npm install
npm run dev
# Listens on ws://localhost:8080/remote-control
```

### Terminal 2: Website
```bash
npm run dev
# Runs on http://localhost:5173
# Uses VITE_REMOTE_CONTROL_WS_URL=ws://localhost:8080/remote-control
```

### Terminal 3: Agent
```bash
cd remote-agent
npm install
npm run dev
# Connects to ws://localhost:8080/remote-control
# Health check on 127.0.0.1:9876
```

---

## 🌍 Production Setup

### Relay Server (VPS/Cloud)
```
wss://remote.example.com:8080/remote-control
├── TLS via Nginx/Cloudflare
├── Environment: REMOTE_SESSION_SECRET=<strong-random>
├── ALLOWED_ORIGINS=https://app.example.com
└── PORT=8080 (internal, exposed via reverse proxy)
```

### Website (Netlify)
```
https://app.example.com
├── Environment: VITE_REMOTE_CONTROL_WS_URL=wss://remote.example.com/remote-control
└── Deployed via Netlify
```

### Agent (Customer Laptop)
```
Environment: REMOTE_CONTROL_WS_URL=wss://remote.example.com/remote-control
├── Connects outbound to relay
├── Local health check: 127.0.0.1:9876
└── No incoming internet required
```

---

## ✅ Verification Checklist

- [ ] Relay server running on correct port
- [ ] Browser connects to relay (not localhost:9876)
- [ ] Agent connects to relay (not localhost:3000)
- [ ] localhost:9876 ONLY used for health check
- [ ] Tokens validated on registration
- [ ] Control events routed correctly
- [ ] Disconnect handling works
- [ ] Session cleanup runs
- [ ] Heartbeat/ping-pong working
- [ ] Production uses wss:// (not ws://)
- [ ] ALLOWED_ORIGINS configured
- [ ] REMOTE_SESSION_SECRET set in production

---

**Status:** ✅ Internet-based architecture complete
**Version:** 1.0.0
