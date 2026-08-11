-- Remote Control Sessions Table
CREATE TABLE IF NOT EXISTS remote_control_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  requester_id TEXT NOT NULL,
  requester_role TEXT NOT NULL CHECK (requester_role IN ('officer', 'adviser')),
  controller_id TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'active', 'ended', 'disconnected')),
  remote_session_id TEXT UNIQUE NOT NULL,
  auth_token TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_remote_control_meeting ON remote_control_sessions(meeting_id);
CREATE INDEX idx_remote_control_customer ON remote_control_sessions(customer_id);
CREATE INDEX idx_remote_control_status ON remote_control_sessions(status);
