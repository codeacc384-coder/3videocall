import React from 'react';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  ShoppingBag, 
  FileText, 
  RotateCw, 
  FolderArchive, 
  Video, 
  BadgeCheck, 
  MessageSquare, 
  Bell, 
  HelpCircle, 
  User, 
  Settings, 
  LogOut, 
  Users, 
  Calculator, 
  BarChart3, 
  CheckSquare, 
  ShieldAlert, 
  Activity, 
  Lock, 
  Briefcase, 
  Sliders, 
  Layers
} from 'lucide-react';
import { PortalRole } from '../../types/insurance';

interface SidebarProps {
  currentRole: PortalRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewPolicyClick?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  onNewPolicyClick,
  onLogout
}) => {
  // Menu definition per role
  const getMenuItems = () => {
    switch (currentRole) {
      case 'customer':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'my-policies', label: 'My Policies', icon: ShieldCheck },
          { id: 'insurance-products', label: 'Insurance Products', icon: ShoppingBag },
          { id: 'claims', label: 'Claims', icon: FileText },
          { id: 'renewals', label: 'Renewals', icon: RotateCw },
          { id: 'documents', label: 'Documents', icon: FolderArchive },
          { id: 'video-consultation', label: 'Video Consultation', icon: Video },
          { id: 'kyc', label: 'KYC Verification', icon: BadgeCheck },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'support', label: 'Support', icon: HelpCircle },
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];

      case 'advisor':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'customers', label: 'Assigned Customers', icon: Users },
          { id: 'policies', label: 'Policies', icon: ShieldCheck },
          { id: 'insurance-products', label: 'Insurance Products', icon: ShoppingBag },
          { id: 'proposals', label: 'Policy Proposals', icon: FileText },
          { id: 'premium-calculator', label: 'Premium Calculator', icon: Calculator },
          { id: 'consultations', label: 'Consultations', icon: Video },
          { id: 'claims-assistance', label: 'Claims Assistance', icon: ShieldAlert },
          { id: 'renewals', label: 'Renewals', icon: RotateCw },
          { id: 'documents', label: 'Documents', icon: FolderArchive },
          { id: 'kyc', label: 'KYC Status', icon: BadgeCheck },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];

      case 'officer':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'policy-requests', label: 'Policy Requests', icon: FileText },
          { id: 'policy-verification', label: 'Policy Verification', icon: CheckSquare },
          { id: 'kyc-verification', label: 'KYC Verification', icon: BadgeCheck },
          { id: 'claims', label: 'Claims Approval', icon: ShieldAlert },
          { id: 'renewals', label: 'Renewals', icon: RotateCw },
          { id: 'documents', label: 'Documents Review', icon: FolderArchive },
          { id: 'consultations', label: 'Consultations', icon: Video },
          { id: 'compliance', label: 'Compliance Center', icon: ShieldCheck },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];

      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'customers', label: 'Customers', icon: Users },
          { id: 'advisors', label: 'Insurance Advisors', icon: Briefcase },
          { id: 'officers', label: 'IndiaFirst Officers', icon: BadgeCheck },
          { id: 'policies', label: 'Policies', icon: ShieldCheck },
          { id: 'insurance-products', label: 'Insurance Products', icon: ShoppingBag },
          { id: 'claims', label: 'Claims', icon: ShieldAlert },
          { id: 'renewals', label: 'Renewals', icon: RotateCw },
          { id: 'kyc', label: 'KYC Queue', icon: CheckSquare },
          { id: 'documents', label: 'Documents', icon: FolderArchive },
          { id: 'sessions', label: 'Video Sessions', icon: Video },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'analytics', label: 'Analytics', icon: Activity },
          { id: 'audit-logs', label: 'Audit Logs', icon: Lock },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'roles', label: 'Roles & Permissions', icon: Sliders },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'system-settings', label: 'System Settings', icon: Settings },
          { id: 'integrations', label: 'Integrations', icon: Layers }
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col py-4 px-3 overflow-y-auto shrink-0 font-sans">
      <div className="flex-1 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Navigation ({currentRole})
        </div>

        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom CTA / Logout */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
        {onNewPolicyClick && (
          <button 
            onClick={onNewPolicyClick}
            className="w-full py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl transition-all border border-blue-200"
          >
            + New Policy Action
          </button>
        )}

        <button 
          onClick={() => onLogout ? onLogout() : onTabChange('logout')}
          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
