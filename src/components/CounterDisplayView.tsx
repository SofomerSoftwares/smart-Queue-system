import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  UserCheck, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Users, 
  Clock, 
  Layers, 
  Flame, 
  Zap, 
  CheckCircle2, 
  ArrowLeft, 
  ExternalLink, 
  Radio, 
  ShieldCheck, 
  Building2,
  ChevronDown,
  Monitor,
  Volume1,
  RotateCcw
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Counter, QueueTicket } from '../types';

interface CounterDisplayViewProps {
  initialCounterId?: string;
  initialCounterNumber?: number;
  onBackToMainDisplay?: () => void;
  onNavigateToManagement?: () => void;
}

export const CounterDisplayView: React.FC<CounterDisplayViewProps> = ({
  initialCounterId,
  initialCounterNumber,
  onBackToMainDisplay,
  onNavigateToManagement
}) => {
  const { 
    counters, 
    waitingTickets, 
    servingTickets, 
    officeSetting, 
    lastAnnouncement,
    uiLanguage,
    isAudioUnlocked,
    unlockAudio
  } = useQueue();

  const { user } = useAuth();
  const isAmharic = uiLanguage === 'AMHARIC';

  // Read URL params if counter number or id is provided in query string
  const getSelectedCounterIdFromQuery = (): string => {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryCounterNum = params.get('counter') || params.get('cnt');
      const queryCounterId = params.get('counterId') || params.get('id');

      if (queryCounterId) {
        const found = counters.find(c => c.id === queryCounterId);
        if (found) return found.id;
      }
      if (queryCounterNum) {
        const num = parseInt(queryCounterNum, 10);
        const found = counters.find(c => c.number === num);
        if (found) return found.id;
      }
    } catch {}

    if (initialCounterId) return initialCounterId;
    if (initialCounterNumber) {
      const found = counters.find(c => c.number === initialCounterNumber);
      if (found) return found.id;
    }
    return counters[0]?.id || 'cnt-1';
  };

  const [selectedCounterId, setSelectedCounterId] = useState<string>(getSelectedCounterIdFromQuery);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayTheme, setDisplayTheme] = useState<'modern' | 'led' | 'minimal'>('modern');
  const [isCounterDropdownOpen, setIsCounterDropdownOpen] = useState(false);
  const [isCallFlashing, setIsCallFlashing] = useState(false);

  // Synchronize when counters array updates
  useEffect(() => {
    if (counters.length > 0 && !counters.some(c => c.id === selectedCounterId)) {
      setSelectedCounterId(counters[0].id);
    }
  }, [counters, selectedCounterId]);

  const activeCounter = counters.find(c => c.id === selectedCounterId) || counters[0];

  // Active serving ticket specifically assigned to this counter
  const counterServingTicket = servingTickets.find(t => 
    (t.counterId && t.counterId === activeCounter?.id) || 
    (t.counterNumber && t.counterNumber === activeCounter?.number) ||
    (activeCounter?.currentTicketNumber && t.ticketNumber === activeCounter.currentTicketNumber)
  ) || (activeCounter?.currentTicketNumber ? {
    id: activeCounter.currentTicketId || 'tkt-current',
    ticketNumber: activeCounter.currentTicketNumber,
    sequenceNumber: 1,
    prefix: activeCounter.currentTicketNumber.split('-')[0] || 'A',
    serviceId: 'srv-1',
    serviceName: 'Counter Service',
    serviceNameAmharic: 'የመስኮት አገልግሎት',
    status: 'SERVING' as const,
    priority: 'NORMAL' as const,
    issuedAt: new Date().toISOString(),
    counterNumber: activeCounter.number,
    officerName: activeCounter.currentOfficerName
  } : null);

  // Tickets waiting specifically for this counter (or matching allowed services)
  const counterUpcomingTickets = waitingTickets.filter(t => {
    if (activeCounter?.serviceIds && activeCounter.serviceIds.length > 0) {
      return activeCounter.serviceIds.includes(t.serviceId);
    }
    return true;
  }).sort((a, b) => {
    const scoreA = a.priority === 'URGENT' ? 3 : a.priority === 'PRIORITY' ? 2 : 1;
    const scoreB = b.priority === 'URGENT' ? 3 : b.priority === 'PRIORITY' ? 2 : 1;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
  });

  // Trigger flash effect when a ticket is called for this counter
  useEffect(() => {
    if (lastAnnouncement && activeCounter) {
      if (lastAnnouncement.counterNumber === activeCounter.number) {
        setIsCallFlashing(true);
        const timer = setTimeout(() => setIsCallFlashing(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastAnnouncement, activeCounter]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const officeTitle = isAmharic 
    ? (officeSetting?.officeNameAmharic || officeSetting?.officeName || 'የኢትዮጵያ አገልግሎት ማዕከል')
    : (officeSetting?.officeName || 'ETHIOPIA SERVICE CENTER');

  const counterTitle = activeCounter 
    ? (isAmharic ? (activeCounter.nameAmharic || `መስኮት 0${activeCounter.number}`) : (activeCounter.name || `COUNTER 0${activeCounter.number}`))
    : (isAmharic ? 'መስኮት' : 'COUNTER');

  return (
    <div 
      className={`min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none transition-colors duration-500 ${
        displayTheme === 'led' 
          ? 'bg-black text-amber-400 font-mono' 
          : displayTheme === 'minimal'
          ? 'bg-slate-100 text-slate-900'
          : 'bg-slate-950 text-white'
      }`}
    >
      {/* Top Header Controls Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-4 ${
        displayTheme === 'minimal' ? 'border-slate-300' : 'border-slate-800'
      }`}>
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          {onBackToMainDisplay && (
            <button
              onClick={onBackToMainDisplay}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                displayTheme === 'minimal'
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              title="Back to Hall TV Display"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{isAmharic ? 'ወደ ዋና ስክሪን' : 'Main Hall TV'}</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-950 shrink-0">
            <Monitor className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={`text-base sm:text-lg font-black tracking-tight uppercase truncate ${
                displayTheme === 'minimal' ? 'text-slate-900' : 'text-white'
              }`}>
                {officeTitle}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                {isAmharic ? 'የመስኮት ስክሪን' : 'Dedicated Counter Display'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>{isAmharic ? 'የቀጥታ ግንኙነት ተከፍቷል' : 'Live Counter Display Terminal'}</span>
            </p>
          </div>
        </div>

        {/* Counter Switcher & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Counter Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCounterDropdownOpen(!isCounterDropdownOpen)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                displayTheme === 'minimal'
                  ? 'bg-white border-slate-300 text-slate-800 hover:border-indigo-500 shadow-xs'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700 shadow-md'
              }`}
            >
              <Tv className="w-4 h-4 text-indigo-400" />
              <span>
                {activeCounter 
                  ? (isAmharic ? `መስኮት 0${activeCounter.number}` : `Counter 0${activeCounter.number}`)
                  : 'Select Counter'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isCounterDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 ${
                displayTheme === 'minimal' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}>
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  {isAmharic ? 'መስኮት ይምረጡ' : 'Select Active Counter Display'}
                </div>
                {counters.map(c => {
                  const isCurrent = c.id === activeCounter?.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCounterId(c.id);
                        setIsCounterDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : displayTheme === 'minimal' ? 'hover:bg-slate-100' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{isAmharic ? `መስኮት 0${c.number}` : `CNT 0${c.number}`}</span>
                        <span className="text-[11px] opacity-75 truncate max-w-[110px] font-normal">{c.name}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                        c.status === 'SERVING' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-400'
                      }`}>
                        {c.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Display Theme Toggle */}
          <button
            onClick={() => {
              const themes: ('modern' | 'led' | 'minimal')[] = ['modern', 'led', 'minimal'];
              const next = themes[(themes.indexOf(displayTheme) + 1) % themes.length];
              setDisplayTheme(next);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              displayTheme === 'minimal'
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="Switch Theme"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline uppercase text-[10px]">
              {displayTheme === 'modern' ? 'Dark Modern' : displayTheme === 'led' ? 'LED Matrix' : 'Clean Light'}
            </span>
          </button>

          {/* Audio Unlock */}
          {!isAudioUnlocked && (
            <button
              onClick={unlockAudio}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition shadow-xs animate-pulse"
              title="Enable Sound"
            >
              <VolumeX className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">{isAmharic ? 'ድምፅ አንቃ' : 'Enable Audio'}</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition ${
              displayTheme === 'minimal'
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Counter Display Canvas */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto">
        
        {/* Left / Center 8 Columns: Massive Counter Number & Now Serving Display */}
        <div className={`lg:col-span-8 flex flex-col justify-between rounded-3xl p-6 sm:p-10 border shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isCallFlashing ? 'ring-8 ring-indigo-500 ring-offset-4 animate-pulse' : ''
        } ${
          displayTheme === 'led'
            ? 'bg-black border-amber-500/40 text-amber-400'
            : displayTheme === 'minimal'
            ? 'bg-white border-slate-200 text-slate-900 shadow-indigo-100'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}>

          {/* Ambient Lighting Background */}
          {displayTheme === 'modern' && (
            <>
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
            </>
          )}

          {/* Counter Identification Banner */}
          <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 z-10 ${
            displayTheme === 'minimal' ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`px-4 py-1.5 rounded-xl font-black text-lg tracking-wider uppercase font-mono ${
                displayTheme === 'led'
                  ? 'bg-amber-400 text-black border border-amber-300'
                  : 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
              }`}>
                {isAmharic ? `መስኮት 0${activeCounter?.number || 1}` : `COUNTER 0${activeCounter?.number || 1}`}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                  {counterTitle}
                </h2>
                {activeCounter?.location && (
                  <p className="text-xs text-slate-400 font-semibold">{activeCounter.location}</p>
                )}
              </div>
            </div>

            {/* Officer On Duty Pill */}
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border ${
              displayTheme === 'minimal'
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-slate-800/80 border-slate-700 text-slate-200'
            }`}>
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {isAmharic ? 'አገልግሎት ሰጪ' : 'Officer On Duty'}
                </div>
                <div className="text-xs font-bold text-emerald-400 truncate max-w-[140px]">
                  {activeCounter?.currentOfficerName || (isAmharic ? 'የተመደበ ሰራተኛ' : 'Staff Officer')}
                </div>
              </div>
            </div>
          </div>

          {/* Giant Now Serving Ticket Centerpiece */}
          <div className="my-auto py-8 sm:py-12 text-center z-10">
            <div className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-slate-400 mb-2 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>{isAmharic ? 'አሁን የሚስተናገድ ደንበኛ' : 'NOW SERVING AT THIS COUNTER'}</span>
            </div>

            <AnimatePresence mode="wait">
              {counterServingTicket ? (
                <motion.div
                  key={counterServingTicket.id + (counterServingTicket.ticketNumber || '')}
                  initial={{ scale: 0.82, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="space-y-4"
                >
                  {/* Urgent / Priority Badge */}
                  {counterServingTicket.priority === 'URGENT' && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-950/50 animate-pulse border border-rose-400 mb-2">
                      <Flame className="w-4 h-4" />
                      <span>{isAmharic ? '⚡ አስቸኳይ ተገልጋይ' : '⚡ URGENT PRIORITY'}</span>
                    </div>
                  )}
                  {counterServingTicket.priority === 'PRIORITY' && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-slate-950 rounded-full text-xs font-black uppercase tracking-wider shadow-md mb-2">
                      <Zap className="w-4 h-4" />
                      <span>{isAmharic ? '★ ቅድሚያ (VIP)' : '★ VIP PRIORITY'}</span>
                    </div>
                  )}

                  {/* Mega Ticket Number */}
                  <div className={`text-7xl sm:text-9xl lg:text-[10rem] font-black tracking-tight font-mono leading-none ${
                    displayTheme === 'led' 
                      ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]' 
                      : displayTheme === 'minimal'
                      ? 'text-indigo-600'
                      : 'text-white drop-shadow-[0_0_35px_rgba(99,102,241,0.4)]'
                  }`}>
                    {counterServingTicket.ticketNumber}
                  </div>

                  {/* Service Title */}
                  <div className={`text-xl sm:text-3xl font-bold tracking-tight mt-3 ${
                    displayTheme === 'minimal' ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    {isAmharic 
                      ? (counterServingTicket.serviceNameAmharic || counterServingTicket.serviceName)
                      : counterServingTicket.serviceName}
                  </div>
                </motion.div>
              ) : (
                <div className="py-12 sm:py-16 text-center space-y-3">
                  <div className="text-6xl sm:text-8xl font-mono font-bold text-slate-600">--</div>
                  <div className="text-base sm:text-lg text-slate-400 font-semibold">
                    {activeCounter?.status === 'CLOSED'
                      ? (isAmharic ? 'ይህ መስኮት በአሁኑ ወቅት ተዘግቷል' : 'This counter is currently closed.')
                      : (isAmharic ? 'መስኮቱ ዝግጁ ነው፤ ቀጣይ ተረኛ ይጠብቃል' : 'Counter is ready. Waiting for next customer call.')}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Counter Status Footer */}
          <div className={`flex flex-wrap items-center justify-between gap-3 pt-4 border-t z-10 text-xs font-semibold ${
            displayTheme === 'minimal' ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${
                activeCounter?.status === 'SERVING' 
                  ? 'bg-emerald-500 animate-pulse' 
                  : activeCounter?.status === 'AVAILABLE' 
                  ? 'bg-indigo-500' 
                  : 'bg-rose-500'
              }`} />
              <span className="uppercase font-mono">
                {isAmharic ? `ሁኔታ፡ ${activeCounter?.status || 'ዝግጁ'}` : `STATUS: ${activeCounter?.status || 'READY'}`}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span>{isAmharic ? 'ማዕከል' : 'Hub'}: {officeSetting?.officeCode || 'ADD-01'}</span>
              <span>•</span>
              <span>Addis AI Audio Sync</span>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Upcoming Queue For This Counter & Quick Tools */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          
          {/* Upcoming Customers Panel */}
          <div className={`flex-1 flex flex-col justify-between rounded-3xl p-6 border shadow-xl ${
            displayTheme === 'minimal'
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div>
              <div className={`flex items-center justify-between pb-3.5 mb-4 border-b ${
                displayTheme === 'minimal' ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm uppercase tracking-wider">
                    {isAmharic ? 'ቀጣይ ተረኞች' : 'Next In Line'}
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold font-mono border border-indigo-500/30">
                  {counterUpcomingTickets.length} {isAmharic ? 'በወረፋ ላይ' : 'Waiting'}
                </span>
              </div>

              {/* Waiting List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {counterUpcomingTickets.length > 0 ? (
                  counterUpcomingTickets.slice(0, 6).map((tkt, idx) => (
                    <div
                      key={tkt.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                        tkt.priority === 'URGENT'
                          ? 'bg-rose-950/40 border-rose-600/60 text-white'
                          : tkt.priority === 'PRIORITY'
                          ? 'bg-amber-950/30 border-amber-500/50 text-white'
                          : displayTheme === 'minimal'
                          ? 'bg-slate-50 border-slate-200 text-slate-800'
                          : 'bg-slate-950/80 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center font-mono border border-indigo-500/30">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-black font-mono tracking-wide">
                              {tkt.ticketNumber}
                            </span>
                            {tkt.priority === 'URGENT' && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-600 text-white">
                                URGENT
                              </span>
                            )}
                            {tkt.priority === 'PRIORITY' && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500 text-black">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[140px]">
                            {isAmharic ? (tkt.serviceNameAmharic || tkt.serviceName) : tkt.serviceName}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-xs font-mono text-slate-400">
                        ~{idx * 5 + 5}m
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs font-medium">
                      {isAmharic ? 'ለዚህ መስኮት የተመደበ የወረፋ ጥበቃ የለም' : 'No waiting queue for this counter.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Management / Navigation Button */}
            {onNavigateToManagement && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={onNavigateToManagement}
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'የመስኮቶች አስተዳደር ማዕከል' : 'Counter Management Dashboard'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Audio / Pairing Info Card */}
          <div className={`p-4 rounded-2xl border text-xs ${
            displayTheme === 'minimal'
              ? 'bg-white border-slate-200 text-slate-700'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center justify-between font-bold mb-1">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'የስክሪን ቅንብር እና ድምፅ' : 'Screen Hardware Setup'}</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                URL: ?counter={activeCounter?.number || 1}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isAmharic 
                ? 'ይህንን ስክሪን በመስኮቱ ላይ በተገጠመ ታብሌት ወይም ሞኒተር ላይ በሙሉ ስክሪን (Fullscreen) ያሳዩ።'
                : 'Mount this view on counter-top tablets or overhead window screens for instant customer calling.'}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
