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
          bg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
          badge: isAmharic ? 'ተጠርቷል' : 'Called',
          color: 'text-indigo-600'
        };
      case 'TICKET_RECALLED':
        return {
          icon: RotateCcw,
          bg: 'bg-amber-50 text-amber-600 border-amber-200',
          badge: isAmharic ? 'እንደገና ተጠርቷል' : 'Recalled',
          color: 'text-amber-600'
        };
      case 'TICKET_COMPLETED':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: isAmharic ? 'ተጠናቋል' : 'Completed',
          color: 'text-emerald-600'
        };
      case 'TICKET_SKIPPED':
        return {
          icon: UserX,
          bg: 'bg-rose-50 text-rose-600 border-rose-200',
          badge: isAmharic ? 'ያልቀረበ (Skipped)' : 'Skipped',
          color: 'text-rose-600'
        };
      case 'TICKET_HOLD':
        return {
          icon: Pause,
          bg: 'bg-orange-50 text-orange-600 border-orange-200',
          badge: isAmharic ? 'በይደር ቆሟል' : 'On Hold',
          color: 'text-orange-600'
        };
      case 'TICKET_RESUMED':
        return {
          icon: Play,
          bg: 'bg-teal-50 text-teal-600 border-teal-200',
          badge: isAmharic ? 'ቀጥሏል' : 'Resumed',
          color: 'text-teal-600'
        };
      case 'TICKET_TRANSFERRED':
        return {
          icon: ArrowRight,
          bg: 'bg-purple-50 text-purple-600 border-purple-200',
          badge: isAmharic ? 'ተላልፏል' : 'Transferred',
          color: 'text-purple-600'
        };
      case 'COUNTER_BREAK':
        return {
          icon: Coffee,
          bg: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          badge: isAmharic ? 'እረፍት' : 'Break',
          color: 'text-yellow-700'
        };
      case 'COUNTER_OFFLINE':
        return {
          icon: PowerOff,
          bg: 'bg-slate-100 text-slate-600 border-slate-300',
          badge: isAmharic ? 'ዝግ' : 'Offline',
          color: 'text-slate-600'
        };
      case 'COUNTER_ONLINE':
      case 'COUNTER_AVAILABLE':
      default:
        return {
          icon: Monitor,
          bg: 'bg-blue-50 text-blue-600 border-blue-200',
          badge: isAmharic ? 'ዝግጁ' : 'Available',
          color: 'text-blue-600'
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
          ? 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700' 
          : 'bg-indigo-50/40 hover:bg-indigo-50/70 border-indigo-200/80 shadow-xs text-slate-900'
      }`}
    >
      {/* Unread Indicator Bar */}
      {!notification.isRead && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-600 rounded-r-full" />
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
          <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-100">
            {notification.ticketNumber && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-mono font-black">
                <Tag className="w-2.5 h-2.5" />
                <span>{notification.ticketNumber}</span>
              </span>
            )}

            {notification.counterName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                <Building2 className="w-2.5 h-2.5 text-slate-400" />
                <span className="truncate max-w-[120px]">{notification.counterName}</span>
              </span>
            )}

            {notification.serviceName && (
              <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[140px]">
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
                className="ml-auto text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 opacity-90 group-hover:opacity-100"
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
