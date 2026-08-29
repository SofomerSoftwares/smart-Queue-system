import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Ticket, 
  UserCheck, 
  ShieldCheck, 
  BarChart3, 
  Smartphone, 
  Volume2, 
  Music, 
  Globe, 
  LogOut, 
  KeyRound,
  Sparkles,
  Building2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Radio,
  Clock,
  Layers,
  ChevronDown,
  Monitor,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenChangePassword?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenChangePassword,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const { user, logout } = useAuth();
  const { 
    officeSetting, 
    uiLanguage, 
    setUiLanguage, 
    isAudioUnlocked, 
    unlockAudio, 
    isMusicPlaying, 
    toggleBackgroundMusic,
    stats,
    counters
  } = useQueue();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const isAmharic = uiLanguage === 'AMHARIC';

  const operationalNav = [
    { 
      id: 'display', 
      label: isAmharic ? 'የስክሪን እይታ' : 'TV Public Display', 
      icon: Tv, 
      badge: stats?.serving !== undefined ? `${stats.serving} Active` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    { 
      id: 'counter-display', 
      label: isAmharic ? 'የመስኮት ስክሪን' : 'Counter Display', 
      icon: Monitor,
      badge: isAmharic ? 'ቀጥታ' : 'Live',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    { 
      id: 'reception', 
      label: isAmharic ? 'መስተንግዶ ዴስክ' : 'Reception Desk', 
      icon: Ticket, 
      badge: stats?.waiting !== undefined ? `${stats.waiting} Wait` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    { 
      id: 'officer', 
      label: isAmharic ? 'መስኮት ጣቢያ' : 'Counter Station', 
      icon: UserCheck 
    },
    { 
      id: 'customer', 
      label: isAmharic ? 'የደንበኛ መከታተያ' : 'Mobile Tracker', 
      icon: Smartphone 
    }
  ];

  const managementNav = [
    { 
      id: 'counters', 
      label: isAmharic ? 'የመስኮቶች አስተዳደር' : 'Counter Hub', 
      icon: Layers,
      badge: counters?.length ? `${counters.length}` : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    { 
      id: 'admin', 
      label: isAmharic ? 'አስተዳደር ማዕከል' : 'Admin Control', 
      icon: ShieldCheck 
    },
    { 
      id: 'reports', 
      label: isAmharic ? 'ትንታኔ እና ሪፖርት' : 'Analytics & Reports', 
      icon: BarChart3 
    }
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  const officeTitle = isAmharic 
    ? (officeSetting?.officeNameAmharic || 'የኢትዮጵያ አገልግሎት መስጫ ማዕከል') 
    : (officeSetting?.officeName || 'ETHIOPIA SERVICE CENTER');

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-[width,transform] duration-300 ease-in-out will-change-[width,transform] select-none ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Header / Brand Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0 overflow-hidden">
          <div 
            onClick={() => handleItemClick('display')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden group select-none min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-950 shrink-0 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-white" />
            </div>

            <div 
              className={`flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${
                isCollapsed && !isMobileOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'
              }`}
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-xs font-bold text-white tracking-tight truncate group-hover:text-indigo-400 transition-colors">
                  {officeTitle}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase truncate">
                  {isAmharic ? 'የወረፋ ስርዓት' : 'Smart Queue'}
                </span>
              </div>
            </div>
          </div>

          {/* Close button for Mobile drawer */}
          <button 
            onClick={onCloseMobile} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Main Operational Navigation */}
          <div className="space-y-1">
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isCollapsed && !isMobileOpen ? 'h-0 opacity-0 mb-0' : 'h-5 opacity-100 mb-1'
              }`}
            >
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                {isAmharic ? 'ዋና ዋና አገልግሎቶች' : 'Operations'}
              </p>
            </div>
            {operationalNav.map((item) => {
              const active = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`sidebar-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  title={isCollapsed && !isMobileOpen ? item.label : undefined}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group overflow-hidden ${
                    active 
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50 font-bold' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  } ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span 
                      className={`whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${
                        isCollapsed && !isMobileOpen ? 'w-0 opacity-0 max-w-0' : 'w-auto opacity-100 max-w-xs'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span 
                      className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md border shrink-0 transition-all duration-300 ease-in-out ${
                        isCollapsed && !isMobileOpen ? 'w-0 opacity-0 p-0 border-0 hidden' : 'opacity-100'
                      } ${
                        active ? 'bg-indigo-500 text-white border-indigo-400' : `${item.badgeColor}`
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Management Section (Strictly restricted to ADMIN role only) */}
          {user?.role === 'ADMIN' && (
            <div className="space-y-1">
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isCollapsed && !isMobileOpen ? 'h-0 opacity-0 mb-0' : 'h-5 opacity-100 mb-1'
                }`}
              >
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  {isAmharic ? 'የስርዓት አስተዳደር' : 'Management'}
                </p>
              </div>
              {managementNav.map((item) => {
                const active = currentView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-${item.id}`}
                    onClick={() => handleItemClick(item.id)}
                    title={isCollapsed && !isMobileOpen ? item.label : undefined}
                    className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group overflow-hidden ${
                      active 
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50 font-bold' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    } ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-start'}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span 
                      className={`whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${
                        isCollapsed && !isMobileOpen ? 'w-0 opacity-0 max-w-0 ml-0' : 'w-auto opacity-100 max-w-xs ml-3'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* System Telemetry Widget (Expanded Mode) */}
          <div 
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isCollapsed && !isMobileOpen ? 'max-h-0 opacity-0 py-0 m-0 border-0' : 'max-h-48 opacity-100 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2.5'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] whitespace-nowrap">
              <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Addis AI Voice</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                Amharic
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-slate-700/50">
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <p className="text-[9px] text-slate-400 uppercase font-semibold">{isAmharic ? 'በመጠባበቅ' : 'Waiting'}</p>
                <p className="text-sm font-bold text-amber-400 font-mono">{stats?.waiting ?? 0}</p>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <p className="text-[9px] text-slate-400 uppercase font-semibold">{isAmharic ? 'በማስተናገድ' : 'Serving'}</p>
                <p className="text-sm font-bold text-emerald-400 font-mono">{stats?.serving ?? 0}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Utilities (Audio, Language, User, Collapse) */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50 space-y-2 shrink-0 overflow-hidden">
          
          {/* Audio & Music Controls */}
          <div className={`flex items-center gap-1.5 transition-all duration-300 ${isCollapsed && !isMobileOpen ? 'flex-col' : 'justify-between'}`}>
            {!isAudioUnlocked ? (
              <button
                id="btn-sidebar-unlock-audio"
                onClick={unlockAudio}
                className="w-full flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs py-2 px-2.5 rounded-xl font-bold transition shadow-xs animate-pulse overflow-hidden"
                title="Enable Amharic audio announcements"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span 
                  className={`whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${
                    isCollapsed && !isMobileOpen ? 'w-0 opacity-0 max-w-0' : 'w-auto opacity-100 max-w-xs'
                  }`}
                >
                  {isAmharic ? 'ድምፅ አንቃ' : 'Enable Audio'}
                </span>
              </button>
            ) : (
              <button
                id="btn-sidebar-toggle-music"
                onClick={() => toggleBackgroundMusic()}
                className={`flex items-center gap-2 py-2 px-2.5 rounded-xl text-xs font-semibold border transition overflow-hidden ${
                  isMusicPlaying 
                    ? 'bg-indigo-900/40 text-indigo-300 border-indigo-700/60' 
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-700/60'
                } ${isCollapsed && !isMobileOpen ? 'w-full justify-center' : 'flex-1'}`}
                title={isMusicPlaying ? 'Office Music: Playing' : 'Office Music: Muted'}
              >
                <Music className={`w-3.5 h-3.5 shrink-0 ${isMusicPlaying ? 'text-indigo-400 animate-bounce' : ''}`} />
                <span 
                  className={`whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${
                    isCollapsed && !isMobileOpen ? 'w-0 opacity-0 max-w-0' : 'w-auto opacity-100 max-w-xs'
                  }`}
                >
                  {isMusicPlaying ? (isAmharic ? 'ሙዚቃ በርቷል' : 'Music On') : (isAmharic ? 'ሙዚቃ አጥፋ' : 'Music Off')}
                </span>
              </button>
            )}

            {/* Language Switch */}
            <button
              id="btn-sidebar-language"
              onClick={() => setUiLanguage(isAmharic ? 'ENGLISH' : 'AMHARIC')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition overflow-hidden ${
                isCollapsed && !isMobileOpen ? 'w-full' : 'shrink-0'
              }`}
              title="Switch Language / ቋንቋ ቀይር"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span 
                className={`whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${
                  isCollapsed && !isMobileOpen ? 'w-0 opacity-0 max-w-0' : 'w-auto opacity-100 max-w-xs'
                }`}
              >
                {isAmharic ? 'አማርኛ' : 'EN'}
              </span>
            </button>
          </div>

          {/* User Account / Login Profile */}
          {user ? (
            <div className="pt-2 border-t border-slate-800/80 overflow-hidden">
              <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-800/50 rounded-xl border border-slate-700/60 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <div 
                    className={`min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${
                      isCollapsed && !isMobileOpen ? 'w-0 opacity-0 max-w-0' : 'w-auto opacity-100 max-w-xs'
                    }`}
                  >
                    <p className="text-xs font-bold text-white truncate leading-tight whitespace-nowrap">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate uppercase whitespace-nowrap">{user.role.replace('_', ' ')}</p>
                  </div>
                </div>

                {(!isCollapsed || isMobileOpen) && (
                  <div className="flex items-center gap-1 shrink-0">
                    {onOpenChangePassword && (
                      <button
                        onClick={onOpenChangePassword}
                        className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md transition"
                        title="Change Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      id="btn-sidebar-logout"
                      onClick={logout}
                      className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-md transition"
                      title="Logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              id="btn-sidebar-login"
              onClick={() => handleItemClick('login')}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition overflow-hidden ${
                isCollapsed && !isMobileOpen ? 'p-2' : ''
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span 
                className={`whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${
                  isCollapsed && !isMobileOpen ? 'w-0 opacity-0 max-w-0' : 'w-auto opacity-100 max-w-xs'
                }`}
              >
                {isAmharic ? 'የሰራተኛ መግቢያ' : 'Staff Login'}
              </span>
            </button>
          )}

          {/* Sidebar Collapse Toggle (Desktop only) */}
          <div className="hidden md:flex justify-end pt-1">
            <button
              id="btn-toggle-sidebar"
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">{isAmharic ? 'አሳንስ' : 'Collapse'}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </aside>
    </>
  );
};
