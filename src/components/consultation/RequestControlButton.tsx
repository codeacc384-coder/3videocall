import React, { useState } from 'react';
import { Hand, Loader } from 'lucide-react';

interface RequestControlButtonProps {
  isScreenSharing: boolean;
  isCustomer: boolean;
  isControlActive: boolean;
  onRequestControl: () => void;
  disabled?: boolean;
}

export const RequestControlButton: React.FC<RequestControlButtonProps> = ({
  isScreenSharing,
  isCustomer,
  isControlActive,
  onRequestControl,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onRequestControl();
    } finally {
      setIsLoading(false);
    }
  };

  // Only show for Officer/Adviser when customer is sharing
  if (isCustomer || !isScreenSharing) return null;

  // Hide if control is already active
  if (isControlActive) return null;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Request Control"
    >
      {isLoading ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        <Hand className="w-4 h-4" />
      )}
      Request Control
    </button>
  );
};
