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
  ArrowRight
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { TicketPrintModal } from './TicketPrintModal';
import { PrintTicketData, Service } from '../types';

export const ReceptionView: React.FC = () => {
  const { 
    services, 
    waitingTickets, 
    createTicket, 
    uiLanguage 
  } = useQueue();

  const [priority, setPriority] = useState<'NORMAL' | 'PRIORITY'>('NORMAL');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activePrintData, setActivePrintData] = useState<PrintTicketData | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isAmharic = uiLanguage === 'AMHARIC';

  const handleGenerateTicket = async (service: Service) => {
    try {
      setIsGenerating(true);
      const res = await createTicket(service.id, priority);
      setActivePrintData(res.printData);
      setIsPrintModalOpen(true);
      setPriority('NORMAL'); // Reset to normal priority
    } catch (err: any) {
      alert(`Error generating ticket: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTickets = waitingTickets.filter(t => 
    t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.serviceNameAmharic && t.serviceNameAmharic.includes(searchQuery))
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {isAmharic ? 'የመስተንግዶ እና የቲኬት መስጫ ጣቢያ' : 'Reception & Ticket Kiosk'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {isAmharic ? 'የሚፈለገውን አገልግሎት በመምረጥ የወረፋ ቲኬት ያውጡ' : 'Select a service below to generate sequential anonymous ticket'}
              </p>
            </div>
          </div>
        </div>

        {/* Priority Option Selector */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setPriority('NORMAL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              priority === 'NORMAL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isAmharic ? 'መደበኛ ተራ' : 'Normal Priority'}
          </button>
          <button
            type="button"
            onClick={() => setPriority('PRIORITY')}
            className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              priority === 'PRIORITY'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-amber-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-900" />
            <span>{isAmharic ? 'አስቸኳይ / ቅድሚያ' : 'VIP / Priority'}</span>
          </button>
        </div>
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
            return (
              <button
                key={service.id}
                id={`btn-service-${service.prefix}`}
                disabled={isGenerating}
                onClick={() => handleGenerateTicket(service)}
                className="group text-left p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-600 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm transition-transform group-hover:scale-105"
                    style={{ backgroundColor: service.color || '#4f46e5' }}
                  >
                    {service.prefix}
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition">
                    {countWaiting} {isAmharic ? 'በወረፋ' : 'Waiting'}
                  </span>
                </div>

                <div className="mt-5">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {isAmharic ? service.nameAmharic : service.name}
                  </h3>
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

      {/* Active Waiting Queue List */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {isAmharic ? 'አሁን በመጠባበቅ ላይ ያሉ ቲኬቶች' : 'Live Waiting Queue'}
            </h2>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full font-mono border border-indigo-100">
              {waitingTickets.length}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={isAmharic ? 'በቁጥር ወይም በአገልግሎት ፈልግ...' : 'Search ticket...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
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
                  <th className="py-3 px-4">{isAmharic ? 'ቅድሚያ' : 'Priority'}</th>
                  <th className="py-3 px-4">{isAmharic ? 'የተሰጠበት ሰዓት' : 'Issued Time'}</th>
                  
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTickets.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900 font-mono text-sm">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {isAmharic ? (t.serviceNameAmharic || t.serviceName) : t.serviceName}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.priority === 'PRIORITY' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {isAmharic ? 'ቅድሚያ' : 'VIP'}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-normal">Normal</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                      {new Date(t.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs">
            {isAmharic ? 'በአሁኑ ሰዓት በመጠባበቅ ላይ ያለ ደንበኛ የለም።' : 'No tickets in waiting line.'}
          </div>
        )}
      </div>

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
