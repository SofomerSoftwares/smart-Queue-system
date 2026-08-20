import React, { useState } from 'react';
import { Shield, KeyRound, User, Sparkles, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { RoleName } from '../types';

interface LoginViewProps {
  onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, demoLogin, isLoading } = useAuth();
  const { uiLanguage } = useQueue();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isAmharic = uiLanguage === 'AMHARIC';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      await login(username, password);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid login credentials');
    }
  };

  const handleDemoClick = async (role: RoleName) => {
    try {
      setErrorMessage('');
      await demoLogin(role);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xs border border-slate-200 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {isAmharic ? 'የሰራተኞች መግቢያ' : 'Staff Portal Login'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {isAmharic ? 'ለአስተዳዳሪዎች፣ ለመስተንግዶ እና ለአገልግሎት ሰጪዎች' : 'Secure role-based access for small office team'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isAmharic ? 'የተጠቃሚ ስም (Username)' : 'Username'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
                placeholder="e.g. admin or reception"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isAmharic ? 'የይለፍ ቃል (Password)' : 'Password'}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 mt-2"
          >
            <span>{isLoading ? (isAmharic ? 'በመግባት ላይ...' : 'Logging in...') : (isAmharic ? 'ግባ (Login)' : 'Sign In')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="pt-5 border-t border-slate-100 space-y-3">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isAmharic ? 'የሙከራ መለያዎች (1-Click Demo Logins):' : 'Instant Demo Logins:'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoClick('ADMIN')}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition text-left shadow-xs"
            >
              <div className="text-white font-bold">Admin</div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">admin</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick('RECEPTIONIST')}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl text-[11px] font-bold transition text-left"
            >
              <div className="text-slate-800 font-bold">Receptionist</div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">reception</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick('SERVICE_OFFICER')}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl text-[11px] font-bold transition text-left"
            >
              <div className="text-slate-800 font-bold">Officer 1</div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">officer1</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
