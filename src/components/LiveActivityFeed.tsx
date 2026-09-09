import React, { useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import { QueueTicket, PriorityLevel } from '../types';
import { Activity, Clock, CheckCircle2, UserX, AlertCircle, XCircle, ArrowRight } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'ISSUED' | 'CALLED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  ticketNumber: string;
  serviceName: string;
  serviceNameAmharic: string;
  counterNumber?: number;
  officerName?: string;
  timestamp: Date;
  priority: PriorityLevel;
}

export const LiveActivityFeed: React.FC = () => {
  const { waitingTickets, servingTickets, completedTickets, uiLanguage } = useQueue();
  const isAmharic = uiLanguage === 'AMHARIC';

  const events = useMemo(() => {
    const allEvents: ActivityEvent[] = [];
    const allTickets = [...waitingTickets, ...servingTickets, ...completedTickets];

    allTickets.forEach(ticket => {
      // 1. Issue Event
      if (ticket.issuedAt) {
        allEvents.push({
          id: `${ticket.id}-issued`,
          type: 'ISSUED',
          ticketNumber: ticket.ticketNumber,
          serviceName: ticket.serviceName,
          serviceNameAmharic: ticket.serviceNameAmharic,
          timestamp: new Date(ticket.issuedAt),
          priority: ticket.priority,
        });
      }

      // 2. Called / Serving Event
      if (ticket.calledAt || ticket.serviceStartedAt) {
        allEvents.push({
          id: `${ticket.id}-called`,
          type: 'CALLED',
          ticketNumber: ticket.ticketNumber,
          serviceName: ticket.serviceName,
          serviceNameAmharic: ticket.serviceNameAmharic,
          counterNumber: ticket.counterNumber,
          officerName: ticket.officerName,
          timestamp: new Date(ticket.serviceStartedAt || ticket.calledAt!),
          priority: ticket.priority,
        });
      }

      // 3. Completed / No Show / Cancelled Event
      if (ticket.status === 'COMPLETED' && ticket.completedAt) {
        allEvents.push({
          id: `${ticket.id}-completed`,
          type: 'COMPLETED',
          ticketNumber: ticket.ticketNumber,
          serviceName: ticket.serviceName,
          serviceNameAmharic: ticket.serviceNameAmharic,
          counterNumber: ticket.counterNumber,
          officerName: ticket.officerName,
          timestamp: new Date(ticket.completedAt),
          priority: ticket.priority,
        });
      } else if (ticket.status === 'NO_SHOW' && ticket.completedAt) {
        allEvents.push({
          id: `${ticket.id}-noshow`,
          type: 'NO_SHOW',
          ticketNumber: ticket.ticketNumber,
          serviceName: ticket.serviceName,
          serviceNameAmharic: ticket.serviceNameAmharic,
          counterNumber: ticket.counterNumber,
          officerName: ticket.officerName,
          timestamp: new Date(ticket.completedAt),
          priority: ticket.priority,
        });
      } else if (ticket.status === 'CANCELLED' && ticket.completedAt) {
        allEvents.push({
          id: `${ticket.id}-cancelled`,
          type: 'CANCELLED',
          ticketNumber: ticket.ticketNumber,
          serviceName: ticket.serviceName,
          serviceNameAmharic: ticket.serviceNameAmharic,
          counterNumber: ticket.counterNumber,
          officerName: ticket.officerName,
          timestamp: new Date(ticket.completedAt),
          priority: ticket.priority,
        });
      }
    });

    // Sort descending by timestamp
    return allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 50);
  }, [waitingTickets, servingTickets, completedTickets]);

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'ISSUED': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'CALLED': return <ArrowRight className="w-4 h-4 text-amber-500" />;
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'NO_SHOW': return <UserX className="w-4 h-4 text-slate-400" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getEventBg = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'ISSUED': return 'bg-blue-50 border-blue-100';
      case 'CALLED': return 'bg-amber-50 border-amber-100';
      case 'COMPLETED': return 'bg-emerald-50 border-emerald-100';
      case 'NO_SHOW': return 'bg-slate-50 border-slate-200';
      case 'CANCELLED': return 'bg-rose-50 border-rose-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    if (Math.floor(seconds) <= 10) return 'just now';
    return Math.floor(seconds) + ' seconds ago';
  };

  const getEventMessage = (event: ActivityEvent) => {
    const sName = isAmharic && event.serviceNameAmharic ? event.serviceNameAmharic : event.serviceName;
    
    if (isAmharic) {
      switch (event.type) {
        case 'ISSUED': return <><span className="font-bold text-slate-900">{event.ticketNumber}</span> ለ {sName} ተመዝግቧል</>;
        case 'CALLED': return <><span className="font-bold text-slate-900">{event.ticketNumber}</span> ወደ ኮንተር {event.counterNumber} ተጠርቷል</>;
        case 'COMPLETED': return <><span className="font-bold text-slate-900">{event.ticketNumber}</span> ተስተናግዶ አልቋል (ኮንተር {event.counterNumber})</>;
        case 'NO_SHOW': return <><span className="font-bold text-slate-900">{event.ticketNumber}</span> አልተገኘም (ኮንተር {event.counterNumber})</>;
        case 'CANCELLED': return <><span className="font-bold text-slate-900">{event.ticketNumber}</span> ተሰርዟል</>;
      }
    } else {
      switch (event.type) {
        case 'ISSUED': return <><span className="font-bold text-slate-900">{event.ticketNumber}</span> checked in for {sName}</>;
        case 'CALLED': return <><span className="font-bold text-slate-900">{event.ticketNumber}</span> called to Counter {event.counterNumber}</>;
        case 'COMPLETED': return <><span className="font-bold text-slate-900">{event.ticketNumber}</span> completed at Counter {event.counterNumber}</>;
        case 'NO_SHOW': return <><span className="font-bold text-slate-900">{event.ticketNumber}</span> marked no-show at Counter {event.counterNumber}</>;
        case 'CANCELLED': return <><span className="font-bold text-slate-900">{event.ticketNumber}</span> was cancelled</>;
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[500px]">
      <div className="p-5 border-b border-slate-100 flex items-center space-x-3 shrink-0">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            {isAmharic ? 'የቀጥታ ስርጭት እንቅስቃሴዎች' : 'Live System Activity'}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isAmharic ? 'የቅርብ ጊዜ የስርዓት ክስተቶች' : 'Real-time feed of system events'}
          </p>
        </div>
      </div>
      
      <div className="p-5 overflow-y-auto flex-1 space-y-4">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
            <Clock className="w-8 h-8 opacity-20" />
            <p className="text-xs font-medium">{isAmharic ? 'ምንም እንቅስቃሴ የለም' : 'No recent activity'}</p>
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[17px] before:w-[2px] before:bg-slate-100">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-2">
                <div className={`w-[36px] h-[36px] rounded-full border-[3px] border-white flex items-center justify-center shrink-0 relative z-10 ${getEventBg(event.type)}`}>
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 pt-1.5 pb-2">
                  <div className="text-xs text-slate-600 font-medium">
                    {getEventMessage(event)}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {timeAgo(event.timestamp)}
                    </span>
                    {event.priority === 'URGENT' && (
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-[4px] text-[9px] font-bold uppercase tracking-wider">
                        URGENT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
