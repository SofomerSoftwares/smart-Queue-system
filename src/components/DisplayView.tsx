import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  Megaphone,
  Radio,
  Film,
  Layers,
  Sliders,
  ChevronDown,
  LayoutGrid,
  Flame,
  Zap
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
    lastAnnouncement,
    uiLanguage,
    isAudioUnlocked,
    unlockAudio,
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
  const officeNameDisplay = isAmharic 
    ? (officeSetting?.officeNameAmharic || officeSetting?.officeName || 'የአገልግሎት መስጫ ቢሮ')
    : (officeSetting?.officeName || officeSetting?.officeNameAmharic || 'SERVICE CENTER');

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

  // Priority sorted waiting tickets: URGENT (3) > PRIORITY (2) > NORMAL (1), then issuedAt
  const sortedWaitingTickets = [...waitingTickets].sort((a, b) => {
    const scoreA = a.priority === 'URGENT' ? 3 : a.priority === 'PRIORITY' ? 2 : 1;
    const scoreB = b.priority === 'URGENT' ? 3 : b.priority === 'PRIORITY' ? 2 : 1;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex flex-col justify-between p-3 sm:p-6 lg:p-8 select-none">
      
      {/* Top Banner / Display Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-indigo-900/50 shadow-md shrink-0">
            <Tv className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-black tracking-tight text-white uppercase flex items-center truncate space-x-2">
              <span className="truncate">{officeNameDisplay}</span>
            </h1>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium truncate mt-0.5">
              <span className="flex items-center space-x-1 text-emerald-400">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                <span>{isAmharic ? 'የቀጥታ የወረፋ መከታተያ' : 'Live Queue Active'}</span>
              </span>
              <span>•</span>
              <span className="text-indigo-400 font-semibold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Addis AI Voice</span>
              </span>
            </div>
          </div>
        </div>

        {/* Video Mode, Audio Unlock & Fullscreen Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* One-click Audio Unlock Button if not yet clicked */}
          {!isAudioUnlocked && (
            <button
              onClick={unlockAudio}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition shadow-sm cursor-pointer animate-pulse"
              title="Click to enable Addis AI Voice sound"
            >
              <VolumeX className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">{isAmharic ? 'ድምፅ አንቃ (Audio Enable)' : 'Enable Audio'}</span>
            </button>
          )}
          
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
                      key={primaryCalledTicket.id + (primaryCalledTicket.calledAt || '') + (primaryCalledTicket.status || '')}
                      initial={{ scale: 0.86, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: -20 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      <div className="inline-block">
                        {/* Priority Badge on TV display if urgent or priority */}
                        {primaryCalledTicket.priority === 'URGENT' && (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0, y: -8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-950/60 animate-pulse border border-rose-400 mb-2"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>{isAmharic ? '⚡ አስቸኳይ ተገልጋይ' : '⚡ URGENT PRIORITY'}</span>
                          </motion.div>
                        )}
                        {primaryCalledTicket.priority === 'PRIORITY' && (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0, y: -8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-500 text-slate-950 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-md mb-2"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{isAmharic ? '★ ቅድሚያ (VIP)' : '★ VIP PRIORITY'}</span>
                          </motion.div>
                        )}

                        <motion.div
                          key={`split-ticket-num-${primaryCalledTicket.ticketNumber}`}
                          initial={{ opacity: 0, scale: 0.82, y: 18 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 1.08, y: -18 }}
                          transition={{ type: 'spring', stiffness: 360, damping: 25 }}
                          className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white font-mono leading-none"
                        >
                          {primaryCalledTicket.ticketNumber}
                        </motion.div>

                        {/* Amharic Letter Display */}
                        {primaryCalledTicket.ticketNumberAmharic && primaryCalledTicket.ticketNumberAmharic !== primaryCalledTicket.ticketNumber && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.06 }}
                            className="text-xl sm:text-2xl font-light text-slate-400 italic mt-1 font-sans"
                          >
                            {primaryCalledTicket.ticketNumberAmharic}
                          </motion.div>
                        )}
                      </div>

                      {/* Service Title */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.08 }}
                        className="text-sm sm:text-base font-semibold text-slate-300 truncate max-w-full px-2"
                      >
                        {isAmharic ? (primaryCalledTicket.serviceNameAmharic || primaryCalledTicket.serviceName) : primaryCalledTicket.serviceName}
                      </motion.div>

                      {/* Counter Assignment Banner */}
                      <motion.div 
                        initial={{ opacity: 0, y: 14, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -14, scale: 0.95 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 320, damping: 24 }}
                        className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xl sm:text-3xl px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl shadow-xl shadow-indigo-950/60 border border-indigo-500/30 font-black tracking-wide"
                      >
                        <span>
                          {isAmharic ? `ወደ መስኮት ${primaryCalledTicket.counterNumber || 1}` : `COUNTER ${primaryCalledTicket.counterNumber || 1}`}
                        </span>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty-split-call"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="py-8 text-slate-500 space-y-2"
                    >
                      <div className="text-4xl sm:text-6xl font-mono font-bold text-slate-700">--</div>
                      <p className="text-xs sm:text-sm text-slate-400 font-medium">
                        {isAmharic ? 'በአሁኑ ሰዓት የተጠራ ደንበኛ የለም።' : 'No active ticket called yet.'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Active Serving Counters Mini-Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800 z-10">
                {counters.slice(0, 4).map((cnt) => {
                  const isBusy = cnt.status === 'SERVING' && cnt.currentTicketNumber;
                  const displayVal = cnt.currentTicketNumber || (cnt.status === 'CLOSED' ? 'CLOSED' : 'READY');
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
                        {isAmharic ? `መስኮት ${cnt.number}` : `CNT ${cnt.number}`}
                      </div>
                      <div className="text-base sm:text-lg font-black text-white mt-0.5 font-mono truncate overflow-hidden h-6 sm:h-7 flex items-center justify-center">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={displayVal}
                            initial={{ opacity: 0, y: 8, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.92 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="inline-block"
                          >
                            {displayVal}
                          </motion.span>
                        </AnimatePresence>
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
                <AnimatePresence initial={false}>
                  {sortedWaitingTickets.length > 0 ? (
                    sortedWaitingTickets.slice(0, 6).map((ticket, idx) => (
                      <motion.div
                        key={ticket.id}
                        layout
                        initial={{ opacity: 0, scale: 0.88, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -12, transition: { duration: 0.18 } }}
                        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                        className={`p-2 rounded-xl border flex items-center justify-between ${
                          ticket.priority === 'URGENT'
                            ? 'bg-rose-950/40 border-rose-600/60'
                            : ticket.priority === 'PRIORITY'
                            ? 'bg-amber-950/30 border-amber-500/50'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <span className="w-4 h-4 rounded bg-slate-800 text-slate-300 font-bold text-[9px] flex items-center justify-center font-mono shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-white font-mono truncate">
                            {ticket.ticketNumber}
                          </span>
                        </div>
                        {ticket.priority === 'URGENT' && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-600 text-white shrink-0 flex items-center gap-0.5 animate-pulse">
                            <Flame className="w-2.5 h-2.5" /> URGENT
                          </span>
                        )}
                        {ticket.priority === 'PRIORITY' && (
                          <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 shrink-0">
                            VIP
                          </span>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      key="empty-waiting-grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="col-span-full text-center py-3 text-slate-600 text-xs font-medium"
                    >
                      {isAmharic ? 'ሁሉም ደንበኞች ተስተናግደዋል' : 'All waiting customers served!'}
                    </motion.div>
                  )}
                </AnimatePresence>
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
              <AnimatePresence mode="wait">
                {primaryCalledTicket ? (
                  <motion.div 
                    key={primaryCalledTicket.id + (primaryCalledTicket.calledAt || '') + (primaryCalledTicket.status || '')}
                    initial={{ opacity: 0, x: -20, scale: 0.92 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className="flex items-center space-x-4"
                  >
                    <motion.span
                      key={`full-ticket-num-${primaryCalledTicket.ticketNumber}`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                      className="text-4xl sm:text-6xl font-black font-mono text-white"
                    >
                      {primaryCalledTicket.ticketNumber}
                    </motion.span>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: 0.08 }}
                      className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xl sm:text-2xl font-black shadow-lg"
                    >
                      {isAmharic ? `ወደ መስኮት ${primaryCalledTicket.counterNumber || 1}` : `COUNTER ${primaryCalledTicket.counterNumber || 1}`}
                    </motion.div>
                    <span className="text-slate-300 font-semibold hidden lg:inline text-sm">
                      {isAmharic ? primaryCalledTicket.serviceNameAmharic : primaryCalledTicket.serviceName}
                    </span>
                  </motion.div>
                ) : (
                  <motion.span 
                    key="empty-full-call"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-slate-500 font-medium text-sm"
                  >
                    {isAmharic ? 'በአሁኑ ሰዓት የተጠራ ደንበኛ የለም' : 'No active ticket called yet'}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Waiting Queue Mini Badges */}
            <div className="flex items-center space-x-2 overflow-x-auto max-w-full py-1">
              <span className="text-xs text-slate-400 font-bold uppercase whitespace-nowrap mr-1">
                {isAmharic ? 'ቀጣይ:' : 'Next:'}
              </span>
              <AnimatePresence initial={false}>
                {waitingTickets.slice(0, 4).map((ticket, idx) => (
                  <motion.span 
                    key={ticket.id}
                    layout
                    initial={{ opacity: 0, scale: 0.82, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -10, transition: { duration: 0.15 } }}
                    transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                    className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white whitespace-nowrap inline-block"
                  >
                    #{idx + 1} {ticket.ticketNumber}
                  </motion.span>
                ))}
              </AnimatePresence>
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
                    key={primaryCalledTicket.id + (primaryCalledTicket.calledAt || '') + (primaryCalledTicket.status || '')}
                    initial={{ scale: 0.86, opacity: 0, y: 24 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: -24 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className="space-y-4"
                  >
                    <div className="inline-block">
                      {/* Priority Badge on Fullscreen display */}
                      {primaryCalledTicket.priority === 'URGENT' && (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0, y: -10 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                          className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-600 text-white rounded-full text-sm font-black uppercase tracking-wider shadow-xl shadow-rose-950/60 animate-pulse border border-rose-400 mb-3"
                        >
                          <Flame className="w-4 h-4" />
                          <span>{isAmharic ? '⚡ አስቸኳይ ተገልጋይ' : '⚡ URGENT PRIORITY'}</span>
                        </motion.div>
                      )}
                      {primaryCalledTicket.priority === 'PRIORITY' && (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0, y: -10 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                          className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-slate-950 rounded-full text-sm font-extrabold uppercase tracking-wider shadow-lg mb-3"
                        >
                          <Zap className="w-4 h-4" />
                          <span>{isAmharic ? '★ ቅድሚያ (VIP)' : '★ VIP PRIORITY'}</span>
                        </motion.div>
                      )}

                      <motion.div 
                        key={`main-ticket-num-${primaryCalledTicket.ticketNumber}`}
                        initial={{ opacity: 0, scale: 0.8, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, y: -24 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 25 }}
                        className="text-7xl sm:text-9xl lg:text-[11rem] font-black tracking-tight text-white font-mono leading-none"
                      >
                        {primaryCalledTicket.ticketNumber}
                      </motion.div>

                      {primaryCalledTicket.ticketNumberAmharic && primaryCalledTicket.ticketNumberAmharic !== primaryCalledTicket.ticketNumber && (
                        <motion.div 
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: 0.06 }}
                          className="text-3xl sm:text-4xl font-light text-slate-400 italic mt-2 font-sans"
                        >
                          {primaryCalledTicket.ticketNumberAmharic}
                        </motion.div>
                      )}
                    </div>

                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.08 }}
                      className="text-xl sm:text-2xl font-semibold text-slate-300"
                    >
                      {isAmharic ? (primaryCalledTicket.serviceNameAmharic || primaryCalledTicket.serviceName) : primaryCalledTicket.serviceName}
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 16, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -16, scale: 0.95 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 320, damping: 24 }}
                      className="inline-flex items-center justify-center space-x-3 bg-indigo-600 hover:bg-indigo-700 text-white text-3xl sm:text-5xl px-10 sm:px-16 py-4 rounded-2xl shadow-xl shadow-indigo-950/60 border border-indigo-500/30 font-black tracking-wide"
                    >
                      <span>
                        {isAmharic ? `ወደ መስኮት ${primaryCalledTicket.counterNumber || 1}` : `COUNTER ${primaryCalledTicket.counterNumber || 1}`}
                      </span>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty-main-call"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="py-16 text-slate-500 space-y-3"
                  >
                    <div className="text-5xl sm:text-7xl font-mono font-bold text-slate-700">--</div>
                    <p className="text-base text-slate-400 font-medium">
                      {isAmharic ? 'በአሁኑ ሰዓት የተጠራ ደንበኛ የለም።' : 'No active ticket called yet.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Serving Counters Mini-Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-800 z-10">
              {counters.map((cnt) => {
                const isBusy = cnt.status === 'SERVING' && cnt.currentTicketNumber;
                const displayVal = cnt.currentTicketNumber || (cnt.status === 'CLOSED' ? 'CLOSED' : 'READY');
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
                      {isAmharic ? `መስኮት ${cnt.number}` : `COUNTER ${cnt.number}`}
                    </div>
                    <div className="text-xl font-black text-white mt-0.5 font-mono overflow-hidden h-7 flex items-center">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={displayVal}
                          initial={{ opacity: 0, y: 8, scale: 0.92 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.92 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="inline-block truncate"
                        >
                          {displayVal}
                        </motion.span>
                      </AnimatePresence>
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
                  <AnimatePresence initial={false}>
                    {sortedWaitingTickets.length > 0 ? (
                      sortedWaitingTickets.slice(0, 8).map((ticket, idx) => (
                        <motion.div
                          key={ticket.id}
                          layout
                          initial={{ opacity: 0, scale: 0.88, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: -12, transition: { duration: 0.18 } }}
                          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                          className={`flex items-center justify-between p-3 rounded-xl border transition ${
                            ticket.priority === 'URGENT'
                              ? 'bg-rose-950/40 border-rose-600/60'
                              : ticket.priority === 'PRIORITY'
                              ? 'bg-amber-950/30 border-amber-500/50'
                              : 'bg-slate-950/80 border-slate-800/80 hover:border-indigo-500/30'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center font-mono">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-black text-white font-mono tracking-wide">
                                  {ticket.ticketNumber}
                                </span>
                                {ticket.priority === 'URGENT' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white flex items-center gap-0.5 animate-pulse">
                                    <Flame className="w-2.5 h-2.5" /> URGENT
                                  </span>
                                )}
                                {ticket.priority === 'PRIORITY' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">
                                    VIP
                                  </span>
                                )}
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
                        </motion.div>
                      ))
                    ) : (
                      <motion.div 
                        key="empty-waiting-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-12 text-slate-600"
                      >
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                        <p className="text-xs font-medium">
                          {isAmharic ? 'ሁሉም ደንበኞች ተስተናግደዋል' : 'All waiting customers served!'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
