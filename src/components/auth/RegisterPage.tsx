import React, { useState } from 'react';
import {
  ShieldCheck, User, KeyRound, PhoneCall, CheckCircle2, ArrowRight, Mail
} from 'lucide-react';
import { PortalRole } from '../../types/insurance';
import { supabase } from '../../lib/supabase';

interface RegisterPageProps {
  onGoToLogin: () => void;
  onRegisterSuccess: (role: PortalRole) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onGoToLogin, onRegisterSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<PortalRole>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone,
          role,
        },
      });

      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email,
        phone,
        role,
      }, { onConflict: 'id' });
    }

    setLoading(false);

    if (data.session) {
      // Auto-confirmed (email confirmation disabled)
      onRegisterSuccess(role);
    } else {
      setSuccess('Registration successful! Please check your email to confirm your account, then log in.');
    }
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
            <ShieldCheck className="w-4 h-4 text-blue-400" /> Create Your Account
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white tracking-tight">
            Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">IndiaFirst Life</span> Enterprise Portal
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg">
            Register to access your personalized insurance dashboard, manage policies, raise claims, and connect with advisors in real-time.
          </p>
          <div className="space-y-3 pt-2">
            {[
              { color: 'text-blue-400', text: 'Secure 256-bit AES encrypted account' },
              { color: 'text-emerald-400', text: 'Instant access to all insurance services' },
              { color: 'text-purple-400', text: 'Live video consultation with advisors' },
              { color: 'text-amber-400', text: 'Real-time claims tracking & KYC verification' },
            ].map(({ color, text }) => (
              <div key={text} className="flex items-center gap-3">
                <CheckCircle2 className={`w-4 h-4 ${color} shrink-0`} />
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Register Box */}
        <div className="lg:w-1/2 w-full max-w-md">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-5">
            <div>
              <h3 className="text-xl font-bold text-white">Create New Account</h3>
              <p className="text-xs text-slate-400 mt-1">Fill in your details to register on the platform.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              {error && (
                <div className="bg-red-950/60 border border-red-800 text-red-400 text-xs px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs px-4 py-2.5 rounded-xl">
                  {success}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Rajesh Sharma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
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

              {/* Phone */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Phone Number</label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Register As</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as PortalRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all capitalize"
                >
                  <option value="customer">Customer</option>
                  <option value="advisor">Advisor</option>
                  <option value="officer">Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? 'Creating Account...' : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800 text-center text-[11px] text-slate-400">
              Already have an account?{' '}
              <button onClick={onGoToLogin} className="text-blue-400 hover:underline font-semibold">
                Sign in here
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
