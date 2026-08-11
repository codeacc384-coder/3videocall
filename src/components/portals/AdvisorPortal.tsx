import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  ShoppingBag, 
  Calculator, 
  Video, 
  ShieldAlert, 
  RotateCw, 
  FolderArchive, 
  BadgeCheck, 
  BarChart3, 
  MessageSquare, 
  Bell, 
  User, 
  Settings, 
  Plus, 
  Search, 
  Download, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Send,
  Eye,
  CheckSquare
} from 'lucide-react';
import { mockPolicies, mockProducts, mockProposals, mockUsers, mockSessions, mockKYCRecords, mockClaims, mockRenewals, mockDocuments } from '../../data/mockInsuranceData';
import { PremiumCalculator } from '../calculator/PremiumCalculator';
import { ConsultationsPage } from '../consultation/ConsultationsPage';

interface AdvisorPortalProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchTerm: string;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  currentUser?: import('../../types/insurance').UserProfile;
}

export const AdvisorPortal: React.FC<AdvisorPortalProps> = ({ 
  activeTab, 
  onTabChange, 
  searchTerm,
  addToast,
  currentUser
}) => {
  const [proposals, setProposals] = useState(mockProposals);
  const [showConsultationRoom, setShowConsultationRoom] = useState(false);
  const advisorUserId = currentUser?.id || '';
  const advisorUserName = currentUser?.name || 'Advisor';
  
  // Proposal Creation state
  const [newCustomerName, setNewCustomerName] = useState('Anil Kumar');
  const [selectedProduct, setSelectedProduct] = useState('IndiaFirst Smart Term Plan Plus');
  const [coverage, setCoverage] = useState(10000000);
  const [calculatedPremium, setCalculatedPremium] = useState(28800);

  // Chat message state
  const [messagesList, setMessagesList] = useState([
    { sender: 'Rajesh Sharma (Customer)', time: 'Yesterday, 14:20', text: 'Amit ji, can we discuss adding critical illness cover to my term plan?', role: 'Customer' },
    { sender: 'Officer S. Sharma (Underwriter)', time: 'Yesterday, 15:00', text: 'Proposal #PROP-201 verified and approved for issuance.', role: 'Officer' }
  ]);
  const [newMessageText, setNewMessageText] = useState('');

  const notify = (type: 'success' | 'error' | 'info', title: string, msg: string) => {
    if (addToast) addToast(type, title, msg);
    else alert(`${title}: ${msg}`);
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    const newProp = {
      id: `PROP-${Math.floor(200 + Math.random() * 800)}`,
      proposalNumber: `IFL-PROP-${Math.floor(9000 + Math.random() * 1000)}`,
      customerName: newCustomerName,
      advisorName: 'Amit Sharma',
      productName: selectedProduct,
      coverageAmount: coverage,
      calculatedPremium,
      termYears: 25,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Shared' as const,
      taxBenefit80C: calculatedPremium
    };
    setProposals([newProp, ...proposals]);
    notify('success', 'Proposal Generated', `Policy proposal ${newProp.proposalNumber} created and sent to ${newCustomerName}!`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    setMessagesList(prev => [
      ...prev,
      {
        sender: 'Amit Sharma (You - Advisor)',
        time: 'Just now',
        text: newMessageText,
        role: 'Advisor'
      }
    ]);
    setNewMessageText('');
    notify('info', 'Message Sent', 'Your message has been delivered to Customer Rajesh Sharma.');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">


      {/* 1. DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="bg-emerald-800/80 border border-emerald-700 text-emerald-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Senior Advisor Portal
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold mt-2">Welcome, {currentUser?.name || 'Amit Sharma'}</h2>
              <p className="text-xs md:text-sm text-emerald-100 mt-1 max-w-xl">
                Mumbai Regional Branch • YTD Premium Mobilized: <strong className="text-white">₹42.5 Lakhs</strong> (118% of target).
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => onTabChange('proposals')}
                className="bg-white text-emerald-950 font-bold text-xs px-5 py-3 rounded-2xl shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-emerald-700" /> Create Policy Proposal
              </button>
              <button 
                onClick={() => onTabChange('consultations')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2"
              >
                <Video className="w-4 h-4" /> Start 3-Way Video Call
              </button>
            </div>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </span>
                <span className="text-emerald-600 font-bold text-xs flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +12%
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">128</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Assigned Customers</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">{proposals.length}</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Active Policy Proposals</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <BarChart3 className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">₹42.5L</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">YTD Mobilized Premium</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">3</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Assisted Claims in Progress</p>
              </div>
            </div>
          </div>

          {/* Main Grid (2 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Active Proposals & Customers */}
            <div className="lg:col-span-8 space-y-6">
              {/* Proposals Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-base text-slate-900">Recent Policy Proposals Shared</h3>
                  <button onClick={() => onTabChange('proposals')} className="text-emerald-700 font-bold text-xs hover:underline">
                    View All Proposals
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-4">Proposal No</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Product</th>
                        <th className="p-4">Calculated Premium</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {proposals.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-900">{p.proposalNumber}</td>
                          <td className="p-4 font-bold text-slate-900">{p.customerName}</td>
                          <td className="p-4 text-slate-600">{p.productName}</td>
                          <td className="p-4 font-extrabold text-emerald-800">₹{p.calculatedPremium.toLocaleString('en-IN')}/yr</td>
                          <td className="p-4">
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => notify('success', 'Proposal Re-sent', `Proposal ${p.proposalNumber} sent to ${p.customerName}.`)}
                              className="text-emerald-700 font-bold hover:bg-emerald-50 px-2.5 py-1 rounded-lg"
                            >
                              Resend
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assigned Customers Quick List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h3 className="font-bold text-base text-slate-900 mb-4">Top Priority Portfolio Customers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-900">Rajesh Sharma</p>
                      <p className="text-[10px] text-slate-500">3 Active Policies • ₹90L Total Cover</p>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
                        High Protection
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowConsultationRoom(true)}
                      className="p-2 bg-emerald-600 text-white rounded-xl text-xs hover:bg-emerald-700"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-900">Priya Singh</p>
                      <p className="text-[10px] text-slate-500">1 Policy • Maturity Claim Settled</p>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
                        Renewal Due
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowConsultationRoom(true)}
                      className="p-2 bg-emerald-600 text-white rounded-xl text-xs hover:bg-emerald-700"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Quick Proposal Generator */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Generate Quick Proposal</span>
                </h3>

                <form onSubmit={handleCreateProposal} className="space-y-3 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-600 mb-1">Customer Full Name</label>
                    <input 
                      type="text"
                      value={newCustomerName}
                      onChange={e => setNewCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Select IndiaFirst Product</label>
                    <select 
                      value={selectedProduct}
                      onChange={e => setSelectedProduct(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                    >
                      {mockProducts.map(prod => (
                        <option key={prod.id} value={prod.name}>{prod.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Coverage Sum Assured (₹)</label>
                    <select 
                      value={coverage}
                      onChange={e => setCoverage(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    >
                      <option value={5000000}>₹50 Lakhs</option>
                      <option value={10000000}>₹1 Crore</option>
                      <option value={20000000}>₹2 Crores</option>
                    </select>
                  </div>

                  <div className="p-3 bg-emerald-50 text-emerald-950 rounded-xl font-mono text-xs">
                    <p className="text-[10px] text-emerald-700 font-sans font-bold uppercase">Estimated Yearly Premium</p>
                    <p className="text-xl font-extrabold mt-0.5">₹{calculatedPremium.toLocaleString('en-IN')}</p>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    Generate & Share Link
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PREMIUM CALCULATOR TAB */}
      {activeTab === 'premium-calculator' && (
        <PremiumCalculator />
      )}

      {/* 3. ASSIGNED CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Assigned Customers Directory</h2>
              <p className="text-xs text-slate-500">Advisor Portfolio Management & Family Coverage Audits.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Customer ID</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Assigned Branch</th>
                  <th className="p-4">Protection Score</th>
                  <th className="p-4 text-right">Consultation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{mockUsers.customer.name}</td>
                  <td className="p-4 font-mono">{mockUsers.customer.id}</td>
                  <td className="p-4">{mockUsers.customer.phone}</td>
                  <td className="p-4">{mockUsers.customer.branch}</td>
                  <td className="p-4 font-bold text-emerald-700">{mockUsers.customer.protectionScore}/100</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setShowConsultationRoom(true)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                    >
                      3-Way Call
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. POLICIES TAB */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Active Managed Policies</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Policy No</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Coverage</th>
                  <th className="p-4">Premium</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {mockPolicies.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-900">{p.policyNumber}</td>
                    <td className="p-4 font-bold text-slate-900">{p.customerName}</td>
                    <td className="p-4">{p.policyName}</td>
                    <td className="p-4 font-bold text-emerald-800">₹{(p.coverageAmount/100000).toFixed(0)}L</td>
                    <td className="p-4">₹{p.premiumAmount.toLocaleString('en-IN')}/{p.frequency[0]}</td>
                    <td className="p-4">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. INSURANCE PRODUCTS TAB */}
      {activeTab === 'insurance-products' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Advisor Product Knowledge Base</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProducts.map(prod => (
              <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">{prod.type}</span>
                <h3 className="font-bold text-base text-slate-900">{prod.name}</h3>
                <p className="text-xs text-slate-500">{prod.tagline}</p>
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <p><strong>Max Cover:</strong> ₹{(prod.maxCoverage/10000000).toFixed(1)} Cr</p>
                  <p><strong>Min Premium:</strong> ₹{prod.minPremiumMonthly}/mo</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PROPOSALS TAB */}
      {activeTab === 'proposals' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Policy Proposals Log</h2>
            <button 
              onClick={() => notify('success', 'New Proposal Draft', 'Draft created in system.')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              + Create Proposal
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Proposal No</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Premium</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {proposals.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-900">{p.proposalNumber}</td>
                    <td className="p-4 font-bold text-slate-900">{p.customerName}</td>
                    <td className="p-4">{p.productName}</td>
                    <td className="p-4 font-bold text-emerald-800">₹{p.calculatedPremium.toLocaleString('en-IN')}/yr</td>
                    <td className="p-4"><span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. CONSULTATIONS TAB */}
      {activeTab === 'consultations' && (
        <ConsultationsPage
          currentUserId={advisorUserId}
          currentUserRole="advisor"
          currentUserName={advisorUserName}
          addToast={addToast}
        />
      )}

      {/* 8. MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-base text-slate-900">Advisor Portal Messages Desk</h3>
            <p className="text-xs text-slate-500">Communicate with Customer Rajesh Sharma and Underwriting Officer S. Sharma</p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messagesList.map((m, idx) => (
              <div key={idx} className={`p-3.5 rounded-2xl max-w-lg text-xs space-y-1 ${
                m.role === 'Advisor' ? 'bg-emerald-600 text-white ml-auto' : 'bg-white border border-slate-200 text-slate-800'
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
              placeholder="Type message to policyholder..."
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800"
            />
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl">
              Send
            </button>
          </form>
        </div>
      )}

      {/* OTHER ADVISOR TABS */}
      {['claims-assistance', 'renewals', 'documents', 'kyc', 'reports', 'notifications', 'profile', 'settings'].includes(activeTab) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <BadgeCheck className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900 capitalize">{activeTab.replace('-', ' ')} Workspace</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Advisor workspace records for IndiaFirst Life Insurance products, policy underwriting, and IRDAI compliance.
          </p>
        </div>
      )}
    </div>
  );
};
