import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Ticket, 
  UserCheck, 
  ShieldCheck, 
  BarChart3, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  Music, 
  Globe, 
  LogOut, 
  KeyRound,
  Sparkles,
  Menu,
  X,
  Building2,
  ChevronDown,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenChangePassword?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenChangePassword }) => {
  const { user, logout } = useAuth();
  const { 
    uiLanguage, 
    setUiLanguage, 
    isAudioUnlocked, 
    unlockAudio, 
    isMusicPlaying, 
    toggleBackgroundMusic,
    officeSetting,
    stats
  } = useQueue();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

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

  const navItems = [
    { 
      id: 'display', 
      label: isAmharic ? 'የስክሪን እይታ' : 'TV Display', 
      icon: Tv, 
      badge: stats?.serving ? `${stats.serving} Active` : undefined 
    },
    { 
      id: 'reception', 
      label: isAmharic ? 'መስተንግዶ' : 'Reception Desk', 
      icon: Ticket, 
      badge: stats?.waiting ? `${stats.waiting} Wait` : undefined 
    },
    { 
      id: 'officer', 
      label: isAmharic ? 'መስኮት' : 'Counter Station', 
      icon: UserCheck 
    },
    { 
      id: 'customer', 
      label: isAmharic ? 'የሞባይል መከታተያ' : 'Customer Tracker', 
      icon: Smartphone 
    },
    { 
      id: 'admin', 
      label: isAmharic ? 'አስተዳደር' : 'Admin Control', 
      icon: ShieldCheck 
    },
    { 
      id: 'reports', 
      label: isAmharic ? 'ትንታኔ እና ሪፖርት' : 'Analytics & Reports', 
      icon: BarChart3 
    }
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Organization Title */}
          <div 
            id="brand-header"
            onClick={() => handleNavClick('display')}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-xs shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Building2 className="w-4.5 h-4.5 text-indigo-100" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {isAmharic 
                    ? (officeSetting?.officeNameAmharic || 'የኢትዮጵያ አገልግሎት መስጫ ማዕከል') 
                    : (officeSetting?.officeName || 'ETHIOPIA SERVICE CENTER')}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Live
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium leading-none">
                {isAmharic ? 'የላቀ የአማርኛ AI የወረፋ አስተዳደር' : 'Intelligent Queue & Voice Management'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Segmented Pill Style) */}
          <nav className="hidden xl:flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
            {navItems.map((item) => {
              const active = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`ml-1 px-1.5 py-0.5 text-[9px] rounded-full font-mono font-bold tracking-tight ${
                      active ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Utilities (Gemini AI Pill, Audio/Music, Language, User/Login) */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* Gemini AI Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700 transition">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-semibold text-slate-800">Gemini Voice</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>

            {/* Audio Unlock / Live Voice Toggle */}
            {!isAudioUnlocked ? (
              <button
                id="btn-unlock-audio"
                onClick={unlockAudio}
                className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all shadow-2xs"
                title="Enable Amharic audio announcements"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
                <span className="text-[11px] font-bold">{isAmharic ? 'ድምፅ አንቃ' : 'Enable Audio'}</span>
              </button>
            ) : (
              <button
                id="btn-toggle-music"
                onClick={() => toggleBackgroundMusic()}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isMusicPlaying 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs' 
                    : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200/80 hover:bg-slate-50'
                }`}
                title={isMusicPlaying ? 'Office Music: Active (Ducks during calls)' : 'Office Music: Muted'}
              >
                <Music className={`w-3.5 h-3.5 ${isMusicPlaying ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="hidden sm:inline text-[11px]">
                  {isMusicPlaying ? (isAmharic ? 'ሙዚቃ በርቷል' : 'Music On') : (isAmharic ? 'ሙዚቃ ጠፍቷል' : 'Music Muted')}
                </span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              id="btn-language-toggle"
              onClick={() => setUiLanguage(isAmharic ? 'ENGLISH' : 'AMHARIC')}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs rounded-lg border border-slate-200/80 font-bold transition shadow-2xs"
              title="Switch Language / ቋንቋ ቀይር"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px]">{isAmharic ? 'አማርኛ' : 'English'}</span>
            </button>

            {/* User Profile or Staff Login */}
            {user ? (
              <div className="relative">
                <button
                  id="btn-user-menu"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 p-1 sm:px-2.5 sm:py-1 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 transition shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">{user.name}</p>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">@{user.username} • {user.role}</p>
                      </div>

                      {onOpenChangePassword && (
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            onOpenChangePassword();
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center space-x-2 font-medium transition"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isAmharic ? 'የይለፍ ቃል ቀይር' : 'Change Password'}</span>
                        </button>
                      )}

                      <button
                        id="btn-dropdown-logout"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center space-x-2 font-bold transition border-t border-slate-100"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>{isAmharic ? 'ውጣ' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                id="btn-nav-login"
                onClick={() => handleNavClick('login')}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition"
              >
                {isAmharic ? 'የሰራተኛ መግቢያ' : 'Staff Login'}
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          <p className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            {isAmharic ? 'የአገልግሎት ክፍሎች' : 'Navigation Modules'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const active = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 hover:bg-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                      active ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

