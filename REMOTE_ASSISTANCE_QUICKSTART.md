# Remote Assistance - Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 16+ installed
- PostgreSQL database running
- Git repository cloned

### Step 1: Database Migration (1 min)

```bash
# Run the migration
psql -U postgres -d insuranceone < migrations/002_remote_control_sessions.sql

# Verify table created
psql -U postgres -d insuranceone -c "\dt remote_control_sessions"
```

### Step 2: Install Dependencies (2 min)

```bash
# Website dependencies
npm install

# Remote Agent dependencies
cd remote-agent
npm install
cd ..
```

### Step 3: Start Development (2 min)

**Terminal 1 - Website:**
```bash
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Remote Agent:**
```bash
cd remote-agent
npm run dev
# Runs on http://localhost:9876
```

## Testing the Feature

### 1. Login as Customer
- Go to http://localhost:3000
- Login as customer
- Join a video consultation

### 2. Login as Officer (New Tab)
- Open new tab: http://localhost:3000
- Login as officer
- Join same consultation

### 3. Test Screen Share
- Customer clicks "Share Screen" button
- Select screen/window to share
- Officer should see the shared screen

### 4. Test Control Request
- Officer clicks "Request Control" button
- Customer receives modal
- Customer clicks "Allow Control"

### 5. Test Remote Control
- Officer moves mouse over screen
- Verify cursor moves on Customer's desktop
- Type text to test keyboard
- Click buttons to test mouse clicks

### 6. Stop Control
- Customer clicks "STOP CONTROL" banner
- Verify control stops immediately
- Verify banner disappears

## File Locations

| Component | Location |
|-----------|----------|
| Types | `src/types/remoteControl.ts` |
| Hooks | `src/hooks/useRemoteControl.ts` |
| Services | `src/services/remoteControl*.ts` |
| Components | `src/components/consultation/RemoteControl*.tsx` |
| Agent | `remote-agent/` |
| Database | `migrations/002_remote_control_sessions.sql` |
| Docs | `REMOTE_ASSISTANCE_GUIDE.md` |

## Key Files to Review

1. **VideoConsultationRoom.tsx** - Main integration point
2. **useRemoteControl.ts** - State management
3. **remoteControlService.ts** - Database operations
4. **remote-agent/main.ts** - Agent entry point

## Debugging

### Enable Verbose Logging

In `src/services/remoteControlSocket.ts`:
```typescript
// Add console.log statements
console.log('[RemoteControl]', 'Event:', event);
```

In `remote-agent/control.ts`:
```typescript
// Add console.log statements
console.log('[Control]', 'Handling:', event.type);
```

### Check Agent Connection

Open browser console:
```javascript
// Check if agent is connected
fetch('http://localhost:9876/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### View Database Sessions

```bash
psql -U postgres -d insuranceone

# List active sessions
SELECT * FROM remote_control_sessions WHERE status IN ('requested', 'approved', 'active');

# View session details
SELECT * FROM remote_control_sessions WHERE id = 'session-id';
```

## Common Issues

### "Agent not detected"
- Ensure `remote-agent` is running
- Check if port 9876 is available: `netstat -an | grep 9876`
- Verify firewall allows localhost:9876

### "Screen share not working"
- Check browser permissions for screen capture
- Try different screen/window
- Verify browser supports getDisplayMedia()

### "Control events not forwarding"
- Check browser console for errors
- Verify WebSocket connection: `ws://localhost:9876`
- Check agent logs for input errors

### "Database error"
- Verify migration ran: `\dt remote_control_sessions`
- Check database connection string
- Ensure user has proper permissions

## Next Steps

1. ✅ Run the setup above
2. ✅ Test all features manually
3. ✅ Review code in `src/components/consultation/`
4. ✅ Check `REMOTE_ASSISTANCE_GUIDE.md` for detailed docs
5. ✅ Build agent installer: `cd remote-agent && npm run dist`

## Production Deployment

### Before Going Live

1. **Security**
   - [ ] Use WSS (WebSocket Secure) instead of WS
   - [ ] Implement rate limiting
   - [ ] Add CSRF protection
   - [ ] Validate all inputs

2. **Performance**
   - [ ] Enable compression
   - [ ] Implement caching
   - [ ] Monitor memory usage
   - [ ] Load test with multiple sessions

3. **Monitoring**
   - [ ] Set up error tracking (Sentry)
   - [ ] Add performance monitoring
   - [ ] Create audit logs
   - [ ] Set up alerts

4. **Documentation**
   - [ ] Update user guides
   - [ ] Create admin documentation
   - [ ] Document API endpoints
   - [ ] Create troubleshooting guide

## Support

For issues or questions:
1. Check `REMOTE_ASSISTANCE_GUIDE.md`
2. Review browser console for errors
3. Check agent logs
4. Contact development team

---

**Happy Testing! 🚀**
