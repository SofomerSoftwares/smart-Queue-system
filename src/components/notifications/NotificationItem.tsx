import React from 'react';
import { 
  Megaphone, 
  RotateCcw, 
  CheckCircle2, 
  UserX, 
  Pause, 
  Play, 
  ArrowRight, 
  Monitor, 
  Coffee, 
  PowerOff, 
  Clock, 
  Check, 
  Building2, 
  Tag
} from 'lucide-react';
import { ReceptionNotification } from '../../types';

interface NotificationItemProps {
  notification: ReceptionNotification;
  isAmharic?: boolean;
  onMarkAsRead: (id: string) => void;
  onClick?: (notification: ReceptionNotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  isAmharic = false,
  onMarkAsRead,
  onClick
}) => {
  const getEventConfig = (type: string) => {
    switch (type) {
      case 'TICKET_CALLED':
        return {
          icon: Megaphone,
          bg: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30',
          badge: isAmharic ? 'ተጠርቷል' : 'Called',
          color: 'text-[#2563EB]'
        };
      case 'TICKET_RECALLED':
        return {
          icon: RotateCcw,
          bg: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
          badge: isAmharic ? 'እንደገና ተጠርቷል' : 'Recalled',
          color: 'text-[#F59E0B]'
        };
      case 'TICKET_COMPLETED':
        return {
          icon: CheckCircle2,
          bg: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/30',
          badge: isAmharic ? 'ተጠናቋል' : 'Completed',
          color: 'text-[#16A34A]'
        };
      case 'TICKET_SKIPPED':
        return {
          icon: UserX,
          bg: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30',
          badge: isAmharic ? 'ያልቀረበ (Skipped)' : 'Skipped',
          color: 'text-[#DC2626]'
        };
      case 'TICKET_HOLD':
        return {
          icon: Pause,
          bg: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
          badge: isAmharic ? 'በይደር ቆሟል' : 'On Hold',
          color: 'text-[#F59E0B]'
        };
      case 'TICKET_RESUMED':
        return {
          icon: Play,
          bg: 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/30',
          badge: isAmharic ? 'ቀጥሏል' : 'Resumed',
          color: 'text-[#0D9488]'
        };
      case 'TICKET_TRANSFERRED':
        return {
          icon: ArrowRight,
          bg: 'bg-[#173B65]/10 text-[#173B65] border-[#173B65]/30',
          badge: isAmharic ? 'ተላልፏል' : 'Transferred',
          color: 'text-[#173B65]'
        };
      case 'COUNTER_BREAK':
        return {
          icon: Coffee,
          bg: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
          badge: isAmharic ? 'እረፍት' : 'Break',
          color: 'text-[#F59E0B]'
        };
      case 'COUNTER_OFFLINE':
        return {
          icon: PowerOff,
          bg: 'bg-slate-100 text-[#64748B] border-[#E2E8F0]',
          badge: isAmharic ? 'ዝግ' : 'Offline',
          color: 'text-[#64748B]'
        };
      case 'COUNTER_ONLINE':
      case 'COUNTER_AVAILABLE':
      default:
        return {
          icon: Monitor,
          bg: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30',
          badge: isAmharic ? 'ዝግጁ' : 'Available',
          color: 'text-[#2563EB]'
        };
    }
  };

  const config = getEventConfig(notification.type);
  const Icon = config.icon;

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div 
      onClick={() => {
        if (!notification.isRead) {
          onMarkAsRead(notification.id);
        }
        if (onClick) onClick(notification);
      }}
      className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none group relative ${
        notification.isRead 
          ? 'bg-white hover:bg-[#F5F7FB] border-[#E2E8F0] text-[#172033]' 
          : 'bg-[#2563EB]/5 hover:bg-[#2563EB]/10 border-[#2563EB]/30 shadow-xs text-[#172033]'
      }`}
    >
      {/* Unread Indicator Bar */}
      {!notification.isRead && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#2563EB] rounded-r-full" />
      )}

      <div className="flex items-start gap-3 pl-1">
        {/* Event Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${config.bg} shadow-xs`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${config.bg}`}>
                {config.badge}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {notification.title}
              </h4>
            </div>

            {/* Time Stamp */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0">
              <Clock className="w-3 h-3" />
              <span>{formatTime(notification.createdAt)}</span>
            </div>
          </div>

          {/* Main message */}
          <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
            {notification.message}
          </p>

          {/* Meta Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-[#E2E8F0]">
            {notification.ticketNumber && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#173B65] text-white text-[11px] font-mono font-black">
                <Tag className="w-2.5 h-2.5" />
                <span>{notification.ticketNumber}</span>
              </span>
            )}

            {notification.counterName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5F7FB] text-[#172033] border border-[#E2E8F0] text-[10px] font-bold">
                <Building2 className="w-2.5 h-2.5 text-[#64748B]" />
                <span className="truncate max-w-[120px]">{notification.counterName}</span>
              </span>
            )}

            {notification.serviceName && (
              <span className="text-[10px] font-semibold text-[#64748B] truncate max-w-[140px]">
                {notification.serviceName}
              </span>
            )}

            {/* Mark as read button */}
            {!notification.isRead && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="ml-auto text-[10px] text-[#2563EB] hover:text-[#1d4ed8] font-bold flex items-center gap-0.5 opacity-90 group-hover:opacity-100"
                title={isAmharic ? 'እንደተነበበ ምልክት አድርግ' : 'Mark as read'}
              >
                <Check className="w-3 h-3" />
                <span>{isAmharic ? 'አንብቤያለሁ' : 'Mark read'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
