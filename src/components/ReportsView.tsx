import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Clock, 
  Users, 
  CheckCircle, 
  UserX, 
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { api } from '../lib/api';
import { QueueStats } from '../types';

export const ReportsView: React.FC = () => {
  const { uiLanguage } = useQueue();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statsData, setStatsData] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isAmharic = uiLanguage === 'AMHARIC';

  const loadReport = async (date: string) => {
    try {
      setIsLoading(true);
      const res = await api.getReportsSummary(date);
      if (res.success) {
        setStatsData(res.stats);
      }
    } catch (err) {
      console.warn('Error loading report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedDate);
  }, [selectedDate]);

  const handleExportCSV = () => {
    if (!statsData) return;
    const rows = [
      ['Metric', 'Value'],
      ['Date', statsData.dateKey],
      ['Total Tickets', statsData.total],
      ['Completed', statsData.completed],
      ['Waiting', statsData.waiting],
      ['No-Show', statsData.noShow],
      ['Cancelled', statsData.cancelled],
      ['Avg Wait Minutes', statsData.avgWaitMinutes],
      ['Avg Service Minutes', statsData.avgServiceMinutes],
      [''],
      ['Service Name', 'Prefix', 'Total', 'Completed', 'Waiting', 'Avg Wait Mins', 'Avg Service Mins']
    ];

    statsData.serviceBreakdown.forEach(s => {
      rows.push([
        s.serviceName,
        s.prefix,
        s.total.toString(),
        s.completed.toString(),
        s.waiting.toString(),
        s.avgWaitMinutes.toString(),
        s.avgServiceMinutes.toString()
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `queue_report_${statsData.dateKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isAmharic ? 'የወረፋ እና የአገልግሎት ሪፖርቶች' : 'Queue Analytics & Reports'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {isAmharic ? 'የደንበኞች ቁጥር፣ የቆይታ ጊዜ እና የቆጣሪዎች አፈፃፀም' : 'Daily throughput, wait times and counter efficiency breakdown'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAmharic ? 'CSV አውርድ' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {statsData && (
        <>
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{isAmharic ? 'ጠቅላላ ደንበኞች' : 'Total Tickets'}</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{statsData.total}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{isAmharic ? 'የተስተናገዱ' : 'Completed'}</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-700 mt-2 font-mono">{statsData.completed}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{isAmharic ? 'አማካይ የጥበቃ ደቂቃ' : 'Avg Wait Time'}</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2 font-mono">~{statsData.avgWaitMinutes}m</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{isAmharic ? 'አማካይ የአገልግሎት ደቂቃ' : 'Avg Service Time'}</span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-indigo-900 mt-2 font-mono">~{statsData.avgServiceMinutes}m</div>
            </div>
          </div>

          {/* Service Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              {isAmharic ? 'በአገልግሎት አይነት የተከፋፈለ ሪፖርት' : 'SERVICE BREAKDOWN'}
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Prefix</th>
                    <th className="py-3 px-4">Service Name</th>
                    <th className="py-3 px-4 text-center">Total</th>
                    <th className="py-3 px-4 text-center">Served</th>
                    <th className="py-3 px-4 text-center">Waiting</th>
                    <th className="py-3 px-4 text-right">Avg Wait</th>
                    <th className="py-3 px-4 text-right">Avg Service</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {statsData.serviceBreakdown.map((s) => (
                    <tr key={s.serviceId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-black font-mono text-indigo-600">{s.prefix}</td>
                      <td className="py-3.5 px-4 text-slate-900 font-bold">
                        {isAmharic ? (s.serviceNameAmharic || s.serviceName) : s.serviceName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">{s.total}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-600 font-bold">{s.completed}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-600 font-bold">{s.waiting}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">~{s.avgWaitMinutes}m</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">~{s.avgServiceMinutes}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Counter Performance */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              {isAmharic ? 'የቆጣሪዎች አፈፃፀም' : 'COUNTER PRODUCTIVITY'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statsData.counterBreakdown.map((cnt) => (
                <div key={cnt.counterId} className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isAmharic ? `ቆጣሪ 0${cnt.counterNumber}` : `Counter 0${cnt.counterNumber}`}
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                    {cnt.totalServed} {isAmharic ? 'ደንበኞች' : 'served'}
                  </div>
                  <div className="text-xs text-slate-500 mt-2 font-medium">
                    {isAmharic ? `አማካይ ደቂቃ: ~${cnt.avgServiceMinutes}m` : `Avg time: ~${cnt.avgServiceMinutes}m`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
