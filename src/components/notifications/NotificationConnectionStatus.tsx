import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface NotificationConnectionStatusProps {
  status: 'connected' | 'reconnecting' | 'disconnected';
  isAmharic?: boolean;
}

export const NotificationConnectionStatus: React.FC<NotificationConnectionStatusProps> = ({ 
  status, 
  isAmharic = false 
}) => {
  if (status === 'connected') {
    return (
      <div 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
        title={isAmharic ? 'የቀጥታ ግንኙነት ይሰራል' : 'Real-time WebSocket/SSE Connected'}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-mono tracking-tight">
          {isAmharic ? 'የቀጥታ ስርጭት' : 'Live Sync'}
        </span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold animate-pulse"
        title={isAmharic ? 'እንደገና በማገናኘት ላይ...' : 'Reconnecting to notification stream...'}
      >
        <Wifi className="w-3 h-3 text-amber-500 animate-spin" />
        <span className="text-[11px]">
          {isAmharic ? 'በማገናኘት ላይ...' : 'Reconnecting...'}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold"
      title={isAmharic ? 'ግንኙነት ተቋርጧል' : 'Disconnected from notification stream'}
    >
      <WifiOff className="w-3 h-3 text-rose-500" />
      <span className="text-[11px]">
        {isAmharic ? 'ተቋርጧል' : 'Offline'}
      </span>
    </div>
  );
};
