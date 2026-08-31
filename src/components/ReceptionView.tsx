import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Printer, 
  Sparkles, 
  PlusCircle, 
  CheckCircle, 
  CheckCircle2,
  Clock, 
  AlertCircle, 
  Search, 
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldAlert,
  Flame,
  Filter,
  Check,
  X,
  Edit3,
  HeartPulse,
  Accessibility,
  Baby,
  Star,
  FileText,
  Lock,
  Crown,
  ShieldCheck,
  KeyRound,
  LogIn,
  UserCheck,
  LogOut,
  Building2,
  Tv,
  Maximize2,
  Minimize2,
  Layers,
  Touchpad,
  Globe,
  QrCode,
  Users,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { TicketPrintModal } from './TicketPrintModal';
import { PrintTicketData, Service, PriorityLevel, QueueTicket } from '../types';

export const URGENCY_PRESETS = [
  { id: 'elderly', labelEn: 'Elderly Citizen (60+)', labelAm: 'አረጋውያን (60+)', icon: Star, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'disability', labelEn: 'Person with Disability', labelAm: 'አካል ጉዳተኛ / ልዩ ድጋፍ', icon: Accessibility, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'pregnancy', labelEn: 'Pregnant / Infant Care', labelAm: 'ነፍሰ ጡር / ሕፃን የያዘች እናት', icon: Baby, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'medical', labelEn: 'Medical Emergency', labelAm: 'የህክምና አስቸኳይ ሁኔታ', icon: HeartPulse, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'official', labelEn: 'Official Priority Escalation', labelAm: 'አስቸኳይ የመንግስት ጉዳይ', icon: ShieldAlert, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' }
];

export interface ReceptionViewProps {
  onNavigate?: (view: string) => void;
}

export type ViewMode = 'DESK' | 'KIOSK';

export const ReceptionView: React.FC<ReceptionViewProps> = ({ onNavigate }) => {
  const { 
    services, 
    waitingTickets, 
    createTicket, 
    updateTicketPriority,
    uiLanguage,
    setUiLanguage,
    officeSetting
  } = useQueue();

  const { user, login, logout, hasPermission } = useAuth();
  
  // Authorization permissions
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const isServiceOfficer = user?.role === 'SERVICE_OFFICER';
  
  // Full authorization check: Admins, Receptionists, officers, or staff with priority flags
  const hasPriorityAuth = 
    isAdmin || 
    isReceptionist || 
    user?.canManagePriority === true || 
    hasPermission('ticket.priority') || 
    hasPermission('ticket.priority_create') ||
    isServiceOfficer;

  const [viewMode, setViewMode] = useState<ViewMode>('DESK');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [urgencyReason, setUrgencyReason] = useState<string>('');
  const [urgencyNotes, setUrgencyNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activePrintData, setActivePrintData] = useState<PrintTicketData | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | PriorityLevel>('ALL');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Admin Priority Authorization Modal State (for optional credential elevation if needed)
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [adminAuthTargetPriority, setAdminAuthTargetPriority] = useState<PriorityLevel>('PRIORITY');
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [isAuthorizingAdmin, setIsAuthorizingAdmin] = useState<boolean>(false);
  const [adminAuthError, setAdminAuthError] = useState<string>('');

  // Auto-print preference state stored in localStorage
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('addis_reception_auto_print') === 'true';
    } catch {
      return false;
    }
  });

  // Reception Authentication Gate State (when not signed in)
  const [authMode, setAuthMode] = useState<'LOGIN' | 'FORGOT_REQUEST' | 'FORGOT_VERIFY'>('LOGIN');
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState<boolean>(false);

  // Forgot password state
  const [forgotUsername, setForgotUsername] = useState<string>('');
  const [forgotCode, setForgotCode] = useState<string>('');
  const [generatedNotice, setGeneratedNotice] = useState<string>('');
  const [receptionNewPassword, setReceptionNewPassword] = useState<string>('');
  const [receptionConfirmPassword, setReceptionConfirmPassword] = useState<string>('');
  const [showReceptionNewPassword, setShowReceptionNewPassword] = useState<boolean>(false);
  const [isProcessingForgot, setIsProcessingForgot] = useState<boolean>(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string>('');

  const handleReceptionLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setLoginError(isAmharic ? 'እባክዎ የተጠቃሚ ስም እና የይለፍ ቃል ያስገቡ' : 'Please enter username and password');
      return;
    }
    try {
      setIsSubmittingLogin(true);
      setLoginError('');
      setForgotSuccessMessage('');
      await login(loginUsername.trim(), loginPassword);
      setActionNotice(isAmharic ? 'ወደ መስተንግዶ እና ኪዮስክ ጣቢያ በተሳካ ሁኔታ ገብተዋል!' : 'Signed in to Reception & Kiosk workstation successfully!');
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err: any) {
      setLoginError(err.message || (isAmharic ? 'የመግቢያ መረጃ የተሳሳተ ነው። እባክዎ እንደገና ይሞክሩ።' : 'Invalid login credentials. Please check username and password.'));
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleReceptionRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername.trim()) {
      setLoginError(isAmharic ? 'እባክዎ የተጠቃሚ ስም ያስገቡ' : 'Please enter username');
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
        setAuthMode('FORGOT_VERIFY');
      }
    } catch (err: any) {
      setLoginError(err.message || (isAmharic ? 'ኮድ መጠየቅ አልተሳካም' : 'Failed to request reset code'));
    } finally {
      setIsProcessingForgot(false);
    }
  };

  const handleReceptionResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCode.trim()) {
      setLoginError(isAmharic ? 'እባክዎ የ6-አሃዝ ማረጋገጫ ኮድ ያስገቡ' : 'Please enter the 6-digit reset code');
      return;
    }
    if (receptionNewPassword.length < 6) {
      setLoginError(isAmharic ? 'አዲሱ የይለፍ ቃል ቢያንስ 6 ፊደላት/ቁጥሮች መሆን አለበት' : 'New password must be at least 6 characters');
      return;
    }
    if (receptionNewPassword !== receptionConfirmPassword) {
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
        newPassword: receptionNewPassword
      });
      if (res.success) {
        setForgotSuccessMessage(
          isAmharic 
            ? 'የይለፍ ቃልዎ ተቀይሯል! አሁን በአዲሱ የይለፍ ቃል መግባት ይችላሉ።'
            : 'Password successfully updated! You can now sign in.'
        );
        setLoginUsername(forgotUsername.trim());
        setLoginPassword(receptionNewPassword);
        setForgotCode('');
        setReceptionNewPassword('');
        setReceptionConfirmPassword('');
        setGeneratedNotice('');
        setAuthMode('LOGIN');
      }
    } catch (err: any) {
      setLoginError(err.message || (isAmharic ? 'የይለፍ ቃል መቀየር አልተሳካም' : 'Failed to reset password'));
    } finally {
      setIsProcessingForgot(false);
    }
  };

  const handleToggleAutoPrint = (enabled: boolean) => {
    setAutoPrintEnabled(enabled);
    try {
      localStorage.setItem('addis_reception_auto_print', String(enabled));
    } catch {}
    setActionNotice(
      enabled
        ? (isAmharic ? 'አውቶማቲክ የቲኬት ማተሚያ በርቷል (Auto-Print ON)' : 'Auto-trigger browser printing enabled for new tickets')
        : (isAmharic ? 'አውቶማቲክ የቲኬት ማተሚያ ጠፍቷል (Auto-Print OFF)' : 'Auto-trigger browser printing disabled')
    );
    setTimeout(() => setActionNotice(''), 3500);
  };

  // Priority Triage Modal state
  const [triageTicket, setTriageTicket] = useState<QueueTicket | null>(null);
  const [triagePriority, setTriagePriority] = useState<PriorityLevel>('URGENT');
  const [triageReason, setTriageReason] = useState<string>('');
  const [triageNotes, setTriageNotes] = useState<string>('');
  const [isUpdatingPriority, setIsUpdatingPriority] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string>('');

  const isAmharic = uiLanguage === 'AMHARIC';

  // Toggle fullscreen for kiosk monitors
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleSelectPriority = (target: PriorityLevel, defaultReason?: string) => {
    if (target === 'NORMAL') {
      setPriority('NORMAL');
      setUrgencyReason('');
      return;
    }

    setPriority(target);
    if (defaultReason) {
      setUrgencyReason(defaultReason);
    } else if (!urgencyReason) {
      if (target === 'URGENT') {
        setUrgencyReason(isAmharic ? 'አስቸኳይ ሁኔታ' : 'Urgent Escalation');
      } else {
        setUrgencyReason(isAmharic ? 'ቅድሚያ የሚሰጠው' : 'Priority Service');
      }
    }

    setActionNotice(
      target === 'URGENT'
        ? (isAmharic ? 'የአስቸኳይ (⚡ URGENT) ደረጃ ተመርጧል' : 'Urgent classification selected')
        : (isAmharic ? 'የቅድሚያ (⭐ PRIORITY) ደረጃ ተመርጧል' : 'Priority classification selected')
    );
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleAdminAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) {
      setAdminAuthError(isAmharic ? 'እባክዎ የተጠቃሚ ስም እና የይለፍ ቃል ያስገቡ' : 'Please enter username and password');
      return;
    }

    try {
      setIsAuthorizingAdmin(true);
      setAdminAuthError('');
      await login(adminUsername.trim(), adminPassword);
      
      setPriority(adminAuthTargetPriority);
      if (!urgencyReason) {
        if (adminAuthTargetPriority === 'URGENT') {
          setUrgencyReason(isAmharic ? 'አስቸኳይ ሁኔታ' : 'Urgent Escalation');
        } else {
          setUrgencyReason(isAmharic ? 'ቅድሚያ የሚሰጠው' : 'Priority Service');
        }
      }
      setIsAdminAuthModalOpen(false);
      setAdminPassword('');
      setActionNotice(
        isAmharic 
          ? `የተጠቃሚ ፈቃድ ተረጋግጧል፡ የ${adminAuthTargetPriority === 'URGENT' ? 'አስቸኳይ' : 'ቅድሚያ'} ቲኬት መስጫ ተፈቅዷል!` 
          : `Authorized: ${adminAuthTargetPriority} ticket issuance enabled!`
      );
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err: any) {
      setAdminAuthError(
        err.message || (isAmharic ? 'የማረጋገጫ ሂደት አልተሳካም። እባክዎ ትክክለኛ መረጃ ያስገቡ።' : 'Authorization failed. Invalid credentials.')
      );
    } finally {
      setIsAuthorizingAdmin(false);
    }
  };

  const handleGenerateTicket = async (service: Service, explicitPriority?: PriorityLevel, customReason?: string) => {
    try {
      setIsGenerating(true);
      const targetPriority = explicitPriority || priority;
      const targetReason = customReason || urgencyReason;

      const res = await createTicket(
        service.id, 
        targetPriority, 
        targetReason || undefined, 
        urgencyNotes || undefined
      );

      setActivePrintData(res.printData);
      setIsPrintModalOpen(true);
      setPriority('NORMAL'); // Reset to normal priority after issue
      setUrgencyReason('');
      setUrgencyNotes('');

      setActionNotice(
        isAmharic
          ? `ቲኬት ${res.ticket.ticketNumber} በተሳካ ሁኔታ ወጥቷል!`
          : `Ticket ${res.ticket.ticketNumber} successfully generated!`
      );
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err: any) {
      alert(`Error generating ticket: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenTriage = (ticket: QueueTicket) => {
    setTriageTicket(ticket);
    setTriagePriority(ticket.priority === 'NORMAL' ? 'URGENT' : ticket.priority);
    setTriageReason(ticket.urgencyReason || '');
    setTriageNotes(ticket.notes || '');
  };

  const handleSaveTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageTicket) return;

    try {
      setIsUpdatingPriority(true);
      await updateTicketPriority(
        triageTicket.id, 
        triagePriority, 
        triageReason || undefined, 
        triageNotes || undefined
      );
      setActionNotice(
        isAmharic 
          ? `የቲኬት ${triageTicket.ticketNumber} ቅድሚያ ደረጃ ወደ "${triagePriority}" ተቀይሯል!` 
          : `Ticket ${triageTicket.ticketNumber} priority changed to ${triagePriority}!`
      );
      setTimeout(() => setActionNotice(''), 4000);
      setTriageTicket(null);
    } catch (err: any) {
      alert(`Failed to update ticket priority: ${err.message}`);
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  const urgentCount = waitingTickets.filter(t => t.priority === 'URGENT').length;
  const priorityCount = waitingTickets.filter(t => t.priority === 'PRIORITY').length;
  const normalCount = waitingTickets.filter(t => t.priority === 'NORMAL' || !t.priority).length;

  const filteredTickets = waitingTickets.filter(t => {
    const matchesSearch = 
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.serviceNameAmharic && t.serviceNameAmharic.includes(searchQuery)) ||
      (t.urgencyReason && t.urgencyReason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = 
      priorityFilter === 'ALL' || 
      (priorityFilter === 'NORMAL' ? (t.priority === 'NORMAL' || !t.priority) : t.priority === priorityFilter);

    return matchesSearch && matchesPriority;
  });

  const activeServices = services.filter(s => s.isActive !== false);

  // 1. Unauthenticated Gate: Staff / Operator authentication required to access Reception & Kiosk
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Toast Notice */}
        {actionNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl font-bold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
              {authMode === 'LOGIN' ? <Lock className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {authMode === 'LOGIN' && (isAmharic ? 'የመስተንግዶ እና ኪዮስክ መግቢያ' : 'Reception & Kiosk Authentication')}
              {authMode === 'FORGOT_REQUEST' && (isAmharic ? 'የይለፍ ቃል መልሶ ማግኛ' : 'Reset Workstation Password')}
              {authMode === 'FORGOT_VERIFY' && (isAmharic ? 'አዲስ የይለፍ ቃል ማዘጋጃ' : 'Set New Staff Password')}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              {authMode === 'LOGIN' && (isAmharic 
                ? 'የመስተንግዶ ዴስክን ለመስራት፣ የወረፋ ቲኬቶችን ለማውጣት ወይም የቅድሚያ አገልግሎት ለመስጠት እባክዎ በተፈቀደ የመስተንግዶ፣ የአገልግሎት ሰጪ ወይም የአስተዳዳሪ መለያ ይግቡ።' 
                : 'Authentication required. Only authorized front desk staff, receptionists, service officers, and administrators are permitted to access the reception desk and issue queue tickets.')}
              {authMode === 'FORGOT_REQUEST' && (isAmharic
                ? 'የማረጋገጫ ኮድ ለመቀበል የተጠቃሚ ስምዎን ያስገቡ።'
                : 'Enter your staff username to receive a 6-digit verification reset code.')}
              {authMode === 'FORGOT_VERIFY' && (isAmharic
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
          {authMode === 'LOGIN' && (
            <div className="max-w-md mx-auto space-y-6">
              <form onSubmit={handleReceptionLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isAmharic ? 'የተጠቃሚ ስም (Username)' : 'Username'}
                  </label>
                  <input
                    type="text"
                    id="input-reception-username"
                    placeholder={isAmharic ? 'የተጠቃሚ ስም (e.g. reception)' : 'Username (e.g. reception)'}
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isAmharic ? 'የይለፍ ቃል (Password)' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="input-reception-password"
                      placeholder={isAmharic ? 'የይለፍ ቃል (Password)' : 'Password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginError('');
                        setForgotSuccessMessage('');
                        setForgotUsername(loginUsername);
                        setAuthMode('FORGOT_REQUEST');
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    >
                      {isAmharic ? 'የይለፍ ቃል ረሱ?' : 'Forgot password?'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-reception-submit-login"
                  disabled={isSubmittingLogin}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmittingLogin ? (isAmharic ? 'በመግባት ላይ...' : 'Signing In...') : (isAmharic ? 'ወደ መስተንግዶ ግባ' : 'Sign In to Workstation')}</span>
                </button>
              </form>
            </div>
          )}

          {/* MODE 2: Request Reset Code */}
          {authMode === 'FORGOT_REQUEST' && (
            <div className="max-w-md mx-auto space-y-4">
              <form onSubmit={handleReceptionRequestResetCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isAmharic ? 'የተጠቃሚ ስም (Username)' : 'Staff Username'}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. reception or admin"
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
              </form>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLoginError('');
                    setForgotSuccessMessage('');
                    setAuthMode('LOGIN');
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  {isAmharic ? '← ወደ መግቢያ ተመለስ' : '← Back to Sign In'}
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: Verify Reset Code & New Password */}
          {authMode === 'FORGOT_VERIFY' && (
            <div className="max-w-md mx-auto space-y-4">
              {generatedNotice && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>{isAmharic ? 'የተፈጠረ የማረጋገጫ ኮድ:' : 'Verification Code:'}</span>
                  </div>
                  <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded border border-amber-300">
                    {generatedNotice}
                  </span>
                </div>
              )}
              <form onSubmit={handleReceptionResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {isAmharic ? 'የ6-አሃዝ ማረጋገጫ ኮድ' : '6-Digit Reset Code'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    className="w-full px-4 py-2.5 text-center font-mono tracking-widest text-base font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {isAmharic ? 'አዲስ የይለፍ ቃል' : 'New Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showReceptionNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={receptionNewPassword}
                      onChange={(e) => setReceptionNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowReceptionNewPassword(!showReceptionNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showReceptionNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {isAmharic ? 'አዲሱን የይለፍ ቃል አረጋግጥ' : 'Confirm New Password'}
                  </label>
                  <input
                    type={showReceptionNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={receptionConfirmPassword}
                    onChange={(e) => setReceptionConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessingForgot}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessingForgot ? (isAmharic ? 'በመቀየር ላይ...' : 'Updating...') : (isAmharic ? 'የይለፍ ቃል ቀይር' : 'Update Password & Return')}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Controls & Mode Switcher Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isAmharic ? 'የመስተንግዶ እና የቲኬት መስጫ ጣቢያ' : 'Reception & Ticket Kiosk'}
              </h1>
              {user && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{user.role} ({user.name.split(' ')[0]})</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {isAmharic 
                ? 'የደንበኞች ፈጣን ምዝገባ፣ የቲኬት አሰጣጥ እና የቅድሚያ አገልግሎት ማስተናገጃ' 
                : 'Front desk customer intake, priority issuance, and kiosk ticketing'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Utility Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          
          {/* Desk vs Kiosk Switcher */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              id="btn-switch-reception-desk"
              onClick={() => setViewMode('DESK')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'DESK'
                  ? 'bg-white text-indigo-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'የመስተንግዶ ዴስክ' : 'Reception Desk'}</span>
            </button>
            <button
              type="button"
              id="btn-switch-touch-kiosk"
              onClick={() => setViewMode('KIOSK')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'KIOSK'
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Touchpad className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'ራስ-አገዝ ኪዮስክ' : 'Touch Kiosk'}</span>
            </button>
          </div>

          {/* Auto-Print Toggle Setting */}
          <div className="flex items-center space-x-2 bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <Printer className={`w-4 h-4 ${autoPrintEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-800 leading-tight">
                {isAmharic ? 'አውቶማቲክ ህትመት' : 'Auto-Print'}
              </span>
              <span className="text-[9px] text-slate-500">
                {autoPrintEnabled 
                  ? (isAmharic ? 'ሲወጣ ወዲያው ይታተማል' : 'Instant Print') 
                  : (isAmharic ? 'ጠፍቷል' : 'Manual')}
              </span>
            </div>
            <button
              type="button"
              id="btn-toggle-autoprint-header"
              onClick={() => handleToggleAutoPrint(!autoPrintEnabled)}
              title={isAmharic ? 'ቲኬት ሲወጣ ራሱ በራሱ እንዲታተም ቀይር' : 'Toggle immediate automatic print dialog for new tickets'}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoPrintEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  autoPrintEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Kiosk Mode'}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Sign Out / Switch User Button */}
          {user && (
            <button
              type="button"
              onClick={logout}
              title={isAmharic ? 'ከመስተንግዶ ጣቢያ ውጣ' : 'Sign out of workstation'}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'ውጣ' : 'Sign Out'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: RECEPTION DESK OPERATOR VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'DESK' && (
        <div className="space-y-6">
          {/* Priority Mode Selector Bar */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  {isAmharic ? 'የቲኬት ደረጃ እና ቅድሚያ አሰጣጥ' : 'Ticket Urgency & Priority Triage'}
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {isAmharic 
                    ? 'አስቸኳይ ወይም የቅድሚያ ደረጃ በመምረጥ ለደንበኞች ቅድሚያ የሚሰጥ ቲኬት ያውጡ' 
                    : 'Select priority classification to assign higher queue weighting before printing ticket'}
                </p>
              </div>

              {/* 3-Tier Priority Selection Buttons */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  id="btn-priority-normal"
                  onClick={() => handleSelectPriority('NORMAL')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    priority === 'NORMAL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isAmharic ? 'መደበኛ ተራ' : 'Normal'}
                </button>

                <button
                  type="button"
                  id="btn-priority-priority"
                  onClick={() => handleSelectPriority('PRIORITY')}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    priority === 'PRIORITY'
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 hover:text-amber-800'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isAmharic ? 'ቅድሚያ / VIP' : 'Priority'}</span>
                </button>

                <button
                  type="button"
                  id="btn-priority-urgent"
                  onClick={() => handleSelectPriority('URGENT')}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    priority === 'URGENT'
                      ? 'bg-rose-600 text-white shadow-xs font-black animate-pulse'
                      : 'text-rose-700 hover:bg-rose-100/60'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-200" />
                  <span>{isAmharic ? '⚡ አስቸኳይ' : '⚡ Urgent'}</span>
                </button>
              </div>
            </div>

            {/* Urgency Details Bar if PRIORITY or URGENT selected */}
            {(priority === 'PRIORITY' || priority === 'URGENT') && (
              <div className={`p-4 rounded-xl border space-y-3 transition-all ${
                priority === 'URGENT' 
                  ? 'bg-rose-50/80 border-rose-200' 
                  : 'bg-amber-50/80 border-amber-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {priority === 'URGENT' ? (
                      <Flame className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-600" />
                    )}
                    <span className="text-xs font-bold text-slate-800">
                      {priority === 'URGENT' 
                        ? (isAmharic ? 'የአስቸኳይነት ምክንያት ይምረጡ ወይም ያስገቡ:' : 'Select or enter urgency escalation reason:')
                        : (isAmharic ? 'የቅድሚያ አገልግሎት ምክንያት:' : 'Reason for priority consideration:')}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    priority === 'URGENT' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {priority === 'URGENT' 
                      ? (isAmharic ? 'በቀጥታ በጣቢያው አናት ላይ ይደርሳል' : 'Prioritized 1st in Officer Queue') 
                      : (isAmharic ? 'ከመደበኛ ተራ አስቀድሞ ይጠራል' : 'Called before normal tickets')}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {URGENCY_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const label = isAmharic ? preset.labelAm : preset.labelEn;
                    const isSelected = urgencyReason === label;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setUrgencyReason(label)}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? (priority === 'URGENT' ? 'bg-rose-600 text-white shadow-xs' : 'bg-amber-600 text-white shadow-xs')
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    value={urgencyReason}
                    onChange={(e) => setUrgencyReason(e.target.value)}
                    placeholder={isAmharic ? 'ልዩ ምክንያት ይጻፉ (e.g. የህክምና ድጋፍ፣ አረጋዊ...)' : 'Enter custom reason (e.g. Medical, Senior, VIP)...'}
                    className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  <input
                    type="text"
                    value={urgencyNotes}
                    onChange={(e) => setUrgencyNotes(e.target.value)}
                    placeholder={isAmharic ? 'ተጨማሪ ማስታወሻ ለባለሙያው (አማራጭ)...' : 'Additional note for counter officer (optional)...'}
                    className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Services Grid (Ticket Generation) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {isAmharic ? 'አገልግሎት መርጠው ቲኬት ያውጡ' : 'Select Service to Issue Ticket'}
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {activeServices.length} {isAmharic ? 'ንቁ አገልግሎቶች' : 'Active Services'}
              </span>
            </div>

            {activeServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeServices.map((service) => {
                  const waitingCount = waitingTickets.filter(t => t.serviceId === service.id).length;
                  const urgentWaiting = waitingTickets.filter(t => t.serviceId === service.id && t.priority === 'URGENT').length;
                  const isUrgentSelected = priority === 'URGENT';
                  const isPrioritySelected = priority === 'PRIORITY';

                  return (
                    <button
                      key={service.id}
                      id={`btn-service-${service.prefix}`}
                      disabled={isGenerating}
                      onClick={() => handleGenerateTicket(service)}
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-44 transition group relative overflow-hidden active:scale-[0.99] cursor-pointer ${
                        isUrgentSelected
                          ? 'bg-rose-50/90 border-rose-300 hover:border-rose-500 hover:shadow-md'
                          : isPrioritySelected
                          ? 'bg-amber-50/90 border-amber-300 hover:border-amber-500 hover:shadow-md'
                          : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'
                      }`}
                    >
                      {/* Active Priority Tag on Service card */}
                      {isUrgentSelected && (
                        <div className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-xs animate-pulse">
                          <Flame className="w-2.5 h-2.5" /> URGENT
                        </div>
                      )}
                      {isPrioritySelected && (
                        <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-xs">
                          <Zap className="w-2.5 h-2.5" /> PRIORITY
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-900 font-mono font-bold text-base flex items-center justify-center transition">
                            {service.prefix}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {waitingCount} {isAmharic ? 'በመጠባበቅ ላይ' : 'waiting'}
                            {urgentWaiting > 0 && (
                              <span className="text-rose-600 font-bold ml-0.5">({urgentWaiting}⚡)</span>
                            )}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition line-clamp-1">
                          {isAmharic ? (service.nameAmharic || service.name) : service.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {isAmharic ? service.name : (service.nameAmharic || '')}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 group-hover:text-indigo-600">
                        <span className="font-bold text-[11px]">
                          {isUrgentSelected ? (isAmharic ? 'አስቸኳይ ቲኬት አውጣ' : 'Issue Urgent Ticket') : isPrioritySelected ? (isAmharic ? 'የቅድሚያ ቲኬት አውጣ' : 'Issue Priority Ticket') : (isAmharic ? 'ቲኬት አውጣ' : 'Print Ticket')}
                        </span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center py-10">
                <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  {isAmharic ? 'ምንም የሚገኙ ንቁ አገልግሎቶች የሉም' : 'No Active Services Found'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {isAmharic ? 'እባክዎ በአስተዳዳሪ ገጽ አገልግሎቶችን ያረጋግጡ ወይም ያክሉ' : 'Please configure or activate services in the Admin panel.'}
                </p>
              </div>
            )}
          </div>

          {/* Active Waiting Queue & Priority Triage Panel */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>{isAmharic ? 'በመጠባበቅ ላይ ያሉ ደንበኞች' : 'Waiting Queue & Priority Management'}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                    {waitingTickets.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isAmharic ? 'የተሰጡ ቲኬቶችን ይመልከቱ ወይም የቅድሚያ ደረጃቸውን ያስተካክሉ' : 'Monitor issued tickets and modify priority triage'}
                </p>
              </div>

              {/* Filter Pills and Search */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setPriorityFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    priorityFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isAmharic ? 'ሁሉንም' : 'All'} ({waitingTickets.length})
                </button>

                <button
                  onClick={() => setPriorityFilter('URGENT')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                    priorityFilter === 'URGENT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  <span>{isAmharic ? 'አስቸኳይ' : 'Urgent'} ({urgentCount})</span>
                </button>

                <button
                  onClick={() => setPriorityFilter('PRIORITY')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    priorityFilter === 'PRIORITY'
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>{isAmharic ? 'ቅድሚያ' : 'Priority'} ({priorityCount})</span>
                </button>

                <button
                  onClick={() => setPriorityFilter('NORMAL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    priorityFilter === 'NORMAL'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isAmharic ? 'መደበኛ' : 'Normal'} ({normalCount})
                </button>

                <div className="relative w-full sm:w-56 ml-auto">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={isAmharic ? 'በቁጥር ወይም ምክንያት ፈልግ...' : 'Search ticket or reason...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {filteredTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">{isAmharic ? 'የቲኬት ቁጥር' : 'Ticket No.'}</th>
                      <th className="py-3 px-4">{isAmharic ? 'አገልግሎት' : 'Service'}</th>
                      <th className="py-3 px-4">{isAmharic ? 'ቅድሚያ እና ምክንያት' : 'Priority & Reason'}</th>
                      <th className="py-3 px-4">{isAmharic ? 'የተሰጠበት ሰዓት' : 'Issued Time'}</th>
                      <th className="py-3 px-4 text-right">{isAmharic ? 'የቅድሚያ ማስተካከያ' : 'Priority Triage'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTickets.map((t, idx) => {
                      const isUrgent = t.priority === 'URGENT';
                      const isPriority = t.priority === 'PRIORITY';
                      return (
                        <tr 
                          key={t.id} 
                          className={`transition ${
                            isUrgent 
                              ? 'bg-rose-50/50 hover:bg-rose-50' 
                              : isPriority 
                                ? 'bg-amber-50/40 hover:bg-amber-50/70' 
                                : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-black font-mono text-sm">
                            <div className="flex items-center space-x-2">
                              <span className={isUrgent ? 'text-rose-700' : isPriority ? 'text-amber-800' : 'text-slate-900'}>
                                {t.ticketNumber}
                              </span>
                              {isUrgent && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                              )}
                            </div>
                            {t.ticketNumberAmharic && (
                              <span className="text-[11px] text-slate-400 font-sans font-normal">
                                {t.ticketNumberAmharic}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            <div>{isAmharic ? (t.serviceNameAmharic || t.serviceName) : t.serviceName}</div>
                            <div className="text-[10px] text-slate-400">
                              {isAmharic ? t.serviceName : (t.serviceNameAmharic || '')}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {isUrgent ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
                                  <Flame className="w-3 h-3 text-rose-600" />
                                  <span>{isAmharic ? 'አስቸኳይ / URGENT' : 'URGENT'}</span>
                                </span>
                                {t.urgencyReason && (
                                  <p className="text-[11px] font-bold text-rose-700">
                                    {t.urgencyReason}
                                  </p>
                                )}
                              </div>
                            ) : isPriority ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                                  <Zap className="w-3 h-3 text-amber-600" />
                                  <span>{isAmharic ? 'ቅድሚያ / PRIORITY' : 'PRIORITY'}</span>
                                </span>
                                {t.urgencyReason && (
                                  <p className="text-[11px] font-semibold text-amber-800">
                                    {t.urgencyReason}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 bg-slate-100">
                                {isAmharic ? 'መደበኛ' : 'Normal'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                            {new Date(t.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              id={`btn-triage-${t.ticketNumber}`}
                              onClick={() => handleOpenTriage(t)}
                              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                                isUrgent
                                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200'
                                  : isPriority
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200'
                                    : 'bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>
                                {isUrgent 
                                  ? (isAmharic ? 'አስቸኳይ ተቀናብሯል' : 'Urgent Set') 
                                  : (isAmharic ? 'ቅድሚያ ስጥ' : 'Flag Priority')}
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-300" />
                <p>{isAmharic ? 'በዚህ ማጣሪያ መሰረት በመጠባበቅ ላይ ያለ ደንበኛ የለም።' : 'No tickets matching current filter.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: STANDALONE TOUCHSCREEN TICKET KIOSK VIEW (For Walk-up Customers) */}
      {/* ========================================================================= */}
      {viewMode === 'KIOSK' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Kiosk Hero Banner */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-black uppercase tracking-wider">
                  <Touchpad className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'ራስ-አገዝ የቲኬት መስጫ ኪዮስክ' : 'Self-Service Touchscreen Kiosk'}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  {isAmharic 
                    ? (officeSetting?.officeNameAmharic || 'እንኳን ደህና መጡ! አገልግሎትዎን ይምረጡ') 
                    : (officeSetting?.officeName || 'Welcome! Please Touch Your Service')}
                </h2>
                <p className="text-sm sm:text-base text-indigo-100/80 font-medium">
                  {isAmharic 
                    ? 'አገልግሎትዎን ሲነኩ የወረፋ ቲኬትዎ ወዲያውኑ ይታተማል። በስክሪኑ ላይ ቁጥርዎ ሲጠራ ወደ መስኮት ይቀርባሉ።' 
                    : 'Touch the service you need to print your queue ticket and confirm your place in line.'}
                </p>
              </div>

              {/* Language Switcher for Citizen */}
              <div className="flex items-center bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
                <button
                  type="button"
                  onClick={() => setUiLanguage('AMHARIC')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    isAmharic ? 'bg-white text-indigo-900 shadow-md' : 'text-white/80 hover:text-white'
                  }`}
                >
                  አማርኛ
                </button>
                <button
                  type="button"
                  onClick={() => setUiLanguage('ENGLISH')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    !isAmharic ? 'bg-white text-indigo-900 shadow-md' : 'text-white/80 hover:text-white'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {/* Citizen Special Assistance & Priority Bar */}
          <div className="bg-amber-50/90 border-2 border-amber-200 rounded-3xl p-5 sm:p-6 space-y-3 shadow-sm">
            <div className="flex items-center space-x-2 text-amber-900">
              <Star className="w-5 h-5 text-amber-600 fill-amber-500" />
              <h3 className="text-sm sm:text-base font-black tracking-tight">
                {isAmharic ? 'ልዩ ድጋፍ ወይም ቅድሚያ ለሚሹ ደንበኞች (Special Assistance)' : 'Special Assistance & Priority Accessibility'}
              </h3>
            </div>
            <p className="text-xs text-amber-800 font-medium">
              {isAmharic 
                ? 'አረጋዊ፣ አካል ጉዳተኛ፣ ነፍሰ ጡር ወይም የህክምና አስቸኳይ ሁኔታ ካለብዎት ከታች ያለውን ልዩ ምድብ በመጫን ቀድመው አገልግሎት ያግኙ።' 
                : 'Seniors, expectant mothers, persons with disabilities, or medical emergencies are given priority assistance.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
              {URGENCY_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const label = isAmharic ? preset.labelAm : preset.labelEn;
                const isSelected = urgencyReason === label && priority !== 'NORMAL';
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPriority('PRIORITY', label)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md font-black scale-[1.02]'
                        : 'bg-white text-slate-800 border-amber-200/80 hover:bg-amber-100/60 shadow-xs'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-slate-950' : 'text-amber-600'}`} />
                    <div>
                      <div className="text-xs font-black leading-tight line-clamp-1">{label}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                        {isAmharic ? 'ቅድሚያ ይሰጣል' : 'Fast-track priority'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Large Touchscreen Service Tiles */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>{isAmharic ? 'የሚፈልጉትን አገልግሎት ይንኩ' : 'Touch Your Desired Service'}</span>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                {activeServices.length} {isAmharic ? 'አገልግሎቶች' : 'Available'}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeServices.map((service) => {
                const waitingCount = waitingTickets.filter(t => t.serviceId === service.id).length;
                const isPriorityActive = priority !== 'NORMAL';

                return (
                  <button
                    key={service.id}
                    disabled={isGenerating}
                    onClick={() => handleGenerateTicket(service)}
                    className={`p-6 sm:p-8 rounded-3xl border-2 text-left flex flex-col justify-between min-h-[220px] transition-all transform active:scale-98 shadow-md group cursor-pointer ${
                      isPriorityActive
                        ? 'bg-gradient-to-br from-amber-50 via-white to-amber-50/50 border-amber-300 hover:border-amber-500 hover:shadow-xl'
                        : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-xl'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-mono font-black text-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition">
                        {service.prefix}
                      </span>
                      
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{waitingCount} {isAmharic ? 'በመጠባበቅ' : 'in line'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 my-3">
                      <h4 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition leading-tight">
                        {isAmharic ? (service.nameAmharic || service.name) : service.name}
                      </h4>
                      <p className="text-sm font-medium text-slate-500">
                        {isAmharic ? service.name : (service.nameAmharic || '')}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Ticket className="w-4 h-4" />
                        <span>{isAmharic ? 'ቲኬት ለማውጣት ይጫኑ' : 'Touch to Print Ticket'}</span>
                      </span>
                      <div className="w-8 h-8 rounded-full bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 flex items-center justify-center transition shadow-xs">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Admin Authorization Modal for optional elevated priority assignment */}
      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {isAmharic ? 'የሰራተኛ መግቢያ እና ፈቃድ' : 'Staff Authorization'}
                  </h3>
                  <p className="text-xs text-amber-100">
                    {isAmharic ? 'የመስተንግዶ ወይም አስተዳዳሪ መለያ ያስገቡ' : 'Enter receptionist or administrator credentials'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminAuthModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminAuthorize} className="p-6 space-y-4">
              {adminAuthError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {isAmharic ? 'የተጠቃሚ ስም' : 'Username'}
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin, reception, or officer1"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {isAmharic ? 'የይለፍ ቃል' : 'Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdminAuthModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer"
                >
                  {isAmharic ? 'ተመለስ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isAuthorizingAdmin}
                  className="px-5 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isAuthorizingAdmin ? (
                    <span>{isAmharic ? 'በማረጋገጥ ላይ...' : 'Verifying...'}</span>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isAmharic ? 'ፈቃድ አረጋግጥ' : 'Authorize'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Priority Escalation / Triage Dialog Modal */}
      {triageTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                  triagePriority === 'URGENT' ? 'bg-rose-600' : triagePriority === 'PRIORITY' ? 'bg-amber-500 text-slate-950' : 'bg-slate-600'
                }`}>
                  {triagePriority === 'URGENT' ? <Flame className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-base font-bold text-slate-900">
                      {isAmharic ? 'የቅድሚያ ደረጃ ማስተካከያ' : 'Ticket Priority Triage'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {triageTicket.ticketNumber} • {isAmharic ? triageTicket.serviceNameAmharic : triageTicket.serviceName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTriageTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTriage} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {isAmharic ? 'የቅድሚያ ደረጃ ምረጥ:' : 'Select Target Priority Level:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTriagePriority('URGENT')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      triagePriority === 'URGENT'
                        ? 'bg-rose-600 text-white border-rose-600 font-black shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50'
                    }`}
                  >
                    <Flame className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-xs font-black uppercase">Urgent</div>
                    <div className="text-[10px] opacity-80">{isAmharic ? 'አስቸኳይ' : 'Highest'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTriagePriority('PRIORITY')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      triagePriority === 'PRIORITY'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                    }`}
                  >
                    <Zap className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-xs font-black uppercase">Priority</div>
                    <div className="text-[10px] opacity-80">{isAmharic ? 'ቅድሚያ' : 'High'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTriagePriority('NORMAL')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      triagePriority === 'NORMAL'
                        ? 'bg-slate-800 text-white border-slate-800 font-bold shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-xs font-bold uppercase">Normal</div>
                    <div className="text-[10px] opacity-80">{isAmharic ? 'መደበኛ' : 'Standard'}</div>
                  </button>
                </div>
              </div>

              {triagePriority !== 'NORMAL' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isAmharic ? 'የአስቸኳይነት / የቅድሚያ ምክንያት:' : 'Urgency Justification / Reason:'}
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    {URGENCY_PRESETS.map((preset) => {
                      const label = isAmharic ? preset.labelAm : preset.labelEn;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setTriageReason(label)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                            triageReason === label
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    value={triageReason}
                    onChange={(e) => setTriageReason(e.target.value)}
                    placeholder={isAmharic ? 'ምክንያት አስገባ...' : 'Specify urgency reason...'}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isAmharic ? 'ተጨማሪ ማስታወሻ ለባለሙያው:' : 'Staff Internal Notes:'}
                </label>
                <textarea
                  rows={2}
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  placeholder={isAmharic ? 'ለአገልግሎት ሰጪው የሚተላለፍ ማስታወሻ...' : 'Instructions or context for counter officer...'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setTriageTicket(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer"
                >
                  {isAmharic ? 'ተው' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPriority}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isUpdatingPriority ? (
                    <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...'}</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAmharic ? 'ቅድሚያውን አጽድቅ' : 'Apply Priority'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Print Dialog Modal */}
      <TicketPrintModal
        printData={activePrintData}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        uiLanguage={uiLanguage}
        autoPrint={autoPrintEnabled}
        onToggleAutoPrint={handleToggleAutoPrint}
      />
    </div>
  );
};
