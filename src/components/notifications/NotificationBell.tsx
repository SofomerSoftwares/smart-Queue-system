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
          ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-[#2563EB]/30'
          : unreadCount > 0
            ? 'bg-[#2563EB]/10 hover:bg-[#2563EB]/20 text-[#2563EB] border-[#2563EB]/30'
            : 'bg-white hover:bg-[#F5F7FB] text-[#64748B] border-[#E2E8F0]'
      }`}
      title={isAmharic ? `ማሳወቂያዎች (${unreadCount} ያልተነበቡ)` : `Notifications (${unreadCount} unread)`}
    >
      <Bell className={`w-4 h-4 ${unreadCount > 0 && !isOpen ? 'animate-wiggle' : ''}`} />

      {/* Unread Badge Counter */}
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-[#DC2626] text-white text-[10px] font-black font-mono rounded-full flex items-center justify-center shadow-xs border-2 border-white">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60 pointer-events-none"></span>
          <span className="relative z-10">{unreadCount > 99 ? '99+' : unreadCount}</span>
        </span>
      )}
    </button>
  );
};
