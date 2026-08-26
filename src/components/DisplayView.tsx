import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Music, 
  Disc,
  Sparkles, 
  Users, 
  CheckCircle2, 
  Megaphone,
  Radio,
  Film,
  Layers,
  Sliders,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { motion, AnimatePresence } from 'motion/react';
import { DisplayVideoPlayer, PRESET_VIDEOS } from './DisplayVideoPlayer';
import { videoStorage } from '../lib/videoStorage';

export const DisplayView: React.FC = () => {
  const { 
    waitingTickets, 
    servingTickets, 
    counters, 
    officeSetting, 
    audioSetting, 
    audioAssets,
    currentMusicTrack,
    changeBackgroundMusicTrack,
    setBackgroundVolume,
    lastAnnouncement,
    uiLanguage,
    isAudioUnlocked,
    unlockAudio,
    isMusicPlaying,
    toggleBackgroundMusic,
    updateOfficeSettingAction
  } = useQueue();

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Video Layout Mode ('SPLIT' | 'SIDE' | 'PIP' | 'FULL' | 'OFF')
  const [videoLayout, setVideoLayout] = useState<'SPLIT' | 'SIDE' | 'PIP' | 'FULL' | 'OFF'>(() => {
    if (typeof window !== 'undefined') {
      const savedLayout = localStorage.getItem('display_video_layout');
      if (savedLayout && ['SPLIT', 'SIDE', 'PIP', 'FULL', 'OFF'].includes(savedLayout)) {
        return savedLayout as any;
      }
    }
    return (officeSetting?.displayVideoLayout as any) || 'SPLIT';
  });

  const [videoUrl, setVideoUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('display_video_url');
      if (saved) return saved;
    }
    return officeSetting?.displayVideoUrl || PRESET_VIDEOS[0].url;
  });

  const [videoTitle, setVideoTitle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('display_video_title');
      if (saved) return saved;
    }
    return officeSetting?.displayVideoTitle || PRESET_VIDEOS[0].title;
  });
  const [isVideoMenuOpen, setIsVideoMenuOpen] = useState<boolean>(false);

  const isAmharic = uiLanguage === 'AMHARIC';

  // Load and resolve active stored video or fallback URL
  const loadResolvedVideo = async () => {
    try {
      const activeId = videoStorage.getActiveVideoId();
      if (activeId) {
        const { video, playbackUrl } = await videoStorage.getStoredVideoById(activeId, true);
        if (video && playbackUrl) {
          setVideoUrl(playbackUrl);
          setVideoTitle(video.title);
          return;
        }
      }

      // Check office setting or local storage
      const candidateUrl = (typeof window !== 'undefined' ? localStorage.getItem('display_video_url') : null) 
        || officeSetting?.displayVideoUrl 
        || PRESET_VIDEOS[0].url;

      const res = await videoStorage.resolvePlaybackUrl(candidateUrl);
      if (res.playbackUrl) {
        setVideoUrl(res.playbackUrl);
        if (res.videoTitle) setVideoTitle(res.videoTitle);
      }
    } catch (err) {
      console.warn('Error loading resolved video in DisplayView:', err);
    }
  };

  // Check active video from local storage on mount & on storage change events
  useEffect(() => {
    loadResolvedVideo();

    const handleStorageChange = () => {
      loadResolvedVideo();
    };

    window.addEventListener('video-storage-changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('video-storage-changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Update layout if officeSetting updates from backend
  useEffect(() => {
    if (officeSetting?.displayVideoLayout) {
      setVideoLayout(officeSetting.displayVideoLayout as any);
    }
    if (officeSetting?.displayVideoUrl && !officeSetting.displayVideoUrl.startsWith('blob:')) {
      setVideoUrl(officeSetting.displayVideoUrl);
    }
    if (officeSetting?.displayVideoTitle) {
      setVideoTitle(officeSetting.displayVideoTitle);
    }
  }, [officeSetting?.displayVideoLayout, officeSetting?.displayVideoUrl, officeSetting?.displayVideoTitle]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleLayoutChange = (newLayout: 'SPLIT' | 'SIDE' | 'PIP' | 'FULL' | 'OFF') => {
    setVideoLayout(newLayout);
    setIsVideoMenuOpen(false);
    try {
      localStorage.setItem('display_video_layout', newLayout);
    } catch {}
    if (updateOfficeSettingAction) {
      updateOfficeSettingAction({ displayVideoLayout: newLayout }).catch(() => {});
    }
  };

  const handleVideoUrlChange = (newUrl: string, newTitle?: string) => {
    setVideoUrl(newUrl);
    if (newTitle) setVideoTitle(newTitle);
    try {
      localStorage.setItem('display_video_url', newUrl);
      if (newTitle) localStorage.setItem('display_video_title', newTitle);
    } catch {}
    if (updateOfficeSettingAction) {
      updateOfficeSettingAction({
        displayVideoUrl: newUrl,
        displayVideoTitle: newTitle || videoTitle
      }).catch(() => {});
    }
  };

  // Find the most recently called or currently active ticket
  const primaryCalledTicket = servingTickets.length > 0 
    ? servingTickets[servingTickets.length - 1] 
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex flex-col justify-between p-3 sm:p-6 lg:p-8 select-none">
      
      {/* Top Banner / Display Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-black tracking-tight text-white uppercase flex items-center truncate">
            </h1>
          </div>
        </div>

        {/* Video Mode & Fullscreen Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          
          {/* Video Layout Mode Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsVideoMenuOpen(!isVideoMenuOpen)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition shadow-sm cursor-pointer ${
                videoLayout !== 'OFF'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/60 shadow-indigo-900/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Display Video Layout"
            >
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">
                {videoLayout === 'SPLIT' && (isAmharic ? 'ቪዲዮ፡ ጎን ለጎን' : 'Video: Split')}
                {videoLayout === 'SIDE' && (isAmharic ? 'ቪዲዮ፡ ማዕዘን' : 'Video: Side')}
                {videoLayout === 'PIP' && (isAmharic ? 'ቪዲዮ፡ ተንሳፋፊ (PiP)' : 'Video: PiP')}
                {videoLayout === 'FULL' && (isAmharic ? 'ቪዲዮ፡ ዋና ማሳያ' : 'Video: Full')}
                {videoLayout === 'OFF' && (isAmharic ? 'ቪዲዮ፡ ዝግ' : 'Video: Off')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-70" />
            </button>

            {/* Layout Switcher Menu */}
            {isVideoMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  {isAmharic ? 'የቪዲዮ ማጫወቻ አቀማመጥ' : 'Screen Video Layout'}
                </div>

                <button
                  onClick={() => handleLayoutChange('SPLIT')}
                  className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition ${
                    videoLayout === 'SPLIT' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{isAmharic ? 'ጎን ለጎን (Split Screen)' : 'Split Screen (Side-by-Side)'}</span>
                  {videoLayout === 'SPLIT' && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleLayoutChange('SIDE')}
                  className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition ${
                    videoLayout === 'SIDE' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{isAmharic ? 'በቀኝ በኩል (Side Panel)' : 'Side Panel Widget'}</span>
                  {videoLayout === 'SIDE' && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleLayoutChange('PIP')}
                  className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition ${
                    videoLayout === 'PIP' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{isAmharic ? 'ተንሳፋፊ መስኮት (Picture in Picture)' : 'Floating Picture-in-Picture'}</span>
                  {videoLayout === 'PIP' && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleLayoutChange('FULL')}
                  className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition ${
                    videoLayout === 'FULL' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{isAmharic ? 'ዋና ቪዲዮ + የወረፋ ባነር' : 'Full Video with Live Banner'}</span>
                  {videoLayout === 'FULL' && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <div className="border-t border-slate-800 pt-1">
                  <button
                    onClick={() => handleLayoutChange('OFF')}
                    className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition ${
                      videoLayout === 'OFF' ? 'bg-rose-900/60 text-rose-200' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>{isAmharic ? 'ቪዲዮ አጥፋ (ወረፋ ብቻ)' : 'Hide Video (Queue Only)'}</span>
                    {videoLayout === 'OFF' && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 sm:p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYOUT OPTION 1: SPLIT SCREEN (Large Video on Left + Now Serving on Right) */}
      {/* ========================================================================= */}
      {videoLayout === 'SPLIT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
          
          {/* Left Column (lg:col-span-7 xl:col-span-8): Large Public Video Player */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[380px] sm:min-h-[460px] lg:min-h-[520px]">
            <DisplayVideoPlayer
              videoUrl={videoUrl}
              videoTitle={videoTitle}
              isAmharic={isAmharic}
              layoutMode={videoLayout}
              onLayoutChange={handleLayoutChange}
              onUrlChange={handleVideoUrlChange}
              lastAnnouncement={lastAnnouncement}
              className="w-full h-full shadow-2xl"
              showControlsBar={true}
            />
          </div>

          {/* Right Column (lg:col-span-5 xl:col-span-4): Now Serving Calling Card & Queue */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between space-y-4">
            
            {/* Primary NOW SERVING Centerpiece Card */}
            <div className="flex-1 flex flex-col justify-between bg-slate-900 rounded-3xl p-5 sm:p-6 lg:p-7 border border-slate-800 shadow-2xl relative overflow-hidden">
              
              {/* Ambient Glow */}
              <div className="absolute -right-16 -top-16 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between z-10 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                    {isAmharic ? 'አሁን የሚስተናገድ ደንበኛ' : 'NOW SERVING'}
                  </span>
                </div>

                {/* Voice Indicator */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-full border border-slate-700/80">
                  <div className="flex gap-1 items-end h-3.5">
                    <div className="w-0.5 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <div className="w-0.5 h-3.5 bg-indigo-400 rounded-full animate-pulse"></div>
                    <div className="w-0.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-[10px] text-slate-300 font-mono">
                    {isAmharic ? 'ድምፅ' : 'Voice'}
                  </span>
                </div>
              </div>

              {/* Giant Called Ticket Centerpiece */}
              <div className="my-auto py-5 sm:py-6 text-center z-10">
                <AnimatePresence mode="wait">
                  {primaryCalledTicket ? (
                    <motion.div
                      key={primaryCalledTicket.id + (primaryCalledTicket.calledAt || '')}
                      initial={{ scale: 0.88, opacity: 0, y: 15 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.92, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      <div className="inline-block">
                        <div className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white font-mono leading-none">
                          {primaryCalledTicket.ticketNumber}
                        </div>

                        {/* Amharic Letter Display */}
                        {primaryCalledTicket.ticketNumberAmharic && primaryCalledTicket.ticketNumberAmharic !== primaryCalledTicket.ticketNumber && (
                          <div className="text-xl sm:text-2xl font-light text-slate-400 italic mt-1 font-sans">
                            {primaryCalledTicket.ticketNumberAmharic}
                          </div>
                        )}
                      </div>

                      {/* Service Title */}
                      <div className="text-sm sm:text-base font-semibold text-slate-300 truncate max-w-full px-2">
                        {isAmharic ? (primaryCalledTicket.serviceNameAmharic || primaryCalledTicket.serviceName) : primaryCalledTicket.serviceName}
                      </div>

                      {/* Counter Assignment Banner */}
                      <div className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xl sm:text-3xl px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl shadow-xl shadow-indigo-950/60 border border-indigo-500/30 font-black tracking-wide">
                        <span>
                          {isAmharic ? `ወደ ቆጣሪ 0${primaryCalledTicket.counterNumber || 1}` : `COUNTER 0${primaryCalledTicket.counterNumber || 1}`}
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="py-8 text-slate-500 space-y-2">
                      <div className="text-4xl sm:text-6xl font-mono font-bold text-slate-700">--</div>
                      <p className="text-xs sm:text-sm text-slate-400 font-medium">
                        {isAmharic ? 'በአሁኑ ሰዓት የተጠራ ደንበኛ የለም።' : 'No active ticket called yet.'}
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Active Serving Counters Mini-Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800 z-10">
                {counters.slice(0, 4).map((cnt) => {
                  const isBusy = cnt.status === 'SERVING' && cnt.currentTicketNumber;
                  return (
                    <div
                      key={cnt.id}
                      className={`p-2 rounded-xl border transition-all text-center ${
                        isBusy
                          ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">
                        {isAmharic ? `ቆጣሪ 0${cnt.number}` : `CNT 0${cnt.number}`}
                      </div>
                      <div className="text-base sm:text-lg font-black text-white mt-0.5 font-mono truncate">
                        {cnt.currentTicketNumber || (cnt.status === 'CLOSED' ? 'CLOSED' : 'READY')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next in line / Waiting Tickets List */}
            <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-4 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-2.5 border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
                    {isAmharic ? 'ቀጣይ ተራዎች' : 'Next In Line'}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 text-[11px] font-bold font-mono border border-slate-700">
                  {waitingTickets.length} {isAmharic ? 'በመጠባበቅ ላይ' : 'Waiting'}
                </span>
              </div>

              {/* Waiting Ticket Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
                {waitingTickets.length > 0 ? (
                  waitingTickets.slice(0, 6).map((ticket, idx) => (
                    <div
                      key={ticket.id}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="w-4 h-4 rounded bg-slate-800 text-slate-300 font-bold text-[9px] flex items-center justify-center font-mono shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-white font-mono truncate">
                          {ticket.ticketNumber}
                        </span>
                      </div>
                      {ticket.priority === 'PRIORITY' && (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 shrink-0">
                          VIP
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-3 text-slate-600 text-xs font-medium">
                    {isAmharic ? 'ሁሉም ደንበኞች ተስተናግደዋል' : 'All waiting customers served!'}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYOUT OPTION 2: FULL VIDEO SHOWCASE WITH NOW SERVING BOTTOM BANNER        */}
      {/* ========================================================================= */}
      {videoLayout === 'FULL' && (
        <div className="flex flex-col space-y-4 flex-1">
          {/* Giant Video Player */}
          <div className="flex-1 w-full min-h-[420px]">
            <DisplayVideoPlayer
              videoUrl={videoUrl}
              videoTitle={videoTitle}
              isAmharic={isAmharic}
              layoutMode={videoLayout}
              onLayoutChange={handleLayoutChange}
              onUrlChange={handleVideoUrlChange}
              lastAnnouncement={lastAnnouncement}
              className="w-full h-full"
              showControlsBar={true}
            />
          </div>

          {/* Bottom Live Queue Calling Strip */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4 min-w-0">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 uppercase tracking-wider">
                {isAmharic ? 'አሁን የሚስተናገድ' : 'NOW SERVING'}
              </span>
              {primaryCalledTicket ? (
                <div className="flex items-center space-x-4">
                  <span className="text-4xl sm:text-6xl font-black font-mono text-white">
                    {primaryCalledTicket.ticketNumber}
                  </span>
                  <div className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xl sm:text-2xl font-black">
                    {isAmharic ? `ወደ ቆጣሪ 0${primaryCalledTicket.counterNumber || 1}` : `COUNTER 0${primaryCalledTicket.counterNumber || 1}`}
                  </div>
                  <span className="text-slate-300 font-semibold hidden lg:inline text-sm">
                    {isAmharic ? primaryCalledTicket.serviceNameAmharic : primaryCalledTicket.serviceName}
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 font-medium text-sm">
                  {isAmharic ? 'በአሁኑ ሰዓት የተጠራ ደንበኛ የለም' : 'No active ticket called yet'}
                </span>
              )}
            </div>

            {/* Waiting Queue Mini Badges */}
            <div className="flex items-center space-x-2 overflow-x-auto max-w-full">
              <span className="text-xs text-slate-400 font-bold uppercase whitespace-nowrap mr-1">
                {isAmharic ? 'ቀጣይ:' : 'Next:'}
              </span>
              {waitingTickets.slice(0, 4).map((ticket, idx) => (
                <span 
                  key={ticket.id}
                  className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white whitespace-nowrap"
                >
                  #{idx + 1} {ticket.ticketNumber}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYOUT OPTION 3: STANDARD QUEUE ONLY OR PIP (Floating Corner Video)       */}
      {/* ========================================================================= */}
      {(videoLayout === 'SIDE' || videoLayout === 'PIP' || videoLayout === 'OFF') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
          
          {/* Main NOW SERVING Center Card */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
            
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

              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700/80">
                <div className="flex gap-1 items-end h-4">
                  <div className="w-0.5 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <div className="w-0.5 h-4 bg-indigo-400 rounded-full animate-pulse"></div>
                  <div className="w-0.5 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                  <div className="w-0.5 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                </div>
                <span className="text-[10px] text-slate-300 font-mono">
                  {isAmharic ? 'Addis AI ድምፅ' : 'Addis AI Voice'}
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

                      {primaryCalledTicket.ticketNumberAmharic && primaryCalledTicket.ticketNumberAmharic !== primaryCalledTicket.ticketNumber && (
                        <div className="text-3xl sm:text-4xl font-light text-slate-400 italic mt-2 font-sans">
                          {primaryCalledTicket.ticketNumberAmharic}
                        </div>
                      )}
                    </div>

                    <div className="text-xl sm:text-2xl font-semibold text-slate-300">
                      {isAmharic ? (primaryCalledTicket.serviceNameAmharic || primaryCalledTicket.serviceName) : primaryCalledTicket.serviceName}
                    </div>

                    <div className="inline-flex items-center justify-center space-x-3 bg-indigo-600 hover:bg-indigo-700 text-white text-3xl sm:text-5xl px-10 sm:px-16 py-4 rounded-2xl shadow-xl shadow-indigo-950/60 border border-indigo-500/30 font-black tracking-wide">
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

            {/* Serving Counters Mini-Strip */}
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

          {/* Right Column: Next in line + (Side Video Widget if SIDE layout) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            
            {/* Side Video Card if in SIDE layout */}
            {videoLayout === 'SIDE' && (
              <div className="h-56">
                <DisplayVideoPlayer
                  videoUrl={videoUrl}
                  videoTitle={videoTitle}
                  isAmharic={isAmharic}
                  layoutMode={videoLayout}
                  onLayoutChange={handleLayoutChange}
                  onUrlChange={handleVideoUrlChange}
                  lastAnnouncement={lastAnnouncement}
                  className="w-full h-full"
                  showControlsBar={false}
                />
              </div>
            )}

            {/* Waiting Queue List */}
            <div className="flex-1 flex flex-col justify-between bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
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

                <div className="space-y-2 max-h-[300px] lg:max-h-[360px] overflow-y-auto pr-1">
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
                    <div className="text-center py-12 text-slate-600">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                      <p className="text-xs font-medium">
                        {isAmharic ? 'ሁሉም ደንበኞች ተስተናግደዋል' : 'All waiting customers served!'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Background Music Strip */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Music className={`w-3.5 h-3.5 shrink-0 ${isMusicPlaying ? 'text-indigo-400 animate-pulse' : 'text-slate-600'}`} />
                    <div className="truncate">
                      <span className="text-[11px] font-bold text-slate-300">
                        {isMusicPlaying 
                          ? (currentMusicTrack?.title || (isAmharic ? 'የቢሮ ዳራ ሙዚቃ' : 'Office Ambient Music')) 
                          : (isAmharic ? 'የዳራ ሙዚቃ ቆሟል' : 'Ambient Music Paused')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleBackgroundMusic()}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 rounded-lg font-bold text-xs transition border border-slate-700 cursor-pointer"
                  >
                    {isMusicPlaying ? (isAmharic ? 'አቁም' : 'Pause') : (isAmharic ? 'አጫውት' : 'Play')}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Floating Picture-in-Picture Video Player Overlay */}
      {videoLayout === 'PIP' && (
        <div className="fixed bottom-16 right-6 z-40 w-80 sm:w-96 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <DisplayVideoPlayer
            videoUrl={videoUrl}
            videoTitle={videoTitle}
            isAmharic={isAmharic}
            layoutMode={videoLayout}
            onLayoutChange={handleLayoutChange}
            onUrlChange={handleVideoUrlChange}
            lastAnnouncement={lastAnnouncement}
            className="w-full h-56 border-2 border-indigo-500/50 shadow-indigo-950/80"
            showControlsBar={false}
          />
        </div>
      )}

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
