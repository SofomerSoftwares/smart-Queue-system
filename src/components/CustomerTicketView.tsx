import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Search, 
  Clock, 
  Users, 
  CheckCircle, 
  Bell, 
  ArrowRight, 
  AlertCircle,
  Radio,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { api } from '../lib/api';
import { useQueue } from '../context/QueueContext';
import { QueueTicket } from '../types';

export const CustomerTicketView: React.FC = () => {
  const { uiLanguage, officeSetting } = useQueue();
  const [ticketQuery, setTicketQuery] = useState<string>('A-024');
  const [ticketData, setTicketData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isAmharic = uiLanguage === 'AMHARIC';

  const fetchTicket = async (num: string) => {
    if (!num.trim()) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await api.getPublicTicket(num.trim().toUpperCase());
      if (res.success) {
        setTicketData(res.ticket);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ticket not found.');
      setTicketData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket(ticketQuery);
    const interval = setInterval(() => {
      if (ticketQuery) fetchTicket(ticketQuery);
    }, 4000);
    return () => clearInterval(interval);
  }, [ticketQuery]);

  const isCalled = ticketData?.status === 'CALLED' || ticketData?.status === 'SERVING';

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Phone Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 text-center relative overflow-hidden">
        <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm font-bold text-lg">
          <Smartphone className="w-5 h-5" />
        </div>

        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          {isAmharic ? (officeSetting?.officeNameAmharic || 'የቀጥታ የወረፋ መከታተያ') : (officeSetting?.officeName || 'Live Queue Tracker')}
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          {isAmharic ? 'የወረፋ ቁጥርዎን በማስገባት ደረጃዎን ይከታተሉ' : 'Track your queue position anonymously'}
        </p>

        {/* Ticket Search Bar */}
        <div className="mt-4 flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200">
          <input
            type="text"
            placeholder="e.g. A-024"
            value={ticketQuery}
            onChange={(e) => setTicketQuery(e.target.value.toUpperCase())}
            className="w-full bg-transparent px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none uppercase"
          />
          <button
            onClick={() => fetchTicket(ticketQuery)}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            {isAmharic ? 'ፈልግ' : 'Check'}
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Ticket Status Card */}
      {ticketData && (
        <div className={`bg-white rounded-2xl p-6 shadow-xs border transition-all ${
          isCalled ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-200'
        }`}>
          
          {/* Urgent "Called" Alarm Banner */}
          {isCalled && (
            <div className="mb-4 p-4 bg-indigo-600 text-white rounded-xl text-center space-y-1 shadow-md shadow-indigo-200 animate-pulse">
              <div className="flex items-center justify-center space-x-1.5 font-black text-sm">
                <Bell className="w-4 h-4" />
                <span>{isAmharic ? 'ተራዎ ደርሷል!' : 'YOUR NUMBER IS CALLED!'}</span>
              </div>
              <div className="text-xs font-semibold text-indigo-100">
                {isAmharic ? `እባክዎ ወደ ቆጣሪ 0${ticketData.counterNumber || 1} ይሂዱ` : `Please proceed to Counter 0${ticketData.counterNumber || 1}`}
              </div>
            </div>
          )}

          <div className="text-center space-y-2 pb-4 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {isAmharic ? 'የእርስዎ ቲኬት ቁጥር' : 'YOUR TICKET NUMBER'}
            </span>
            <div className="text-6xl font-black text-slate-900 font-mono tracking-tight">
              {ticketData.ticketNumber}
            </div>

            {ticketData.ticketNumberAmharic && (
              <div className="text-lg font-bold text-slate-400 font-sans italic">
                {ticketData.ticketNumberAmharic}
              </div>
            )}

            <div className="text-sm font-bold text-slate-700">
              {isAmharic ? (ticketData.serviceNameAmharic || ticketData.serviceName) : ticketData.serviceName}
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${isCalled ? 'bg-indigo-600 animate-ping' : 'bg-amber-500'}`} />
              <span>{ticketData.status}</span>
            </div>
          </div>

          {/* Stats Grid: People Ahead & Estimated Wait */}
          <div className="grid grid-cols-2 gap-3 py-4 border-b border-slate-100">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <div className="text-slate-400 text-xs flex items-center justify-center space-x-1 mb-1 font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'ከፊትዎ ያሉ' : 'Ahead'}</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {ticketData.peopleAhead}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {isAmharic ? 'ደንበኞች' : 'Customers'}
              </div>
            </div>

            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-center">
              <div className="text-indigo-700 text-xs flex items-center justify-center space-x-1 mb-1 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'ግምታዊ ጊዜ' : 'Est. Wait'}</span>
              </div>
              <div className="text-2xl font-black text-indigo-900 font-mono">
                ~{ticketData.estimatedWaitMinutes}
              </div>
              <div className="text-[10px] text-indigo-600 font-medium">
                {isAmharic ? 'ደቂቃ' : 'Minutes'}
              </div>
            </div>
          </div>

          {/* Currently Serving in Service */}
          <div className="pt-4 flex items-center justify-between text-xs text-slate-600">
            <span>{isAmharic ? 'አሁን በመስተናገድ ላይ:' : 'Currently Serving:'}</span>
            <span className="font-bold font-mono text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {ticketData.currentlyServingTicketNumber || 'None'}
            </span>
          </div>

          {/* Privacy Guarantee */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-center text-slate-400 flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>{isAmharic ? 'ምንም አይነት የግል መረጃ አይጠየቅም' : '100% Anonymous • Zero PII stored'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
