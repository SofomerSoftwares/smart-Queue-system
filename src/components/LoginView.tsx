import React, { useState } from 'react';
import { KeyRound, User, ArrowRight, Lock, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { api } from '../lib/api';

interface LoginViewProps {
  onSuccess: () => void;
}

type AuthMode = 'LOGIN' | 'FORGOT_REQUEST' | 'FORGOT_VERIFY';

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, isLoading } = useAuth();
  const { uiLanguage } = useQueue();

  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // Forgot password state
  const [resetUsername, setResetUsername] = useState<string>('');
  const [resetCode, setResetCode] = useState<string>('');
  const [generatedCodeNotice, setGeneratedCodeNotice] = useState<string>('');
  const [targetStaffName, setTargetStaffName] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const isAmharic = uiLanguage === 'AMHARIC';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      setSuccessMessage('');
      await login(username, password);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || (isAmharic ? 'የተጠቃሚ ስም ወይም የይለፍ ቃል የተሳሳተ ነው' : 'Invalid login credentials'));
    }
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUsername.trim()) {
      setErrorMessage(isAmharic ? 'እባክዎ የተጠቃሚ ስም ያስገቡ' : 'Please enter your username');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await api.forgotPassword({ username: resetUsername.trim() });
      if (res.success) {
        if (res.resetCode) {
          setResetCode(res.resetCode);
          setGeneratedCodeNotice(res.resetCode);
        }
        setTargetStaffName(res.name || resetUsername);
        setSuccessMessage(
          isAmharic
            ? `የ6-አሃዝ የማረጋገጫ ኮድ ተፈጥሯል (የሚቆየው ለ${res.expiresInMinutes || 15} ደቂቃ ነው)`
            : `6-digit reset code generated (valid for ${res.expiresInMinutes || 15} minutes).`
        );
        setMode('FORGOT_VERIFY');
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isAmharic ? 'የይለፍ ቃል መልሶ ማግኛ ጥያቄ አልተሳካም' : 'Failed to request reset code'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setErrorMessage(isAmharic ? 'እባክዎ የ6-አሃዝ ማረጋገጫ ኮድ ያስገቡ' : 'Please enter the 6-digit reset code');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage(isAmharic ? 'አዲሱ የይለፍ ቃል ቢያንስ 6 ፊደላት/ቁጥሮች መሆን አለበት' : 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage(isAmharic ? 'አዲሱ የይለፍ ቃል እና ማረጋገጫው አይመሳሰሉም' : 'Passwords do not match');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await api.resetPassword({
        username: resetUsername.trim(),
        resetCode: resetCode.trim(),
        newPassword
      });

      if (res.success) {
        setSuccessMessage(
          isAmharic
            ? 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል! አሁን በአዲሱ የይለፍ ቃል መግባት ይችላሉ።'
            : 'Password has been successfully updated! You can now sign in.'
        );
        setUsername(resetUsername.trim());
        setPassword(newPassword);
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setGeneratedCodeNotice('');
        setMode('LOGIN');
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isAmharic ? 'የይለፍ ቃል መቀየር አልተሳካም' : 'Failed to reset password'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-8 shadow-xs border border-slate-200 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
            {mode === 'LOGIN' ? (
              <Lock className="w-5 h-5" />
            ) : (
              <KeyRound className="w-5 h-5" />
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'LOGIN' && (isAmharic ? 'የሰራተኞች መግቢያ' : 'Staff Portal Login')}
            {mode === 'FORGOT_REQUEST' && (isAmharic ? 'የይለፍ ቃል ረሱ?' : 'Reset Your Password')}
            {mode === 'FORGOT_VERIFY' && (isAmharic ? 'አዲስ የይለፍ ቃል ይፍጠሩ' : 'Set New Password')}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {mode === 'LOGIN' && (isAmharic ? 'ለአስተዳዳሪዎች፣ ለመስተንግዶ እና ለአገልግሎት ሰጪዎች' : 'Secure role-based access for office staff')}
            {mode === 'FORGOT_REQUEST' && (isAmharic ? 'የይለፍ ቃልዎን ለመቀየር የተጠቃሚ ስምዎን ያስገቡ' : 'Enter your staff username to receive a verification reset code')}
            {mode === 'FORGOT_VERIFY' && (isAmharic ? `ለ ${targetStaffName || resetUsername} አዲስ የይለፍ ቃል ያዘጋጁ` : `Enter the 6-digit code to update credentials for ${targetStaffName || resetUsername}`)}
          </p>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-start space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODE 1: Standard Login */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                  placeholder="e.g. admin or officer1"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {isAmharic ? 'የይለፍ ቃል (Password)' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setResetUsername(username);
                    setMode('FORGOT_REQUEST');
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  {isAmharic ? 'የይለፍ ቃል ረሱ?' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 mt-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? (isAmharic ? 'በመግባት ላይ...' : 'Logging in...') : (isAmharic ? 'ግባ (Login)' : 'Sign In')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* MODE 2: Forgot Password - Request Reset Code */}
        {mode === 'FORGOT_REQUEST' && (
          <form onSubmit={handleRequestResetCode} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAmharic ? 'የተጠቃሚ ስም (Staff Username)' : 'Staff Username'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
                  placeholder="e.g. admin, reception, or officer1"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                {isAmharic 
                  ? 'የይለፍ ቃል መልሶ ማግኛ ኮድ ለመቀበል አካውንት የፈጠሩበትን የተጠቃሚ ስም ያስገቡ።' 
                  : 'Enter the username assigned to your office profile to generate a verification code.'}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>
                  {isProcessing 
                    ? (isAmharic ? 'ኮድ በመፍጠር ላይ...' : 'Generating Code...') 
                    : (isAmharic ? 'የማረጋገጫ ኮድ ላክ' : 'Get Verification Code')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setSuccessMessage('');
                  setMode('LOGIN');
                }}
                className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'ወደ መግቢያ ተመለስ' : 'Back to Sign In'}</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: Forgot Password - Enter Code & New Password */}
        {mode === 'FORGOT_VERIFY' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            
            {/* Generated Code Display Box */}
            {generatedCodeNotice && (
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
                  <span>{isAmharic ? 'የማረጋገጫ ኮድዎ:' : 'Your Reset Verification Code:'}</span>
                  <span className="bg-indigo-200/70 text-indigo-800 px-2 py-0.5 rounded-full font-mono text-[10px]">
                    {isAmharic ? '15 ደቂቃ' : '15m valid'}
                  </span>
                </div>
                <div className="text-xl font-mono font-black text-indigo-700 tracking-widest text-center py-1">
                  {generatedCodeNotice}
                </div>
                <p className="text-[10px] text-indigo-600 text-center">
                  {isAmharic ? 'ይህንን ባለ 6-አሃዝ ቁጥር ከታች ባለው ሳጥን ውስጥ ያስገቡ' : 'Enter this 6-digit code in the field below'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAmharic ? 'የ6-አሃዝ ማረጋገጫ ኮድ (Reset Code)' : '6-Digit Reset Code'}
              </label>
              <div className="relative">
                <ShieldAlert className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-widest font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 text-center"
                  placeholder="123456"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAmharic ? 'አዲስ የይለፍ ቃል (New Password)' : 'New Password'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
                  placeholder={isAmharic ? 'ቢያንስ 6 ፊደላት/ቁጥሮች' : 'At least 6 characters'}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAmharic ? 'አዲሱን የይለፍ ቃል ያረጋግጡ (Confirm Password)' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>
                  {isProcessing 
                    ? (isAmharic ? 'የይለፍ ቃል በመቀየር ላይ...' : 'Updating Password...') 
                    : (isAmharic ? 'የይለፍ ቃል ቀይር' : 'Update Password')}
                </span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setMode('FORGOT_REQUEST')}
                  className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  {isAmharic ? 'አዲስ ኮድ ጠይቅ' : 'Request new code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setMode('LOGIN');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                >
                  {isAmharic ? 'ወደ መግቢያ ተመለስ' : 'Back to Sign In'}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

