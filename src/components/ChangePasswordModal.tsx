import React, { useState } from 'react';
import { KeyRound, X, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, HelpCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { uiLanguage } = useQueue();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotOldPasswordMode, setForgotOldPasswordMode] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;
  const isAmharic = uiLanguage === 'AMHARIC';

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    setForgotOldPasswordMode(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg(isAmharic ? 'አዲሱ የይለፍ ቃል አይመሳሰልም' : 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg(isAmharic ? 'የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት' : 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);

      if (forgotOldPasswordMode) {
        // Direct authenticated reset
        const res = await api.directUpdatePassword({ newPassword });
        if (res.success) {
          setSuccessMsg(isAmharic ? 'የይለፍ ቃል በተሳካ ሁኔታ ተቀይሯል!' : 'Password updated successfully!');
          setTimeout(() => {
            handleClose();
          }, 1500);
        }
      } else {
        // Standard change password with verification
        try {
          const res = await api.changePassword({ currentPassword, newPassword });
          if (res.success) {
            setSuccessMsg(isAmharic ? 'የይለፍ ቃል በተሳካ ሁኔታ ተቀይሯል!' : 'Password changed successfully!');
            setTimeout(() => {
              handleClose();
            }, 1500);
          }
        } catch (err: any) {
          // If current password was rejected, offer direct reset for the logged-in user
          setErrorMsg(err.message || (isAmharic ? 'የአሁኑ የይለፍ ቃል ልክ አይደለም' : 'Current password does not match.'));
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {isAmharic ? 'የይለፍ ቃል ማሻሻያ' : 'Update Staff Password'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {user?.name || 'Staff User'} ({user?.username})
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error / Success Feedback Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMsg}</span>
              {!forgotOldPasswordMode && (
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOldPasswordMode(true);
                      setErrorMsg('');
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 underline font-bold cursor-pointer"
                  >
                    {isAmharic ? 'የአሁኑ የይለፍ ቃል ጠፍቶብዎታል? በቀጥታ አዲስ ይለፍ ቃል ያስቀምጡ' : 'Forgot old password? Set new password directly'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center space-x-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Current Password Field (Only in standard mode) */}
          {!forgotOldPasswordMode ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isAmharic ? 'የአሁኑ የይለፍ ቃል (Current Password)' : 'Current Password'}
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOldPasswordMode(true)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {isAmharic ? 'የቀደመውን ረስተዋል?' : 'Forgot old password?'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-indigo-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>{isAmharic ? 'ቀጥታ አዲስ የይለፍ ቃል ማዘጋጃ በርቷል' : 'Direct Password Reset Active'}</span>
              </div>
              <button
                type="button"
                onClick={() => setForgotOldPasswordMode(false)}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
              >
                {isAmharic ? 'የቀደመውን አስገባ' : 'Use old password'}
              </button>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAmharic ? 'አዲስ የይለፍ ቃል (New Password)' : 'New Password'}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              {isAmharic ? 'ቢያንስ 6 ፊደላት ወይም ቁጥሮች መሆን አለበት' : 'Must be minimum 6 alphanumeric characters'}
            </p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAmharic ? 'አዲሱን የይለፍ ቃል ያረጋግጡ' : 'Confirm New Password'}
            </label>
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              {isAmharic ? 'ተመለስ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isLoading ? (isAmharic ? 'በማስተካከል ላይ...' : 'Updating...') : (isAmharic ? 'የይለፍ ቃል ቀይር' : 'Update Password')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
