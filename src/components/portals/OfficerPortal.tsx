import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckSquare, 
  BadgeCheck, 
  ShieldAlert, 
  RotateCw, 
  FolderArchive, 
  Video, 
  BarChart3, 
  MessageSquare, 
  Bell, 
  User, 
  Settings, 
  Check, 
  X, 
  FileText, 
  Search, 
  AlertCircle,
  Eye,
  Lock,
  Send,
  Building2
} from 'lucide-react';
import { mockPolicies, mockClaims, mockKYCRecords, mockUsers, mockDocuments, mockRenewals, mockSessions } from '../../data/mockInsuranceData';
import { ConsultationsPage } from '../consultation/ConsultationsPage';

interface OfficerPortalProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchTerm: string;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  currentUser?: import('../../types/insurance').UserProfile;
}

export const OfficerPortal: React.FC<OfficerPortalProps> = ({ 
  activeTab, 
  onTabChange, 
  searchTerm,
  addToast,
  currentUser
}) => {
  const [policies, setPolicies] = useState(mockPolicies);
  const [claims, setClaims] = useState(mockClaims);
  const [kycRecords, setKycRecords] = useState(mockKYCRecords);
  const [showConsultationRoom, setShowConsultationRoom] = useState(false);
  const officerUserId = currentUser?.id || '';
  const officerUserName = currentUser?.name || 'Officer';

  // Chat message state
  const [messagesList, setMessagesList] = useState([
    { sender: 'Amit Sharma (Advisor)', time: '10:00 AM', text: 'Officer Sharma, proposal #PROP-201 uploaded with PAN NSDL verification.', role: 'Advisor' },
    { sender: 'Rajesh Sharma (Customer)', time: '10:15 AM', text: 'Thank you Officer Sharma for clearing my KYC record.', role: 'Customer' }
  ]);
  const [newMessageText, setNewMessageText] = useState('');

  const notify = (type: 'success' | 'error' | 'info', title: string, msg: string) => {
    if (addToast) addToast(type, title, msg);
    else alert(`${title}: ${msg}`);
  };

  const handleApprovePolicy = (policyId: string) => {
    setPolicies(policies.map(p => p.id === policyId ? { ...p, status: 'Active' as const } : p));
    notify('success', 'Policy Underwritten', `Policy ${policyId} approved with digital officer underwriting signature.`);
  };

  const handleApproveClaim = (claimId: string) => {
    setClaims(claims.map(c => c.id === claimId ? { ...c, status: 'Settled' as const, settlementProgress: 100 } : c));
    notify('success', 'Claim Sanctioned', `Claim ${claimId} sanctioned and forwarded to Finance Desk for NEFT transfer.`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    setMessagesList(prev => [
      ...prev,
      {
        sender: 'Officer S. Sharma (You - Underwriter)',
        time: 'Just now',
        text: newMessageText,
        role: 'Officer'
      }
    ]);
    setNewMessageText('');
    notify('info', 'Underwriting Dispatch Sent', 'Instruction dispatched to Advisor & Customer.');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">


      {/* 1. DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Officer Banner */}
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-purple-900/40">
            <div>
              <span className="bg-purple-800/80 border border-purple-700 text-purple-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                IndiaFirst Officer & Underwriting Portal
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold mt-2">Welcome, {currentUser?.name || 'Officer S. Sharma'}</h2>
              <p className="text-xs md:text-sm text-purple-200 mt-1 max-w-xl">
                Verification Head • IndiaFirst Head Office • Pending Verifications Queue: <strong className="text-white">4 Proposals, 2 Claims</strong>.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => onTabChange('policy-requests')}
                className="bg-white text-purple-950 font-bold text-xs px-5 py-3 rounded-2xl shadow-lg hover:bg-purple-50 transition-all flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4 text-purple-700" /> Review Policy Queue
              </button>
              <button 
                onClick={() => onTabChange('consultations')}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2"
              >
                <Video className="w-4 h-4" /> Open 3-Way Video Desk
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <CheckSquare className="w-5 h-5" />
                </span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Pending</span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">4</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Policy Underwriting Queue</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">₹7.45L</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Claims Pending Sanction</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <BadgeCheck className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">100%</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">KYC Compliance Rate</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Video className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">12</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Completed 3-Way Consultations</p>
              </div>
            </div>
          </div>

          {/* Underwriting Verification Queue */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900">Policy Underwriting & Verification Queue</h3>
              <span className="text-xs text-purple-700 font-bold bg-purple-50 px-3 py-1 rounded-full">
                Officer Clearance Portal
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">Policy No</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Sum Assured</th>
                    <th className="p-4">Risk Level</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Officer Sanction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {policies.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono font-bold text-slate-900">{p.policyNumber}</td>
                      <td className="p-4 font-bold text-slate-900">{p.customerName}</td>
                      <td className="p-4">{p.type}</td>
                      <td className="p-4 font-bold text-blue-900">₹{(p.coverageAmount/100000).toFixed(0)}L</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.riskLevel === 'Low' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {p.riskLevel || 'Standard'} Risk
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-700">{p.status}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        {p.status !== 'Active' ? (
                          <button 
                            onClick={() => handleApprovePolicy(p.id)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
                            <Check className="w-4 h-4" /> Cleared
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. CLAIMS APPROVAL TAB */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Claims Sanction Desk</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Claim No</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Claim Amount</th>
                  <th className="p-4">Hospital</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Sanction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {claims.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-900">{c.claimNumber}</td>
                    <td className="p-4 font-bold text-slate-900">{c.customerName}</td>
                    <td className="p-4">{c.type}</td>
                    <td className="p-4 font-bold text-red-700">₹{c.claimAmount.toLocaleString('en-IN')}</td>
                    <td className="p-4">{c.hospitalName}</td>
                    <td className="p-4"><span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{c.status}</span></td>
                    <td className="p-4 text-right">
                      {c.status !== 'Settled' ? (
                        <button 
                          onClick={() => handleApproveClaim(c.id)}
                          className="px-3 py-1 bg-purple-600 text-white font-bold rounded-lg text-xs hover:bg-purple-700"
                        >
                          Sanction NEFT
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-xs">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-base text-slate-900">Officer Verification Chat Desk</h3>
            <p className="text-xs text-slate-500">Communicate underwriter notes with Advisor Amit Sharma and Policyholder</p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messagesList.map((m, idx) => (
              <div key={idx} className={`p-3.5 rounded-2xl max-w-lg text-xs space-y-1 ${
                m.role === 'Officer' ? 'bg-purple-600 text-white ml-auto' : 'bg-white border border-slate-200 text-slate-800'
              }`}>
                <div className="flex justify-between items-center gap-4">
                  <span className="font-bold">{m.sender}</span>
                  <span className="text-[10px] opacity-75">{m.time}</span>
                </div>
                <p className="leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-2 bg-white">
            <input 
              type="text"
              value={newMessageText}
              onChange={e => setNewMessageText(e.target.value)}
              placeholder="Write underwriting note or clearance instruction..."
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800"
            />
            <button type="submit" className="px-5 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl">
              Send
            </button>
          </form>
        </div>
      )}

      {/* CONSULTATIONS TAB */}
      {activeTab === 'consultations' && (
        <ConsultationsPage
          currentUserId={officerUserId}
          currentUserRole="officer"
          currentUserName={officerUserName}
          addToast={addToast}
        />
      )}

      {/* OTHER OFFICER TABS */}
      {['policy-requests', 'policy-verification', 'kyc-verification', 'renewals', 'documents', 'compliance', 'reports', 'notifications', 'profile', 'settings'].includes(activeTab) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <BadgeCheck className="w-10 h-10 text-purple-600 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900 capitalize">{activeTab.replace('-', ' ')} Desk</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            IndiaFirst Life Officer verification records for risk audit, IRDAI compliance, and underwriting clearances.
          </p>
        </div>
      )}
    </div>
  );
};
