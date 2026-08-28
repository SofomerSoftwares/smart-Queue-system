import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Tv, 
  Ticket, 
  UserCheck, 
  ShieldCheck, 
  BarChart3, 
  Smartphone, 
  LogIn, 
  Clock, 
  Sparkles, 
  Volume2, 
  Music, 
  Globe,
  Radio,
  Bell,
  BellRing
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { AmharicLib } from '../lib/amharic';

interface TopHeaderProps {
  currentView: string;
  onOpenMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ currentView, onOpenMobileSidebar }) => {
  const { 
    uiLanguage, 
    officeSetting, 
    stats, 
    isAudioUnlocked, 
    unlockAudio, 
    isMusicPlaying,
    isNotificationsEnabled,
    requestNotificationPermission,
    sendTestNotification,
    toggleNotifications
  } = useQueue();
  const { user } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');
  const [showNotificationToast, setShowNotificationToast] = useState<boolean>(false);

  const isAmharic = uiLanguage === 'AMHARIC';
  const t = (key: string, defaultText?: string) => AmharicLib.i18n.t(key, uiLanguage, defaultText);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getViewMeta = () => {
    switch (currentView) {
      case 'display':
        return {
          title: t('display_screen', 'Public Display Screen'),
          subtitle: isAmharic ? 'የቀጥታ ወረፋ እና ጥሪ ስክሪን' : 'Live queue status & audio broadcasting',
          icon: Tv
        };
      case 'reception':
        return {
          title: t('reception_desk', 'Reception & Ticket Kiosk'),
          subtitle: isAmharic ? 'አዲስ የወረፋ ቲኬት መስጫ' : 'Issue visitor tickets & service routing',
          icon: Ticket
        };
      case 'officer':
        return {
          title: t('officer_station', 'Officer Counter Station'),
          subtitle: isAmharic ? 'ደንበኞችን ይጥሩ እና ያስተናግዱ' : 'Call next ticket, recall, and complete service',
          icon: UserCheck
        };
      case 'customer':
        return {
          title: t('customer_tracker', 'Customer Mobile Tracker'),
          subtitle: isAmharic ? 'የወረፋ ሂደት በቀጥታ ይከታተሉ' : 'Live position tracking and wait estimations',
          icon: Smartphone
        };
      case 'admin':
        return {
          title: t('system_admin', 'System Administration'),
          subtitle: isAmharic ? 'መስኮቶች፣ ሰራተኞች፣ አገልግሎቶች፣ አዲስ AI ድምፅ እና ዳታቤዝ' : 'Counters, services, Addis AI Voice, Atlas DB and audit logs',
          icon: ShieldCheck
        };
      case 'reports':
        return {
          title: t('analytics_reports', 'Analytics & Performance'),
          subtitle: isAmharic ? 'የመስተንግዶ ጊዜ፣ የተጠቃሚ ብዛት እና የስራ አፈፃፀም' : 'Wait times, counter efficiency and peak hours',
          icon: BarChart3
        };
      case 'login':
        return {
          title: isAmharic ? 'የሰራተኛ መግቢያ' : 'Staff Authentication',
          subtitle: isAmharic ? 'የመስኮት ወይም የአስተዳዳሪ መግቢያ' : 'Officer & administrator secure sign in',
          icon: LogIn
        };
      default:
        return {
          title: isAmharic ? 'የወረፋ ስርዓት' : 'Queue Management',
          subtitle: isAmharic ? 'የቀጥታ ስርዓት' : 'Live system',
          icon: Tv
        };
    }
  };

  const meta = getViewMeta();
  const Icon = meta.icon;

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      
      {/* Left: Mobile Sidebar Trigger + View Title & Subtitle */}
      <div className="flex items-center gap-3">
        <button
          id="btn-open-sidebar-mobile"
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 hidden sm:flex">
            <Icon className="w-4.5 h-4.5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {meta.title}
              </h1>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 hidden sm:inline-flex">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block leading-none mt-0.5">
              {meta.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Real-time Clock & Live Telemetry Pills */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Browser Call Notifications Toggle */}
        <button
          id="btn-browser-notifications"
          onClick={async () => {
            if (!isNotificationsEnabled) {
              const granted = await requestNotificationPermission();
              if (granted) {
                sendTestNotification();
              }
            } else {
              // Trigger test notification
              sendTestNotification();
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition cursor-pointer ${
            isNotificationsEnabled
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100/80 text-slate-600 border-slate-200/60 hover:bg-slate-200'
          }`}
          title={
            isNotificationsEnabled
              ? (isAmharic ? 'የብሮውዘር ጥሪ ማሳወቂያ ነቅቷል (ለመሞከር ይጫኑ)' : 'Browser notifications enabled (Click to test call alert)')
              : (isAmharic ? 'ቲኬት ሲጠራ በብሮውዘር እንዲያሳውቅዎ ያንቁ' : 'Click to enable browser call notifications')
          }
        >
          {isNotificationsEnabled ? (
            <>
              <BellRing className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="text-[11px] hidden sm:inline">{isAmharic ? 'ማሳወቂያ' : 'Alerts'}</span>
            </>
          ) : (
            <>
              <Bell className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] hidden sm:inline">{isAmharic ? 'ማሳወቂያ አንቃ' : 'Enable Alerts'}</span>
            </>
          )}
        </button>

        {/* Live Audio Status */}
        {!isAudioUnlocked && (
          <button
            onClick={unlockAudio}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition animate-pulse"
            title="Enable Amharic audio announcements"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-700" />
            <span className="text-[11px] hidden sm:inline">{isAmharic ? 'ድምፅ አንቃ' : 'Audio On'}</span>
          </button>
        )}

        {/* Live Clock Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs font-mono font-bold text-slate-700 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{timeStr || '--:--:--'}</span>
        </div>

        {/* Addis AI Active Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100/80 text-xs font-semibold text-indigo-700">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[11px]">{isAmharic ? 'Addis AI ድምፅ' : 'Addis AI Voice'}</span>
        </div>

      </div>

    </header>
  );
};
