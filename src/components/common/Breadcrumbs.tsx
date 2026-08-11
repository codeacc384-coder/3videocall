import React from 'react';
import { ChevronRight, Home, Shield, RefreshCw, Download } from 'lucide-react';
import { PortalRole } from '../../types/insurance';

interface BreadcrumbsProps {
  currentRole: PortalRole;
  activeTab: string;
  onRefresh?: () => void;
  onExport?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentRole,
  activeTab,
  onRefresh,
  onExport
}) => {
  const getRoleLabel = (role: PortalRole) => {
    switch (role) {
      case 'customer': return 'Customer Portal';
      case 'advisor': return 'Insurance Advisor Portal';
      case 'officer': return 'IndiaFirst Officer Portal';
      case 'admin': return 'Enterprise Admin Portal';
      default: return 'Portal';
    }
  };

  const getTabLabel = (tab: string) => {
    return tab
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-2xs font-sans text-xs">
      <div className="flex items-center gap-2 text-slate-500 font-medium overflow-x-auto">
        <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-400">Home</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="text-blue-800 font-semibold">{getRoleLabel(currentRole)}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="text-slate-900 font-extrabold capitalize bg-blue-50 px-2.5 py-0.5 rounded-lg text-blue-900 border border-blue-100">
          {getTabLabel(activeTab)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 text-[11px] font-semibold"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Refresh
          </button>
        )}
        {onExport && (
          <button 
            onClick={onExport}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold transition-colors flex items-center gap-1 text-[11px]"
            title="Export Table CSV / PDF"
          >
            <Download className="w-3.5 h-3.5 text-blue-700" /> Export Data
          </button>
        )}
      </div>
    </div>
  );
};
