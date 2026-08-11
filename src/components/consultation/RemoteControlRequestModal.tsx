import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { ControllerRole } from '../../types/remoteControl';

interface RemoteControlRequestModalProps {
  isOpen: boolean;
  requesterName: string;
  requesterRole: ControllerRole;
  onAllow: () => void;
  onReject: () => void;
}

export const RemoteControlRequestModal: React.FC<RemoteControlRequestModalProps> = ({
  isOpen,
  requesterName,
  requesterRole,
  onAllow,
  onReject,
}) => {
  if (!isOpen) return null;

  const roleLabel = requesterRole === 'officer' ? 'Officer' : 'Adviser';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Remote Control Request</h2>
            <p className="text-sm text-slate-400 mt-1">
              {roleLabel} {requesterName} wants to control your screen
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
          <p className="text-sm text-slate-300">
            {roleLabel} <span className="font-semibold text-white">{requesterName}</span> is requesting permission to control your screen to help you complete the form.
          </p>
          <p className="text-xs text-slate-400">
            You can stop control at any time by clicking the <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded">STOP CONTROL</span> button.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={onAllow}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Accept Control
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500 text-center">
          Your screen will be visible to {roleLabel.toLowerCase()} {requesterName} during this session.
        </p>
      </div>
    </div>
  );
};
