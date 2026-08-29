import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  PhoneCall, 
  Play, 
  CheckCircle2, 
  UserX, 
  ArrowRightLeft, 
  Clock, 
  Timer, 
  AlertCircle, 
  Users, 
  Volume2, 
  Tv, 
  CheckCircle, 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldAlert,
  Flame,
  Zap,
  Edit3,
  X,
  Check,
  FileText,
  Keyboard
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Service, QueueTicket, PriorityLevel } from '../types';

export const OfficerStationView: React.FC = () => {
  const { user, login, logout, hasPermission, isLoading: isAuthLoading } = useAuth();
  const { 
    counters, 
    waitingTickets, 
    servingTickets, 
    services,
    stats,
    callNextTicket, 
    recallTicket, 
    startService, 
    completeTicket, 
    markNoShow, 
    transferTicket,
    updateTicketPriority,
    uiLanguage 
  } = useQueue();

  const isAmharic = uiLanguage === 'AMHARIC';
  const isAuthorized = user && (user.role === 'ADMIN' || user.role === 'SERVICE_OFFICER' || hasPermission('ticket.call'));
  const isOfficer = user?.role === 'SERVICE_OFFICER';
  const assignedCounterId = user?.assignedCounterId;

  // Local login state for station login gate
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState<boolean>(false);

  // Forgot password state for station
  const [stationAuthMode, setStationAuthMode] = useState<'LOGIN' | 'FORGOT_REQUEST' | 'FORGOT_VERIFY'>('LOGIN');
  const [forgotUsername, setForgotUsername] = useState<string>('');
  const [forgotCode, setForgotCode] = useState<string>('');
  const [generatedNotice, setGeneratedNotice] = useState<string>('');
  const [officerNewPassword, setOfficerNewPassword] = useState<string>('');
  const [officerConfirmPassword, setOfficerConfirmPassword] = useState<string>('');
  const [showOfficerNewPassword, setShowOfficerNewPassword] = useState<boolean>(false);
  const [isProcessingForgot, setIsProcessingForgot] = useState<boolean>(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string>('');

  // Initialize counter from assigned counter if officer, or first counter
  const [selectedCounterId, setSelectedCounterId] = useState<string>(assignedCounterId || '');
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferTargetServiceId, setTransferTargetServiceId] = useState<string>('');
  const [serviceTimerSeconds, setServiceTimerSeconds] = useState<number>(0);
  const [stationNotice, setStationNotice] = useState<string>('');

  // Priority triage state for officer station
  const [officerTriageTicket, setOfficerTriageTicket] = useState<QueueTicket | null>(null);
  const [officerTriagePriority, setOfficerTriagePriority] = useState<PriorityLevel>('URGENT');
  const [officerTriageReason, setOfficerTriageReason] = useState<string>('');
  const [officerTriageNotes, setOfficerTriageNotes] = useState<string>('');
  const [isOfficerUpdatingPriority, setIsOfficerUpdatingPriority] = useState<boolean>(false);

  // Keep officer locked to assigned counter whenever user or counters change
  useEffect(() => {
    if (isOfficer && assignedCounterId) {
      if (selectedCounterId !== assignedCounterId) {
        setSelectedCounterId(assignedCounterId);
      }
    } else if (!selectedCounterId && counters.length > 0) {
      setSelectedCounterId(counters[0].id);
    }
  }, [counters, user, isOfficer, assignedCounterId, selectedCounterId]);

  const activeCounter = counters.find(c => c.id === selectedCounterId);

  // Find currently active ticket at this counter
  const currentTicket = servingTickets.find(t => 
    (t.counterId === selectedCounterId || t.counterNumber === activeCounter?.number)
  );

  // Live timer for active ticket service duration
  useEffect(() => {
    let interval: any = null;
    if (currentTicket) {
      const startTime = new Date(currentTicket.serviceStartedAt || currentTicket.calledAt || currentTicket.issuedAt).getTime();
      const updateTimer = () => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        setServiceTimerSeconds(Math.max(0, diff));
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setServiceTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentTicket]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Priority-sorted queue: URGENT (score 3) > PRIORITY (score 2) > NORMAL (score 1), then issuedAt
  const sortedWaitingTickets = [...waitingTickets].sort((a, b) => {
    const scoreA = a.priority === 'URGENT' ? 3 : a.priority === 'PRIORITY' ? 2 : 1;
    const scoreB = b.priority === 'URGENT' ? 3 : b.priority === 'PRIORITY' ? 2 : 1;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
  });

  // Eligible tickets for active counter
  const eligibleTickets = sortedWaitingTickets.filter(t => {
    if (!activeCounter?.serviceIds || activeCounter.serviceIds.length === 0) return true;
    return activeCounter.serviceIds.includes(t.serviceId);
  });

  const nextEligibleTicket = eligibleTickets[0];
  const hasUrgentWaiting = eligibleTickets.some(t => t.priority === 'URGENT');

  const hasPriorityPermission = user?.role === 'ADMIN';

  const handleOpenOfficerTriage = (ticket: QueueTicket) => {
    if (!hasPriorityPermission) {
      setStationNotice(
        isAmharic 
          ? 'የቅድሚያ ደረጃ ለመቀየር የአስተዳዳሪ (Admin) ፈቃድ ያስፈልጋል።' 
          : 'Access denied: Ticket priority must be issued or modified by an Administrator.'
      );
      setTimeout(() => setStationNotice(''), 4000);
      return;
    }
    setOfficerTriageTicket(ticket);
    setOfficerTriagePriority(ticket.priority || 'URGENT');
    setOfficerTriageReason(ticket.urgencyReason || '');
    setOfficerTriageNotes(ticket.notes || '');
  };

  const handleSaveOfficerTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerTriageTicket) return;
    try {
      setIsOfficerUpdatingPriority(true);
      await updateTicketPriority(
        officerTriageTicket.id,
        officerTriagePriority,
        officerTriageReason || undefined,
        officerTriageNotes || undefined
      );
      setStationNotice(
        isAmharic 
          ? `የቲኬት ${officerTriageTicket.ticketNumber} ቅድሚያ ወደ ${officerTriagePriority} ተቀይሯል` 
          : `Ticket ${officerTriageTicket.ticketNumber} priority updated to ${officerTriagePriority}`
      );
      setTimeout(() => setStationNotice(''), 4000);
      setOfficerTriageTicket(null);
    } catch (err: any) {
      setStationNotice(err.message || 'Failed to update priority');
      setTimeout(() => setStationNotice(''), 5000);
    } finally {
      setIsOfficerUpdatingPriority(false);
    }
  };

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingLogin(true);
      setLoginError('');
      setForgotSuccessMessage('');
      await login(loginUsername, loginPassword);
    } catch (err: any) {
      setLoginError(err.message || (isAmharic ? 'የመግቢያ መረጃ የተሳሳተ ነው። እባክዎ እንደገና ይሞክሩ።' : 'Login failed. Please check credentials.'));
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleStationRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername.trim()) {
      setLoginError(isAmharic ? 'እባክዎ የተጠቃሚ ስም ያስገቡ' : 'Please enter your username');
      return;
    }
    try {
      setIsProcessingForgot(true);
      setLoginError('');
      setForgotSuccessMessage('');
      const res = await api.forgotPassword({ username: forgotUsername.trim() });
      if (res.success) {
        if (res.resetCode) {
          setForgotCode(res.resetCode);
          setGeneratedNotice(res.resetCode);
        }
        setForgotSuccessMessage(
          isAmharic 
            ? `የ6-አሃዝ ማረጋገጫ ኮድ ተፈጥሯል (ለ${res.expiresInMinutes || 15} ደቂቃ የሚሰራ)`
            : `6-digit reset code generated (valid for ${res.expiresInMinutes || 15} minutes).`
        );
        setStationAuthMode('FORGOT_VERIFY');
      }
    } catch (err: any) {
      setLoginError(err.message || (isAmharic ? 'ኮድ መጠየቅ አልተሳካም' : 'Failed to request reset code'));
    } finally {
      setIsProcessingForgot(false);
    }
  };

  const handleStationResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCode.trim()) {
      setLoginError(isAmharic ? 'እባክዎ የ6-አሃዝ ማረጋገጫ ኮድ ያስገቡ' : 'Please enter the 6-digit reset code');
      return;
    }
    if (officerNewPassword.length < 6) {
      setLoginError(isAmharic ? 'አዲሱ የይለፍ ቃል ቢያንስ 6 ፊደላት/ቁጥሮች መሆን አለበት' : 'New password must be at least 6 characters');
      return;
    }
    if (officerNewPassword !== officerConfirmPassword) {
      setLoginError(isAmharic ? 'የይለፍ ቃሎቹ አይመሳሰሉም' : 'Passwords do not match');
      return;
    }
    try {
      setIsProcessingForgot(true);
      setLoginError('');
      setForgotSuccessMessage('');
      const res = await api.resetPassword({
        username: forgotUsername.trim(),
        resetCode: forgotCode.trim(),
        newPassword: officerNewPassword
      });
      if (res.success) {
        setForgotSuccessMessage(
          isAmharic 
            ? 'የይለፍ ቃልዎ ተቀይሯል! አሁን በአዲሱ የይለፍ ቃል መግባት ይችላሉ።'
            : 'Password successfully updated! You can now sign in.'
        );
        setLoginUsername(forgotUsername.trim());
        setLoginPassword(officerNewPassword);
        setForgotCode('');
        setOfficerNewPassword('');
        setOfficerConfirmPassword('');
        setGeneratedNotice('');
        setStationAuthMode('LOGIN');
      }
    } catch (err: any) {
      setLoginError(err.message || (isAmharic ? 'የይለፍ ቃል መቀየር አልተሳካም' : 'Failed to reset password'));
    } finally {
      setIsProcessingForgot(false);
    }
  };

  // Actions
  const handleCallNext = async (specificTicketId?: string) => {
    if (!user) {
      setStationNotice(isAmharic ? 'ቲኬት ለመጥራት እባክዎ መጀመሪያ ይግቡ።' : 'Authentication required. Please sign in to call tickets.');
      return;
    }
    if (!isAuthorized) {
      setStationNotice(isAmharic ? 'ይቅርታ፡ ቲኬት የመጥራት ፈቃድ የለዎትም።' : 'Access denied: You do not have permission to call tickets.');
      return;
    }
    if (!selectedCounterId) return;
    try {
      setIsCalling(true);
      setStationNotice('');
      const res = await callNextTicket(selectedCounterId, specificTicketId);
      if (!res.success && res.message) {
        setStationNotice(res.message);
        setTimeout(() => setStationNotice(''), 4000);
      }
    } catch (err: any) {
      setStationNotice(err.message || 'Failed to call next ticket');
      setTimeout(() => setStationNotice(''), 5000);
    } finally {
      setIsCalling(false);
    }
  };

  const handleRecall = async () => {
    if (!currentTicket) return;
    try {
      await recallTicket(currentTicket.id);
    } catch (err: any) {
      setStationNotice(err.message || 'Failed to recall ticket');
      setTimeout(() => setStationNotice(''), 5000);
    }
  };

  const handleStart = async () => {
    if (!currentTicket) return;
    try {
      await startService(currentTicket.id);
    } catch (err: any) {
      setStationNotice(err.message || 'Failed to start service');
      setTimeout(() => setStationNotice(''), 5000);
    }
  };

  const handleComplete = async () => {
    if (!currentTicket) return;
    try {
      await completeTicket(currentTicket.id);
    } catch (err: any) {
      setStationNotice(err.message || 'Failed to complete ticket');
      setTimeout(() => setStationNotice(''), 5000);
    }
  };

  const handleNoShow = async () => {
    if (!currentTicket) return;
    if (confirm(isAmharic ? 'ደንበኛው አልቀረበም ተብሎ ይመዝገብ?' : 'Mark customer as No-Show?')) {
      try {
        await markNoShow(currentTicket.id);
      } catch (err: any) {
        setStationNotice(err.message || 'Failed to mark no-show');
        setTimeout(() => setStationNotice(''), 5000);
      }
    }
  };

  const handleTransfer = async () => {
    if (!currentTicket || !transferTargetServiceId) return;
    try {
      await transferTicket(currentTicket.id, transferTargetServiceId);
      setShowTransferModal(false);
      setTransferTargetServiceId('');
    } catch (err: any) {
      setStationNotice(err.message || 'Failed to transfer ticket');
      setTimeout(() => setStationNotice(''), 5000);
    }
  };

  // Global keyboard shortcuts for staff: N (Next), C (Complete), R (Re-announce / Recall), A (Mark Absent / No Show)
  useEffect(() => {
    if (!user || !isAuthorized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept browser system combinations like Ctrl+C (Copy), Ctrl+A (Select All), Ctrl+R (Reload), Ctrl+N (New window) or Meta/Cmd
      if (e.ctrlKey || e.metaKey) return;

      // Check if user is actively interacting with form inputs/modals or editable content
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        (activeEl as HTMLElement).isContentEditable
      );

      if (isTyping) return;
      if (officerTriageTicket || showTransferModal) return;

      const key = e.key.toLowerCase();
      const code = e.code;

      // N or Alt+N -> Call Next Ticket
      if (key === 'n' || code === 'KeyN') {
        e.preventDefault();
        e.stopPropagation();
        if (!isCalling) {
          handleCallNext();
        }
      } 
      // C or Alt+C -> Complete Active Ticket
      else if (key === 'c' || code === 'KeyC') {
        e.preventDefault();
        e.stopPropagation();
        if (currentTicket) {
          handleComplete();
        }
      }
      // R or Alt+R -> Re-announce / Recall Ticket
      else if (key === 'r' || code === 'KeyR') {
        e.preventDefault();
        e.stopPropagation();
        if (currentTicket) {
          handleRecall();
        }
      }
      // A or Alt+A -> Mark Absent / No Show
      else if (key === 'a' || code === 'KeyA') {
        e.preventDefault();
        e.stopPropagation();
        if (currentTicket) {
          handleNoShow();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, isAuthorized, isCalling, selectedCounterId, currentTicket, nextEligibleTicket, isAmharic, officerTriageTicket, showTransferModal]);

  // 1. Unauthenticated Gate: User must sign in first
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-200">
              {stationAuthMode === 'LOGIN' ? <Lock className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stationAuthMode === 'LOGIN' && (isAmharic ? 'የአገልግሎት ሰጪ ጣቢያ መግቢያ' : 'Officer Station Authentication')}
              {stationAuthMode === 'FORGOT_REQUEST' && (isAmharic ? 'የይለፍ ቃል መልሶ ማግኛ' : 'Reset Station Password')}
              {stationAuthMode === 'FORGOT_VERIFY' && (isAmharic ? 'አዲስ የይለፍ ቃል ማዘጋጃ' : 'Set New Officer Password')}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              {stationAuthMode === 'LOGIN' && (isAmharic 
                ? 'ቲኬቶችን ለመጥራት፣ ወረፋዎችን ለማስተዳደር እና የድምፅ ማስታወቂያዎችን ለማሰማት የተፈቀደላቸው አገልግሎት ሰጪዎች እና አስተዳዳሪዎች ብቻ ናቸው የሚችሉት።' 
                : 'Only authorized and authenticated Service Officers and Administrators are permitted to call tickets, operate counter queues, and broadcast announcements.')}
              {stationAuthMode === 'FORGOT_REQUEST' && (isAmharic
                ? 'የማረጋገጫ ኮድ ለመቀበል የአገልግሎት ሰጪ መለያ የተጠቃሚ ስምዎን ያስገቡ።'
                : 'Enter your officer username to receive a 6-digit verification reset code.')}
              {stationAuthMode === 'FORGOT_VERIFY' && (isAmharic
                ? 'የተላከውን 6-አሃዝ ኮድ እና አዲሱን የይለፍ ቃል ያስገቡ።'
                : 'Enter the verification code and your new password to restore access.')}
            </p>
          </div>

          {loginError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold flex items-center space-x-2 max-w-md mx-auto animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{loginError}</span>
            </div>
          )}

          {forgotSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center space-x-2 max-w-md mx-auto animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{forgotSuccessMessage}</span>
            </div>
          )}

          {/* MODE 1: Standard Credentials Form */}
          {stationAuthMode === 'LOGIN' && (
            <div className="max-w-md mx-auto">
              <p className="text-[11px] font-bold text-slate-500 text-center uppercase tracking-wider mb-4">
                {isAmharic ? 'የተጠቃሚ ስም እና የይለፍ ቃል ያስገቡ' : 'Sign In with Authorized Credentials'}
              </p>
              <form onSubmit={handleInlineLogin} className="space-y-3">
                <input
                  type="text"
                  placeholder={isAmharic ? 'የተጠቃሚ ስም (e.g. officer1)' : 'Username (e.g. officer1)'}
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <div>
                  <input
                    type="password"
                    placeholder={isAmharic ? 'የይለፍ ቃል (Password)' : 'Password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginError('');
                        setForgotSuccessMessage('');
                        setForgotUsername(loginUsername);
                        setStationAuthMode('FORGOT_REQUEST');
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    >
                      {isAmharic ? 'የይለፍ ቃል ረሱ?' : 'Forgot password?'}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  {isSubmittingLogin ? (isAmharic ? 'በመግባት ላይ...' : 'Signing In...') : (isAmharic ? 'ግባ' : 'Sign In to Station')}
                </button>
              </form>
            </div>
          )}

          {/* MODE 2: Request Reset Code */}
          {stationAuthMode === 'FORGOT_REQUEST' && (
            <div className="max-w-md mx-auto">
              <form onSubmit={handleStationRequestResetCode} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAmharic ? 'የተጠቃሚ ስም (Username)' : 'Officer Username'}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. officer1 or admin"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessingForgot}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center space-x-1.5"
                >
                  <span>{isProcessingForgot ? (isAmharic ? 'ኮድ በመፍጠር ላይ...' : 'Generating Code...') : (isAmharic ? 'የማረጋገጫ ኮድ ላክ' : 'Get Verification Code')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginError('');
                    setForgotSuccessMessage('');
                    setStationAuthMode('LOGIN');
                  }}
                  className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'ወደ መግቢያ ተመለስ' : 'Back to Sign In'}</span>
                </button>
              </form>
            </div>
          )}

          {/* MODE 3: Verify Code & Update Password */}
          {stationAuthMode === 'FORGOT_VERIFY' && (
            <div className="max-w-md mx-auto">
              <form onSubmit={handleStationResetPassword} className="space-y-3">
                {generatedNotice && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-center space-y-1">
                    <span className="text-[11px] font-bold text-indigo-900">{isAmharic ? 'የማረጋገጫ ኮድዎ:' : 'Reset Verification Code:'}</span>
                    <div className="text-xl font-mono font-black text-indigo-700 tracking-widest">{generatedNotice}</div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAmharic ? 'የ6-አሃዝ ማረጋገጫ ኮድ' : '6-Digit Reset Code'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 text-sm font-mono font-bold tracking-widest text-center bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAmharic ? 'አዲስ የይለፍ ቃል' : 'New Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showOfficerNewPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 6 characters"
                      value={officerNewPassword}
                      onChange={(e) => setOfficerNewPassword(e.target.value)}
                      className="w-full px-4 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOfficerNewPassword(!showOfficerNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showOfficerNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAmharic ? 'አዲሱን የይለፍ ቃል ያረጋግጡ' : 'Confirm New Password'}
                  </label>
                  <input
                    type={showOfficerNewPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={officerConfirmPassword}
                    onChange={(e) => setOfficerConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessingForgot}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center space-x-1.5"
                >
                  <span>{isProcessingForgot ? (isAmharic ? 'በመቀየር ላይ...' : 'Updating...') : (isAmharic ? 'የይለፍ ቃል ቀይር' : 'Update Password')}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <div className="flex justify-between items-center text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setStationAuthMode('FORGOT_REQUEST')}
                    className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    {isAmharic ? 'አዲስ ኮድ ጠይቅ' : 'Request new code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginError('');
                      setForgotSuccessMessage('');
                      setStationAuthMode('LOGIN');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    {isAmharic ? 'ወደ መግቢያ ተመለስ' : 'Back to Sign In'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Unauthorized Role Gate: User is authenticated, but not authorized for ticket.call
  if (!isAuthorized) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isAmharic ? 'ይቅርታ፡ ቲኬት የመጥራት ፈቃድ የለዎትም' : 'Access Restricted: Unauthorized Account'}
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
              {isAmharic 
                ? `በአሁኑ ሰዓት እንደ "${user.name}" (${user.role}) ገብተዋል። ይህ ሚና ደንበኞችን የመጥራት ፈቃድ የለውም። እባክዎ እንደ አገልግሎት ሰጪ ወይም አስተዳዳሪ ይግቡ።`
                : `You are signed in as "${user.name}" with the role "${user.role}". Calling and serving tickets is exclusively permitted for Service Officers and Administrators.`}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto space-y-3">
            <p className="text-xs font-medium text-slate-600 text-center">
              {isAmharic ? 'ወደ አገልግሎት ሰጪ መለያ ለመግባት እባክዎ መጀመሪያ ይውጡ:' : 'To sign in with an authorized officer account, please log out:'}
            </p>
            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {isAmharic ? 'ውጣና እንደገና ግባ (Log Out)' : 'Log Out Current Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Header Bar with Counter Selector or Locked Counter Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isAmharic ? 'የአገልግሎት ሰጪ ጣቢያ' : 'Service Officer Station'}
              </h1>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs text-slate-600 font-bold">
                  {user ? user.name : (isAmharic ? 'አገልግሎት ሰጪ' : 'Counter Officer')}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 uppercase">
                  {user?.role || 'OFFICER'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Keyboard Shortcuts Reference Pill */}
          <div className="inline-flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl text-[11px] text-slate-600">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isAmharic ? 'አቋራጮች:' : 'Shortcuts:'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono font-bold text-slate-800 shadow-2xs">N</kbd>
              <span className="text-slate-600">{isAmharic ? 'ቀጣይ' : 'Next'}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono font-bold text-slate-800 shadow-2xs">C</kbd>
              <span className="text-slate-600">{isAmharic ? 'ጨርስ' : 'Complete'}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono font-bold text-slate-800 shadow-2xs">R</kbd>
              <span className="text-slate-600">{isAmharic ? 'ድገም' : 'Re-announce'}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono font-bold text-slate-800 shadow-2xs">A</kbd>
              <span className="text-slate-600">{isAmharic ? 'አልቀረበም' : 'Absent'}</span>
            </span>
          </div>
        </div>

        {/* Counter Station Control Area */}
        {isOfficer && assignedCounterId ? (
          // LOCKED STATION BADGE FOR OFFICERS WITH ASSIGNED COUNTER
          <div className="flex items-center space-x-3 bg-indigo-50/90 border border-indigo-200 px-4 py-2.5 rounded-xl shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600">
                  {isAmharic ? 'የተመደበ መስኮት (የተገደበ)' : 'Assigned Station (Limited Access)'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-sm font-black text-slate-900 font-mono">
                {isAmharic ? `መስኮት ${activeCounter?.number || 1}` : `COUNTER ${activeCounter?.number || 1}`}
                <span className="font-sans font-medium text-slate-500 text-xs ml-1.5">
                  ({activeCounter?.name || `Counter ${activeCounter?.number}`})
                </span>
              </p>
            </div>
          </div>
        ) : (
          // SUPERVISOR / UNRESTRICTED COUNTER SELECTOR
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isAmharic ? 'መስኮት ምረጥ:' : 'Select Station:'}
            </span>
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex-wrap">
              {counters.map((c) => {
                const active = c.id === selectedCounterId;
                return (
                  <button
                    key={c.id}
                    id={`btn-select-counter-${c.number}`}
                    onClick={() => setSelectedCounterId(c.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {isAmharic ? `መስኮት ${c.number}` : `COUNTER ${c.number}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Notice Banner */}
      {stationNotice && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{stationNotice}</span>
        </div>
      )}

      {/* Urgent Ticket Ready Alert */}
      {nextEligibleTicket && nextEligibleTicket.priority === 'URGENT' && (
        <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shadow-xs animate-pulse shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                  {isAmharic ? '⚡ አስቸኳይ ተገልጋይ በቀጣይነት ተዘጋጅቷል' : '⚡ URGENT TICKET IN QUEUE'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 font-mono font-black text-xs">
                  {nextEligibleTicket.ticketNumber}
                </span>
              </div>
              <p className="text-xs text-rose-800 font-medium mt-0.5">
                {nextEligibleTicket.urgencyReason 
                  ? `${isAmharic ? 'የአስቸኳይ ምክንያት:' : 'Urgency reason:'} ${nextEligibleTicket.urgencyReason}` 
                  : (isAmharic ? 'በመስተንግዶ ክፍል አስቸኳይ ቅድሚያ ተሰጥቶታል' : 'Urgent priority flagged by reception')}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleCallNext(nextEligibleTicket.id)}
            disabled={isCalling}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{isAmharic ? 'አስቸኳዩን አሁኑኑ ጥራ' : 'Call Urgent Ticket Now'}</span>
          </button>
        </div>
      )}

      {/* Main Grid: Officer Station Left & Live Preview / Upcoming Queue Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 7 Columns: Currently Serving Hero Section & Metric Cards */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Active Serving Section */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden min-h-[420px]">
            
            {/* Top Right Counter Pill */}
            <div className="absolute top-0 right-0 p-6">
              <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-base border border-indigo-100 flex items-center space-x-1.5">
                {isOfficer && <Lock className="w-3.5 h-3.5 text-indigo-500" />}
                <span>
                  {isAmharic 
                    ? `መስኮት ${activeCounter?.number || 1}` 
                    : `COUNTER ${activeCounter?.number || 1}`}
                </span>
              </span>
            </div>

            {/* Currently Serving Content */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                  {isAmharic ? 'አሁን የሚስተናገድ ደንበኛ' : 'Currently Serving'}
                </h2>
              </div>

              {currentTicket ? (
                <div>
                  {currentTicket.priority === 'URGENT' && (
                    <div className="inline-flex items-center space-x-2 bg-rose-600 text-white px-3 py-1 rounded-xl text-xs font-black shadow-xs uppercase tracking-wider mb-2 animate-pulse">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{isAmharic ? '⚡ አስቸኳይ ቅድሚያ የተሰጠው ደንበኛ' : '⚡ URGENT ESCALATED TICKET'}</span>
                      {currentTicket.urgencyReason && (
                        <span className="font-normal normal-case border-l border-rose-400 pl-2">
                          {currentTicket.urgencyReason}
                        </span>
                      )}
                    </div>
                  )}
                  {currentTicket.priority === 'PRIORITY' && (
                    <div className="inline-flex items-center space-x-2 bg-amber-500 text-slate-950 px-3 py-1 rounded-xl text-xs font-black shadow-xs uppercase tracking-wider mb-2">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isAmharic ? '★ ቅድሚያ የሚሰጠው ተገልጋይ (VIP)' : '★ PRIORITY SERVICE (VIP)'}</span>
                      {currentTicket.urgencyReason && (
                        <span className="font-medium normal-case border-l border-amber-600 pl-2">
                          {currentTicket.urgencyReason}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-baseline gap-4 mt-2">
                    <span className="text-7xl sm:text-8xl lg:text-9xl font-black text-slate-900 tracking-tighter font-mono">
                      {currentTicket.ticketNumber}
                    </span>
                    {currentTicket.ticketNumberAmharic && (
                      <span className="text-2xl sm:text-3xl text-slate-400 font-light italic font-sans">
                        {currentTicket.ticketNumberAmharic}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                    <p className="text-xl sm:text-2xl text-slate-600 font-medium">
                      {isAmharic ? (currentTicket.serviceNameAmharic || currentTicket.serviceName) : currentTicket.serviceName}
                      <span className="text-slate-400 font-normal ml-2 text-lg">
                        / {isAmharic ? currentTicket.serviceName : (currentTicket.serviceNameAmharic || '')}
                      </span>
                    </p>

                    <div className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-mono text-slate-700 font-bold border border-slate-200">
                      <Timer className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{formatTimer(serviceTimerSeconds)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-slate-400 space-y-2">
                  <div className="text-6xl sm:text-7xl font-black text-slate-300 font-mono tracking-tighter">
                    --
                  </div>
                  <p className="text-base text-slate-500 font-medium">
                    {isAmharic ? 'በአሁኑ ሰዓት በመስኮትዎ ላይ የተጠራ ደንበኛ የለም።' : 'No customer currently at this counter.'}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons Matrix (Call Next, Recall, Complete, No Show) */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              
              {/* Call Next Button */}
              <button
                id="btn-call-next"
                disabled={isCalling}
                onClick={() => handleCallNext()}
                className={`text-white font-bold py-5 px-3 rounded-xl shadow-lg active:scale-[0.99] flex flex-col items-center justify-center gap-1 transition relative group ${
                  nextEligibleTicket?.priority === 'URGENT'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 ring-2 ring-rose-400 ring-offset-2'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  {nextEligibleTicket?.priority === 'URGENT' && <Flame className="w-5 h-5 text-yellow-300 animate-pulse" />}
                  <span className="text-lg uppercase tracking-wider">
                    {nextEligibleTicket?.priority === 'URGENT'
                      ? (isAmharic ? `አስቸኳይ ጥራ (${nextEligibleTicket.ticketNumber})` : `Call Next (${nextEligibleTicket.ticketNumber} Urgent)`)
                      : (isAmharic ? 'ቀጣይ ጥራ' : 'Call Next')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs opacity-80 font-normal italic">
                    {isAmharic ? 'Call Next Customer' : 'ቀጣዩን ጥራ'}
                  </span>
                  <span className="text-[11px] font-mono font-black bg-white/20 px-2 py-0.5 rounded text-white shadow-2xs border border-white/20">
                    N
                  </span>
                </div>
              </button>

              {/* Recall Button */}
              <button
                id="btn-recall-ticket"
                disabled={!currentTicket}
                onClick={handleRecall}
                className="bg-white border-2 border-slate-200 hover:border-slate-300 active:scale-[0.99] text-slate-700 font-bold py-5 px-3 rounded-xl flex flex-col items-center justify-center gap-1 transition disabled:opacity-50 relative group shadow-xs"
              >
                <span className="text-lg uppercase tracking-wider">
                  {isAmharic ? 'ድገም ጥራ' : 'Recall'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-400 font-normal italic">
                    {isAmharic ? 'Re-announce' : 'እንደገና ጥራ'}
                  </span>
                  <span className="text-[11px] font-mono font-black bg-slate-100 px-2 py-0.5 rounded text-slate-700 shadow-2xs border border-slate-300">
                    R
                  </span>
                </div>
              </button>

              {/* Complete Button */}
              <button
                id="btn-complete-ticket"
                disabled={!currentTicket}
                onClick={handleComplete}
                className="bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold py-5 px-3 rounded-xl shadow-lg shadow-emerald-100 flex flex-col items-center justify-center gap-1 transition disabled:opacity-50 relative group"
              >
                <span className="text-lg uppercase tracking-wider">
                  {isAmharic ? 'ጨርስ' : 'Complete'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs opacity-80 font-normal italic">
                    {isAmharic ? 'Finish Service' : 'ጨርስ'}
                  </span>
                  <span className="text-[11px] font-mono font-black bg-white/20 px-2 py-0.5 rounded text-white shadow-2xs border border-white/20">
                    C
                  </span>
                </div>
              </button>

              {/* No Show Button */}
              <button
                id="btn-no-show-ticket"
                disabled={!currentTicket}
                onClick={handleNoShow}
                className="bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 active:scale-[0.99] font-bold py-5 rounded-xl flex flex-col items-center justify-center gap-1 transition disabled:opacity-50 relative group shadow-xs"
              >
                <span className="text-lg uppercase tracking-wider">
                  {isAmharic ? 'አልቀረበም' : 'No Show'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-rose-400 font-normal italic">
                    {isAmharic ? 'Mark Absent' : 'አልተገኘም'}
                  </span>
                  <span className="text-[11px] font-mono font-black bg-rose-200/70 text-rose-800 px-2 py-0.5 rounded shadow-2xs border border-rose-300">
                    A
                  </span>
                </div>
              </button>
            </div>

            {/* Transfer Ticket Link */}
            {currentTicket && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center space-x-1.5 transition"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'ወደ ሌላ አገልግሎት አስተላልፍ (Transfer)' : 'Transfer ticket to another service'}</span>
                </button>

                {currentTicket.status === 'CALLED' && (
                  <button
                    onClick={handleStart}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100"
                  >
                    ▶ {isAmharic ? 'አገልግሎት ጀምር' : 'Start Service'}
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Metric KPIs Strip */}
          <section className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-center shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
                {isAmharic ? 'በመጠባበቅ ላይ' : 'Waiting'}
              </p>
              <p className="text-3xl font-bold font-mono text-slate-900">{waitingTickets.length}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-center shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
                {isAmharic ? 'አማካይ አገልግሎት' : 'Avg. Service'}
              </p>
              <p className="text-3xl font-bold font-mono text-slate-900">~{stats?.avgServiceMinutes || 8}m</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-center shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">
                {isAmharic ? 'የተስተናገዱ' : 'Served Today'}
              </p>
              <p className="text-3xl font-bold font-mono text-slate-900">{stats?.completed || 0}</p>
            </div>
          </section>
        </div>

        {/* Right 5 Columns: Live Display Preview & Upcoming Queue */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Live Display Preview Card */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col border border-slate-800 shadow-2xl relative min-h-[300px]">
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Live Display Preview
              </span>
            </div>
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">
              {isAmharic ? 'አሁን የሚስተናገድ / Now Serving' : 'Now Serving / አሁን የሚስተናገድ'}
            </h3>
            
            <div className="flex flex-col items-center justify-center flex-1 py-4">
              <div className="text-7xl font-black font-mono text-white tracking-tight mb-2">
                {currentTicket ? currentTicket.ticketNumber : (servingTickets[0]?.ticketNumber || '--')}
              </div>
              <div className="text-lg text-slate-400 mb-6 font-medium">
                {isAmharic 
                  ? `ወደ መስኮት ${activeCounter?.number || 1} ይሂዱ` 
                  : `Proceed to Counter ${activeCounter?.number || 1}`}
              </div>
              
              <div className="w-full grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      {isAmharic ? 'ቀጣይ ተራ' : 'Next Up'}
                    </p>
                    {sortedWaitingTickets[0]?.priority === 'URGENT' && (
                      <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                        <Flame className="w-2.5 h-2.5" /> URGENT
                      </span>
                    )}
                    {sortedWaitingTickets[0]?.priority === 'PRIORITY' && (
                      <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> VIP
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold font-mono text-white mt-0.5">
                    {sortedWaitingTickets[0]?.ticketNumber || '--'}
                  </p>
                </div>
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      {isAmharic ? 'ቀጣይ ተራ' : 'Next Up'}
                    </p>
                    {sortedWaitingTickets[1]?.priority === 'URGENT' && (
                      <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                        <Flame className="w-2.5 h-2.5" /> URGENT
                      </span>
                    )}
                    {sortedWaitingTickets[1]?.priority === 'PRIORITY' && (
                      <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> VIP
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold font-mono text-white mt-0.5">
                    {sortedWaitingTickets[1]?.ticketNumber || '--'}
                  </p>
                </div>
              </div>
            </div>

            {/* Audio Waveform / Addis Voice Synthesis Indicator */}
            <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="flex gap-1 items-end h-5">
                  <div className="w-1 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                  <div className="w-1 h-5 bg-indigo-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isAmharic ? 'Addis AI የአማርኛ ድምፅ ማስታወቂያ ዝግጁ' : 'Addis AI Voice Engine Active...'}
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Queue List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[380px] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{isAmharic ? 'የሚጠባበቁ ደንበኞች' : 'Upcoming Queue'}</span>
                  {hasUrgentWaiting && (
                    <span className="px-2 py-0.5 text-[10px] bg-rose-100 text-rose-700 font-black rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-600" />
                      {isAmharic ? 'አስቸኳይ አለ' : 'Urgent In Queue'}
                    </span>
                  )}
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {sortedWaitingTickets.length} {isAmharic ? 'በወረፋ ውስጥ' : 'People in Queue'}
              </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              {sortedWaitingTickets.length > 0 ? (
                sortedWaitingTickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    className={`flex flex-col p-3 rounded-xl border transition ${
                      ticket.priority === 'URGENT' 
                        ? 'bg-rose-50/70 border-rose-200 shadow-xs' 
                        : ticket.priority === 'PRIORITY'
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          {ticket.ticketNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-medium uppercase border border-indigo-100">
                          {ticket.serviceName.split(' ')[0]}
                        </span>
                        {ticket.priority === 'URGENT' && (
                          <span className="text-[10px] px-2 py-0.5 bg-rose-600 text-white rounded-md font-black flex items-center gap-1 shadow-2xs animate-pulse">
                            <Flame className="w-3 h-3" />
                            {isAmharic ? 'አስቸኳይ' : 'URGENT'}
                          </span>
                        )}
                        {ticket.priority === 'PRIORITY' && (
                          <span className="text-[10px] px-2 py-0.5 bg-amber-500 text-slate-950 rounded-md font-extrabold flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            VIP
                          </span>
                        )}
                        {ticket.isCheckedIn ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold flex items-center space-x-1" title="Customer checked-in with QR code">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{isAmharic ? 'ተገኝተዋል' : 'Checked-In'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium" title="Awaiting QR check-in">
                            {isAmharic ? 'አልተረጋገጠም' : 'Pending QR'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-slate-400 italic mr-1">
                          {ticket.ticketNumberAmharic || ''}
                        </span>

                        {/* Priority Triage Quick Action */}
                        <button
                          onClick={() => handleOpenOfficerTriage(ticket)}
                          title={isAmharic ? 'ቅድሚያ ሁኔታ ቀይር' : 'Change Ticket Priority'}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={true}
                          title={isAmharic ? 'በወረፋ ዝርዝር ላይ በቀጥታ መጥራት ተሰናክሏል፤ የጣቢያውን "ቀጣይ ጥራ" ይጠቀሙ' : 'Direct calling from upcoming queue is disabled. Use the main station "Call Next" button.'}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 flex items-center space-x-1"
                        >
                          <Lock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{isAmharic ? 'ጥራ' : 'Call'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Urgency Reason Subtitle */}
                    {(ticket.urgencyReason || ticket.notes) && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-600">
                        {ticket.priority === 'URGENT' && <Flame className="w-3 h-3 text-rose-500 shrink-0" />}
                        <span className="font-semibold text-slate-700">
                          {ticket.urgencyReason ? ticket.urgencyReason : ticket.notes}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-slate-400 text-xs">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  {isAmharic ? 'ምንም የሚጠብቅ ደንበኛ የለም።' : 'No tickets in waiting line.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {isAmharic ? 'ቲኬት ወደ ሌላ አገልግሎት አስተላልፍ' : 'Transfer Customer Ticket'}
            </h3>

            <p className="text-xs text-slate-500">
              {isAmharic ? 'ደንበኛው እንዲያገኝ የሚፈለገውን አዲስ አገልግሎት ይምረጡ:' : 'Select target service for ticket transfer:'}
            </p>

            <select
              value={transferTargetServiceId}
              onChange={(e) => setTransferTargetServiceId(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            >
              <option value="">{isAmharic ? '-- አገልግሎት ይምረጡ --' : '-- Select Service --'}</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {isAmharic ? `${s.nameAmharic} (${s.prefix})` : `${s.name} (${s.prefix})`}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                {isAmharic ? 'ተመለስ' : 'Cancel'}
              </button>
              <button
                disabled={!transferTargetServiceId}
                onClick={handleTransfer}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                {isAmharic ? 'አስተላልፍ' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Officer Ticket Priority Triage Modal */}
      {officerTriageTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                  <Flame className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isAmharic ? 'የቲኬት ቅድሚያ ሁኔታ አስተካክል' : 'Manage Ticket Priority'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Ticket: <strong className="text-slate-800">{officerTriageTicket.ticketNumber}</strong> ({officerTriageTicket.serviceName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOfficerTriageTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOfficerTriage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {isAmharic ? 'የቅድሚያ ደረጃ ይምረጡ' : 'Select Priority Level'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOfficerTriagePriority('NORMAL')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      officerTriagePriority === 'NORMAL'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>{isAmharic ? 'መደበኛ' : 'Normal'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOfficerTriagePriority('PRIORITY')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      officerTriagePriority === 'PRIORITY'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                        : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100/70'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>{isAmharic ? 'ቅድሚያ (VIP)' : 'Priority (VIP)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOfficerTriagePriority('URGENT')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      officerTriagePriority === 'URGENT'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>{isAmharic ? 'አስቸኳይ' : 'Urgent'}</span>
                  </button>
                </div>
              </div>

              {/* Urgency Reason Field */}
              {(officerTriagePriority === 'URGENT' || officerTriagePriority === 'PRIORITY') && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-700">
                    {isAmharic ? 'የአስቸኳይ ወይም የቅድሚያ ምክንያት' : 'Urgency / Priority Reason'}
                  </label>
                  <input
                    type="text"
                    value={officerTriageReason}
                    onChange={(e) => setOfficerTriageReason(e.target.value)}
                    placeholder={
                      isAmharic
                        ? 'ምሳሌ፡ የጤና እክል፣ አረጋዊ፣ አስቸኳይ የጉዞ ሰነድ...'
                        : 'e.g. Medical distress, Elderly, Emergency document...'
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { en: 'Medical condition', am: 'የጤና እክል' },
                      { en: 'Elderly / Special assistance', am: 'አረጋዊ / ልዩ ድጋፍ' },
                      { en: 'Urgent document', am: 'አስቸኳይ ሰነድ' },
                      { en: 'Transit passenger', am: 'ተላላፊ መንገደኛ' }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setOfficerTriageReason(isAmharic ? preset.am : preset.en)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-medium transition"
                      >
                        {isAmharic ? preset.am : preset.en}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {isAmharic ? 'ተጨማሪ ማስታወሻ (አማራጭ)' : 'Additional Officer Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={officerTriageNotes}
                  onChange={(e) => setOfficerTriageNotes(e.target.value)}
                  placeholder={isAmharic ? 'ለባለሙያዎች ማስታወሻ...' : 'Notes for officers or reception staff...'}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOfficerTriageTicket(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition"
                >
                  {isAmharic ? 'ተመለስ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isOfficerUpdatingPriority}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isOfficerUpdatingPriority ? (isAmharic ? 'በመቀየር ላይ...' : 'Saving...') : (isAmharic ? 'አስቀምጥ' : 'Save Priority')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

