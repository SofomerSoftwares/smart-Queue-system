import React from 'react';
import { Shield, UserCheck, Sparkles } from 'lucide-react';

interface AdminGateProps {
  isAmharic: boolean;
  adminUsername: string;
  setAdminUsername: (val: string) => void;
  adminPassword: string;
  setAdminPassword: (val: string) => void;
  adminGateError: string;
  isLoggingInAdmin: boolean;
  handleAdminGateLogin: (e: React.FormEvent) => void;
  onQuickDemoLogin: () => void;
}

export const AdminGate: React.FC<AdminGateProps> = ({
  isAmharic,
  adminUsername,
  setAdminUsername,
  adminPassword,
  setAdminPassword,
  adminGateError,
  isLoggingInAdmin,
  handleAdminGateLogin,
  onQuickDemoLogin
}) => {
  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6 animate-in fade-in">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {isAmharic ? 'የአስተዳዳሪ ማረጋገጫ' : 'Administrator Authorization'}
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          {isAmharic 
            ? 'ወደዚህ ማዕከል ለመግባት እና ለውጦችን ለማድረግ የአስተዳዳሪ መለያ ያስፈልጋል።' 
            : 'Access to system configuration and data requires verified administrative credentials.'}
        </p>
      </div>

      {adminGateError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold animate-in fade-in text-center">
          {adminGateError}
        </div>
      )}

      <form onSubmit={handleAdminGateLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {isAmharic ? 'የተጠቃሚ ስም (Username)' : 'Username'}
          </label>
          <input
            type="text"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            placeholder="admin"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {isAmharic ? 'የይለፍ ቃል (Password)' : 'Password'}
          </label>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            placeholder="••••••••"
          />
        </div>

        <div className="pt-2 space-y-2">
          <button
            type="submit"
            disabled={isLoggingInAdmin}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            <span>{isLoggingInAdmin ? (isAmharic ? 'በማረጋገጥ ላይ...' : 'Verifying...') : (isAmharic ? 'እንደ አስተዳዳሪ ግባ' : 'Sign In as Administrator')}</span>
          </button>

          <button
            type="button"
            onClick={onQuickDemoLogin}
            className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isAmharic ? 'ፈጣን የአስተዳዳሪ መግቢያ (Quick Admin Sign-In)' : 'Quick Demo Admin Sign-In (admin)'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
