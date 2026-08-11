import React, { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { PortalRole, UserProfile } from '../../types/insurance';

interface HeaderProps {
  currentRole: PortalRole;
  onRoleChange: (role: PortalRole) => void;
  currentUser: UserProfile;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onOpenConsultation?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  searchTerm,
  onSearchChange,
  onOpenConsultation
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    { title: 'New Proposal Shared', time: '10 mins ago', desc: 'Amit Sharma generated a quote for Term Protect Plus.' },
    { title: 'KYC Document Verified', time: '1 hour ago', desc: 'Officer S. Sharma verified Aadhaar XML records.' },
    { title: 'Premium Due Alert', time: '3 hours ago', desc: 'IndiaFirst Smart Save premium due on 15 Oct.' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-blue-100/80 px-4 md:px-8 h-16 flex items-center justify-between shadow-xs">
      {/* Brand Logo & Search */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-black text-xl shadow-md">
            IF
          </div>
          <div>
            <span className="font-extrabold text-lg text-blue-950 tracking-tight block leading-none">IndiaFirst Life</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mt-0.5">Enterprise Portal</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 w-72 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input 
            type="text"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search policies, UIN, customers..."
            className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-900 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <span className="capitalize">{currentRole.replace('-', ' ')} Portal</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-fade-in space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-bold text-xs text-slate-900">Notifications</h4>
                <span className="text-[10px] font-bold text-blue-600">Mark all read</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-xl text-xs space-y-0.5">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-slate-800">{n.title}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile User Badge */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="font-bold text-xs text-slate-900 leading-tight">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 font-medium">{currentUser.designation}</p>
          </div>
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-9 h-9 rounded-full object-cover border-2 border-blue-500 shadow-xs"
          />
        </div>
      </div>
    </header>
  );
};
