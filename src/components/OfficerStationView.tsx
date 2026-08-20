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
  CheckCircle
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { Service, QueueTicket } from '../types';

export const OfficerStationView: React.FC = () => {
  const { user } = useAuth();
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
    uiLanguage 
  } = useQueue();

  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferTargetServiceId, setTransferTargetServiceId] = useState<string>('');
  const [serviceTimerSeconds, setServiceTimerSeconds] = useState<number>(0);

  const isAmharic = uiLanguage === 'AMHARIC';

  // Initialize counter from assigned counter or first available counter
  useEffect(() => {
    if (!selectedCounterId && counters.length > 0) {
      if (user?.assignedCounterId) {
        setSelectedCounterId(user.assignedCounterId);
      } else {
        setSelectedCounterId(counters[0].id);
      }
    }
  }, [counters, user, selectedCounterId]);

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

  // Actions
  const handleCallNext = async (specificTicketId?: string) => {
    if (!selectedCounterId) return;
    try {
      setIsCalling(true);
      const res = await callNextTicket(selectedCounterId, specificTicketId);
      if (!res.success && res.message) {
        alert(res.message);
      }
    } finally {
      setIsCalling(false);
    }
  };

  const handleRecall = async () => {
    if (!currentTicket) return;
    await recallTicket(currentTicket.id);
  };

  const handleStart = async () => {
    if (!currentTicket) return;
    await startService(currentTicket.id);
  };

  const handleComplete = async () => {
    if (!currentTicket) return;
    await completeTicket(currentTicket.id);
  };

  const handleNoShow = async () => {
    if (!currentTicket) return;
    if (confirm(isAmharic ? 'ደንበኛው አልቀረበም ተብሎ ይመዝገብ?' : 'Mark customer as No-Show?')) {
      await markNoShow(currentTicket.id);
    }
  };

  const handleTransfer = async () => {
    if (!currentTicket || !transferTargetServiceId) return;
    await transferTicket(currentTicket.id, transferTargetServiceId);
    setShowTransferModal(false);
    setTransferTargetServiceId('');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Header Bar with Counter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isAmharic ? 'የአገልግሎት ሰጪ ጣቢያ' : 'Service Officer Station'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {user ? `${user.name} • ${user.role}` : (isAmharic ? 'አገልግሎት ሰጪ' : 'Counter Officer')}
            </p>
          </div>
        </div>

        {/* Counter Selection Tabs */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {isAmharic ? 'ቆጣሪ:' : 'Station:'}
          </span>
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
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
                  {isAmharic ? `ቆጣሪ 0${c.number}` : `COUNTER 0${c.number}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Officer Station Left & Live Preview / Upcoming Queue Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 7 Columns: Currently Serving Hero Section & Metric Cards */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Active Serving Section */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden min-h-[420px]">
            
            {/* Top Right Counter Pill */}
            <div className="absolute top-0 right-0 p-6">
              <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-base border border-indigo-100">
                {isAmharic 
                  ? `ቆጣሪ 0${activeCounter?.number || 1}` 
                  : `COUNTER 0${activeCounter?.number || 1}`}
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
                    {isAmharic ? 'በአሁኑ ሰዓት በቆጣሪዎ ላይ የተጠራ ደንበኛ የለም።' : 'No customer currently at this counter.'}
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
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold py-5 rounded-xl shadow-lg shadow-indigo-100 flex flex-col items-center justify-center gap-1 transition"
              >
                <span className="text-lg uppercase tracking-wider">
                  {isAmharic ? 'ቀጣይ ጥራ' : 'Call Next'}
                </span>
                <span className="text-xs opacity-80 font-normal italic">
                  {isAmharic ? 'Call Next Customer' : 'ቀጣዩን ጥራ'}
                </span>
              </button>

              {/* Recall Button */}
              <button
                id="btn-recall-ticket"
                disabled={!currentTicket}
                onClick={handleRecall}
                className="bg-white border-2 border-slate-200 hover:border-slate-300 active:scale-[0.99] text-slate-700 font-bold py-5 rounded-xl flex flex-col items-center justify-center gap-1 transition disabled:opacity-50"
              >
                <span className="text-lg uppercase tracking-wider">
                  {isAmharic ? 'ድገም ጥራ' : 'Recall'}
                </span>
                <span className="text-xs text-slate-400 font-normal italic">
                  {isAmharic ? 'Re-announce' : 'እንደገና ጥራ'}
                </span>
              </button>

              {/* Complete Button */}
              <button
                id="btn-complete-ticket"
                disabled={!currentTicket}
                onClick={handleComplete}
                className="bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold py-5 rounded-xl shadow-lg shadow-emerald-100 flex flex-col items-center justify-center gap-1 transition disabled:opacity-50"
              >
                <span className="text-lg uppercase tracking-wider">
                  {isAmharic ? 'ጨርስ' : 'Complete'}
                </span>
                <span className="text-xs opacity-80 font-normal italic">
                  {isAmharic ? 'Finish Service' : 'ጨርስ'}
                </span>
              </button>

              {/* No Show Button */}
              <button
                id="btn-no-show-ticket"
                disabled={!currentTicket}
                onClick={handleNoShow}
                className="bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 active:scale-[0.99] font-bold py-5 rounded-xl flex flex-col items-center justify-center gap-1 transition disabled:opacity-50"
              >
                <span className="text-lg uppercase tracking-wider">
                  {isAmharic ? 'አልቀረበም' : 'No Show'}
                </span>
                <span className="text-xs text-rose-400 font-normal italic">
                  {isAmharic ? 'Mark Absent' : 'አልተገኘም'}
                </span>
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
                  ? `ወደ ቆጣሪ 0${activeCounter?.number || 1} ይሂዱ` 
                  : `Proceed to Counter 0${activeCounter?.number || 1}`}
              </div>
              
              <div className="w-full grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    {isAmharic ? 'ቀጣይ ተራ' : 'Next Up'}
                  </p>
                  <p className="text-xl font-bold font-mono text-white mt-0.5">
                    {waitingTickets[0]?.ticketNumber || '--'}
                  </p>
                </div>
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    {isAmharic ? 'ቀጣይ ተራ' : 'Next Up'}
                  </p>
                  <p className="text-xl font-bold font-mono text-white mt-0.5">
                    {waitingTickets[1]?.ticketNumber || '--'}
                  </p>
                </div>
              </div>
            </div>

            {/* Audio Waveform / Gemini Synthesis Indicator */}
            <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="flex gap-1 items-end h-5">
                  <div className="w-1 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                  <div className="w-1 h-5 bg-indigo-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isAmharic ? 'Gemini AI የአማርኛ ድምፅ ማስታወቂያ ዝግጁ' : 'Gemini AI Amharic Audio Active...'}
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Queue List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[340px] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">
                {isAmharic ? 'የሚጠባበቁ ደንበኞች' : 'Upcoming Queue'}
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                {waitingTickets.length} {isAmharic ? 'በወረፋ ውስጥ' : 'People in Queue'}
              </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              {waitingTickets.length > 0 ? (
                waitingTickets.map((ticket, idx) => (
                  <div 
                    key={ticket.id}
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800 font-mono text-sm">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium uppercase border border-indigo-100">
                        {ticket.serviceName.split(' ')[0]}
                      </span>
                      {ticket.priority === 'PRIORITY' && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold">
                          VIP
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400 italic">
                        {ticket.ticketNumberAmharic || ''}
                      </span>
                      <button
                        onClick={() => handleCallNext(ticket.id)}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        {isAmharic ? 'ጥራ' : 'Call'}
                      </button>
                    </div>
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
    </div>
  );
};
