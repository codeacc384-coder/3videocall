import { supabase } from '../lib/supabase';
import { RemoteControlSession, RemoteControlState } from '../types/remoteControl';

export class RemoteControlService {
  static async createControlRequest(
    meetingId: string,
    customerId: string,
    requesterId: string,
    requesterRole: 'officer' | 'adviser'
  ): Promise<RemoteControlSession> {
    const remoteSessionId = crypto.randomUUID();
    const authToken = this.generateAuthToken();

    const { data, error } = await supabase
      .from('remote_control_sessions')
      .insert({
        meeting_id: meetingId,
        customer_id: customerId,
        requester_id: requesterId,
        requester_role: requesterRole,
        remote_session_id: remoteSessionId,
        auth_token: authToken,
        status: 'requested',
      })
      .select()
      .single();

    if (error) throw error;
    return data as RemoteControlSession;
  }

  static async approveControlRequest(
    sessionId: string,
    controllerId: string
  ): Promise<RemoteControlSession> {
    const { data, error } = await supabase
      .from('remote_control_sessions')
      .update({
        controller_id: controllerId,
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data as RemoteControlSession;
  }

  static async rejectControlRequest(sessionId: string): Promise<RemoteControlSession> {
    const { data, error } = await supabase
      .from('remote_control_sessions')
      .update({
        status: 'rejected',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data as RemoteControlSession;
  }

  static async startControl(sessionId: string): Promise<RemoteControlSession> {
    const { data, error } = await supabase
      .from('remote_control_sessions')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data as RemoteControlSession;
  }

  static async stopControl(sessionId: string): Promise<RemoteControlSession> {
    const { data, error } = await supabase
      .from('remote_control_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data as RemoteControlSession;
  }

  static async getActiveSession(
    meetingId: string,
    customerId: string
  ): Promise<RemoteControlSession | null> {
    const { data, error } = await supabase
      .from('remote_control_sessions')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('customer_id', customerId)
      .in('status', ['requested', 'approved', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as RemoteControlSession) || null;
  }

  static async validateSession(
    remoteSessionId: string,
    authToken: string
  ): Promise<RemoteControlSession | null> {
    const { data, error } = await supabase
      .from('remote_control_sessions')
      .select('*')
      .eq('remote_session_id', remoteSessionId)
      .eq('auth_token', authToken)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as RemoteControlSession) || null;
  }

  private static generateAuthToken(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}.${random}`;
  }

  static async logControlEvent(
    sessionId: string,
    eventType: string,
    details?: Record<string, any>
  ): Promise<void> {
    // Audit log for control events
    // Can be extended to store in a separate audit table
    console.log(`[RemoteControl] ${eventType}:`, details);
  }
}
