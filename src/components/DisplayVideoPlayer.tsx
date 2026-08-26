import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Tv, 
  Sliders, 
  Sparkles,
  ExternalLink,
  Plus,
  Check,
  Film,
  Upload,
  AlertCircle,
  HardDrive,
  FolderOpen,
  FileVideo,
  Trash2,
  Download,
  Save,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { AnnouncementPayload } from '../types';
import { videoStorage, StoredVideo, formatBytes } from '../lib/videoStorage';

export interface VideoPreset {
  id: string;
  title: string;
  titleAmharic: string;
  description: string;
  url: string;
  category: 'CITY' | 'NEWS' | 'NATURE' | 'TECH' | 'OFFICE';
  isDefault?: boolean;
}

export const PRESET_VIDEOS: VideoPreset[] = [
  {
    id: 'addis-smart-city',
    title: 'Addis Ababa Smart City & Urban Development',
    titleAmharic: 'የአዲስ አበባ ዘመናዊ ከተማ እና የመሰረተ ልማት እንቅስቃሴ',
    description: 'Modern infrastructure, smart transportation & green legacy in Addis Ababa',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'CITY',
    isDefault: true
  },
  {
    id: 'ethiopia-tourism',
    title: 'Land of Origins - Ethiopian Heritage',
    titleAmharic: 'የሰው ዘር መገኛ - የኢትዮጵያ የቱሪዝም መስህቦች',
    description: 'Breathtaking landscapes, culture and historic landmarks of Ethiopia',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'NATURE'
  },
  {
    id: 'tech-innovation',
    title: 'Digital Ethiopia & Tech Innovations',
    titleAmharic: 'ዲጂታል ኢትዮጵያ እና የቴክኖሎጂ ፈጠራዎች',
    description: 'AI, fintech, and digital transformation initiatives in East Africa',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'TECH'
  },
  {
    id: 'office-welcome',
    title: 'Customer Service & Public Service Guidelines',
    titleAmharic: 'የደንበኞች አገልግሎት አሰጣጥ እና መመሪያዎች',
    description: 'Office queue guidelines, customer care principles and service hours',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'OFFICE'
  }
];

interface DisplayVideoPlayerProps {
  videoUrl?: string;
  videoTitle?: string;
  videoTitleAmharic?: string;
  isAmharic?: boolean;
  layoutMode?: 'SPLIT' | 'SIDE' | 'PIP' | 'FULL' | 'OFF';
  onLayoutChange?: (layout: 'SPLIT' | 'SIDE' | 'PIP' | 'FULL' | 'OFF') => void;
  onUrlChange?: (url: string, title?: string) => void;
  lastAnnouncement?: AnnouncementPayload | null;
  className?: string;
  showControlsBar?: boolean;
}

