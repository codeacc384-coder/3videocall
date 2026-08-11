import React, { useState, useEffect } from 'react';
import { X, Video, ChevronLeft, ChevronRight, Users, Loader, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { createVideoSDKRoom } from '../../lib/videosdk';
import { PortalRole } from '../../types/insurance';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: PortalRole;
}

interface CreateConsultationModalProps {
  currentUserId: string;
  currentUserRole: PortalRole;
  currentUserName: string;
  onClose: () => void;
  onCreated: () => void;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export const CreateConsultationModal: React.FC<CreateConsultationModalProps> = ({
  currentUserId,
  currentUserRole,
  currentUserName,
  onClose,
  onCreated,
}) => {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [advisors, setAdvisors] = useState<Profile[]>([]);
  const [officers, setOfficers] = useState<Profile[]>([]);
  const [fetchingProfiles, setFetchingProfiles] = useState(true);

  const [title, setTitle] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step: 1 = details, 2 = calendar
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    async function fetchProfiles() {
      // Use service-level select — works if RLS allows select for authenticated users
      // We select all profiles and filter client-side
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .neq('id', currentUserId); // exclude self

      if (data) {
        setCustomers(data.filter((p: Profile) => p.role === 'customer'));
        setAdvisors(data.filter((p: Profile) => p.role === 'advisor'));
        setOfficers(data.filter((p: Profile) => p.role === 'officer'));
      }
      setFetchingProfiles(false);
    }
    fetchProfiles();
  }, [currentUserId]);

  const canProceedStep1 = () => {
    if (!title.trim()) return false;
    if (!selectedCustomer) return false;
    if (currentUserRole === 'advisor' && !selectedOfficer) return false;
    if (currentUserRole === 'officer' && !selectedAdvisor) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    setError('');
    setLoading(true);

    try {
      const roomId = await createVideoSDKRoom();
      const scheduledAt = new Date(calYear, calMonth, selectedDate,
        parseInt(selectedTime.split(':')[0]),
        parseInt(selectedTime.split(':')[1])
      ).toISOString();

      const advisorId = currentUserRole === 'advisor' ? currentUserId : selectedAdvisor;
      const officerId = currentUserRole === 'officer' ? currentUserId : selectedOfficer;

      const { error: insertError } = await supabase.from('consultations').insert({
        title,
        room_id: roomId,
        customer_id: selectedCustomer,
        advisor_id: advisorId,
        officer_id: officerId,
        created_by: currentUserId,
        scheduled_at: scheduledAt,
        status: 'scheduled',
      });

      if (insertError) throw insertError;
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create consultation.');
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null);
    setSelectedTime('');
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null);
    setSelectedTime('');
  };

  const isDateDisabled = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t || d.getDay() === 0; // disable past & Sundays
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const selectedDateObj = selectedDate
    ? new Date(calYear, calMonth, selectedDate)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 animate-fade-in overflow-hidden my-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Schedule Video Consultation</h3>
              <p className="text-[11px] text-slate-400">
                Step {step} of 2 — {step === 1 ? 'Participants & Title' : 'Pick Date & Time'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-4 gap-2">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step >= s ? 'bg-blue-600' : 'bg-slate-100'}`} />
          ))}
        </div>

        {fetchingProfiles ? (
          <div className="p-12 flex items-center justify-center">
            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── STEP 1: Details ── */}
            {step === 1 && (
              <div className="p-6 space-y-4 text-xs font-medium">
                {/* Title */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Consultation Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Policy Briefing & Underwriting Review"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Customer — always shown */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    Select Customer
                    <span className="text-slate-400 font-normal">({customers.length} available)</span>
                  </label>
                  {customers.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl px-4 py-3 text-slate-400 text-center">
                      No customers registered yet
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {customers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCustomer(c.id)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-left ${
                            selectedCustomer === c.id
                              ? 'border-blue-500 bg-blue-50 text-blue-800'
                              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{c.full_name}</p>
                            <p className="text-[10px] text-slate-400">{c.email}</p>
                          </div>
                          {selectedCustomer === c.id && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Officer — shown on advisor dashboard */}
                {currentUserRole === 'advisor' && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                      Select Officer
                      <span className="text-slate-400 font-normal">({officers.length} available)</span>
                    </label>
                    {officers.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-xl px-4 py-3 text-slate-400 text-center">
                        No officers registered yet
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {officers.map(o => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setSelectedOfficer(o.id)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-left ${
                              selectedOfficer === o.id
                                ? 'border-purple-500 bg-purple-50 text-purple-800'
                                : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>
                              <p className="font-bold">{o.full_name}</p>
                              <p className="text-[10px] text-slate-400">{o.email}</p>
                            </div>
                            {selectedOfficer === o.id && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Advisor — shown on officer dashboard */}
                {currentUserRole === 'officer' && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      Select Advisor
                      <span className="text-slate-400 font-normal">({advisors.length} available)</span>
                    </label>
                    {advisors.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-xl px-4 py-3 text-slate-400 text-center">
                        No advisors registered yet
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {advisors.map(a => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setSelectedAdvisor(a.id)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-left ${
                              selectedAdvisor === a.id
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>
                              <p className="font-bold">{a.full_name}</p>
                              <p className="text-[10px] text-slate-400">{a.email}</p>
                            </div>
                            {selectedAdvisor === a.id && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex gap-3 border-t border-slate-100 mt-4">
                  <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-xs">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canProceedStep1()}
                    onClick={() => setStep(2)}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Calendar ── */}
            {step === 2 && (
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Calendar */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {/* Month nav */}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-200 rounded-lg text-slate-600">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-xs text-slate-900">
                      {MONTH_NAMES[calMonth]} {calYear}
                    </span>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-200 rounded-lg text-slate-600">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                    {DAY_NAMES.map(d => (
                      <div key={d} className="py-1.5 text-center text-[9px] font-bold text-slate-400 uppercase">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 p-1.5 gap-0.5">
                    {/* Empty cells for first day offset */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const disabled = isDateDisabled(day);
                      const isSelected = selectedDate === day;
                      const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={disabled}
                          onClick={() => { setSelectedDate(day); setSelectedTime(''); }}
                          className={`
                            aspect-square flex items-center justify-center rounded-lg text-[10px] font-semibold transition-all
                            ${disabled ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-700 cursor-pointer'}
                            ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white shadow-md' : ''}
                            ${isToday && !isSelected ? 'border border-blue-400 text-blue-600' : ''}
                            ${!disabled && !isSelected ? 'text-slate-700' : ''}
                          `}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-700 mb-2">
                      Available Time Slots —{' '}
                      <span className="text-blue-600">
                        {selectedDateObj?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </p>
                    <div className="grid grid-cols-6 gap-1.5">
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                            selectedTime === slot
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected summary */}
                {selectedDate && selectedTime && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[11px] text-blue-800 font-semibold flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>
                      {selectedDateObj?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' })}{' '}
                      at {selectedTime}
                    </span>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2 border-t border-slate-100 mt-4">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-xs">
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={!selectedDate || !selectedTime || loading}
                    onClick={handleSubmit}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                    {loading ? 'Creating...' : 'Create Room'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
