import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface SessionBannerProps {
  message: string;
  onDismiss: () => void;
}

export const SessionBanner: React.FC<SessionBannerProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-6 py-3 flex items-center justify-between transition-all text-xs font-medium shadow-sm">
      <div className="flex items-center space-x-3">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
        <span>{message}</span>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 hover:bg-amber-100 rounded-lg transition-colors text-amber-700"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
