import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Music, 
  Sparkles, 
  Clock, 
  Users, 
  CheckCircle2, 
  Megaphone,
  Radio
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { motion, AnimatePresence } from 'motion/react';

export const DisplayView: React.FC = () => {
  const { 
    waitingTickets, 
    servingTickets, 
    counters, 
    officeSetting, 
    audioSetting, 
    lastAnnouncement,
    uiLanguage,
    isAudioUnlocked,
    unlockAudio,
    isMusicPlaying,
    toggleBackgroundMusic
  } = useQueue();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isAmharic = uiLanguage === 'AMHARIC';

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Find the most recently called or currently active ticket
  const primaryCalledTicket = servingTickets.length > 0 
    ? servingTickets[servingTickets.length - 1] 
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 select-none">
      
      {/* Top Banner / Display Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-bold text-2xl">
            Q
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase flex items-center">
              <span>{isAmharic ? (officeSetting?.officeNameAmharic || 'የአገልግሎት መስጫ ቢሮ') : (officeSetting?.officeName || 'ABC SERVICE OFFICE')}</span>
              <span className="text-slate-500 font-normal ml-3 hidden sm:inline text-sm">| {isAmharic ? 'የቀጥታ ስክሪን' : 'LIVE DISPLAY'}</span>
            </h1>
            <p className="text-xs text-indigo-400 font-semibold tracking-wide">
              {isAmharic ? 'የቀጥታ የወረፋ መከታተያ ስክሪን • በጀሚኒ AI ድምፅ የተደገፈ' : 'Live Official Queue Display • Powered by Gemini AI Voice'}
            </p>
          </div>
        </div>

        {/* Live Clock & Fullscreen Controls */}
        <div className="flex items-center space-x-3">
          {!isAudioUnlocked && (
            <button
              onClick={unlockAudio}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 animate-pulse transition"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isAmharic ? 'ድምፅ አንቃ' : 'Enable Audio'}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center space-x-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-slate-300">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="font-mono font-bold text-sm tracking-wider">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Grid: NOW SERVING (Center Hero) & Counters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        
        {/* Left / Center: Giant NOW SERVING Hero Card */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
          
          {/* Ambient Minimal Glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card Label */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                {isAmharic ? 'አሁን የሚስተናገድ ደንበኛ' : 'NOW SERVING'}
              </span>
            </div>

            {/* Audio Waveform Equalizer */}
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700/80">
              <div className="flex gap-1 items-end h-4">
                <div className="w-0.5 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <div className="w-0.5 h-4 bg-indigo-400 rounded-full animate-pulse"></div>
                <div className="w-0.5 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                <div className="w-0.5 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-[10px] text-slate-300 font-mono">
                {isAmharic ? 'Gemini AI ድምፅ' : 'Gemini AI Voice'}
              </span>
            </div>
          </div>

          {/* Giant Called Ticket Centerpiece */}
          <div className="my-auto py-8 text-center z-10">
            <AnimatePresence mode="wait">
              {primaryCalledTicket ? (
                <motion.div
                  key={primaryCalledTicket.id + (primaryCalledTicket.calledAt || '')}
                  initial={{ scale: 0.88, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="space-y-4"
                >
                  <div className="inline-block">
                    <div className="text-7xl sm:text-9xl lg:text-[11rem] font-black tracking-tight text-white font-mono leading-none">
                      {primaryCalledTicket.ticketNumber}
                    </div>

                    {/* Amharic Letter Display */}
                    {primaryCalledTicket.ticketNumberAmharic && primaryCalledTicket.ticketNumberAmharic !== primaryCalledTicket.ticketNumber && (
                      <div className="text-3xl sm:text-4xl font-light text-slate-400 italic mt-2 font-sans">
                        {primaryCalledTicket.ticketNumberAmharic}
                      </div>
                    )}
                  </div>

                  {/* Service Title */}
                  <div className="text-xl sm:text-2xl font-semibold text-slate-300">
                    {isAmharic ? (primaryCalledTicket.serviceNameAmharic || primaryCalledTicket.serviceName) : primaryCalledTicket.serviceName}
                  </div>

                  {/* Counter Assignment Banner */}
                  <div className="inline-flex items-center justify-center space-x-3 bg-indigo-600 hover:bg-indigo-700 text-white px-10 sm:px-16 py-4 rounded-2xl shadow-xl shadow-indigo-950/60 border border-indigo-500/30 text-3xl sm:text-5xl font-black tracking-wide">
                    <span>
                      {isAmharic ? `ወደ ቆጣሪ 0${primaryCalledTicket.counterNumber || 1}` : `COUNTER 0${primaryCalledTicket.counterNumber || 1}`}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="py-16 text-slate-500 space-y-3">
                  <div className="text-5xl sm:text-7xl font-mono font-bold text-slate-700">--</div>
                  <p className="text-base text-slate-400 font-medium">
                    {isAmharic ? 'በአሁኑ ሰዓት የተጠራ ደንበኛ የለም።' : 'No active ticket called yet.'}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Active Serving Counters Mini-Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-800 z-10">
            {counters.map((cnt) => {
              const isBusy = cnt.status === 'SERVING' && cnt.currentTicketNumber;
              return (
                <div
                  key={cnt.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isBusy
                      ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {isAmharic ? `ቆጣሪ 0${cnt.number}` : `COUNTER 0${cnt.number}`}
                  </div>
                  <div className="text-xl font-black text-white mt-0.5 font-mono">
                    {cnt.currentTicketNumber || (cnt.status === 'CLOSED' ? 'CLOSED' : 'READY')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Next in Line / Waiting Queue */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3.5">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  {isAmharic ? 'ቀጣይ ተራዎች' : 'Next In Line'}
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 text-xs font-bold font-mono border border-slate-700">
                {waitingTickets.length} {isAmharic ? 'በመጠባበቅ ላይ' : 'Waiting'}
              </span>
            </div>

            {/* Waiting Ticket Pills */}
            <div className="space-y-2 max-h-[380px] lg:max-h-[460px] overflow-y-auto pr-1">
              {waitingTickets.length > 0 ? (
                waitingTickets.slice(0, 8).map((ticket, idx) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/30 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center font-mono">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-lg font-black text-white font-mono tracking-wide">
                          {ticket.ticketNumber}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-[140px]">
                          {isAmharic ? (ticket.serviceNameAmharic || ticket.serviceName) : ticket.serviceName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {ticket.priority === 'PRIORITY' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {isAmharic ? 'ቅድሚያ' : 'VIP'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">
                          ~{idx * 5 + 5}m
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-slate-600">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                  <p className="text-xs font-medium">
                    {isAmharic ? 'ሁሉም ደንበኞች ተስተናግደዋል' : 'All waiting customers served!'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Background Audio / Music Indicator */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Music className={`w-3.5 h-3.5 ${isMusicPlaying ? 'text-purple-400 animate-bounce' : 'text-slate-600'}`} />
              <span className="text-[11px]">{isMusicPlaying ? (isAmharic ? 'የቢሮ ሙዚቃ በርቷል' : 'Ambient Music Playing') : (isAmharic ? 'ሙዚቃ ዝም ብሏል' : 'Audio Muted')}</span>
            </div>

            <button
              onClick={() => toggleBackgroundMusic()}
              className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs"
            >
              {isMusicPlaying ? (isAmharic ? 'አቁም' : 'Pause') : (isAmharic ? 'አጫውት' : 'Play')}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Display Notice Ticker */}
      <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 flex items-center space-x-3 text-xs sm:text-sm text-slate-300">
        <div className="flex items-center space-x-1.5 text-indigo-400 font-bold whitespace-nowrap">
          <Megaphone className="w-4 h-4" />
          <span>{isAmharic ? 'ማስታወቂያ:' : 'Notice:'}</span>
        </div>
        <div className="overflow-hidden relative w-full">
          <div className="truncate font-medium text-slate-200">
            {isAmharic 
              ? (officeSetting?.displayNoticeAmharic || 'እንኳን ወደ ቢሮአችን በደህና መጡ። ቁጥርዎ በስክሪኑ እና በድምፅ እስኪጠራ ድረስ ይጠብቁ።')
              : (officeSetting?.displayNotice || 'Welcome! Please wait for your ticket number to be called on display and speaker.')}
          </div>
        </div>
      </div>
    </div>
  );
};
