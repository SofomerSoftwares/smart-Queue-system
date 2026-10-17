import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Settings2, 
  Filter, 
  RefreshCw, 
  Inbox, 
  SlidersHorizontal,
  Clock,
  Building2,
  Tag,
  User,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReceptionNotification, NotificationSettings } from '../../types';
import { NotificationItem } from './NotificationItem';
import { NotificationConnectionStatus } from './NotificationConnectionStatus';
import { DesktopNotificationSettings } from './DesktopNotificationSettings';
import { NotificationFilter } from '../../hooks/useReceptionNotifications';
import { NotificationPermissionState } from '../../lib/notificationManager';

interface NotificationPanelProps {
  notifications: ReceptionNotification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  activeFilter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRefresh: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  desktopPermission: NotificationPermissionState;
  onRequestPermission: () => Promise<'granted' | 'denied' | 'unsupported'>;
  isAmharic?: boolean;
  className?: string;
  isCollapsible?: boolean;
  onClose?: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  unreadCount,
  totalCount,
  isLoading,
  connectionStatus,
  activeFilter,
  onFilterChange,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh,
  settings,
  onUpdateSettings,
  desktopPermission,
  onRequestPermission,
  isAmharic = false,
  className = '',
  isCollapsible = false,
  onClose
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<ReceptionNotification | null>(null);

  const filters: Array<{ id: NotificationFilter; labelEn: string; labelAm: string }> = [
    { id: 'ALL', labelEn: 'All', labelAm: 'ሁሉም' },
    { id: 'UNREAD', labelEn: 'Unread', labelAm: 'ያልተነበቡ' },
    { id: 'CALLS', labelEn: 'Calls', labelAm: 'ጥሪዎች' },
    { id: 'COMPLETED', labelEn: 'Completed', labelAm: 'የተጠናቀቁ' },
    { id: 'SYSTEM', labelEn: 'System Alerts', labelAm: 'የመስኮት ሁኔታ' }
  ];

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden ${className}`}>
      
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  {isAmharic ? 'የመስተንግዶ ማሳወቂያዎች' : 'Reception Notifications'}
                </h3>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                    {unreadCount} {isAmharic ? 'አዲስ' : 'unread'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 font-mono">
                    {totalCount} {isAmharic ? 'ጠቅላላ' : 'total'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {isAmharic ? 'የመስኮት ጥሪዎች፣ የደንበኞች መስተንግዶ እና ጣቢያዎች ፈጣን ክስተቶች' : 'Live counter calls, completions, transfers & station events'}
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 ml-auto">
            <NotificationConnectionStatus status={connectionStatus} isAmharic={isAmharic} />

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-600 hover:text-indigo-800 border border-slate-200 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                title={isAmharic ? 'ሁሉንም እንደተነበበ ምልክት አድርግ' : 'Mark all notifications as read'}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAmharic ? 'ሁሉንም አንብብ' : 'Mark all read'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
              title={isAmharic ? 'የማሳወቂያ ቅንብሮች' : 'Notification Settings'}
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {isCollapsible && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                title={isAmharic ? 'ዝጋ' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <Filter className="w-3 h-3 text-slate-400 shrink-0 ml-0.5 mr-1" />
          {filters.map(filter => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange(filter.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {isAmharic ? filter.labelAm : filter.labelEn}
                {filter.id === 'UNREAD' && unreadCount > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white text-indigo-600 font-black' : 'bg-rose-500 text-white font-black'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onRefresh}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title={isAmharic ? 'አድስ' : 'Refresh'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>

      </div>

      {/* Notifications Scroll List */}
      <div className="p-3 sm:p-4 overflow-y-auto max-h-[480px] min-h-[220px] space-y-2.5">
        <AnimatePresence initial={false}>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              >
                <NotificationItem
                  notification={notification}
                  isAmharic={isAmharic}
                  onMarkAsRead={onMarkAsRead}
                  onClick={(n) => setSelectedNotif(n)}
                />
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-700">
                {isAmharic ? 'ማሳወቂያዎች የሉም' : 'No Notifications'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                {isAmharic
                  ? 'የመስኮት ሰራተኞች ደንበኞችን ሲጠሩ፣ ሲያጠናቅቁ ወይም ሁኔታ ሲቀይሩ እዚህ ወዲያውኑ ይደርስዎታል።'
                  : 'Whenever counter officers call, skip, complete or transfer tickets, instant alerts will appear here.'}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotif && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedNotif(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Bell className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedNotif.title}</h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(selectedNotif.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {selectedNotif.message}
            </p>

            <div className="space-y-2 text-xs">
              {selectedNotif.ticketNumber && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'የቲኬት ቁጥር' : 'Ticket Number'}:</span>
                  </span>
                  <span className="font-mono font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100">
                    {selectedNotif.ticketNumber}
                  </span>
                </div>
              )}

              {selectedNotif.counterName && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'የመስኮት ጣቢያ' : 'Counter'}:</span>
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedNotif.counterName}
                  </span>
                </div>
              )}

              {selectedNotif.serviceName && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">
                    {isAmharic ? 'አገልግሎት' : 'Service'}:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedNotif.serviceName}
                  </span>
                </div>
              )}

              {selectedNotif.officerName && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'የመስኮት ሰራተኛ' : 'Officer'}:</span>
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedNotif.officerName}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                {isAmharic ? 'እሺ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <DesktopNotificationSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        desktopPermission={desktopPermission}
        onRequestPermission={onRequestPermission}
        isAmharic={isAmharic}
      />
    </div>
  );
};
