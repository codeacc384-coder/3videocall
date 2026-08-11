import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { ControllerRole } from '../../types/remoteControl';

interface RemoteControlRequestModalProps {
  isOpen: boolean;
  requesterName: string;
  requesterRole: ControllerRole;
  onAllow: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export const RemoteControlRequestModal: React.FC<RemoteControlRequestModalProps> = ({
  isOpen,
  requesterName,
  requesterRole,
  onAllow,
  onReject,
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  const roleLabel = requesterRole === 'officer' ? 'Officer' : 'Adviser';

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-white" />
          <h2 className="text-lg font-bold text-white">Remote Control Request</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              <span className="font-bold text-blue-700">{requesterName}</span>
              <span className="text-slate-600"> ({roleLabel}) </span>
              <span className="text-slate-700">
                is requesting permission to control your computer to assist you.
              </span>
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">
              You can stop remote control at any time by clicking the STOP button.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-200">
          <button
            onClick={onReject}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reject
          </button>
          <button
            onClick={onAllow}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Allow Control'}
          </button>
        </div>
      </div>
    </div>
  );
};