export const DisplayVideoPlayer: React.FC<DisplayVideoPlayerProps> = ({
  videoUrl = PRESET_VIDEOS[0].url,
  videoTitle,
  videoTitleAmharic,
  isAmharic = true,
  layoutMode = 'SPLIT',
  onLayoutChange,
  onUrlChange,
  lastAnnouncement,
  className = '',
  showControlsBar = true
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentUrl, setCurrentUrl] = useState<string>(videoUrl);
  const [resolvedPlaybackUrl, setResolvedPlaybackUrl] = useState<string>(videoUrl);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(30);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [activeConfigTab, setActiveConfigTab] = useState<'local_storage' | 'presets' | 'custom_url'>('local_storage');
  const [customInputUrl, setCustomInputUrl] = useState<string>('');
  const [customInputTitle, setCustomInputTitle] = useState<string>('');
  const [videoError, setVideoError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);

  // Local Storage State
  const [storedVideos, setStoredVideos] = useState<StoredVideo[]>([]);
  const [activeStoredId, setActiveStoredId] = useState<string | null>(null);
  const [isUploadingToStorage, setIsUploadingToStorage] = useState<boolean>(false);
  const [storageStatusMsg, setStorageStatusMsg] = useState<string>('');
  const [storageUsage, setStorageUsage] = useState<{ count: number; totalBytes: number; formattedSize: string }>({
    count: 0,
    totalBytes: 0,
    formattedSize: '0 B'
  });

  // Load and refresh stored videos from local storage
  const refreshLocalStorageList = async () => {
    try {
      const list = videoStorage.getStoredVideos();
      setStoredVideos(list);
      const activeId = videoStorage.getActiveVideoId();
      setActiveStoredId(activeId);
      const usage = await videoStorage.getStorageUsage();
      setStorageUsage(usage);
    } catch (err) {
      console.warn('Error refreshing local video storage:', err);
    }
  };

  // Safe playback execution helper with autoplay policy fallback
  const attemptPlay = async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      await el.play();
      setIsPlaying(true);
      setIsAutoplayBlocked(false);
      setVideoError('');
    } catch (err: any) {
      // Browser autoplay policy might block unmuted audio
      const currentEl = videoRef.current;
      if (currentEl && (err?.name === 'NotAllowedError' || !currentEl.muted)) {
        try {
          currentEl.muted = true;
          setIsMuted(true);
          await currentEl.play();
          setIsPlaying(true);
          setIsAutoplayBlocked(true);
          setVideoError('');
        } catch {
          setIsPlaying(false);
        }
      } else {
        setIsPlaying(false);
      }
    }
  };

  // Universal URL resolver & loader
  const resolveAndLoadVideo = async (targetUrlOrId: string, forceFresh: boolean = false) => {
    try {
      setIsLoading(true);
      setVideoError('');

      // Check if we have an active stored video
      const activeId = videoStorage.getActiveVideoId();
      setActiveStoredId(activeId);

      // If no URL or default preset given, prioritize active stored video
      if (!targetUrlOrId || targetUrlOrId === PRESET_VIDEOS[0].url) {
        const activeStored = await videoStorage.getActiveStoredVideo(forceFresh);
        if (activeStored.playbackUrl) {
          setResolvedPlaybackUrl(activeStored.playbackUrl);
          setActiveStoredId(activeStored.video?.id || null);
          setIsLoading(false);
          return;
        }
      }

      // Resolve URL (handles IndexedDB blobs, IDs, URLs)
      const res = await videoStorage.resolvePlaybackUrl(targetUrlOrId);
      if (res.playbackUrl) {
        setResolvedPlaybackUrl(res.playbackUrl);
        if (res.isLocal) {
          const matchedId = videoStorage.getActiveVideoId();
          setActiveStoredId(matchedId);
        }
      } else {
        // Fallback to target URL or default preset
        setResolvedPlaybackUrl(targetUrlOrId || PRESET_VIDEOS[0].url);
      }
    } catch (err: any) {
      console.warn('Video URL resolve issue, falling back to direct URL:', err);
      setResolvedPlaybackUrl(targetUrlOrId || PRESET_VIDEOS[0].url);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshLocalStorageList();
    resolveAndLoadVideo(videoUrl);

    // Listen for storage updates across tabs or components
    const handleStorageChange = () => {
      refreshLocalStorageList();
      const currentActiveId = videoStorage.getActiveVideoId();
      if (currentActiveId) {
        videoStorage.getStoredVideoById(currentActiveId, true).then(({ video, playbackUrl }) => {
          if (playbackUrl) {
            setResolvedPlaybackUrl(playbackUrl);
            setActiveStoredId(currentActiveId);
            setVideoError('');
          }
        });
      }
    };

    window.addEventListener('video-storage-changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('video-storage-changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sync internal state when prop changes
  useEffect(() => {
    if (videoUrl && videoUrl !== currentUrl) {
      setCurrentUrl(videoUrl);
      resolveAndLoadVideo(videoUrl);
    }
  }, [videoUrl]);

  // When resolved playback URL changes, reload the video element
  useEffect(() => {
    if (videoRef.current && resolvedPlaybackUrl && !youtubeEmbedInfo) {
      videoRef.current.load();
      attemptPlay();
    }
  }, [resolvedPlaybackUrl]);

  // Determine if URL is YouTube
  const youtubeEmbedInfo = useMemo(() => {
    if (!resolvedPlaybackUrl) return null;
    const url = resolvedPlaybackUrl.trim();

    // Standard YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (watchMatch && watchMatch[1]) {
      const videoId = watchMatch[1];
      return {
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0`
      };
    }

    // Direct embed URL already provided
    if (url.includes('youtube.com/embed/')) {
      const parts = url.split('youtube.com/embed/');
      const videoId = parts[1]?.split('?')[0];
      return {
        videoId: videoId || '',
        embedUrl: url.includes('?') 
          ? `${url}&autoplay=1&mute=${isMuted ? 1 : 0}&loop=1` 
          : `${url}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1`
      };
    }

    return null;
  }, [resolvedPlaybackUrl, isMuted]);

  // Audio Auto-Ducking on Ticket Announcements
  useEffect(() => {
    if (!lastAnnouncement) return;
    if (videoRef.current && !isMuted) {
      const originalVolume = videoRef.current.volume;
      videoRef.current.volume = Math.max(0.05, originalVolume * 0.15);

      const restoreTimer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.volume = originalVolume;
        }
      }, 7000);

      return () => clearTimeout(restoreTimer);
    }
  }, [lastAnnouncement, isMuted]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      attemptPlay();
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Handle Mute/Unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      if (isMuted) {
        // Unmuting
        setIsMuted(false);
        setIsAutoplayBlocked(false);
        videoRef.current.play().catch(() => {});
      } else {
        setIsMuted(true);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  // Handle Volume Change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol / 100;
      if (newVol > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      } else if (newVol === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  // Handle Fullscreen of Video Container
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Handle Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Format Time (mm:ss)
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Apply custom video URL or preset
  const handleApplyCustomUrl = (urlToApply: string, titleToApply?: string) => {
    if (!urlToApply.trim()) return;
    const cleanUrl = urlToApply.trim();
    setCurrentUrl(cleanUrl);
    setVideoError('');
    setIsConfigOpen(false);
    resolveAndLoadVideo(cleanUrl);
    if (onUrlChange) {
      onUrlChange(cleanUrl, titleToApply || customInputTitle);
    }
  };

  // Retrieve and play a video from local storage
  const handleSelectStoredVideo = async (video: StoredVideo) => {
    try {
      setIsLoading(true);
      setVideoError('');
      videoStorage.setActiveVideoId(video.id);
      setActiveStoredId(video.id);

      const { playbackUrl } = await videoStorage.getStoredVideoById(video.id, true);
      if (playbackUrl) {
        setCurrentUrl(playbackUrl);
        setResolvedPlaybackUrl(playbackUrl);
        setIsConfigOpen(false);
        if (onUrlChange) {
          onUrlChange(playbackUrl, video.title);
        }
        await refreshLocalStorageList();
      } else {
        setVideoError(isAmharic ? 'ቪዲዮውን ከ Local Storage ማጫወት አልተቻለም።' : 'Failed to retrieve video from local storage.');
      }
    } catch (err) {
      console.error('Error selecting stored video:', err);
      setVideoError(isAmharic ? 'ቪዲዮውን ከማህደረ ትውስታ በማውጣት ላይ ስህተት ተፈጥሯል።' : 'Error retrieving video from local storage.');
    } finally {
      setIsLoading(false);
    }
  };

  // Store uploaded video file directly into IndexedDB local storage
  const handleFileUploadToStorage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingToStorage(true);
      setStorageStatusMsg(isAmharic ? 'ቪዲዮ ወደ Local Storage እየተቀመጠ ነው...' : 'Storing video in browser local storage...');
      
      const stored = await videoStorage.storeLocalVideoFile(file, {
        title: customInputTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
        titleAmharic: customInputTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
        description: `Stored local video (${file.type || 'video/mp4'})`
      });

      setStorageStatusMsg(isAmharic ? 'ቪዲዮ በተሳካ ሁኔታ በ Local Storage ተቀምጧል!' : 'Video successfully saved to Local Storage!');
      await refreshLocalStorageList();

      // Retrieve and start playback immediately
      const { playbackUrl } = await videoStorage.getStoredVideoById(stored.id, true);
      if (playbackUrl) {
        setCurrentUrl(playbackUrl);
        setResolvedPlaybackUrl(playbackUrl);
        setActiveStoredId(stored.id);
        setVideoError('');
        if (onUrlChange) {
          onUrlChange(playbackUrl, stored.title);
        }
      }

      setTimeout(() => {
        setStorageStatusMsg('');
        setIsConfigOpen(false);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to store video to local storage:', err);
      setStorageStatusMsg(isAmharic ? 'ቪዲዮ ማስቀመጥ አልተቻለም፡ ' + (err?.message || '') : 'Failed to store video: ' + (err?.message || ''));
    } finally {
      setIsUploadingToStorage(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  // Save custom stream URL to local storage library
  const handleSaveCustomUrlToStorage = async () => {
    if (!customInputUrl.trim()) return;

    try {
      setIsUploadingToStorage(true);
      const stored = await videoStorage.storeVideoUrl(customInputUrl.trim(), {
        title: customInputTitle.trim() || (customInputUrl.includes('youtube') ? 'YouTube Stream' : 'Custom Video Stream'),
        titleAmharic: customInputTitle.trim() || (customInputUrl.includes('youtube') ? 'የዩቲዩብ ስርጭት' : 'የድረገጽ ቪዲዮ')
      });

      setStorageStatusMsg(isAmharic ? 'ቪዲዮው ወደ Local Storage ተመዝግቧል!' : 'Video stream saved to local storage library!');
      await refreshLocalStorageList();
      
      handleApplyCustomUrl(customInputUrl, customInputTitle);
      setCustomInputUrl('');
      setCustomInputTitle('');

      setTimeout(() => {
        setStorageStatusMsg('');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to save URL to storage:', err);
      setStorageStatusMsg('Failed to save URL: ' + (err?.message || ''));
    } finally {
      setIsUploadingToStorage(false);
    }
  };

  // Delete a video from local storage
  const handleDeleteStoredVideo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(isAmharic ? 'ይህን ቪዲዮ ከ Local Storage መሰረዝ ይፈልጋሉ?' : 'Are you sure you want to delete this video from Local Storage?')) {
      await videoStorage.deleteStoredVideo(id);
      await refreshLocalStorageList();
      if (activeStoredId === id) {
        // Fallback to default preset
        setActiveStoredId(null);
        setCurrentUrl(PRESET_VIDEOS[0].url);
        setResolvedPlaybackUrl(PRESET_VIDEOS[0].url);
        if (onUrlChange) {
          onUrlChange(PRESET_VIDEOS[0].url, PRESET_VIDEOS[0].title);
        }
      }
    }
  };

  // Download stored video
  const handleDownloadStoredVideo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await videoStorage.downloadStoredVideo(id);
    } catch (err) {
      console.error('Failed to download stored video:', err);
    }
  };

  // Auto-recovery when video element errors
  const handleVideoElementError = async () => {
    console.warn('Video element error occurred on URL:', resolvedPlaybackUrl);
    
    // Check if it was a local storage video and attempt refresh of Object URL
    const activeId = activeStoredId || videoStorage.getActiveVideoId();
    if (activeId) {
      try {
        const { playbackUrl } = await videoStorage.getStoredVideoById(activeId, true);
        if (playbackUrl && playbackUrl !== resolvedPlaybackUrl) {
          setResolvedPlaybackUrl(playbackUrl);
          setVideoError('');
          return;
        }
      } catch (err) {
        console.error('Self-healing failed for local video:', err);
      }
    }

    setVideoError(
      isAmharic 
        ? 'ቪዲዮውን ማጫወት አልተቻለም። እባክዎ ፋይሉን እንደገና ይጫኑ ወይም ሌላ ቻናል ይምረጡ።' 
        : 'Unable to play video source. Please reload the file or select another preset channel.'
    );
  };

  const activeTitle = isAmharic 
    ? (videoTitleAmharic || videoTitle || 'የቢሮ መረጃ እና የማስተዋወቂያ ቪዲዮ') 
    : (videoTitle || videoTitleAmharic || 'Office Information & Welcome Video');

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-slate-950 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col group ${className}`}
    >
      {/* Top Overlay Badge & Quick Switcher */}
      <div className="absolute top-0 inset-x-0 z-20 p-3 sm:p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent flex items-center justify-between pointer-events-auto transition-opacity duration-300">
        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border font-bold shrink-0 flex items-center space-x-1 ${
                activeStoredId 
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60' 
                  : youtubeEmbedInfo 
                    ? 'bg-red-950/90 text-red-200 border-red-700/50' 
                    : 'bg-indigo-900/80 text-indigo-200 border-indigo-700/50'
              }`}>
                {activeStoredId && <HardDrive className="w-2.5 h-2.5 mr-0.5 inline" />}
                <span>{activeStoredId ? 'Local Storage' : (youtubeEmbedInfo ? 'YouTube HD' : '4K Media')}</span>
              </span>
              <p className="text-xs sm:text-sm font-bold text-white tracking-tight truncate drop-shadow-md">
                {activeTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-md transition shadow-md cursor-pointer"
            title={isAmharic ? 'ቪዲዮ ቀይር ወይም አዘጋጅ' : 'Change Video / Select Channel'}
          >
            <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
          </button>

          {onLayoutChange && (
            <div className="hidden sm:flex items-center bg-slate-900/80 rounded-xl border border-slate-700/80 p-0.5 backdrop-blur-md">
              <button
                onClick={() => onLayoutChange('SPLIT')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                  layoutMode === 'SPLIT' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Split View (Side by Side)"
              >
                Split
              </button>
              <button
                onClick={() => onLayoutChange('SIDE')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                  layoutMode === 'SIDE' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Compact Sidebar Video"
              >
                Side
              </button>
            </div>
          )}

          <button
            onClick={toggleMute}
            className={`p-1.5 sm:p-2 rounded-xl border backdrop-blur-md transition shadow-md cursor-pointer ${
              isMuted 
                ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border-slate-700/80' 
                : 'bg-emerald-600/90 text-white border-emerald-500/50'
            }`}
            title={isMuted ? 'Unmute Video' : 'Mute Video'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video Viewport (16:9 Aspect Ratio Container) */}
      <div className="relative w-full flex-1 min-h-[220px] sm:min-h-[300px] lg:min-h-[360px] bg-black flex items-center justify-center overflow-hidden">
        {youtubeEmbedInfo ? (
          <iframe
            src={youtubeEmbedInfo.embedUrl}
            title={activeTitle}
            className="w-full h-full absolute inset-0 border-0 pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : resolvedPlaybackUrl && resolvedPlaybackUrl.trim() !== '' ? (
          <>
            <video
              ref={videoRef}
              src={resolvedPlaybackUrl}
              autoPlay
              loop={isLooping}
              muted={isMuted}
              playsInline
              preload="auto"
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                  setDuration(videoRef.current.duration || 0);
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration || 0);
                  videoRef.current.volume = volume / 100;
                  videoRef.current.muted = isMuted;
                  attemptPlay();
                }
              }}
              onPlay={() => {
                setIsPlaying(true);
                setIsAutoplayBlocked(false);
              }}
              onPause={() => setIsPlaying(false)}
              onError={handleVideoElementError}
              className="w-full h-full object-cover sm:object-contain bg-black cursor-pointer"
              onClick={togglePlay}
            />

            {/* Tap to Unmute Banner if Autoplay audio was restricted by browser */}
            {isAutoplayBlocked && (
              <div 
                onClick={toggleMute}
                className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-indigo-900/90 hover:bg-indigo-800 text-white text-xs font-bold shadow-xl border border-indigo-500/50 flex items-center space-x-2 cursor-pointer transition animate-in fade-in slide-in-from-top-2"
              >
                <VolumeX className="w-3.5 h-3.5 text-amber-300" />
                <span>{isAmharic ? 'ድምፅ ለማብራት ይጫኑ (Tap for Sound)' : 'Click to Unmute Sound'}</span>
              </div>
            )}

            {/* Error Overlay if video fails */}
            {videoError && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
                <Film className="w-10 h-10 text-rose-500 animate-pulse" />
                <p className="text-sm font-bold text-slate-200 max-w-sm">{videoError}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {storedVideos.length > 0 && (
                    <button
                      onClick={() => {
                        handleSelectStoredVideo(storedVideos[0]);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer flex items-center space-x-1.5"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>{isAmharic ? 'የተቀመጠ ቪዲዮ እንደገና ጫን' : 'Reload Stored Video'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      videoStorage.setActiveVideoId(null);
                      setActiveStoredId(null);
                      setCurrentUrl(PRESET_VIDEOS[0].url);
                      setResolvedPlaybackUrl(PRESET_VIDEOS[0].url);
                      setVideoError('');
                      if (onUrlChange) {
                        onUrlChange(PRESET_VIDEOS[0].url, PRESET_VIDEOS[0].title);
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
                  >
                    {isAmharic ? 'ነባሪ ቪዲዮ አጫውት' : 'Load Default Preset'}
                  </button>
                </div>
              </div>
            )}

            {/* Center Big Play Indicator on Pause */}
            {!isPlaying && !videoError && (
              <button
                onClick={togglePlay}
                className="absolute z-10 w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-xs hover:scale-110 hover:bg-indigo-500 transition cursor-pointer"
              >
                <Play className="w-8 h-8 ml-1" />
              </button>
            )}
          </>
        ) : (
          /* Placeholder state when no video URL is provided */
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
            <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-800/40 text-indigo-400 shadow-xl">
              <Tv className="w-10 h-10" />
            </div>
            <p className="text-sm font-bold text-slate-200">
              {isAmharic ? 'ምንም ቪዲዮ አልተመረጠም' : 'No Video Source Loaded'}
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              {isAmharic ? 'እባክዎ ከታች ካሉት አማራጮች ቪዲዮ ይምረጡ ወይም የራስዎን ቪዲዮ ሊንክ ያስገቡ' : 'Select a channel below or click Custom URL to play videos on this screen.'}
            </p>
            <button
              onClick={() => {
                setCurrentUrl(PRESET_VIDEOS[0].url);
                setResolvedPlaybackUrl(PRESET_VIDEOS[0].url);
                setVideoError('');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
            >
              {isAmharic ? 'ነባሪ ቪዲዮ አጫውት' : 'Load Default Video'}
            </button>
          </div>
        )}
      </div>

      {/* HTML5 Bottom Floating / Overlay Controls Bar */}
      {!youtubeEmbedInfo && (
        <div 
          className={`absolute bottom-0 inset-x-0 z-20 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent transition-all duration-300 ${
            isHovered || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          {/* Scrubber Progress Slider */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-[10px] font-mono text-slate-400 w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Bottom Controls Row */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                  }
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Volume Controls */}
              <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                <button
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                  className="w-14 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                  isLooping ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
                title="Loop playback"
              >
                LOOP
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Channel Presets / Switcher Footer (Optional bottom bar) */}
      {showControlsBar && (
        <div className="p-2.5 sm:p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1 shrink-0 mr-1">
              <Tv className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isAmharic ? 'ቻናሎች:' : 'Channels:'}</span>
            </span>

            {/* Quick Button for Stored Local Videos if any exist */}
            {storedVideos.length > 0 && (
              <button
                onClick={() => {
                  setActiveConfigTab('local_storage');
                  setIsConfigOpen(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 flex items-center space-x-1.5 border ${
                  activeStoredId 
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' 
                    : 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                }`}
                title={isAmharic ? 'በ Local Storage የተቀመጡ ቪዲዮዎች' : 'Stored Local Videos'}
              >
                <HardDrive className="w-3 h-3" />
                <span>{isAmharic ? `የተቀመጡ (${storedVideos.length})` : `Stored (${storedVideos.length})`}</span>
                {activeStoredId && <Check className="w-3 h-3" />}
              </button>
            )}

            {PRESET_VIDEOS.map((preset) => {
              const isSelected = !activeStoredId && currentUrl === preset.url;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    videoStorage.setActiveVideoId(null);
                    setActiveStoredId(null);
                    setCurrentUrl(preset.url);
                    setResolvedPlaybackUrl(preset.url);
                    setVideoError('');
                    if (onUrlChange) {
                      onUrlChange(preset.url, preset.title);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {isAmharic ? preset.titleAmharic.split(' - ')[0].substring(0, 18) : preset.title.substring(0, 18)}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              setActiveConfigTab('local_storage');
              setIsConfigOpen(true);
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 shrink-0 border border-slate-700 transition cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isAmharic ? 'የቪዲዮ ማከማቻ (Storage)' : 'Video Storage'}</span>
          </button>
        </div>
      )}

      {/* Video Source Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-xl w-full shadow-2xl text-white space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-900/50 border border-indigo-700/50 text-indigo-400">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isAmharic ? 'የቪዲዮ ማጫወቻ እና ማከማቻ (Video Storage & Presets)' : 'Video Library & Local Storage'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isAmharic 
                      ? `በ Local Storage የተቀመጡ፡ ${storageUsage.count} ቪዲዮዎች (${storageUsage.formattedSize})`
                      : `Stored in Browser Storage: ${storageUsage.count} files (${storageUsage.formattedSize})`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Status Alert Notification */}
            {storageStatusMsg && (
              <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-700 text-xs text-indigo-200 flex items-center space-x-2 shrink-0 animate-in fade-in">
                {isUploadingToStorage ? (
                  <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span className="font-medium">{storageStatusMsg}</span>
              </div>
            )}

            {/* Modal Navigation Tabs */}
            <div className="flex items-center space-x-1 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveConfigTab('local_storage')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  activeConfigTab === 'local_storage'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'የተቀመጡ ቪዲዮዎች' : 'Local Storage'}</span>
                {storedVideos.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-200 border border-indigo-400 font-mono">
                    {storedVideos.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveConfigTab('presets')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  activeConfigTab === 'presets'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'የተዘጋጁ ቻናሎች' : 'Curated Presets'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveConfigTab('custom_url')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  activeConfigTab === 'custom_url'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'አዲስ ሊንክ (URL)' : 'Custom URL'}</span>
              </button>
            </div>

            {/* Tab 1: Local Storage Video Manager */}
            {activeConfigTab === 'local_storage' && (
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                
                {/* Upload New Video to Local Storage Card */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isAmharic ? 'አዲስ ቪዲዮ ወደ Local Storage ጫን' : 'Upload & Store Video Locally'}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isAmharic 
                        ? 'የቪዲዮ ፋይሎችን በኮምፒውተሩ ማህደረ ትውስታ (IndexedDB) አስቀምጠው ያለ ኢንተርኔት ያጫውቱ' 
                        : 'Stores high-capacity video files offline in browser storage (IndexedDB)'}
                    </p>
                  </div>

                  <label className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 shadow-md">
                    {isUploadingToStorage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingToStorage ? (isAmharic ? 'በመጫን ላይ...' : 'Storing...') : (isAmharic ? 'ቪዲዮ ምረጥ' : 'Choose Video File')}</span>
                    <input
                      type="file"
                      accept="video/*"
                      disabled={isUploadingToStorage}
                      onChange={handleFileUploadToStorage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Stored Videos List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isAmharic ? 'በማህደረ ትውስታ የተቀመጡ ቪዲዮዎች' : 'Saved Local Videos'}</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {storedVideos.length} {isAmharic ? 'ቪዲዮዎች' : 'items'}
                    </span>
                  </div>

                  {storedVideos.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                      <HardDrive className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-300">
                        {isAmharic ? 'ምንም የተቀመጠ ቪዲዮ አልተገኘም' : 'No stored local videos found'}
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        {isAmharic 
                          ? 'ቪዲዮዎችን ከኮምፒውተርዎ ወደዚህ በመጫን ወይም ሊንኮችን በማስቀመጥ ያለ ኢንተርኔት መጠቀም ይችላሉ።' 
                          : 'Upload an MP4/WebM file or save a video stream to store it in local storage.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {storedVideos.map((item) => {
                        const isPlayingThis = activeStoredId === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectStoredVideo(item)}
                            className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                              isPlayingThis
                                ? 'bg-emerald-950/60 border-emerald-500/70 ring-1 ring-emerald-500'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isPlayingThis ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                              }`}>
                                <FileVideo className="w-4 h-4" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs font-bold text-white truncate">
                                    {isAmharic ? (item.titleAmharic || item.title) : item.title}
                                  </p>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 font-mono shrink-0">
                                    {item.type}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                                  {item.sizeBytes && (
                                    <span className="font-mono">{formatBytes(item.sizeBytes)}</span>
                                  )}
                                  <span>•</span>
                                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              {item.type === 'LOCAL_FILE' && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDownloadStoredVideo(item.id, e)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                  title="Download / Export file"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => handleDeleteStoredVideo(item.id, e)}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 transition"
                                title="Delete from Local Storage"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {isPlayingThis ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex items-center space-x-1">
                                  <Check className="w-3 h-3" />
                                  <span>{isAmharic ? 'የተመረጠ' : 'Active'}</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 text-[10px] font-bold transition">
                                  {isAmharic ? 'አጫውት' : 'Play'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Curated Presets */}
            {activeConfigTab === 'presets' && (
              <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {isAmharic ? 'የተዘጋጁ የቪዲዮ አማራጮች (Presets)' : 'Curated Video Presets'}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {PRESET_VIDEOS.map((preset) => {
                    const isSelected = !activeStoredId && currentUrl === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          videoStorage.setActiveVideoId(null);
                          setActiveStoredId(null);
                          handleApplyCustomUrl(preset.url, preset.title);
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-950/60 border-indigo-500/60 ring-1 ring-indigo-500'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white truncate">
                              {isAmharic ? preset.titleAmharic : preset.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 font-mono">
                              {preset.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {preset.description}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Custom URL & YouTube Stream */}
            {activeConfigTab === 'custom_url' && (
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {isAmharic ? 'የራስዎን ቪዲዮ አድራሻ (YouTube ወይም MP4) ያስገቡ' : 'Custom Video / YouTube Stream URL'}
                </label>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={customInputUrl}
                    onChange={(e) => setCustomInputUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
                    className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />

                  <input
                    type="text"
                    value={customInputTitle}
                    onChange={(e) => setCustomInputTitle(e.target.value)}
                    placeholder={isAmharic ? 'የቪዲዮው ርዕስ (አማራጭ)' : 'Video Title (Optional)'}
                    className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-200">
                      {isAmharic ? 'ወደ Local Storage ማከማቻ አስቀምጥ' : 'Save to Local Storage Library'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isAmharic ? 'ይህንን ሊንክ ለወደፊቱ በቀላሉ ለማጫወት በማህደረ ትውስታ ያስቀምጣል' : 'Saves this custom stream for 1-click playback across refreshes'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCustomUrlToStorage}
                    disabled={!customInputUrl.trim() || isUploadingToStorage}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-indigo-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 border border-slate-700"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'አስቀምጥ' : 'Save Stream'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {isAmharic ? 'ዝጋ' : 'Close'}
              </button>

              {activeConfigTab === 'custom_url' && (
                <button
                  type="button"
                  onClick={() => {
                    videoStorage.setActiveVideoId(null);
                    setActiveStoredId(null);
                    handleApplyCustomUrl(customInputUrl, customInputTitle);
                  }}
                  disabled={!customInputUrl.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'ተግብር እና አጫውት' : 'Apply & Play'}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
