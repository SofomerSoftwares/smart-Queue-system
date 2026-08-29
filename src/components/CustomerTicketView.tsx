import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Search, 
  Clock, 
  Users, 
  CheckCircle2, 
  Bell, 
  AlertCircle,
  ShieldCheck,
  QrCode,
  Check,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Camera,
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle,
  Star,
  MessageSquare,
  Send,
  ThumbsUp,
  Smile,
  Edit3,
  MessageCircleHeart,
  BellRing,
  Flame
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../lib/api';
import { useQueue } from '../context/QueueContext';
import { QueueTicket, CustomerReview } from '../types';
import { AmharicLib } from '../lib/amharic';
import { notificationManager } from '../lib/notificationManager';

interface FeedbackTagOption {
  id: string;
  en: string;
  am: string;
  isPositive: boolean;
}

const FEEDBACK_TAGS: FeedbackTagOption[] = [
  { id: 'fast_service', en: '⚡ Fast Service', am: '⚡ ፈጣን አገልግሎት', isPositive: true },
  { id: 'polite_officer', en: '🌟 Polite & Friendly Staff', am: '🌟 ተስማሚ እና አክባሪ ሰራተኛ', isPositive: true },
  { id: 'clear_audio', en: '📢 Clear Audio Announcement', am: '📢 ግልጽ የድምፅ ጥሪ', isPositive: true },
  { id: 'clear_guidance', en: '💡 Clear Guidance', am: '💡 ግልጽ መመሪያ', isPositive: true },
  { id: 'clean_lobby', en: '🏢 Clean & Comfortable Lobby', am: '🏢 ንጹህ እና ምቹ አዳራሽ', isPositive: true },
  { id: 'long_wait', en: '⏳ Long Waiting Time', am: '⏳ ረጅም የጥበቃ ጊዜ', isPositive: false },
  { id: 'screen_visibility', en: '🖥️ Screen Visibility Issue', am: '🖥️ የስክሪን እይታ ችግር', isPositive: false },
  { id: 'audio_low', en: '🔉 Low Voice Call Volume', am: '🔉 የድምፅ ጥሪ ማነስ', isPositive: false }
];

