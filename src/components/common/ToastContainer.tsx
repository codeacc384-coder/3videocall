import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-3 max-w-sm w-full pointer-events-none font-sans">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`pointer-events-auto bg-white border rounded-2xl shadow-xl p-4 flex items-start gap-3 transition-all transform animate-slide-up ${
            toast.type === 'success' ? 'border-emerald-200 bg-emerald-50/30' :
            toast.type === 'error' ? 'border-red-200 bg-red-50/30' :
            'border-blue-200 bg-blue-50/30'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs text-slate-900">{toast.title}</h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{toast.message}</p>
          </div>

          <button 
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
