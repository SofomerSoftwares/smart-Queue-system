import React from 'react';
import { Printer, X, CheckCircle, Clock, Users, QrCode } from 'lucide-react';
import { PrintTicketData } from '../types';

interface TicketPrintModalProps {
  printData: PrintTicketData | null;
  isOpen: boolean;
  onClose: () => void;
  uiLanguage: 'AMHARIC' | 'ENGLISH';
}

export const TicketPrintModal: React.FC<TicketPrintModalProps> = ({
  printData,
  isOpen,
  onClose,
  uiLanguage
}) => {
  if (!isOpen || !printData) return null;

  const isAmharic = uiLanguage === 'AMHARIC';

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(printData.issuedAt).toLocaleString(
    isAmharic ? 'am-ET' : 'en-US',
    {
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-bold text-slate-900">
              {isAmharic ? 'ቲኬት በተሳካ ሁኔታ ተዘጋጅቷል' : 'Ticket Generated'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Style */}
        <div id="printable-ticket" className="p-6 bg-slate-50/50 text-slate-800 font-mono text-center select-all">
          <div className="border-b border-dashed border-slate-300 pb-4 mb-4">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
              {printData.officeNameAmharic || printData.officeName}
            </h2>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              {printData.officeName}
            </p>
          </div>

          <div className="py-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
              {isAmharic ? 'የወረፋ ቁጥርዎ' : 'YOUR QUEUE NUMBER'}
            </div>
            
            {/* Primary Big Ticket Number */}
            <div className="text-5xl font-black text-slate-900 font-mono tracking-wider my-3 bg-white py-3 rounded-xl border border-slate-200 shadow-xs">
              {printData.ticketNumber}
            </div>

            {/* Amharic Script Equivalent */}
            {printData.ticketNumberAmharic && printData.ticketNumberAmharic !== printData.ticketNumber && (
              <div className="text-lg font-bold text-slate-500 italic font-sans">
                {printData.ticketNumberAmharic}
              </div>
            )}

            <div className="text-sm font-bold text-slate-900 font-sans mt-2">
              {printData.serviceNameAmharic || printData.serviceName}
            </div>
            <div className="text-xs text-slate-400 font-sans">
              {printData.serviceName}
            </div>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-3 my-4 space-y-1.5 text-xs text-left">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center space-x-1.5 font-sans">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAmharic ? 'ከፊትዎ ያሉ ሰዎች:' : 'People Ahead:'}</span>
              </span>
              <span className="font-bold text-slate-900 text-sm font-mono">
                {printData.peopleAhead} {isAmharic ? 'ሰው' : ''}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center space-x-1.5 font-sans">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAmharic ? 'ግምታዊ የጥበቃ ጊዜ:' : 'Estimated Wait:'}</span>
              </span>
              <span className="font-bold text-indigo-600 text-sm font-mono">
                ~{printData.estimatedWaitMinutes} {isAmharic ? 'ደቂቃ' : 'Mins'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400 text-[10px] pt-1 font-mono">
              <span>{isAmharic ? 'የተሰጠበት ቀን:' : 'Issued at:'}</span>
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Notice & QR Code Placeholder */}
          <div className="text-[11px] text-slate-500 font-sans leading-tight mb-2">
            {isAmharic ? 'እባክዎ ቁጥርዎ በስክሪን እና በድምፅ እስኪጠራ ድረስ ይጠብቁ።' : 'Please wait until your number is called on display.'}
          </div>

          <div className="pt-2 flex flex-col items-center">
            <div className="w-14 h-14 border border-slate-200 rounded-xl p-1 bg-white flex items-center justify-center shadow-xs">
              <QrCode className="w-10 h-10 text-slate-700" />
            </div>
            <span className="text-[9px] text-slate-400 mt-1.5 font-sans">
              Scan to track anonymously on phone
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 px-5 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-xs transition"
          >
            {isAmharic ? 'ዝጋ' : 'Close'}
          </button>
          <button
            id="btn-print-thermal-ticket"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isAmharic ? 'ቲኬት አትም' : 'Print Ticket'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
