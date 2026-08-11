import React, { useState, useEffect } from 'react';
import { Video, Plus, Trash2, Edit2, Calendar, Clock, Users, Loader, Copy, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PortalRole } from '../../types/insurance';
import { CreateConsultationModal } from './CreateConsultationModal';
import { VideoConsultationRoom } from './VideoConsultationRoom';

interface Consultation {
  id: string;
  title: string;
  room_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  created_by: string;
  customer_id: string;
  advisor_id: string;
  officer_id: string;
  customer?: { full_name: string };
  advisor?: { full_name: string };
  officer?: { full_name: string };
}

interface ConsultationsPageProps {
  currentUserId: string;
  currentUserRole: PortalRole;
  currentUserName: string;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const ConsultationsPage: React.FC<ConsultationsPageProps> = ({
  currentUserId,
  currentUserRole,
  currentUserName,
  addToast,
}) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeRoom, setActiveRoom] = useState<{ roomId: string; title: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const notify = (type: 'success' | 'error' | 'info', title: string, msg: string) => {
    if (addToast) addToast(type, title, msg);
  };

  const fetchConsultations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('consultations')
      .select(`
        *,
        customer:customer_id(full_name),
        advisor:advisor_id(full_name),
        officer:officer_id(full_name)
      `)
      .or(`customer_id.eq.${currentUserId},advisor_id.eq.${currentUserId},officer_id.eq.${currentUserId}`)
      .order('scheduled_at', { ascending: true });

    setConsultations((data as Consultation[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchConsultations();

    // Realtime subscription
    const channel = supabase
      .channel('consultations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultations' }, fetchConsultations)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  const handleDelete = async (id: string) => {
    await supabase.from('consultations').delete().eq('id', id);
    notify('info', 'Deleted', 'Consultation removed.');
    fetchConsultations();
  };

  const handleEditSave = async (id: string) => {
    const scheduledAt = new Date(`${editDate}T${editTime}`).toISOString();
    await supabase.from('consultations').update({ title: editTitle, scheduled_at: scheduledAt }).eq('id', id);
    setEditingId(null);
    notify('success', 'Updated', 'Consultation updated.');
    fetchConsultations();
  };

  const startEdit = (c: Consultation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
    const d = new Date(c.scheduled_at);
    setEditDate(d.toISOString().split('T')[0]);
    setEditTime(d.toTimeString().slice(0, 5));
  };

  const copyRoomId = (roomId: string) => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusColor: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    live: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (activeRoom) {
    return (
      <VideoConsultationRoom
        roomId={activeRoom.roomId}
        title={activeRoom.title}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
        onClose={() => setActiveRoom(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {showCreateModal && (
        <CreateConsultationModal
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          currentUserName={currentUserName}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            notify('success', 'Consultation Scheduled', 'Video room created and participants notified.');
            fetchConsultations();
          }}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Video Consultations</h2>
          <p className="text-xs text-slate-500">Schedule and manage 3-way video consultations with customers and team.</p>
        </div>
        {(currentUserRole === 'advisor' || currentUserRole === 'officer') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Schedule Consultation
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : consultations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <Video className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-500">No consultations scheduled yet.</p>
          {(currentUserRole === 'advisor' || currentUserRole === 'officer') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 font-bold text-xs hover:underline"
            >
              + Schedule your first consultation
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              {editingId === c.id ? (
                /* Inline Edit Form */
                <div className="space-y-3 text-xs">
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                      className="border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500" />
                    <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                      className="border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditSave(c.id)}
                      className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Save</button>
                    <button onClick={() => setEditingId(null)}
                      className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${statusColor[c.status]}`}>
                          {c.status === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>}
                          {c.status}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(c.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(c.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-blue-700 font-semibold">
                          <Users className="w-3.5 h-3.5" />
                          Customer: {(c.customer as any)?.full_name || '—'}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          Advisor: {(c.advisor as any)?.full_name || '—'}
                        </span>
                        <span className="flex items-center gap-1 text-purple-700 font-semibold">
                          Officer: {(c.officer as any)?.full_name || '—'}
                        </span>
                      </div>

                      {/* Room ID */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">Room: {c.room_id}</span>
                        <button onClick={() => copyRoomId(c.room_id)} className="text-slate-400 hover:text-blue-600">
                          {copiedId === c.room_id
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActiveRoom({ roomId: c.room_id, title: c.title })}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" /> Join
                      </button>

                      {c.created_by === currentUserId && (
                        <>
                          <button
                            onClick={() => startEdit(c)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
