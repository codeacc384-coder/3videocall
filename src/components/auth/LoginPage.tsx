import React, { useState } from 'react';
import {
  ShieldCheck, Lock, User, Briefcase, BadgeCheck, Sliders,
  CheckCircle2, ArrowRight, KeyRound, PhoneCall
} from 'lucide-react';
import { PortalRole } from '../../types/insurance';
import { mockUsers } from '../../data/mockInsuranceData';
import { supabase } from '../../lib/supabase';

interface LoginPageProps {
  onLogin: (role: PortalRole) => void;
  onGoToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGoToRegister }) => {
  const [selectedRole, setSelectedRole] = useState<PortalRole>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleTabClick = (role: PortalRole) => {
    setSelectedRole(role);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin(selectedRole);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between relative overflow-hidden selection:bg-blue-600 selection:text-white">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-lg border border-blue-400/30">
            IF
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-white tracking-tight leading-none">IndiaFirst Life Insurance</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Joint Venture: Bank of Baroda & Union Bank of India</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> IRDAI Reg. No. 143
          </span>
          <span className="flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-blue-400" /> Helpline: 1800-209-8700
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
        {/* Left Hero */}
        <div className="lg:w-1/2 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 bg-blue-900/60 border border-blue-700/60 text-blue-300 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-blue-400" /> Enterprise Insurance Gateway
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white tracking-tight">
            Protecting What Matters Most to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">Indian Families</span>
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg">
            Unified digital operations portal connecting policyholders, certified insurance advisors, underwriting officers, and enterprise administrators in real-time.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-2xl font-black text-blue-400">₹184+ Cr</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Active Insured Sum</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-2xl font-black text-emerald-400">98.4%</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Claims Settlement Ratio</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-2xl font-black text-purple-400">3-Way Call</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Live Video Consultation</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-2xl font-black text-amber-400">256-Bit</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold">AES Security & ISO 27001</p>
            </div>
          </div>
        </div>

        {/* Right Login Box */}
        <div className="lg:w-1/2 w-full max-w-md">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Select Your Role & Sign In</h3>
              <p className="text-xs text-slate-400 mt-1">Choose an enterprise portal role to access your dashboard.</p>
            </div>

            {/* Role Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 text-xs font-bold">
              {(['customer', 'advisor', 'officer', 'admin'] as PortalRole[]).map((role) => {
                const icons = { customer: User, advisor: Briefcase, officer: BadgeCheck, admin: Sliders };
                const Icon = icons[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleTabClick(role)}
                    className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all capitalize ${
                      selectedRole === role ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {role}
                  </button>
                );
              })}
            </div>

            {/* Role Preview */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl flex items-center gap-3">
              <img
                src={mockUsers[selectedRole]?.avatar}
                alt={mockUsers[selectedRole]?.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-white truncate">{mockUsers[selectedRole]?.name}</p>
                <p className="text-[10px] text-blue-400 truncate">{mockUsers[selectedRole]?.designation}</p>
                {mockUsers[selectedRole]?.branch && (
                  <p className="text-[10px] text-slate-500 truncate">Branch: {mockUsers[selectedRole]?.branch}</p>
                )}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              {error && (
                <div className="bg-red-950/60 border border-red-800 text-red-400 text-xs px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Registered Email</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? 'Signing In...' : (
                  <>
                    <span>Enter IndiaFirst {selectedRole.toUpperCase()} Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800 text-center text-[11px] text-slate-400">
              Don't have an account?{' '}
              <button onClick={onGoToRegister} className="text-blue-400 hover:underline font-semibold">
                Register here
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500 relative z-10">
        <p>© 2026 IndiaFirst Life Insurance Company Ltd. CIN: U66010MH2008PLC183679. All Rights Reserved.</p>
      </footer>
    </div>
  );
};
