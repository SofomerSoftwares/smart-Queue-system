import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Volume2, 
  Monitor, 
  CheckCircle2, 
  AlertTriangle, 
  Settings2, 
  ShieldAlert, 
  Sliders, 
  Megaphone,
  RotateCcw,
  UserX,
  Coffee,
  PowerOff
} from 'lucide-react';
import { NotificationSettings, NotificationEventType } from '../../types';
import { notificationManager, NotificationPermissionState } from '../../lib/notificationManager';

interface DesktopNotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  desktopPermission: NotificationPermissionState;
  onRequestPermission: () => Promise<'granted' | 'denied' | 'unsupported'>;
  isAmharic?: boolean;
}

export const DesktopNotificationSettings: React.FC<DesktopNotificationSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  desktopPermission,
  onRequestPermission,
  isAmharic = false
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [testChimePlayed, setTestChimePlayed] = useState(false);

  if (!isOpen) return null;

  const handleEnableDesktop = async () => {
    setIsRequesting(true);
    try {
      await onRequestPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestChime = () => {
    notificationManager.playAlertChime();
    setTestChimePlayed(true);
    setTimeout(() => setTestChimePlayed(false), 2000);
  };

  const handleTestDesktopNotification = () => {
    notificationManager.sendTestNotification(isAmharic);
  };

  const toggleEventType = (type: NotificationEventType) => {
    const current = settings.eventTypes[type] !== false;
    onUpdateSettings({
      eventTypes: {
        ...settings.eventTypes,
        [type]: !current
      }
    });
  };

  const eventTypeLabels: Array<{ type: NotificationEventType; labelEn: string; labelAm: string; icon: any }> = [
    { type: 'TICKET_CALLED', labelEn: 'Ticket Called', labelAm: 'ቲኬት ተጠርቷል', icon: Megaphone },
    { type: 'TICKET_RECALLED', labelEn: 'Ticket Recalled', labelAm: 'ቲኬት እንደገና ተጠርቷል', icon: RotateCcw },
    { type: 'TICKET_COMPLETED', labelEn: 'Ticket Completed', labelAm: 'አገልግሎት ተጠናቋል', icon: CheckCircle2 },
    { type: 'TICKET_SKIPPED', labelEn: 'Ticket Skipped (No-Show)', labelAm: 'ያልቀረበ ደንበኛ (ዝላይ)', icon: UserX },
    { type: 'TICKET_HOLD', labelEn: 'Ticket Placed on Hold', labelAm: 'ቲኬት በይደር ቆይቷል', icon: Coffee },
    { type: 'TICKET_RESUMED', labelEn: 'Ticket Resumed', labelAm: 'ቲኬት አገልግሎት ቀጥሏል', icon: CheckCircle2 },
    { type: 'TICKET_TRANSFERRED', labelEn: 'Ticket Transferred', labelAm: 'ቲኬት ወደ ሌላ ተላልፏል', icon: Sliders },
    { type: 'COUNTER_AVAILABLE', labelEn: 'Counter Available', labelAm: 'መስኮት ዝግጁ ሆኗል', icon: Monitor },
    { type: 'COUNTER_BREAK', labelEn: 'Counter Break', labelAm: 'መስኮት እረፍት ወጥቷል', icon: Coffee },
    { type: 'COUNTER_OFFLINE', labelEn: 'Counter Offline / Disconnected', labelAm: 'መስኮት ዝግ ሆኗል', icon: PowerOff },
    { type: 'COUNTER_ONLINE', labelEn: 'Counter Online / Reconnected', labelAm: 'መስኮት ተገናኝቷል', icon: Monitor }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isAmharic ? 'የማሳወቂያ ቅንብሮች' : 'Reception Notification Settings'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAmharic ? 'የቀጥታ ስክሪን፣ ድምፅ እና የብሮውዘር ዴስክቶፕ ማሳወቂያዎችን ያስተካክሉ' : 'Manage in-app alerts, browser desktop notifications & audio chimes'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Section 1: Desktop Browser Notifications */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Monitor className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {isAmharic ? 'የብሮውዘር ዴስክቶፕ ማሳወቂያ' : 'Browser Desktop Notifications'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isAmharic ? 'ሌላ ገጽ ላይ ሆነውም እንኳን ፈጣን ማሳወቂያ በስክሪኑ ላይ ይታያል' : 'Receive instant OS-level banners even when working in another tab or app'}
                  </p>
                </div>
              </div>

              {desktopPermission === 'granted' && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.desktopEnabled}
                    onChange={(e) => onUpdateSettings({ desktopEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              )}
            </div>

            {/* Permission status & action */}
            {desktopPermission === 'granted' ? (
              <div className="flex items-center justify-between pt-2 border-t border-indigo-100/80">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAmharic ? 'የብሮውዘር ፈቃድ ተሰጥቷል' : 'Permission Granted & Active'}</span>
                </span>

                <button
                  onClick={handleTestDesktopNotification}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-3 py-1 rounded-lg shadow-xs hover:bg-indigo-50 transition"
                >
                  {isAmharic ? 'የሙከራ ማሳወቂያ ላክ' : 'Send Test Notification'}
                </button>
              </div>
            ) : desktopPermission === 'denied' ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>{isAmharic ? 'የብሮውዘር ማሳወቂያ ፈቃድ ተከልክሏል' : 'Desktop notifications are blocked in your browser'}</span>
                </div>
                <p className="text-amber-700">
                  {isAmharic 
                    ? 'ማሳወቂያዎችን ለማንቃት በብሮውዘሩ የላይኛው አድራሻ መስጫ ላይ ያለውን የመቆለፊያ (Lock) ወይም የጣቢያ ቅንብር ምልክት ተጭነው "Notifications" የሚለውን ወደ "Allow" ይቀይሩ።'
                    : 'To enable notifications, click the Lock / Tune icon in your browser address bar and set Notifications to "Allow", then refresh.'}
                </p>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  id="btn-enable-desktop-notifications"
                  onClick={handleEnableDesktop}
                  disabled={isRequesting}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Bell className="w-4 h-4" />
                  <span>
                    {isRequesting 
                      ? (isAmharic ? 'በማረጋገጥ ላይ...' : 'Requesting permission...') 
                      : (isAmharic ? 'የዴስክቶፕ ማሳወቂያዎችን አንቃ (Enable Desktop Notifications)' : 'Enable Desktop Notifications')}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: In-App & Sound Alerts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* In-App Notifications */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold text-slate-900">
                    {isAmharic ? 'በገጽ ውስጥ ማሳወቂያ' : 'In-App Alerts'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isAmharic ? 'በመስተንግዶ ዳሽቦርድ ላይ የሚታይ' : 'Dashboard notification panel'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.inAppEnabled}
                  onChange={(e) => onUpdateSettings({ inAppEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Sound Chime */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold text-slate-900">
                    {isAmharic ? 'የድምፅ ቅላጼ' : 'Audio Alert Chime'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleTestChime}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline"
                >
                  {testChimePlayed 
                    ? (isAmharic ? 'ድምፅ ተጫውቷል 🔊' : 'Played Chime 🔊') 
                    : (isAmharic ? 'ድምፅ ሞክር' : 'Test Sound')}
                </button>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

          </div>

          {/* Section 3: Notification Event Types */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                {isAmharic ? 'የሚደርሱ የማሳወቂያ አይነቶች' : 'Enabled Event Types'}
              </h4>
              <span className="text-[11px] text-slate-400">
                {isAmharic ? 'የሚፈልጓቸውን ክስተቶች ይምረጡ' : 'Toggle individual alerts'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {eventTypeLabels.map(({ type, labelEn, labelAm, icon: EventIcon }) => {
                const isChecked = settings.eventTypes[type] !== false;
                return (
                  <div
                    key={type}
                    onClick={() => toggleEventType(type)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                      isChecked 
                        ? 'bg-slate-50 border-slate-300 text-slate-900 font-semibold' 
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <EventIcon className={`w-3.5 h-3.5 ${isChecked ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="truncate">{isAmharic ? labelAm : labelEn}</span>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleEventType(type)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
          >
            {isAmharic ? 'ዝጋ እና አስቀምጥ' : 'Done & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
