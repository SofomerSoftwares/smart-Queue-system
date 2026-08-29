import React from 'react';
import { QueueStats } from '../../types';

interface AdminOverviewTabProps {
  stats: QueueStats | null;
  isAmharic: boolean;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  stats,
  isAmharic
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{isAmharic ? 'የዛሬ ጠቅላላ ቲኬቶች' : 'Total Tickets Today'}</div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono tracking-tight">{stats?.total || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{isAmharic ? 'የተስተናገዱ ደንበኞች' : 'Completed Served'}</div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1 font-mono tracking-tight">{stats?.completed || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{isAmharic ? 'በመጠባበቅ ላይ' : 'Currently Waiting'}</div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1 font-mono tracking-tight">{stats?.waiting || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{isAmharic ? 'አማካይ የጥበቃ ጊዜ' : 'Avg. Wait Time'}</div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 font-mono tracking-tight">~{stats?.avgWaitMinutes || 0}m</div>
        </div>
      </div>

      {/* Service Breakdown Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-4">
          {isAmharic ? 'የአገልግሎቶች አፈፃፀም ዝርዝር' : 'Service Queue Distribution'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Prefix</th>
                <th className="py-2.5 px-3">Service Name</th>
                <th className="py-2.5 px-3 text-center">Total</th>
                <th className="py-2.5 px-3 text-center">Waiting</th>
                <th className="py-2.5 px-3 text-center">Completed</th>
                <th className="py-2.5 px-3 text-right">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {stats?.serviceBreakdown.map((s) => (
                <tr key={s.serviceId} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-bold font-mono text-indigo-600">{s.prefix}</td>
                  <td className="py-3 px-3 text-slate-900 font-bold">
                    {isAmharic ? (s.serviceNameAmharic || s.serviceName) : s.serviceName}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{s.total}</td>
                  <td className="py-3 px-3 text-center font-mono text-amber-600 font-bold">{s.waiting}</td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-600 font-bold">{s.completed}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">~{s.avgServiceMinutes}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
