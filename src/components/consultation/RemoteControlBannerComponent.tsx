import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { ControllerRole } from '../../types/remoteControl';

interface RemoteControlBannerProps {
  isActive: boolean;
  controllerName: string;
  controllerRole: ControllerRole;
  onStop: () => void;
  isCustomer: boolean;
}

export const RemoteControlBanner: React.FC<RemoteControlBannerProps> = ({
  isActive,
  controllerName,
  controllerRole,
  onStop,
  isCustomer,
}) => {
  if (!isActive) return null;

  const roleLabel = controllerRole === 'officer' ? 'Officer' : 'Adviser';

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-red-600 text-white px-4 py-3 flex items-center justify-between gap-4 shadow-lg">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
        <span className="font-semibold">
          {roleLabel} {controllerName} is controlling your computer
        </span>
      </div>
      {isCustomer && (
        <button
          onClick={onStop}
          className="px-4 py-1.5 bg-white text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <X className="w-4 h-4" />
          STOP CONTROL
        </button>
      )}
    </div>
  );
};
