import React from 'react';
import { AlertCircle, Eye, EyeOff, Sliders, Save } from 'lucide-react';
import { User, Counter } from '../../types';

interface UserModalProps {
  isOpen: boolean;
  editingUser: Partial<User> | null;
  setEditingUser: React.Dispatch<React.SetStateAction<Partial<User> | null>>;
  userModalError: string;
  setUserModalError: (err: string) => void;
  showUserPassword: boolean;
  setShowUserPassword: (show: boolean) => void;
  counters: Counter[];
  isSavingUser: boolean;
  onSaveUser: () => void;
  onClose: () => void;
  isAmharic: boolean;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  editingUser,
  setEditingUser,
  userModalError,
  setUserModalError,
  showUserPassword,
  setShowUserPassword,
  counters,
  isSavingUser,
  onSaveUser,
  onClose,
  isAmharic
}) => {
  if (!isOpen || !editingUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-900">
          {editingUser.id ? (isAmharic ? 'የሰራተኛ መረጃ አስተካክል' : 'Edit Staff User') : (isAmharic ? 'አዲስ ሰራተኛ ጨምር' : 'Add Staff User')}
        </h3>

        {userModalError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{userModalError}</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAmharic ? 'ሙሉ ስም' : 'Full Name'}
          </label>
          <input
            type="text"
            placeholder="Abebe Kebede"
            value={editingUser.name || ''}
            onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAmharic ? 'የተጠቃሚ ስም (Username)' : 'Username'}
          </label>
          <input
            type="text"
            placeholder="abebe1"
            value={editingUser.username || ''}
            onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAmharic ? 'የይለፍ ቃል (Password)' : 'Password'}
          </label>
          <div className="relative">
            <input
              type={showUserPassword ? 'text' : 'password'}
              placeholder={editingUser.id ? (isAmharic ? 'ሳይቀየር እንዲቆይ ባዶ ይተዉ (ወይም አዲስ ይፃፉ)' : 'Leave blank to keep password or type new') : 'At least 6 chars'}
              value={editingUser.password || ''}
              onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
              className="w-full p-2.5 pr-9 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowUserPassword(!showUserPassword)}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {editingUser.id 
              ? (isAmharic ? 'የይለፍ ቃል ለመቀየር ቢያንስ 6 ፊደላት ይፃፉ' : 'Enter 6+ characters to change password') 
              : (isAmharic ? 'ቢያንስ 6 ፊደላት መሆን አለበት' : 'Must be at least 6 characters')}
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAmharic ? 'የስራ ሃላፊነት / ሚና' : 'Role'}
          </label>
          <select
            value={editingUser.role || 'SERVICE_OFFICER'}
            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ADMIN">ADMIN (አስተዳዳሪ)</option>
            <option value="RECEPTIONIST">RECEPTIONIST (አስተናጋጅ / ኪዮስክ)</option>
            <option value="SERVICE_OFFICER">SERVICE_OFFICER (የመስኮት ሰራተኛ)</option>
          </select>
        </div>

        {editingUser.role === 'SERVICE_OFFICER' && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAmharic ? 'የተመደበ መስኮት (የስራ ጣቢያ ገደብ)' : 'Assigned Counter (Station Lock)'}
            </label>
            <select
              value={editingUser.assignedCounterId || ''}
              onChange={(e) => setEditingUser({ ...editingUser, assignedCounterId: e.target.value || undefined })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">{isAmharic ? '-- የተመደበ መስኮት የለም (Unassigned) --' : '-- No Counter Assigned --'}</option>
              {counters.map(c => (
                <option key={c.id} value={c.id}>
                  {isAmharic ? `መስኮት 0${c.number} (${c.nameAmharic || c.name})` : `Counter 0${c.number} (${c.name})`}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              {isAmharic ? 'ይህ ሰራተኛ በመስኮት ጣቢያው ላይ በዚህ መስኮት ብቻ እንዲጠቀም ይገደባል።' : 'Limits this officer to only call and serve tickets at this specific counter.'}
            </p>
          </div>
        )}

        {editingUser.role !== 'ADMIN' && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>{isAmharic ? 'የቅድሚያ ትኬት አስተዳደር ፈቃድ' : 'Priority Management Access'}</span>
              </span>
              <select
                value={
                  editingUser.canManagePriority === true 
                    ? 'ALLOWED' 
                    : editingUser.canManagePriority === false 
                    ? 'DENIED' 
                    : 'ROLE_DEFAULT'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setEditingUser({
                    ...editingUser,
                    canManagePriority: val === 'ALLOWED' ? true : val === 'DENIED' ? false : undefined
                  });
                }}
                className="p-1 text-[11px] font-bold bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none"
              >
                <option value="ROLE_DEFAULT">{isAmharic ? 'የሚና ነባሪ (Role Default)' : 'Role Default'}</option>
                <option value="ALLOWED">{isAmharic ? 'ተፈቅዷል (Granted)' : 'Granted'}</option>
                <option value="DENIED">{isAmharic ? 'ተከልክሏል (Denied)' : 'Denied'}</option>
              </select>
            </div>
            <p className="text-[10px] text-amber-800 leading-tight">
              {isAmharic 
                ? 'የዚህን ሰራተኛ የሚና ፈቃድ በመሻር አስቸኳይ ትኬቶችን የመመደብ ወይም ቅድሚያ የመስጠት መብት ይስጡ/ይከልክሉ።' 
                : 'Grant or deny this specific user ability to prioritize tickets regardless of role default.'}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              setUserModalError('');
            }}
            disabled={isSavingUser}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
          >
            {isAmharic ? 'ሰርዝ' : 'Cancel'}
          </button>
          <button
            type="button"
            id="btn-save-user"
            onClick={onSaveUser}
            disabled={isSavingUser}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            {isSavingUser ? (
              <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...'}</span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'አስቀምጥ' : 'Save Staff'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
