import React, { useState } from 'react';
import { LogOut, Loader } from 'lucide-react';

interface ReleaseControlButtonProps {
  isControlActive: boolean;
  isCustomer: boolean;
  onReleaseControl: () => void;
  disabled?: boolean;
}

export const ReleaseControlButton: React.FC<ReleaseControlButtonProps> = ({
  isControlActive,
  isCustomer,
  onReleaseControl,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onReleaseControl();
    } finally {
      setIsLoading(false);
    }
  };

  // Only show for Officer/Adviser when control is active
  if (isCustomer || !isControlActive) return null;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Release Control"
    >
      {isLoading ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      Release Control
    </button>
  );
};
