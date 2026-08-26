import React, { useState } from 'react';
import { Printer, X, CheckCircle2, Clock, Users, Download, Copy, Check, Sparkles, Calendar, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PrintTicketData } from '../types';
import { AmharicLib } from '../lib/amharic';

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
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printSuccess, setPrintSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !printData) return null;

  const isAmharic = uiLanguage === 'AMHARIC';
  const issuedDate = new Date(printData.issuedAt);

  const formattedDate = issuedDate.toLocaleString(
    isAmharic ? 'am-ET' : 'en-US',
    {
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  );

  const ethiopianDateStr = AmharicLib.calendar.formatDateString(issuedDate, { useGeez: true });
  const geezAhead = AmharicLib.numbers.toGeez(printData.peopleAhead);

  const checkInUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?view=customer&ticket=${encodeURIComponent(printData.ticketNumber)}&checkin=true`
    : `https://addisqueue.app?ticket=${printData.ticketNumber}&checkin=true`;

  const generateTicketHtml = () => {
    // Get serialized SVG of the QR Code from the DOM if rendered, or render inline
    const qrSvgElement = document.getElementById('modal-print-qr-svg');
    const qrSvgMarkup = qrSvgElement ? new XMLSerializer().serializeToString(qrSvgElement) : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ticket - ${printData.ticketNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      font-family: monospace, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      width: 76mm;
      margin: 0 auto;
      padding: 12px;
      color: #000;
      background: #fff;
      text-align: center;
      box-sizing: border-box;
    }
    .header {
      border-bottom: 2px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .office-title {
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 0;
    }
    .office-sub {
      font-size: 11px;
      margin: 2px 0 0 0;
    }
    .ticket-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .ticket-number {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: 2px;
      margin: 8px 0;
      padding: 4px;
      border: 1px solid #000;
    }
    .amharic-number {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .service-name {
      font-size: 14px;
      font-weight: bold;
      margin: 4px 0 2px;
    }
    .service-sub {
      font-size: 11px;
      color: #333;
    }
    .details {
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 8px 0;
      margin: 10px 0;
      font-size: 12px;
      text-align: left;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .qr-section {
      margin: 10px 0 6px 0;
      padding: 6px;
      border: 1px dashed #000;
      display: inline-block;
    }
    .qr-caption {
      font-size: 9px;
      font-weight: bold;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .footer {
      font-size: 10px;
      margin-top: 8px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="office-title">${printData.officeNameAmharic || printData.officeName}</h1>
    <div class="office-sub">${printData.officeName}</div>
  </div>

  <div class="ticket-label">QUEUE TICKET / የወረፋ ቲኬት</div>
  <div class="ticket-number">${printData.ticketNumber}</div>
  ${printData.ticketNumberAmharic && printData.ticketNumberAmharic !== printData.ticketNumber ? `<div class="amharic-number">${printData.ticketNumberAmharic}</div>` : ''}

  <div class="service-name">${printData.serviceNameAmharic || printData.serviceName}</div>
  <div class="service-sub">${printData.serviceName}</div>

  <div class="details">
    <div class="detail-row">
      <span>People Ahead / ከፊትዎ:</span>
      <strong>${printData.peopleAhead} (${geezAhead})</strong>
    </div>
    <div class="detail-row">
      <span>Est. Wait / ግምታዊ ጊዜ:</span>
      <strong>~${printData.estimatedWaitMinutes} mins</strong>
    </div>
    <div class="detail-row">
      <span>Date (ኢትዮጵያ):</span>
      <span>${ethiopianDateStr}</span>
    </div>
    <div class="detail-row">
      <span>Issued (Gregorian):</span>
      <span>${formattedDate}</span>
    </div>
  </div>

  ${qrSvgMarkup ? `
  <div class="qr-section">
    ${qrSvgMarkup}
    <div class="qr-caption">SCAN TO CHECK-IN / ለመገኘት ማረጋገጫ ይቃኙ</div>
  </div>
  ` : ''}

  <div class="footer">
    እባክዎ ቁጥርዎ በስክሪን እና በድምፅ እስኪጠራ ድረስ ይጠብቁ።<br/>
    Please wait until your number is announced.
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setPrintSuccess(false);

    try {
      // Approach 1: Try printing through isolated iframe
      let iframe = document.getElementById('ticket-print-iframe') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'ticket-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generateTicketHtml());
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setIsPrinting(false);
            setPrintSuccess(true);
            setTimeout(() => setPrintSuccess(false), 4000);
          } catch {
            // Fallback to top window print if iframe print blocked
            window.print();
            setIsPrinting(false);
            setPrintSuccess(true);
          }
        }, 300);
      } else {
        window.print();
        setIsPrinting(false);
        setPrintSuccess(true);
      }
    } catch (e) {
      console.warn('Print trigger fallback:', e);
      window.print();
      setIsPrinting(false);
      setPrintSuccess(true);
    }
  };

  const handleDownloadSlip = () => {
    const textContent = `
========================================
  ${printData.officeNameAmharic || printData.officeName}
  ${printData.officeName}
========================================
  YOUR TICKET NUMBER: ${printData.ticketNumber}
  ${printData.ticketNumberAmharic ? `(${printData.ticketNumberAmharic})` : ''}
----------------------------------------
  Service: ${printData.serviceNameAmharic || printData.serviceName}
  People Ahead: ${printData.peopleAhead}
  Est. Wait Time: ~${printData.estimatedWaitMinutes} mins
  Issued: ${formattedDate}
----------------------------------------
  Please wait for audio & display callout.
========================================
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ticket-${printData.ticketNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const text = `Ticket: ${printData.ticketNumber} | Service: ${printData.serviceName} | Ahead: ${printData.peopleAhead} | Wait: ~${printData.estimatedWaitMinutes}m`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-900">
              {isAmharic ? 'ቲኬት በተሳካ ሁኔታ ተዘጋጅቷል' : 'Ticket Ready to Print'}
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
        <div id="printable-ticket" className="p-6 bg-slate-50/70 text-slate-800 font-mono text-center select-all">
          <div className="border-b border-dashed border-slate-300 pb-3 mb-3">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
              {printData.officeNameAmharic || printData.officeName}
            </h2>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              {printData.officeName}
            </p>
          </div>

          <div className="py-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
              {isAmharic ? 'የወረፋ ቁጥርዎ' : 'YOUR QUEUE NUMBER'}
            </div>
            
            {/* Primary Big Ticket Number */}
            <div className="text-5xl font-black text-slate-900 font-mono tracking-wider my-2.5 bg-white py-3.5 rounded-xl border border-slate-200 shadow-xs">
              {printData.ticketNumber}
            </div>

            {/* Amharic Script Equivalent */}
            {printData.ticketNumberAmharic && printData.ticketNumberAmharic !== printData.ticketNumber && (
              <div className="text-base font-bold text-slate-500 italic font-sans mb-1">
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

          <div className="border-t border-b border-dashed border-slate-300 py-3 my-3 space-y-1.5 text-xs text-left">
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
              <span>{isAmharic ? 'የተሰጠበት ሰዓት:' : 'Issued:'}</span>
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Check-In QR Pass preview */}
          <div className="my-3 p-3 bg-white border border-dashed border-slate-300 rounded-xl inline-block">
            <div className="flex justify-center">
              <QRCodeSVG
                id="modal-print-qr-svg"
                value={checkInUrl}
                size={96}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1.5 font-mono">
              {isAmharic ? 'ለመገኘት ማረጋገጫ ይቃኙ (SCAN TO CHECK-IN)' : 'SCAN TO CONFIRM ARRIVAL'}
            </div>
          </div>

          {/* Notice */}
          <div className="text-[11px] text-slate-500 font-sans leading-relaxed">
            {isAmharic ? 'እባክዎ ቁጥርዎ በስክሪን እና በድምፅ እስኪጠራ ድረስ ይጠብቁ።' : 'Please wait until your number is called on the main display and audio system.'}
          </div>
        </div>

        {/* Print Status Feedback Badge */}
        {printSuccess && (
          <div className="mx-5 mb-1 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isAmharic ? 'የቲኬት ማተሚያ ትእዛዝ ተልኳል!' : 'Print command sent to thermal printer!'}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? (isAmharic ? 'ተቀድቷል' : 'Copied!') : (isAmharic ? 'ቁጥሩን ቅዳ' : 'Copy')}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSlip}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAmharic ? 'ስሊፕ አውርድ' : 'Save Slip'}</span>
            </button>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-xs transition"
            >
              {isAmharic ? 'ዝጋ' : 'Close'}
            </button>
            <button
              type="button"
              id="btn-print-thermal-ticket"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? (isAmharic ? 'በማተም ላይ...' : 'Printing...') : (isAmharic ? 'ቲኬት አትም (Print)' : 'Print Thermal Ticket')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

