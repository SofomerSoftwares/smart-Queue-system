import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  unreadCount: number;
  isOpen?: boolean;
  onClick: () => void;
  isAmharic?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  isOpen = false,
  onClick,
  isAmharic = false
}) => {
  return (
    <button
      id="btn-reception-notification-bell"
      type="button"
      onClick={onClick}
      className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
        isOpen
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
          : unreadCount > 0
            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
      }`}
      title={isAmharic ? `ማሳወቂያዎች (${unreadCount} ያልተነበቡ)` : `Notifications (${unreadCount} unread)`}
    >
      <Bell className={`w-4 h-4 ${unreadCount > 0 && !isOpen ? 'animate-wiggle' : ''}`} />

      {/* Unread Badge Counter */}
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-600 text-white text-[10px] font-black font-mono rounded-full flex items-center justify-center shadow-xs border-2 border-white">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60 pointer-events-none"></span>
          <span className="relative z-10">{unreadCount > 99 ? '99+' : unreadCount}</span>
        </span>
      )}
    </button>
  );
};
