import React from 'react';
import { AuditLog } from '../../types';

interface AdminAuditTabProps {
  auditLogs: AuditLog[];
  isAmharic: boolean;
}

export const AdminAuditTab: React.FC<AdminAuditTabProps> = ({
  auditLogs,
  isAmharic
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
      <h2 className="text-base font-bold text-slate-900">
        {isAmharic ? 'የስርዓት እንቅስቃሴዎች መዝገብ' : 'Audit Logs & Action History'}
      </h2>

      <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
            <tr>
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Staff / User</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Entity</th>
              <th className="py-2.5 px-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="py-2.5 px-3 font-bold text-slate-800">{log.userName || 'System'}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {log.action}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{log.entity}</td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                  {log.metadata ? JSON.stringify(log.metadata) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
