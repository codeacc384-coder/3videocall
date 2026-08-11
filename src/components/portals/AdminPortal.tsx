import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Briefcase, 
  BadgeCheck, 
  ShoppingBag, 
  ShieldAlert, 
  RotateCw, 
  FolderArchive, 
  Video, 
  BarChart3, 
  Activity, 
  Lock, 
  Sliders, 
  Bell, 
  Settings, 
  Layers, 
  CheckCircle2, 
  Server, 
  Database, 
  Globe, 
  Cpu, 
  Search,
  Download,
  Plus,
  Check
} from 'lucide-react';
import { mockAuditLogs, mockPolicies, mockClaims, mockUsers, mockProducts, mockRenewals } from '../../data/mockInsuranceData';

interface AdminPortalProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchTerm: string;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  currentUser?: import('../../types/insurance').UserProfile;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ 
  activeTab, 
  onTabChange, 
  searchTerm,
  addToast,
  currentUser
}) => {
  const [auditLogs, setAuditLogs] = useState(mockAuditLogs);

  const notify = (type: 'success' | 'error' | 'info', title: string, msg: string) => {
    if (addToast) addToast(type, title, msg);
    else alert(`${title}: ${msg}`);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 1. DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Admin Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800">
            <div>
              <span className="bg-blue-800/80 border border-blue-700 text-blue-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                IndiaFirst Enterprise Administration
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold mt-2">Enterprise Control & Operations Center</h2>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
                Real-time governance across 48 regional branches, 1,200+ advisors, and ₹184.2 Crore active policy portfolio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => notify('success', 'Report Exported', 'IRDAI Regulatory Audit Report PDF generated.')}
                className="bg-white text-slate-950 font-bold text-xs px-5 py-3 rounded-2xl shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-blue-700" /> Export IRDAI Audit Report
              </button>
            </div>
          </div>

          {/* System Health Indicators Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
            <div className="flex items-center gap-3">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Core Gateway: <strong className="text-emerald-400">99.99% Online</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Firestore Sync: <strong className="text-emerald-400">Active</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>NSDL & UIDAI Gateway: <strong className="text-blue-400">Connected</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Video className="w-4 h-4 text-emerald-400" />
              <span>Video Consultation Server: <strong className="text-emerald-400">Encrypted (1080p)</strong></span>
            </div>
          </div>

          {/* High Level Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">14,280</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Total Active Policies</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <BarChart3 className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">₹184.2 Cr</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Total Mobilized Premiums</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Activity className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">98.4%</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Claims Settlement Ratio</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">1,240</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Active Certified Advisors</p>
              </div>
            </div>
          </div>

          {/* Real-time System Audit Logs */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Real-Time Enterprise System Audit Log</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">Auto Sync Active</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">User / System</th>
                    <th className="p-4">Action Performed</th>
                    <th className="p-4">Resource Target</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-500">{log.timestamp}</td>
                      <td className="p-4 font-bold text-slate-900">{log.administrator}</td>
                      <td className="p-4 text-blue-800">{log.action}</td>
                      <td className="p-4 text-slate-600">{log.resource}</td>
                      <td className="p-4 text-slate-400">{log.ipAddress}</td>
                      <td className="p-4 text-right">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADVISORS TAB */}
      {activeTab === 'advisors' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Insurance Advisors Management</h2>
            <button 
              onClick={() => notify('success', 'Advisor Added', 'New IndiaFirst Certified Advisor added to system.')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl"
            >
              + Onboard New Advisor
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Advisor Name</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4">YTD Premium</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{mockUsers.advisor.name}</td>
                  <td className="p-4 font-mono">{mockUsers.advisor.id}</td>
                  <td className="p-4">{mockUsers.advisor.branch}</td>
                  <td className="p-4 font-extrabold text-emerald-800">₹42.5 Lakhs</td>
                  <td className="p-4"><span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. OFFICERS TAB */}
      {activeTab === 'officers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">IndiaFirst Underwriting Officers</h2>
            <button 
              onClick={() => notify('success', 'Officer Onboarded', 'New Verification Officer added.')}
              className="bg-purple-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl"
            >
              + Add Underwriting Officer
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Officer Name</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4">Approval Clearance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{mockUsers.officer.name}</td>
                  <td className="p-4 font-mono">{mockUsers.officer.id}</td>
                  <td className="p-4">{mockUsers.officer.designation}</td>
                  <td className="p-4">{mockUsers.officer.branch}</td>
                  <td className="p-4 font-extrabold text-purple-800">Level 3 (Up to ₹5 Crores)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. AUDIT LOGS TAB */}
      {activeTab === 'audit-logs' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Security & Governance Audit Logs</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Resource</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {auditLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-500">{l.timestamp}</td>
                    <td className="p-4 font-bold text-slate-900">{l.administrator}</td>
                    <td className="p-4 text-blue-800">{l.action}</td>
                    <td className="p-4">{l.resource}</td>
                    <td className="p-4 text-slate-400">{l.ipAddress}</td>
                    <td className="p-4"><span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OTHER ADMIN TABS */}
      {['customers', 'policies', 'insurance-products', 'claims', 'renewals', 'kyc', 'documents', 'sessions', 'reports', 'analytics', 'users', 'roles', 'notifications', 'system-settings', 'integrations'].includes(activeTab) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <Sliders className="w-10 h-10 text-slate-800 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900 capitalize">{activeTab.replace('-', ' ')} Control Panel</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Super Administrator controls for IndiaFirst Life Insurance platform infrastructure, security policies, and user permissions.
          </p>
        </div>
      )}
    </div>
  );
};
