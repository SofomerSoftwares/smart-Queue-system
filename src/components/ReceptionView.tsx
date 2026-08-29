import React, { useState } from 'react';
import { 
  Ticket, 
  Printer, 
  Sparkles, 
  PlusCircle, 
  CheckCircle, 
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
  LogIn
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { TicketPrintModal } from './TicketPrintModal';
import { PrintTicketData, Service, PriorityLevel, QueueTicket } from '../types';

const URGENCY_PRESETS = [
  { id: 'medical', labelEn: 'Medical / Health Emergency', labelAm: 'የህክምና አስቸኳይ ሁኔታ', icon: HeartPulse },
  { id: 'elderly', labelEn: 'Elderly Citizen', labelAm: 'አረጋውያን', icon: Star },
  { id: 'disability', labelEn: 'Person with Disability', labelAm: 'አካል ጉዳተኛ', icon: Accessibility },
  { id: 'pregnancy', labelEn: 'Pregnant / With Infant', labelAm: 'ነፍሰ ጡር / ሕፃን የያዘ', icon: Baby },
  { id: 'official', labelEn: 'Official Escalation', labelAm: 'አስቸኳይ የስራ ጉዳይ', icon: ShieldAlert }
];

export const ReceptionView: React.FC = () => {
  const { 
    services, 
    waitingTickets, 
    createTicket, 
    updateTicketPriority,
    uiLanguage 
  } = useQueue();

  const { user, login } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [urgencyReason, setUrgencyReason] = useState<string>('');
  const [urgencyNotes, setUrgencyNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activePrintData, setActivePrintData] = useState<PrintTicketData | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | PriorityLevel>('ALL');

  // Admin Priority Authorization Modal State
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

  const handleSelectPriority = (target: PriorityLevel) => {
    if (target === 'NORMAL') {
      setPriority('NORMAL');
      setUrgencyReason('');
      return;
    }

    if (!isAdmin) {
      setAdminAuthTargetPriority(target);
      setAdminAuthError('');
      setIsAdminAuthModalOpen(true);
      return;
    }

    setPriority(target);
    if (!urgencyReason) {
      if (target === 'URGENT') {
        setUrgencyReason(isAmharic ? 'አስቸኳይ ሁኔታ' : 'Urgent Escalation');
      } else {
        setUrgencyReason(isAmharic ? 'ቅድሚያ የሚሰጠው' : 'Priority Service');
      }
    }
  };

  const handleAdminAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) {
      setAdminAuthError(isAmharic ? 'እባክዎ የተጠቃሚ ስም እና የይለፍ ቃል ያስገቡ' : 'Please enter administrator username and password');
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
          ? `የአስተዳዳሪ ፈቃድ ተረጋግጧል፡ የ${adminAuthTargetPriority === 'URGENT' ? 'አስቸኳይ' : 'ቅድሚያ'} ቲኬት መስጫ ተፈቅዷል!` 
          : `Admin authorized: ${adminAuthTargetPriority} ticket issuance enabled!`
      );
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err: any) {
      setAdminAuthError(
        err.message || (isAmharic ? 'የአስተዳዳሪ ማረጋገጫ አልተሳካም። እባክዎ ትክክለኛ መረጃ ያስገቡ።' : 'Admin authorization failed. Invalid credentials.')
      );
    } finally {
      setIsAuthorizingAdmin(false);
    }
  };

  const handleGenerateTicket = async (service: Service) => {
    try {
      setIsGenerating(true);
      if ((priority === 'PRIORITY' || priority === 'URGENT') && !isAdmin) {
        setAdminAuthTargetPriority(priority);
        setIsAdminAuthModalOpen(true);
        return;
      }

      const effectivePriority = isAdmin ? priority : 'NORMAL';
      const res = await createTicket(service.id, effectivePriority, urgencyReason || undefined, urgencyNotes || undefined);
      setActivePrintData(res.printData);
      setIsPrintModalOpen(true);
      setPriority('NORMAL'); // Reset to normal priority
      setUrgencyReason('');
      setUrgencyNotes('');
    } catch (err: any) {
      alert(`Error generating ticket: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenTriage = (ticket: QueueTicket) => {
    if (!isAdmin) {
      setAdminAuthTargetPriority(ticket.priority === 'NORMAL' ? 'URGENT' : ticket.priority);
      setAdminAuthError('');
      setIsAdminAuthModalOpen(true);
      setActionNotice(
        isAmharic 
          ? 'የቅድሚያ ደረጃ ለመቀየር የአስተዳዳሪ (Admin) ፈቃድ ያስፈልጋል።' 
          : 'Admin authorization required to modify ticket priority.'
      );
      setTimeout(() => setActionNotice(''), 4000);
      return;
    }
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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar & Priority Mode Selection */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {isAmharic ? 'የመስተንግዶ እና የቲኬት መስጫ ጣቢያ' : 'Reception & Ticket Kiosk'}
                </h1>
                {isAdmin ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>{isAmharic ? 'አስተዳዳሪ' : 'Admin'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                    <span>{isAmharic ? 'መደበኛ ተጠቃሚ' : 'Standard'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {isAmharic 
                  ? 'የደንበኛውን አገልግሎት መርጠው ቲኬት ያውጡ፤ የቅድሚያ እና አስቸኳይ ቲኬቶች በአስተዳዳሪ (Admin) ፈቃድ ይሰጣሉ' 
                  : 'Issue queue tickets. Priority and Urgent classifications must be authorized and issued by an Administrator'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto-Print Toggle Setting */}
            <div className="flex items-center space-x-2 bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 rounded-xl">
              <Printer className={`w-4 h-4 ${autoPrintEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {isAmharic ? 'አውቶማቲክ ህትመት' : 'Auto-Print'}
                </span>
                <span className="text-[9px] text-slate-500">
                  {autoPrintEnabled 
                    ? (isAmharic ? 'ሲወጣ ወዲያው ይታተማል' : 'Instant Print Dialog') 
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

            {/* Admin Authorization Status Pill */}
            {isAdmin ? (
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300/80 text-amber-900 rounded-xl text-xs font-bold">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>{isAmharic ? 'የአስተዳዳሪ ፈቃድ አለ' : 'Admin Authorized'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAdminAuthTargetPriority('PRIORITY');
                  setAdminAuthError('');
                  setIsAdminAuthModalOpen(true);
                }}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium transition cursor-pointer"
                title={isAmharic ? 'የአስተዳዳሪ መለያ አስገባ' : 'Authenticate as Admin for Priority Issuance'}
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>{isAmharic ? 'የቅድሚያ ፈቃድ አረጋግጥ' : 'Admin Priority Auth'}</span>
              </button>
            )}

            {/* 3-Tier Priority Option Selector (Strictly requires Admin for PRIORITY and URGENT) */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              {/* NORMAL */}
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

              {/* PRIORITY / VIP */}
              <button
                type="button"
                id="btn-priority-priority"
                onClick={() => handleSelectPriority('PRIORITY')}
                title={!isAdmin ? (isAmharic ? 'የቅድሚያ ቲኬት በአስተዳዳሪ (Admin) ብቻ ይሰጣል' : 'Priority tickets must be issued by an Admin') : undefined}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  priority === 'PRIORITY'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-amber-800'
                }`}
              >
                {!isAdmin ? (
                  <Lock className="w-3 h-3 text-amber-600" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>{isAmharic ? 'ቅድሚያ / VIP' : 'Priority'}</span>
                {!isAdmin && (
                  <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-normal">
                    Admin
                  </span>
                )}
              </button>

              {/* URGENT ESCALATION */}
              <button
                type="button"
                id="btn-priority-urgent"
                onClick={() => handleSelectPriority('URGENT')}
                title={!isAdmin ? (isAmharic ? 'አስቸኳይ ቲኬት በአስተዳዳሪ (Admin) ብቻ ይሰጣል' : 'Urgent tickets must be issued by an Admin') : undefined}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  priority === 'URGENT'
                    ? 'bg-rose-600 text-white shadow-xs font-black animate-pulse'
                    : 'text-rose-700 hover:bg-rose-100/60'
                }`}
              >
                {!isAdmin ? (
                  <Lock className="w-3 h-3 text-rose-500" />
                ) : (
                  <Flame className="w-3.5 h-3.5 text-rose-200" />
                )}
                <span>{isAmharic ? '⚡ አስቸኳይ' : '⚡ Urgent'}</span>
                {!isAdmin && (
                  <span className="text-[9px] px-1 py-0.2 bg-rose-100 text-rose-800 rounded font-normal">
                    Admin
                  </span>
                )}
              </button>
            </div>
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
                    ? (isAmharic ? 'የአስቸኳይነት ምክንያት ይምረጡ ወይም ያስገቡ (በአስተዳዳሪ የተፈቀደ):' : 'Select or enter urgency escalation reason (Admin Authorized):')
                    : (isAmharic ? 'የቅድሚያ አገልግሎት ምክንያት (በአስተዳዳሪ የተፈቀደ):' : 'Reason for priority consideration (Admin Authorized):')}
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

            {/* Presets */}
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
            {isAmharic ? 'አገልግሎት ይምረጡ' : 'Select Service to Issue Ticket'}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {services.filter(s => s.isActive !== false).length} {isAmharic ? 'ንቁ አገልግሎቶች' : 'Active Services'}
          </span>
        </div>

        {services.filter(s => s.isActive !== false).length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <Ticket className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {isAmharic ? 'ምንም ንቁ አገልግሎት አልተገኘም' : 'No active services available'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAmharic ? 'እባክዎ በአስተዳዳሪ ክፍል ውስጥ አገልግሎቶችን ያክሉ ወይም ያንቁ' : 'Please configure or activate services in the Admin panel'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {services.filter(s => s.isActive !== false).map((service) => {
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
                    <span className="font-medium text-[11px]">
                      {isUrgentSelected ? (isAmharic ? 'አስቸኳይ ቲኬት አውጣ' : 'Issue Urgent Ticket') : isPrioritySelected ? (isAmharic ? 'የቅድሚያ ቲኬት አውጣ' : 'Issue Priority Ticket') : (isAmharic ? 'ቲኬት አውጣ' : 'Print Ticket')}
                    </span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Waiting Queue & Priority Triage Panel */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>{isAmharic ? 'በመጠባበቅ ላይ ያሉ ደንበኞች' : 'Waiting Queue & Priority Management'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {waitingTickets.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isAmharic ? 'የተሰጡ ቲኬቶችን ይመልከቱ ወይም የቅድሚያ ደረጃቸውን በአስተዳዳሪ ይለውጡ' : 'Monitor issued tickets and perform priority escalation / triage by Admin'}
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
              <span>{isAmharic ? 'ቅድሚያ (VIP)' : 'Priority'} ({priorityCount})</span>
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
                  <th className="py-3 px-4 text-right">{isAmharic ? 'የአስተዳዳሪ ቅድሚያ ቀይር' : 'Admin Triage'}</th>
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
                          {!isAdmin && <Lock className="w-3 h-3 text-slate-400 mr-0.5" />}
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

      {/* Admin Authorization Modal for Priority Issuance / Triage */}
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
                    {isAmharic ? 'የአስተዳዳሪ የቅድሚያ ፈቃድ' : 'Admin Priority Authorization'}
                  </h3>
                  <p className="text-xs text-amber-100">
                    {isAmharic 
                      ? 'የቅድሚያ እና አስቸኳይ ቲኬት በአስተዳዳሪ ብቻ ነው የሚሰጠው' 
                      : 'Priority & Urgent tickets must be authorized by an Administrator'}
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
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-2.5 text-amber-900 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">
                  {isAmharic 
                    ? `ለዚህ ደንበኛ "${adminAuthTargetPriority === 'URGENT' ? 'አስቸኳይ (Urgent)' : 'ቅድሚያ (Priority/VIP)'}" ቲኬት ለመስጠት እባክዎ የአስተዳዳሪ መለያዎን ያስገቡ።` 
                    : `To issue a "${adminAuthTargetPriority}" ticket, an authorized Administrator must provide login credentials.`}
                </p>
              </div>

              {adminAuthError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {isAmharic ? 'የአስተዳዳሪ የተጠቃሚ ስም' : 'Admin Username'}
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
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
                      <span>{isAmharic ? 'ፈቃድ አረጋግጥ' : 'Authorize Priority'}</span>
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
                      {isAmharic ? 'የአስተዳዳሪ የቅድሚያ ማስተካከያ' : 'Admin Ticket Triage'}
                    </h3>
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {triageTicket.ticketNumber} • {isAmharic ? triageTicket.serviceNameAmharic : triageTicket.serviceName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTriageTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
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

