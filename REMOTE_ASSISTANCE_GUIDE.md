# Remote Assistance Feature - Implementation Guide

## Overview

The Remote Assistance feature enables Officers and Advisers to request control of a Customer's computer during video consultations to provide hands-on assistance with form filling and other tasks.

## Architecture

### Components

#### React/TypeScript Components
- **RemoteControlButton.tsx** - Share Screen button in video call controls
- **RequestControlButton.tsx** - Request Control button for Officer/Adviser
- **ReleaseControlButton.tsx** - Release Control button for Officer/Adviser
- **RemoteControlBanner.tsx** - Modal for control permission requests
- **RemoteControlBannerComponent.tsx** - Active control banner with stop button
- **RemoteScreenController.tsx** - Interactive screen viewer with input capture

#### React Hooks
- **useRemoteControl.ts** - State management for remote control lifecycle
- **useRemoteAgent.ts** - Agent connection detection

#### Services
- **remoteControlService.ts** - Database operations for sessions
- **remoteControlProtocol.ts** - Event protocol definitions
- **remoteControlSocket.ts** - WebSocket wrapper for real-time events

#### Electron Remote Agent
- **main.ts** - Electron main process
- **preload.ts** - IPC bridge
- **control.ts** - Control event handler
- **mouse.ts** - Mouse input control
- **keyboard.ts** - Keyboard input control
- **connection.ts** - WebSocket connection
- **security.ts** - Session validation

### Data Flow

```
Customer clicks "Share Screen"
  ↓
Website captures screen via getDisplayMedia()
  ↓
Officer/Adviser sees shared screen
  ↓
Officer clicks "Request Control"
  ↓
Event sent via VideoSDK PubSub
  ↓
Customer receives permission modal
  ↓
Customer clicks "Allow Control"
  ↓
Session created in database
  ↓
WebSocket connection established
  ↓
Officer's mouse/keyboard events forwarded to Agent
  ↓
Agent applies inputs to Windows desktop
  ↓
Customer can stop at any time
```

## Database Schema

### remote_control_sessions Table

```sql
CREATE TABLE remote_control_sessions (
  id UUID PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  requester_id TEXT NOT NULL,
  requester_role TEXT NOT NULL,
  controller_id TEXT,
  status TEXT NOT NULL,
  remote_session_id TEXT UNIQUE NOT NULL,
  auth_token TEXT,
  requested_at TIMESTAMP,
  approved_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Status Values:**
- `requested` - Initial request sent
- `approved` - Customer approved
- `rejected` - Customer rejected
- `active` - Control is active
- `ended` - Control ended normally
- `disconnected` - Connection lost

## Feature Workflow

### 1. Screen Sharing

**Customer:**
1. Clicks "Share Screen" button in video call controls
2. Selects screen/window/tab to share
3. Screen appears in Officer/Adviser view
4. Button changes to "Stop Sharing"

**Officer/Adviser:**
- See Customer's shared screen in real-time
- Can see "Request Control" button when screen is shared

### 2. Control Request

**Officer/Adviser:**
1. Clicks "Request Control" button
2. Request sent via VideoSDK PubSub

**Customer:**
1. Receives modal: "Officer [Name] is requesting permission to control your computer"
2. Can click "Allow Control" or "Reject"
3. Banner shows: "You can stop remote control at any time"

### 3. Control Approval

**Customer approves:**
1. Session created in database
2. Auth token generated (5-minute expiry)
3. WebSocket connection established
4. Officer/Adviser sees "Release Control" button
5. Customer sees active control banner

### 4. Remote Control Active

**Officer/Adviser:**
- Mouse movements normalized to 0-1 coordinates
- Clicks, double-clicks, scrolling forwarded
- Keyboard input captured when screen viewer has focus
- Can release control at any time

**Customer:**
- Sees red banner: "Officer [Name] is controlling your computer"
- Can click "STOP CONTROL" to immediately end session
- Can still see all actions happening

### 5. Control Stops

Control automatically stops if:
- Customer clicks "STOP CONTROL"
- Officer/Adviser clicks "Release Control"
- Customer stops screen sharing
- Customer leaves meeting
- Officer/Adviser leaves meeting
- Network connection lost
- Agent disconnects

## Security

### Session Binding
- Each session has unique `remoteSessionId`
- Auth token expires after 5 minutes
- Tokens validated on every control event
- Session tied to specific meeting and customer

### Input Validation
- Only normalized coordinates (0-1) accepted
- Unknown key codes ignored
- Control events only processed when `controlAllowed === true`
- No clipboard access or text storage

### Privacy
- No typed content stored
- No passwords captured
- Only control session lifecycle events logged
- Audit trail: REQUEST, ACCEPT, REJECT, START, STOP, DISCONNECT

## Installation

### Website Setup

1. Install dependencies:
```bash
npm install
```

2. Run migrations:
```bash
psql -U postgres -d insuranceone < migrations/002_remote_control_sessions.sql
```

3. Start development server:
```bash
npm run dev
```

### Remote Agent Setup

1. Navigate to remote-agent directory:
```bash
cd remote-agent
```

2. Install dependencies:
```bash
npm install
```

3. Build:
```bash
npm run build
```

4. Run in development:
```bash
npm run dev
```

5. Build installer:
```bash
npm run dist
```

## Configuration

### Environment Variables

Add to `.env`:
```
REMOTE_CONTROL_ENABLED=true
REMOTE_AGENT_PORT=9876
REMOTE_CONTROL_TIMEOUT=300000
```

### Agent Connection

The website automatically detects the agent by:
1. Attempting connection to `ws://localhost:9876`
2. Sending health check every 5 seconds
3. Showing "Agent Connected" or "Agent not detected"

## Testing

### Manual Testing

1. **Screen Share:**
   - Customer clicks "Share Screen"
   - Select screen/window
   - Verify Officer/Adviser see screen

2. **Request Control:**
   - Officer clicks "Request Control"
   - Verify Customer receives modal
   - Customer clicks "Allow Control"

3. **Mouse Control:**
   - Officer moves mouse over screen
   - Verify cursor moves on Customer's desktop
   - Test clicks, double-clicks, scrolling

4. **Keyboard Control:**
   - Officer clicks in screen viewer
   - Type text
   - Verify text appears on Customer's desktop

5. **Stop Control:**
   - Customer clicks "STOP CONTROL"
   - Verify control immediately stops
   - Verify banner disappears

## Troubleshooting

### Agent Not Detected
- Ensure Remote Assistance Agent is installed and running
- Check if port 9876 is available
- Verify firewall allows localhost connections

### Control Events Not Working
- Check browser console for errors
- Verify WebSocket connection is established
- Ensure auth token hasn't expired
- Check Agent logs for input errors

### Screen Share Not Working
- Verify browser has permission to capture screen
- Try different screen/window
- Check if display media API is supported

## Future Enhancements

- [ ] Multi-monitor support
- [ ] Clipboard sharing
- [ ] File transfer
- [ ] Session recording
- [ ] Control history/playback
- [ ] Gesture recognition
- [ ] Mobile device support
- [ ] End-to-end encryption

## Support

For issues or questions, contact the development team.
