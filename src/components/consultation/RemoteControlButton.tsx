import React, { useState } from 'react';
import { Monitor, MonitorOff } from 'lucide-react';

interface RemoteControlButtonProps {
  isSharing: boolean;
  isCustomer: boolean;
  onToggleShare: () => void;
  disabled?: boolean;
}

export const RemoteControlButton: React.FC<RemoteControlButtonProps> = ({
  isSharing,
  isCustomer,
  onToggleShare,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onToggleShare();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCustomer) return null;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`p-3 rounded-xl transition-all ${
        isSharing
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isSharing ? 'Stop Sharing' : 'Share Screen'}
    >
      {isSharing ? (
        <MonitorOff className="w-5 h-5" />
      ) : (
        <Monitor className="w-5 h-5" />
      )}
    </button>
  );
};