const RATING_DESCRIPTIONS: Record<number, { en: string; am: string; badgeColor: string }> = {
  1: { en: 'Poor Experience', am: 'ደካማ አገልግሎት', badgeColor: 'bg-rose-100 text-rose-800 border-rose-200' },
  2: { en: 'Fair Experience', am: 'መጠነኛ አገልግሎት', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
  3: { en: 'Good Experience', am: 'ጥሩ አገልግሎት', badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  4: { en: 'Very Good Service', am: 'በጣም ጥሩ አገልግሎት', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  5: { en: 'Excellent & Outstanding', am: 'ምርጥ / ከፍተኛ እርካታ', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
};

export const CustomerTicketView: React.FC = () => {
  const { 
    uiLanguage, 
    officeSetting, 
    waitingTickets, 
    checkInTicket,
    isNotificationsEnabled,
    requestNotificationPermission,
    toggleNotifications,
    sendTestNotification
  } = useQueue();
  
  // Read initial query params from URL if present
  const getInitialTicket = (): string => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramTicket = urlParams.get('ticket') || urlParams.get('t') || urlParams.get('num');
      if (paramTicket) return paramTicket.trim().toUpperCase();
    } catch {}
    return 'A-002';
  };

  const [ticketQuery, setTicketQuery] = useState<string>(getInitialTicket);
  const [ticketData, setTicketData] = useState<(QueueTicket & {
    ticketNumberAmharic?: string;
    peopleAhead?: number;
    estimatedWaitMinutes?: number;
    currentlyServingTicketNumber?: string;
  }) | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
  const [checkInSuccessMsg, setCheckInSuccessMsg] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isScanSimulating, setIsScanSimulating] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');

  // Customer Review & Satisfaction State
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState<string>('');
  const [isEditingReview, setIsEditingReview] = useState<boolean>(false);

  const hasAutoCheckedInRef = useRef<boolean>(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const isAmharic = uiLanguage === 'AMHARIC';

  // Watch for ticket status changing to CALLED or SERVING and trigger browser notification
  useEffect(() => {
    if (ticketData?.status) {
      if (
        (ticketData.status === 'CALLED' || ticketData.status === 'SERVING') &&
        prevStatusRef.current &&
        prevStatusRef.current !== 'CALLED' &&
        prevStatusRef.current !== 'SERVING'
      ) {
        if (isNotificationsEnabled) {
          notificationManager.notifyTicketCalled({
            ticketNumber: ticketData.ticketNumber,
            counterNumber: ticketData.counterNumber || 1,
            serviceName: ticketData.serviceName,
            serviceNameAmharic: ticketData.serviceNameAmharic,
            language: isAmharic ? 'AMHARIC' : 'ENGLISH'
          });
        }
      }
      prevStatusRef.current = ticketData.status;
    }
  }, [ticketData?.status, ticketData?.counterNumber, ticketData?.ticketNumber, isNotificationsEnabled, isAmharic]);

  // Construct current check-in URL for QR code
  const getCheckInUrl = (ticketNum?: string): string => {
    const num = ticketNum || ticketData?.ticketNumber || ticketQuery;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    return `${origin}${pathname}?view=customer&ticket=${encodeURIComponent(num)}&checkin=true`;
  };

  // Populate review state from ticketData if already submitted
  useEffect(() => {
    if (ticketData?.customerReview && !isEditingReview) {
      setReviewRating(ticketData.customerReview.rating || 5);
      setSelectedTags(ticketData.customerReview.tags || []);
      setReviewComment(ticketData.customerReview.comment || '');
    }
  }, [ticketData?.customerReview, isEditingReview]);

  // Fetch ticket details
  const fetchTicket = async (num: string, autoCheckInParam = false) => {
    if (!num.trim()) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await api.getPublicTicket(num.trim().toUpperCase());
      if (res.success && res.ticket) {
        setTicketData(res.ticket);

        // If URL contains checkin=true and ticket hasn't been checked in yet
        if (autoCheckInParam && !res.ticket.isCheckedIn && !hasAutoCheckedInRef.current) {
          hasAutoCheckedInRef.current = true;
          handleCheckIn(res.ticket.ticketNumber, true);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isAmharic ? 'ቲኬት አልተገኘም' : 'Ticket not found.'));
      setTicketData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check URL params on initial mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ticketParam = params.get('ticket') || params.get('t') || params.get('num');
      const isCheckInParam = params.get('checkin') === 'true' || params.get('checkin') === '1' || params.get('auto') === '1';

      if (ticketParam) {
        const clean = ticketParam.trim().toUpperCase();
        setTicketQuery(clean);
        fetchTicket(clean, isCheckInParam);
      } else {
        fetchTicket(ticketQuery, false);
      }
    } catch {
      fetchTicket(ticketQuery, false);
    }
  }, []);

  // Poll active ticket status
  useEffect(() => {
    if (!ticketQuery) return;
    const interval = setInterval(() => {
      fetchTicket(ticketQuery, false);
    }, 4000);
    return () => clearInterval(interval);
  }, [ticketQuery]);

  // Handle Arrival Check-In Action
  const handleCheckIn = async (ticketNum?: string, isAuto = false) => {
    const target = ticketNum || ticketData?.ticketNumber || ticketQuery;
    if (!target) return;

    try {
      setIsCheckingIn(true);
      setErrorMessage('');
      const res = await checkInTicket(target);
      if (res.success) {
        setCheckInSuccessMsg(
          isAmharic
            ? `መገኘትዎ በተሳካ ሁኔታ ተረጋግጧል! (Arrival Confirmed at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
            : `Arrival check-in confirmed! (Recorded at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
        );
        // Refresh ticket
        await fetchTicket(target, false);
        setTimeout(() => setCheckInSuccessMsg(''), 6000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isAmharic ? 'የመገኘት ማረጋገጫ አልተሳካም' : 'Failed to confirm arrival.'));
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Toggle Feedback Tag
  const toggleFeedbackTag = (tagText: string) => {
    setSelectedTags(prev => 
      prev.includes(tagText) 
        ? prev.filter(t => t !== tagText)
        : [...prev, tagText]
    );
  };

  // Submit Customer Review
  const handleSubmitReview = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ticketData) return;

    try {
      setIsSubmittingReview(true);
      setReviewErrorMsg('');
      setReviewSuccessMsg('');

      const res = await api.submitCustomerReview(ticketData.ticketNumber, {
        rating: reviewRating,
        tags: selectedTags,
        comment: reviewComment
      });

      if (res.success) {
        setReviewSuccessMsg(
          isAmharic 
            ? 'አስተያየትዎ እና ደረጃ አሰጣጥዎ በተሳካ ሁኔታ ተመዝግቧል! እናመሰግናለን።' 
            : 'Thank you! Your feedback and rating have been recorded successfully.'
        );
        setIsEditingReview(false);
        // Update local ticketData with submitted review
        setTicketData(prev => prev ? { ...prev, customerReview: res.review } : null);
        setTimeout(() => setReviewSuccessMsg(''), 7000);
      }
    } catch (err: any) {
      setReviewErrorMsg(err.message || (isAmharic ? 'አስተያየት ማስገባት አልተሳካም' : 'Failed to submit review. Please try again.'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Copy check-in link to clipboard
  const handleCopyLink = () => {
    const url = getCheckInUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Download QR Code image
  const handleDownloadQr = () => {
    const svgElement = document.getElementById('customer-qr-code-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `QR-CheckIn-${ticketData?.ticketNumber || 'ticket'}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  // Simulate scanning QR code (for testing without a 2nd phone)
  const handleSimulateScan = () => {
    setIsScanSimulating(true);
    setScanStep('SCANNING');

    setTimeout(() => {
      setScanStep('SUCCESS');
      handleCheckIn(ticketData?.ticketNumber);
      setTimeout(() => {
        setIsScanSimulating(false);
        setScanStep('IDLE');
      }, 1800);
    }, 1200);
  };

  const isCalled = ticketData?.status === 'CALLED' || ticketData?.status === 'SERVING';
  const isCompleted = ticketData?.status === 'COMPLETED';
  const isCheckedIn = Boolean(ticketData?.isCheckedIn);
  const formattedCheckedInTime = ticketData?.checkedInAt 
    ? new Date(ticketData.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const activeDisplayRating = hoverRating || reviewRating;
  const currentRatingDesc = RATING_DESCRIPTIONS[activeDisplayRating] || RATING_DESCRIPTIONS[5];
  const hasExistingReview = Boolean(ticketData?.customerReview);

  // Quick tickets for convenient testing
  const samplePills = ['A-001', 'A-002', 'P-001', 'D-001'];

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header Card */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200 text-center relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-100 font-bold text-lg">
          <Smartphone className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {isAmharic ? (officeSetting?.officeNameAmharic || 'የቀጥታ የወረፋ እና የQR መገኘት ማረጋገጫ') : (officeSetting?.officeName || 'Live Ticket & QR Check-In')}
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          {isAmharic ? 'የቲኬት ቁጥርዎን ይከታተሉ፣ መገኘትዎን ያረጋግጡ እና የአገልግሎት አስተያየትዎን ይስጡ' : 'Track your queue position, check-in with QR, and rate your customer experience'}
        </p>

        {/* Ticket Search Bar */}
        <div className="mt-5 flex items-center bg-slate-50 rounded-2xl p-1.5 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
          <div className="pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="e.g. A-002, P-001"
            value={ticketQuery}
            onChange={(e) => setTicketQuery(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchTicket(ticketQuery)}
            className="w-full bg-transparent px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none uppercase"
          />
          <button
            onClick={() => fetchTicket(ticketQuery)}
            disabled={isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>{isAmharic ? 'ፈልግ' : 'Check'}</span>
          </button>
        </div>

        {/* Quick Sample Selector Pills */}
        <div className="mt-3 flex items-center justify-center flex-wrap gap-1.5 text-xs text-slate-400">
          <span className="text-[11px] font-medium">{isAmharic ? 'ፈጣን ምርጫ:' : 'Quick Select:'}</span>
          {samplePills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => {
                setTicketQuery(pill);
                fetchTicket(pill);
              }}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition cursor-pointer ${
                ticketQuery === pill
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Success Notification Alert */}
      {checkInSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">{isAmharic ? 'መገኘት ተረጋግጧል!' : 'Arrival Confirmed!'}</p>
            <p className="text-emerald-700">{checkInSuccessMsg}</p>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Live Ticket Status Card */}
      {ticketData && (
        <div className={`bg-white rounded-3xl p-6 sm:p-7 shadow-xs border transition-all ${
          isCalled ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-200'
        }`}>
          
          {/* Urgent "Called" Alarm Banner */}
          {isCalled && (
            <div className="mb-6 p-4.5 bg-indigo-600 text-white rounded-2xl text-center space-y-1.5 shadow-lg shadow-indigo-200 animate-pulse">
              <div className="flex items-center justify-center space-x-2 font-black text-base">
                <Bell className="w-5 h-5" />
                <span>{isAmharic ? 'ተራዎ ደርሷል!' : 'YOUR NUMBER IS CALLED!'}</span>
              </div>
              <div className="text-sm font-bold text-indigo-100">
                {isAmharic ? `እባክዎ ወደ መስኮት ${ticketData.counterNumber || 1} ይሂዱ` : `Please proceed to Counter ${ticketData.counterNumber || 1}`}
              </div>
            </div>
          )}

          {/* Ticket Header & Number */}
          <div className="text-center space-y-2 pb-5 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {isAmharic ? 'የእርስዎ ቲኬት ቁጥር' : 'YOUR TICKET NUMBER'}
            </span>
            <div className="text-6xl sm:text-7xl font-black text-slate-900 font-mono tracking-tight">
              {ticketData.ticketNumber}
            </div>

            {ticketData.ticketNumberAmharic && (
              <div className="text-xl font-bold text-slate-400 font-sans italic">
                {ticketData.ticketNumberAmharic}
              </div>
            )}

            <div className="text-base font-bold text-slate-700">
              {isAmharic ? (ticketData.serviceNameAmharic || ticketData.serviceName) : ticketData.serviceName}
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                <span className={`w-2 h-2 rounded-full ${
                  isCompleted 
                    ? 'bg-emerald-500' 
                    : isCalled 
                    ? 'bg-indigo-600 animate-ping' 
                    : 'bg-amber-500'
                }`} />
                <span>{ticketData.status}</span>
              </div>

              {ticketData.priority === 'URGENT' && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-xs animate-pulse">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'አስቸኳይ ተገልጋይ' : 'Urgent Priority'}</span>
                </div>
              )}

              {ticketData.priority === 'PRIORITY' && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-slate-950 rounded-full text-xs font-black uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'ቅድሚያ (VIP)' : 'VIP Priority'}</span>
                </div>
              )}
            </div>

            {ticketData.urgencyReason && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 px-3 py-1 rounded-xl border border-rose-100 inline-block">
                {ticketData.urgencyReason}
              </p>
            )}
          </div>

          {/* Browser Push Notification Banner for Customer */}
          {!isCalled && !isCompleted && (
            <div className="mt-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BellRing className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-indigo-950">
                    {isAmharic ? 'የብሮውዘር ጥሪ ማሳወቂያ' : 'Browser Call Notification'}
                  </p>
                  <p className="text-[11px] text-indigo-700 truncate">
                    {isNotificationsEnabled
                      ? (isAmharic ? 'ነቅቷል፡ ተራዎ ሲደርስ ድምፅና ማሳወቂያ ይደርስዎታል' : 'Active: Instant sound & notification when called')
                      : (isAmharic ? 'ስክሪን ቢያንቀላፉም እንኳ ተራዎ እንዳያመልጥዎት ማሳወቂያ ያንቁ' : 'Get alerted with chime even if tab is minimized')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!isNotificationsEnabled) {
                    const granted = await requestNotificationPermission();
                    if (granted) sendTestNotification();
                  } else {
                    toggleNotifications();
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  isNotificationsEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isNotificationsEnabled ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'ነቅቷል' : 'Enabled'}</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'አንቃ' : 'Enable Alert'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* QR CODE & AUTOMATIC ARRIVAL CHECK-IN SECTION */}
          {/* ========================================================= */}
          <div className="my-6 p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
            
            {/* Arrival Status Banner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isAmharic ? 'የመገኘት ማረጋገጫ (Arrival Check-In)' : 'Arrival QR Pass & Check-In'}
                </h3>
              </div>

              {/* Status Badge */}
              {isCheckedIn ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full animate-in zoom-in-95">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAmharic ? 'ተገኝተዋል' : 'Checked-In'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mr-1" />
                  <span>{isAmharic ? 'መገኘት አልተረጋገጠም' : 'Pending Check-In'}</span>
                </span>
              )}
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              
              {/* QR Code Graphic */}
              <div className="relative group p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                <QRCodeSVG
                  id="customer-qr-code-svg"
                  value={getCheckInUrl(ticketData.ticketNumber)}
                  size={140}
                  level="H"
                  includeMargin={true}
                  className="rounded-lg"
                />
                
                {/* Expand Overlay Button */}
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-1 text-xs font-bold cursor-pointer"
                >
                  <Maximize2 className="w-5 h-5" />
                  <span>{isAmharic ? 'አጉላ' : 'Enlarge'}</span>
                </button>
              </div>

              {/* QR Explanation & Actions */}
              <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {isCheckedIn 
                      ? (isAmharic ? '✓ መገኘትዎ ተረጋግጧል' : '✓ Presence Confirmed') 
                      : (isAmharic ? 'ለመገኘት ማረጋገጫ ይህን QR ይቃኙ' : 'Scan to check-in automatically')}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                    {isCheckedIn
                      ? (isAmharic 
                          ? `በ ${formattedCheckedInTime || 'ዛሬ'} መገኘትዎ ተመዝግቧል። ወደ ቢሮው መጥተው መጠበቅ ይችላሉ።` 
                          : `Recorded at ${formattedCheckedInTime || 'today'}. You are queued in the lobby.`)
                      : (isAmharic 
                          ? 'የሞባይል ካሜራዎን በመጠቀም ይህን QR ኮድ ሲቃኙ ወደ ቢሮው መምጣትዎን ያረጋግጣል።' 
                          : 'Point any phone camera at this QR code to automatically confirm your arrival in the lobby.')}
                  </p>
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {!isCheckedIn ? (
                    <button
                      type="button"
                      onClick={() => handleCheckIn(ticketData.ticketNumber)}
                      disabled={isCheckingIn}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isCheckingIn ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{isAmharic ? 'መገኘቴን አረጋግጥ (Check-In)' : 'Confirm My Arrival Now'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isAmharic ? 'በመጠባበቂያ አዳራሽ ተመዝግበዋል' : 'Lobby Arrival Confirmed'}</span>
                    </div>
                  )}

                  {/* Simulate Scan Button */}
                  <button
                    type="button"
                    onClick={handleSimulateScan}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    title="Simulate smartphone camera scan"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isAmharic ? 'ስካን መሞከሪያ' : 'Test Scanner'}</span>
                  </button>

                  {/* Copy Link Button */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    title={isAmharic ? 'ሊንክ ቅዳ' : 'Copy Check-In Link'}
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Download QR */}
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    title={isAmharic ? 'QR ኮድ አውርድ' : 'Download QR Code'}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid: People Ahead & Estimated Wait */}
          <div className="grid grid-cols-2 gap-3 py-4 border-b border-slate-100">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
              <div className="text-slate-400 text-xs flex items-center justify-center space-x-1 mb-1 font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'ከፊትዎ ያሉ' : 'Ahead'}</span>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                {ticketData.peopleAhead ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {isAmharic ? `${AmharicLib.numbers.toGeez(ticketData.peopleAhead || 0)} ደንበኞች` : 'Customers'}
              </div>
            </div>

            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-center">
              <div className="text-indigo-700 text-xs flex items-center justify-center space-x-1 mb-1 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'ግምታዊ ጊዜ' : 'Est. Wait'}</span>
              </div>
              <div className="text-3xl font-black text-indigo-900 font-mono">
                ~{ticketData.estimatedWaitMinutes ?? 0}
              </div>
              <div className="text-[11px] text-indigo-600 font-medium">
                {isAmharic ? `~${AmharicLib.numbers.toGeez(ticketData.estimatedWaitMinutes || 0)} ደቂቃ` : 'Minutes'}
              </div>
            </div>
          </div>

          {/* Currently Serving in Service */}
          <div className="pt-4 flex items-center justify-between text-xs text-slate-600">
            <span>{isAmharic ? 'አሁን በመስተናገድ ላይ:' : 'Currently Serving:'}</span>
            <span className="font-bold font-mono text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
              {ticketData.currentlyServingTicketNumber || 'None'}
            </span>
          </div>

          {/* Privacy Guarantee */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-center text-slate-400 flex items-center justify-center space-x-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>{isAmharic ? 'ምንም አይነት የግል መረጃ አይጠየቅም • 100% ደህንነቱ የተጠበቀ' : '100% Anonymous • Zero PII stored'}</span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CUSTOMER REVIEW & SATISFACTION RATING CARD */}
      {/* ========================================================= */}
      {ticketData && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200 space-y-5 animate-in fade-in slide-in-from-bottom-2">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <MessageCircleHeart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isAmharic ? 'የደንበኛ እርካታ እና አስተያየት' : 'Rate Your Service Experience'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isAmharic ? 'አገልግሎታችንን ለማሻሻል ደረጃ እና አስተያየትዎን ያጋሩን' : 'Help us improve by sharing your quick feedback and star rating'}
                </p>
              </div>
            </div>

            {hasExistingReview && !isEditingReview && (
              <button
                type="button"
                onClick={() => setIsEditingReview(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'አስተካክል' : 'Edit'}</span>
              </button>
            )}
          </div>

          {/* Review Success Alert */}
          {reviewSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-start space-x-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">{isAmharic ? 'እናመሰግናለን!' : 'Thank You!'}</p>
                <p className="text-emerald-700">{reviewSuccessMsg}</p>
              </div>
            </div>
          )}

          {/* Review Error Alert */}
          {reviewErrorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="font-medium">{reviewErrorMsg}</span>
            </div>
          )}

          {/* If already submitted and not editing: show existing summary */}
          {hasExistingReview && !isEditingReview ? (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                
                {/* Rating stars display */}
                <div className="flex items-center space-x-1.5">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= (ticketData.customerReview?.rating || 5);
                    return (
                      <Star
                        key={starVal}
                        className={`w-6 h-6 ${
                          isFilled 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-slate-300'
                        }`}
                      />
                    );
                  })}
                  <span className="font-bold text-slate-800 text-sm ml-2 font-mono">
                    {ticketData.customerReview?.rating}/5
                  </span>
                </div>

                {/* Rating category badge */}
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border self-start sm:self-auto ${
                  currentRatingDesc.badgeColor
                }`}>
                  {isAmharic ? currentRatingDesc.am : currentRatingDesc.en}
                </span>
              </div>

              {/* Selected Tags */}
              {ticketData.customerReview?.tags && ticketData.customerReview.tags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isAmharic ? 'የተመረጡ ማጠቃለያዎች:' : 'Selected Feedback Tags:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ticketData.customerReview.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-xl shadow-2xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Written comment */}
              {ticketData.customerReview?.comment && (
                <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{isAmharic ? 'የእርስዎ አስተያየት:' : 'Your Written Comment:'}</span>
                  </div>
                  <p className="italic text-slate-800 leading-relaxed font-sans">
                    "{ticketData.customerReview.comment}"
                  </p>
                </div>
              )}

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                <span>
                  {isAmharic ? 'የተመዘገበበት ቀን:' : 'Submitted on:'}{' '}
                  {ticketData.customerReview?.createdAt 
                    ? new Date(ticketData.customerReview.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Recently'}
                </span>
                <span className="text-emerald-600 font-bold flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>{isAmharic ? 'የጸደቀ አስተያየት' : 'Verified Review'}</span>
                </span>
              </div>
            </div>
          ) : (
            /* Interactive Review Form */
            <form onSubmit={handleSubmitReview} className="space-y-5">
              
              {/* Star Rating Selector */}
              <div className="text-center space-y-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <label className="text-xs font-bold text-slate-700 block">
                  {isAmharic ? 'አገልግሎታችንን እንዴት ይገመግሙታል? (ኮከብ ይምረጡ)' : 'How would you rate our office service today?'}
                </label>

                {/* Stars Grid */}
                <div className="flex items-center justify-center space-x-2 py-1">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= activeDisplayRating;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setReviewRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-2 transition-transform hover:scale-125 active:scale-95 focus:outline-none cursor-pointer rounded-xl"
                        aria-label={`Rate ${starVal} stars`}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            isFilled 
                              ? 'text-amber-400 fill-amber-400 drop-shadow-xs' 
                              : 'text-slate-300 hover:text-amber-200'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Score Description Pill */}
                <div className="inline-block">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                    currentRatingDesc.badgeColor
                  }`}>
                    {activeDisplayRating} / 5 — {isAmharic ? currentRatingDesc.am : currentRatingDesc.en}
                  </span>
                </div>
              </div>

              {/* Quick Feedback Tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {isAmharic ? 'ፈጣን ማጠቃለያ ምረጡ (አንድ ወይም ከዚያ በላይ)' : 'What went well / needs improvement? (Select tags)'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_TAGS.map((tag) => {
                    const tagLabel = isAmharic ? tag.am : tag.en;
                    const isSelected = selectedTags.includes(tagLabel);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleFeedbackTag(tagLabel)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1.5 ${
                          isSelected
                            ? tag.isPositive
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102'
                              : 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{tagLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Written Comments */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isAmharic ? 'ተጨማሪ አስተያየት ወይም ሀሳብ (አማራጭ)' : 'Additional Comments or Suggestions (Optional)'}</span>
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    isAmharic
                      ? 'የተሰማዎትን ተጨማሪ አስተያየት እዚህ ይጻፉ...'
                      : 'Share any additional thoughts to help us serve you better...'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition resize-none font-sans"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-100 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReview ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isAmharic ? 'በመመዝገብ ላይ...' : 'Submitting Feedback...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isAmharic ? 'አስተያየቴን አስገባ' : 'Submit My Review'}</span>
                    </>
                  )}
                </button>

                {hasExistingReview && isEditingReview && (
                  <button
                    type="button"
                    onClick={() => setIsEditingReview(false)}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
                  >
                    {isAmharic ? 'ተመለስ' : 'Cancel'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* FULLSCREEN / ENLARGED QR PASS MODAL */}
      {/* ========================================================= */}
      {isQrModalOpen && ticketData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isAmharic ? 'የመገኘት ማረጋገጫ QR ኮድ' : 'Arrival Check-In QR Pass'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black font-mono text-slate-900">
                {ticketData.ticketNumber}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {isAmharic ? (ticketData.serviceNameAmharic || ticketData.serviceName) : ticketData.serviceName}
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-indigo-200 inline-block shadow-inner">
              <QRCodeSVG
                value={getCheckInUrl(ticketData.ticketNumber)}
                size={220}
                level="H"
                includeMargin={true}
                className="mx-auto"
              />
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {isAmharic 
                ? 'በመስተንግዶ ጠረጴዛው ላይ ወይም በሞባይልዎ ስካን በማድረግ መገኘትዎን ያረጋግጡ።' 
                : 'Present this QR pass to the kiosk scanner or scan with your phone to confirm your arrival.'}
            </p>

            <div className="flex justify-center space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleCheckIn(ticketData.ticketNumber)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                {isAmharic ? 'መገኘቴን አረጋግጥ' : 'Confirm Check-In'}
              </button>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {isAmharic ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCAN SIMULATOR MODAL (Interactive Camera Scanner Simulator) */}
      {/* ========================================================= */}
      {isScanSimulating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-950 text-white rounded-3xl p-6 max-w-sm w-full text-center space-y-5 border border-slate-800 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-center space-x-2 text-indigo-400">
              <Camera className="w-5 h-5" />
              <h3 className="text-sm font-bold tracking-wide">
                {isAmharic ? 'ካሜራ ስካነር መሞከሪያ' : 'Live Camera QR Scanner'}
              </h3>
            </div>

            {/* Camera Viewfinder Box */}
            <div className="relative w-48 h-48 mx-auto bg-slate-900 rounded-2xl border-2 border-indigo-500 overflow-hidden flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />

              {/* Scanning Red Laser Line */}
              {scanStep === 'SCANNING' && (
                <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] animate-bounce" />
              )}

              {scanStep === 'SUCCESS' ? (
                <div className="flex flex-col items-center space-y-2 text-emerald-400 animate-in zoom-in">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isAmharic ? 'ስካን ተደርጓል!' : 'Scanned!'}
                  </span>
                </div>
              ) : (
                <div className="opacity-40 scale-75">
                  <QRCodeSVG value={getCheckInUrl(ticketData?.ticketNumber)} size={120} />
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 font-medium">
              {scanStep === 'SCANNING'
                ? (isAmharic ? 'የ QR ኮድ በመፈለግ ላይ...' : 'Detecting Arrival Check-In QR payload...')
                : (isAmharic ? 'መገኘትዎ ተረጋግጧል!' : 'Arrival confirmed successfully!')}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
