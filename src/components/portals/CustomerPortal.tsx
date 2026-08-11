import React, { useState } from 'react';
import { 
  Shield, 
  CreditCard, 
  Calendar, 
  FileText, 
  Video, 
  ArrowRight, 
  Download, 
  Upload, 
  PhoneCall, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  BadgeCheck, 
  HelpCircle, 
  DollarSign, 
  Share2, 
  Eye, 
  Sparkles,
  Search,
  ChevronRight,
  MessageSquare,
  Bell,
  User,
  Settings,
  Lock,
  Mail,
  Send,
  ShieldCheck,
  Building2,
  ChevronDown
} from 'lucide-react';
import { mockPolicies, mockProducts, mockClaims, mockRenewals, mockDocuments, mockSessions, mockUsers } from '../../data/mockInsuranceData';
import { ConsultationsPage } from '../consultation/ConsultationsPage';
import { RaiseClaimModal } from '../claims/RaiseClaimModal';
import { KYCVerificationModule } from '../kyc/KYCVerificationModule';
import { InsurancePolicy } from '../../types/insurance';

interface CustomerPortalProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchTerm: string;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  currentUser?: import('../../types/insurance').UserProfile;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ 
  activeTab, 
  onTabChange, 
  searchTerm,
  addToast,
  currentUser
}) => {
  const [policies, setPolicies] = useState(mockPolicies.filter(p => p.customerId === 'CUST-88219'));
  const [claims, setClaims] = useState(mockClaims);
  const [showRaiseClaimModal, setShowRaiseClaimModal] = useState(false);
  const [selectedPolicyDetail, setSelectedPolicyDetail] = useState<InsurancePolicy | null>(null);

  // Messages state
  const [messagesList, setMessagesList] = useState([
    { sender: 'Amit Sharma (Advisor)', time: 'Yesterday, 14:30', text: 'Namaste Rajesh ji. I have attached the Critical Illness rider proposal for your review.', role: 'Advisor' },
    { sender: 'Officer S. Sharma (Underwriter)', time: 'Yesterday, 16:15', text: 'Your Aadhaar XML and PAN NSDL records are verified. Final underwriting clearance complete.', role: 'Officer' },
  ]);
  const [newMessageText, setNewMessageText] = useState('');

  // Support ticket form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  // Profile Form state
  const [customerName, setCustomerName] = useState(currentUser?.name || mockUsers.customer.name);
  const [phone, setPhone] = useState(currentUser?.phone || mockUsers.customer.phone);
  const [email, setEmail] = useState(currentUser?.email || mockUsers.customer.email);

  const notify = (type: 'success' | 'error' | 'info', title: string, msg: string) => {
    if (addToast) addToast(type, title, msg);
    else alert(`${title}: ${msg}`);
  };

  const handleAddClaim = (newClaimPartial: any) => {
    setClaims(prev => [newClaimPartial, ...prev]);
    notify('success', 'Claim Submitted', `Claim #${newClaimPartial.claimNumber} has been logged.`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    setMessagesList(prev => [
      ...prev,
      {
        sender: 'Rajesh Sharma (You)',
        time: 'Just now',
        text: newMessageText,
        role: 'Customer'
      }
    ]);
    setNewMessageText('');
    notify('info', 'Message Sent', 'Your message was sent to Senior Advisor Amit Sharma.');
  };

  const handleRaiseTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    notify('success', 'Support Ticket Created', `Ticket #${Math.floor(1000 + Math.random()*9000)} logged successfully.`);
    setTicketSubject('');
    setTicketMessage('');
  };

  const filteredPolicies = policies.filter(p => 
    p.policyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.policyNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Raise Claim Modal */}
      {showRaiseClaimModal && (
        <RaiseClaimModal 
          policies={policies}
          onClose={() => setShowRaiseClaimModal(false)}
          onSubmitClaim={handleAddClaim}
        />
      )}

      {/* Detail View Modal for Policy */}
      {selectedPolicyDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-6 animate-fade-in">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  {selectedPolicyDetail.type}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedPolicyDetail.policyName}</h3>
                <p className="text-xs text-slate-500">Policy No: {selectedPolicyDetail.policyNumber} | Term: {selectedPolicyDetail.termYears} Years</p>
              </div>
              <button onClick={() => setSelectedPolicyDetail(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Life Coverage Sum Assured</span>
                <span className="text-lg font-extrabold text-blue-900">₹{(selectedPolicyDetail.coverageAmount / 100000).toFixed(0)} Lakhs</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Premium Amount ({selectedPolicyDetail.frequency})</span>
                <span className="text-lg font-extrabold text-slate-900">₹{selectedPolicyDetail.premiumAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Registered Nominee</span>
                <span className="font-bold text-slate-800">{selectedPolicyDetail.nomineeName} ({selectedPolicyDetail.nomineeRelation})</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Next Premium Due Date</span>
                <span className="font-bold text-blue-700">{selectedPolicyDetail.nextRenewalDate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Policy Key Benefits</p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {selectedPolicyDetail.benefits.map((b, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => notify('success', 'Policy Certificate Downloaded', `Certificate IFL-${selectedPolicyDetail.policyNumber}.pdf saved.`)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Certificate
              </button>
              <button 
                onClick={() => { setSelectedPolicyDetail(null); onTabChange('video-consultation'); }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" /> Discuss in 3-Way Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="bg-blue-800/80 border border-blue-700 text-blue-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Welcome Back
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold mt-2">Namaste, {currentUser?.name || 'Rajesh Sharma'}</h2>
              <p className="text-xs md:text-sm text-blue-200 mt-1 max-w-xl leading-relaxed">
                Your protection plan is securing your family's future for the next 25 years. All 3 policies are active and compliant.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => notify('info', 'e-NACH Payment Gateway', 'Redirected to HDFC Bank auto-debit portal.')}
                className="bg-white text-blue-950 hover:bg-blue-50 font-bold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-blue-700" /> Pay Premium
              </button>
              <button 
                onClick={() => onTabChange('video-consultation')}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 border border-blue-400/30"
              >
                <Video className="w-4 h-4" /> Join 3-Way Video Room
              </button>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-blue-100/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Shield className="w-5 h-5" />
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">{policies.length}</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Active Insurance Policies</p>
              </div>
            </div>

            <div className="bg-white border border-blue-100/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">₹90L</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Total Life & Health Cover</p>
              </div>
            </div>

            <div className="bg-white border border-red-100 p-5 rounded-2xl shadow-xs flex flex-col justify-between border-l-4 border-l-red-500">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </span>
                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Due Soon</span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">Aug 12</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Next Premium Due Date</p>
              </div>
            </div>

            <div className="bg-white border border-blue-100/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">1</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Claims in Progress</p>
              </div>
            </div>
          </div>

          {/* Main Dashboard Layout (2 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: My Policies & Policy Timeline */}
            <div className="lg:col-span-8 space-y-6">
              {/* My Policies Summary Card */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-base text-slate-900">My Policies</h3>
                  <button onClick={() => onTabChange('my-policies')} className="text-blue-600 font-bold text-xs flex items-center gap-1 hover:underline">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-4">Policy Name</th>
                        <th className="p-4">Policy No</th>
                        <th className="p-4">Coverage</th>
                        <th className="p-4">Premium</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {policies.map(p => (
                        <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-slate-900">{p.policyName}</p>
                            <p className="text-[10px] text-slate-400">{p.type}</p>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-600">{p.policyNumber}</td>
                          <td className="p-4 font-bold text-blue-900">₹{(p.coverageAmount / 100000).toFixed(0)} Lakhs</td>
                          <td className="p-4 font-semibold">₹{p.premiumAmount.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400">/{p.frequency.toLowerCase()}</span></td>
                          <td className="p-4">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => setSelectedPolicyDetail(p)}
                              className="text-blue-600 font-bold hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Policy Lifecycle Timeline */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h3 className="font-bold text-base text-slate-900 mb-4">Policy Activity & Renewal Timeline</h3>
                <div className="space-y-4 pl-2 border-l-2 border-dashed border-slate-200 ml-2">
                  <div className="relative pl-6">
                    <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100"></span>
                    <p className="text-xs font-bold text-slate-900">Policy Issued: IndiaFirst Smart Save Plan</p>
                    <p className="text-[11px] text-slate-500">12 Aug 2023 • Policy No: IFL-883412 • Mode: Auto Debit</p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100"></span>
                    <p className="text-xs font-bold text-slate-900">Premium Paid: IndiaFirst Term Protect Plus</p>
                    <p className="text-[11px] text-slate-500">05 Sept 2023 • ₹12,400 • Ref #NEFT-991208</p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-600"></span>
                    <p className="text-xs font-bold text-blue-700">Upcoming: Smart Save Monthly Premium Due</p>
                    <p className="text-[11px] text-slate-500">12 Aug 2026 • ₹5,000 Due • Auto-Debit via HDFC Bank</p>
                  </div>
                </div>
              </div>

              {/* Assigned Insurance Advisor & Officer Details Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
                  <img src={mockUsers.advisor.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-blue-500" />
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Assigned Advisor</span>
                    <p className="font-bold text-xs text-slate-900">{mockUsers.advisor.name}</p>
                    <p className="text-[10px] text-slate-500">{mockUsers.advisor.phone}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
                  <img src={mockUsers.officer.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-purple-500" />
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">IndiaFirst Underwriter</span>
                    <p className="font-bold text-xs text-slate-900">{mockUsers.officer.name}</p>
                    <p className="text-[10px] text-slate-500">{mockUsers.officer.branch}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Consultation Banner & Quick Actions & Details */}
            <div className="lg:col-span-4 space-y-6">
              {/* Upcoming 3-Way Consultation Card */}
              <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Live Consultation</span>
                </div>
                <h4 className="font-bold text-lg">Underwriting & Proposal Briefing</h4>
                
                <div className="mt-4 p-3 bg-blue-950/80 rounded-xl border border-blue-800/80 space-y-2 text-xs">
                  <p className="text-blue-200"><strong>Advisor:</strong> Amit Sharma (Senior Advisor)</p>
                  <p className="text-blue-200"><strong>Officer:</strong> Officer S. Sharma (Verification Head)</p>
                  <p className="text-emerald-300 font-semibold">Today at 10:30 AM (Encrypted Room)</p>
                </div>

                <button 
                  onClick={() => onTabChange('video-consultation')}
                  className="w-full mt-4 bg-white text-blue-950 font-bold py-3 rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-md text-xs"
                >
                  <Video className="w-4 h-4 text-blue-700" /> Join Three-Way Call
                </button>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <h4 className="font-bold text-sm text-slate-900">Quick Actions</h4>
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowRaiseClaimModal(true)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 transition-colors flex items-center gap-3 text-xs"
                  >
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Raise a Claim</p>
                      <p className="text-[10px] text-slate-500">Submit medical bills or intimation</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => onTabChange('documents')}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 transition-colors flex items-center gap-3 text-xs"
                  >
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Download Policy Docs</p>
                      <p className="text-[10px] text-slate-500">Tax certificates Sec 80C</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => onTabChange('kyc')}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 transition-colors flex items-center gap-3 text-xs"
                  >
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                      <BadgeCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">KYC Status</p>
                      <p className="text-[10px] text-slate-500">PAN & Aadhaar XML records</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Protection Score Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Family Protection Score</h4>
                  <span className="font-extrabold text-blue-700 text-sm">84/100</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '84%' }}></div>
                </div>
                <p className="text-[11px] text-slate-600">
                  Your protection score is excellent! Adding a Critical Illness rider could boost it to 95/100.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MY POLICIES TAB */}
      {activeTab === 'my-policies' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">My Insurance Policies</h2>
              <p className="text-xs text-slate-500">Manage active policy coverage, benefits, nominees, and renewals.</p>
            </div>
            <button 
              onClick={() => onTabChange('insurance-products')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Explore New Products
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredPolicies.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 hover:border-blue-300 shadow-xs transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      {p.type}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {p.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mt-2">{p.policyName}</h3>
                  <p className="text-xs font-mono text-slate-500">Policy No: {p.policyNumber}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Coverage</span>
                      <span className="font-extrabold text-blue-900">₹{(p.coverageAmount/100000).toFixed(0)} Lakhs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Premium</span>
                      <span className="font-bold text-slate-800">₹{p.premiumAmount.toLocaleString('en-IN')} /{p.frequency[0]}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Nominee</span>
                      <span className="font-semibold text-slate-700">{p.nomineeName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Renewal</span>
                      <span className="font-semibold text-blue-700">{p.nextRenewalDate}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => setSelectedPolicyDetail(p)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => notify('success', 'Policy Downloaded', `Policy Certificate IFL-${p.policyNumber}.pdf downloaded.`)}
                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl"
                    title="Download Policy Document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. INSURANCE PRODUCTS TAB */}
      {activeTab === 'insurance-products' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">IndiaFirst Insurance Products Catalog</h2>
            <p className="text-xs text-slate-500">Comprehensive Term, Health, ULIP, Child, and Retirement plans tailored for Indian families.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProducts.map(prod => (
              <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 hover:border-blue-300 shadow-xs transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      {prod.type}
                    </span>
                    {prod.popular && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" /> Popular
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mt-2">{prod.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">{prod.tagline}</p>

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max Cover:</span>
                      <span className="font-bold text-blue-900">Up to ₹{(prod.maxCoverage/10000000).toFixed(1)} Cr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Starting Premium:</span>
                      <span className="font-bold text-slate-900">₹{prod.minPremiumMonthly}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Waiting Period:</span>
                      <span className="font-medium text-slate-700">{prod.waitingPeriod}</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs">
                    <p className="font-bold text-slate-800 text-[11px] uppercase">Required Documents:</p>
                    <p className="text-[11px] text-slate-500">{prod.documentsRequired.join(', ')}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      notify('success', 'Proposal Requested', `Proposal for ${prod.name} requested. Senior Advisor Amit Sharma will contact you.`);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                  >
                    Apply for Policy Proposal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CLAIMS TAB */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Claims & Settlement Tracking</h2>
              <p className="text-xs text-slate-500">Transparent claim tracking, medical document upload, and settlement status.</p>
            </div>
            <button 
              onClick={() => setShowRaiseClaimModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Raise New Claim
            </button>
          </div>

          <div className="space-y-4">
            {claims.map(claim => (
              <div key={claim.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-700">{claim.claimNumber}</span>
                    <h3 className="font-bold text-base text-slate-900">{claim.type}</h3>
                    <p className="text-xs text-slate-500">Policy: {claim.policyName} ({claim.policyNumber})</p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    claim.status === 'Approved' || claim.status === 'Settled' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {claim.status} ({claim.settlementProgress}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Claim Amount</span>
                    <span className="font-extrabold text-slate-900">₹{claim.claimAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Hospital / Clinic</span>
                    <span className="font-semibold text-slate-800">{claim.hospitalName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Incident Date</span>
                    <span className="font-medium text-slate-700">{claim.incidentDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Submission Date</span>
                    <span className="font-medium text-slate-700">{claim.submissionDate}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>Settlement Stage Progress</span>
                    <span>{claim.settlementProgress}% Completed</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${claim.settlementProgress}%` }}></div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <strong>Officer Remarks:</strong> {claim.remarks}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. RENEWALS TAB */}
      {activeTab === 'renewals' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Policy Renewals & Payment Schedule</h2>
            <p className="text-xs text-slate-500">Upcoming premium dues, e-NACH auto debit setup, and tax receipts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockRenewals.map(ren => (
              <div key={ren.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-slate-500">{ren.policyNumber}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    ren.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {ren.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900">{ren.policyName}</h3>
                  <p className="text-xs text-slate-500 mt-1">Due Date: <strong className="text-red-600">{ren.dueDate}</strong></p>
                  <p className="text-2xl font-extrabold text-blue-900 mt-2">₹{ren.premiumAmount.toLocaleString('en-IN')}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
                  <p className="text-slate-600"><strong>Auto Debit:</strong> {ren.autoDebitEnabled ? 'Enabled (HDFC Bank e-NACH)' : 'Disabled'}</p>
                </div>

                <button 
                  onClick={() => notify('success', 'Premium Paid', `Payment processed for ${ren.policyName}. Tax receipt generated under Section 80C.`)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  Pay Premium Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Policy Documents Vault</h2>
            <p className="text-xs text-slate-500">PAN, Aadhaar, Medical Reports, Health Declaration, Proposal Forms, and Cancelled Cheque.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockDocuments.map(doc => (
              <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-900">{doc.documentType}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {doc.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500">Uploaded: {doc.uploadDate} | Size: {doc.fileSize || '1.2 MB'}</p>
                {doc.comments && <p className="text-[11px] text-slate-600 italic">"{doc.comments}"</p>}

                <div className="pt-2 flex gap-2">
                  <button 
                    onClick={() => notify('info', 'Document Preview', `Previewing ${doc.documentType}...`)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button 
                    onClick={() => notify('success', 'Document Downloaded', `${doc.documentType} downloaded.`)}
                    className="flex-1 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. VIDEO CONSULTATION TAB */}
      {activeTab === 'video-consultation' && (
        <ConsultationsPage
          currentUserId={currentUser?.id || ''}
          currentUserRole="customer"
          currentUserName={currentUser?.name || 'Customer'}
          addToast={addToast}
        />
      )}

      {/* 8. KYC TAB */}
      {activeTab === 'kyc' && (
        <KYCVerificationModule />
      )}

      {/* 9. MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>IndiaFirst Secure Advisor & Underwriter Chat</span>
              </h3>
              <p className="text-xs text-slate-500">Encrypted line with Amit Sharma (Advisor) & Officer S. Sharma (Underwriter)</p>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messagesList.map((m, idx) => (
              <div key={idx} className={`p-3.5 rounded-2xl max-w-lg text-xs space-y-1 ${
                m.role === 'Customer' ? 'bg-blue-600 text-white ml-auto' : 'bg-white border border-slate-200 text-slate-800'
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
              placeholder="Ask a question about your policy or rider..."
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
            <button 
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      )}

      {/* 10. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Activity & Policy Alerts</h2>
            <button 
              onClick={() => notify('info', 'Notifications Cleared', 'All activity notifications marked as read.')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Mark all as read
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-xs">
            <div className="p-4 flex gap-4 items-start">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Bell className="w-5 h-5" />
              </span>
              <div>
                <p className="font-bold text-xs text-slate-900">New Critical Illness Rider Proposal Generated</p>
                <p className="text-xs text-slate-500 mt-0.5">Amit Sharma generated a proposal quote of ₹450/mo for ₹25 Lakhs cover.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">10 mins ago</span>
              </div>
            </div>

            <div className="p-4 flex gap-4 items-start">
              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div>
                <p className="font-bold text-xs text-slate-900">KYC Aadhaar XML Clearance Approved</p>
                <p className="text-xs text-slate-500 mt-0.5">Officer S. Sharma verified your Aadhaar XML and PAN NSDL records.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">1 hour ago</span>
              </div>
            </div>

            <div className="p-4 flex gap-4 items-start">
              <span className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <p className="font-bold text-xs text-slate-900">Smart Save Premium Due Reminder</p>
                <p className="text-xs text-slate-500 mt-0.5">Monthly premium ₹5,000 due on Aug 12 via HDFC Bank e-NACH auto debit.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Yesterday</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. SUPPORT TAB */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>Frequently Asked Questions (FAQ)</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900">How do I claim tax benefits under Section 80C and 80D?</p>
                  <p className="text-slate-600 mt-1">Download your annual Tax Certificate directly from the Documents tab. Life premiums qualify up to ₹1.5 Lakhs under 80C.</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900">What is the cashless hospitalization procedure?</p>
                  <p className="text-slate-600 mt-1">Show your IndiaFirst Health Card or Policy Number at any of our 10,000+ network hospitals for instant authorization.</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900">How does the 3-Way Video Consultation work?</p>
                  <p className="text-slate-600 mt-1">Click 'Join 3-Way Video Room' to connect simultaneously with Senior Advisor Amit Sharma and Underwriting Officer S. Sharma.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900">Raise Support Ticket</h3>
              <form onSubmit={handleRaiseTicket} className="space-y-3 text-xs font-semibold">
                <div>
                  <label className="block text-slate-600 mb-1">Issue Subject</label>
                  <input 
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={e => setTicketSubject(e.target.value)}
                    placeholder="e.g., e-NACH auto-debit inquiry"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Detailed Message</label>
                  <textarea 
                    required
                    value={ticketMessage}
                    onChange={e => setTicketMessage(e.target.value)}
                    rows={4}
                    placeholder="Describe your issue or query..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Submit Ticket
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 12. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <img src={currentUser?.avatar || mockUsers.customer.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-md" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">{currentUser?.name || mockUsers.customer.name}</h2>
              <p className="text-xs text-slate-500">Policyholder ID: {currentUser?.id || mockUsers.customer.id} | {currentUser?.branch || mockUsers.customer.branch}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] block">Full Name</span>
              <span className="font-bold text-slate-900 text-sm">{customerName}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] block">Mobile Number</span>
              <span className="font-bold text-slate-900 text-sm">{phone}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] block">Email Address</span>
              <span className="font-bold text-slate-900 text-sm">{email}</span>
            </div>
          </div>
        </div>
      )}

      {/* 13. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Account & Security Preferences</h2>
          <div className="space-y-4 text-xs font-semibold">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-900 font-bold">Biometric / Aadhaar Face Auth</p>
                <p className="text-[10px] text-slate-500">Enable biometric login for instant portal access.</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-blue-600 w-4 h-4" />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-900 font-bold">SMS & WhatsApp Renewal Alerts</p>
                <p className="text-[10px] text-slate-500">Receive instant alerts 15 days prior to premium due dates.</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-blue-600 w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
