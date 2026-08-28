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
  FileText
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
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

  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [urgencyReason, setUrgencyReason] = useState<string>('');
  const [urgencyNotes, setUrgencyNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activePrintData, setActivePrintData] = useState<PrintTicketData | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | PriorityLevel>('ALL');

  // Priority Triage Modal state
  const [triageTicket, setTriageTicket] = useState<QueueTicket | null>(null);
  const [triagePriority, setTriagePriority] = useState<PriorityLevel>('URGENT');
  const [triageReason, setTriageReason] = useState<string>('');
  const [triageNotes, setTriageNotes] = useState<string>('');
  const [isUpdatingPriority, setIsUpdatingPriority] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string>('');

  const isAmharic = uiLanguage === 'AMHARIC';

  const handleGenerateTicket = async (service: Service) => {
    try {
      setIsGenerating(true);
      const res = await createTicket(service.id, priority, urgencyReason || undefined, urgencyNotes || undefined);
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
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {isAmharic ? 'የመስተንግዶ እና የቲኬት መስጫ ጣቢያ' : 'Reception & Ticket Kiosk'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {isAmharic 
                  ? 'የደንበኛውን ሁኔታ መርጠው ቲኬት ያውጡ ወይም አስቸኳይ ጉዳዮችን ቅድሚያ ይስጡ' 
                  : 'Issue tickets with priority classification or triage urgency for queue sorting'}
              </p>
            </div>
          </div>

          {/* 3-Tier Priority Option Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {/* NORMAL */}
            <button
              type="button"
              id="btn-priority-normal"
              onClick={() => {
                setPriority('NORMAL');
                setUrgencyReason('');
              }}
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
              onClick={() => {
                setPriority('PRIORITY');
                if (!urgencyReason) setUrgencyReason(isAmharic ? 'ቅድሚያ የሚሰጠው' : 'Priority Service');
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                priority === 'PRIORITY'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-amber-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'ቅድሚያ / VIP' : 'Priority'}</span>
            </button>

            {/* URGENT ESCALATION */}
            <button
              type="button"
              id="btn-priority-urgent"
              onClick={() => {
                setPriority('URGENT');
                if (!urgencyReason) setUrgencyReason(isAmharic ? 'አስቸኳይ ሁኔታ' : 'Urgent Escalation');
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                priority === 'URGENT'
                  ? 'bg-rose-600 text-white shadow-xs font-black animate-pulse'
                  : 'text-rose-700 hover:bg-rose-100/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-200" />
              <span>{isAmharic ? '⚡ አስቸኳይ (URGENT)' : '⚡ Urgent (Urgent)'}</span>
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
                placeholder={isAmharic ? 'ምክንያት (ለምሳሌ፦ የደም ግፊት ህመም፣ አረጋዊ...)' : 'Custom urgency reason...'}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <input
                type="text"
                value={urgencyNotes}
                onChange={(e) => setUrgencyNotes(e.target.value)}
                placeholder={isAmharic ? 'ተጨማሪ ማስታወሻ ለባለሙያው (አማራጭ)...' : 'Internal notes for service officer (optional)...'}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* Service Selection Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {isAmharic ? 'አገልግሎት ይምረጡ / SELECT SERVICE' : 'SELECT SERVICE TO ISSUE TICKET'}
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            {services.length} {isAmharic ? 'የተዘጋጁ አገልግሎቶች' : 'Available Services'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => {
            const countWaiting = waitingTickets.filter(t => t.serviceId === service.id).length;
            const urgentWaiting = waitingTickets.filter(t => t.serviceId === service.id && t.priority === 'URGENT').length;
            return (
              <button
                key={service.id}
                id={`btn-service-${service.prefix}`}
                disabled={isGenerating}
                onClick={() => handleGenerateTicket(service)}
                className="group text-left p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-600 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm transition-transform group-hover:scale-105"
                    style={{ backgroundColor: service.color || '#4f46e5' }}
                  >
                    {service.prefix}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {urgentWaiting > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-0.5">
                        <Flame className="w-2.5 h-2.5" />
                        <span>{urgentWaiting}</span>
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition">
                      {countWaiting} {isAmharic ? 'በወረፋ' : 'Waiting'}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {isAmharic ? service.nameAmharic : service.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {isAmharic ? service.name : service.nameAmharic}
                  </p>
                  {service.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-2.5 leading-relaxed font-normal">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                  <span className="flex items-center space-x-1.5 text-slate-500 font-normal">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>~{service.estimatedDurationMinutes} {isAmharic ? 'ደቂቃ' : 'mins'}</span>
                  </span>
                  <span className="flex items-center space-x-1 font-bold group-hover:translate-x-1 transition-transform">
                    <span>{isAmharic ? 'ቲኬት አውጣ' : 'Issue Ticket'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Waiting Queue List & Triage Management */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  {isAmharic ? 'በመጠባበቅ ላይ ያሉ ቲኬቶች እና ቅድሚያ አሰጣጥ' : 'Live Waiting Queue & Priority Triage'}
                </h2>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full font-mono border border-indigo-100">
                  {waitingTickets.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAmharic ? 'የመስተንግዶ ባለሙያዎች አስቸኳይ ደንበኞችን ወደ ፊት በማምጣት ለባለሙያው ማስተላለፍ ይችላሉ' : 'Reception staff can flag or escalate urgent tickets for prioritized service in the officer dashboard'}
              </p>
            </div>
          </div>

          {/* Quick Stats & Priority Filter Chips */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setPriorityFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                priorityFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAmharic ? 'ሁሉም' : 'All'} ({waitingTickets.length})
            </button>

            <button
              onClick={() => setPriorityFilter('URGENT')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                priorityFilter === 'URGENT'
                  ? 'bg-rose-600 text-white'
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
                  ? 'bg-amber-500 text-slate-950 font-extrabold'
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
                  <th className="py-3 px-4 text-right">{isAmharic ? 'ቅድሚያ ቀይር (Triage)' : 'Manage Priority'}</th>
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
                  <h3 className="text-base font-bold text-slate-900">
                    {isAmharic ? 'የቲኬት ቅድሚያ ማስተካከያ' : 'Flag Ticket Priority'}
                  </h3>
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
      />
    </div>
  );
};

