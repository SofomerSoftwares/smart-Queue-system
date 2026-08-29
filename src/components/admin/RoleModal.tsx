import React from 'react';
import { Sliders, X, AlertCircle, Flame, Ticket, Layers, Settings, Save } from 'lucide-react';
import { Role, PermissionDefinition } from '../../types';

interface RoleModalProps {
  isOpen: boolean;
  editingRole: Role | null;
  selectedRolePerms: string[];
  setSelectedRolePerms: React.Dispatch<React.SetStateAction<string[]>>;
  permissionsList: PermissionDefinition[];
  roleModalError: string;
  isSavingRolePerms: boolean;
  onSaveRolePermissions: () => void;
  onClose: () => void;
  isAmharic: boolean;
}

export const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  editingRole,
  selectedRolePerms,
  setSelectedRolePerms,
  permissionsList,
  roleModalError,
  isSavingRolePerms,
  onSaveRolePermissions,
  onClose,
  isAmharic
}) => {
  if (!isOpen || !editingRole) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isAmharic ? 'የሚና ፈቃዶች ማስተካከያ' : 'Configure Role Permissions'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {editingRole.name}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isAmharic && editingRole.descriptionAmharic ? editingRole.descriptionAmharic : editingRole.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {roleModalError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{roleModalError}</span>
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="font-semibold text-slate-600">
            {selectedRolePerms.length} {isAmharic ? 'ፈቃዶች ተመርጠዋል' : 'permissions selected'}
          </span>
          {editingRole.name !== 'ADMIN' && (
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => setSelectedRolePerms(permissionsList.map(p => p.id))}
                className="text-indigo-600 hover:text-indigo-800 font-bold text-xs cursor-pointer"
              >
                {isAmharic ? 'ሁሉንም ምረጥ' : 'Select All'}
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setSelectedRolePerms([])}
                className="text-slate-500 hover:text-slate-700 font-bold text-xs cursor-pointer"
              >
                {isAmharic ? 'ሁሉንም አፅዳ' : 'Clear All'}
              </button>
            </div>
          )}
        </div>

        {/* Categorized Permissions Scrollable Area */}
        <div className="overflow-y-auto pr-1 space-y-5 flex-1 max-h-[50vh]">
          {/* Category 1: Priority & Escalation */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 border-b border-amber-100 pb-1">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>{isAmharic ? 'የቅድሚያ እና የአስቸኳይ ሁኔታ ቁጥጥር (Priority & Triage)' : 'Priority & Triage Management'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissionsList.filter(p => p.id.startsWith('ticket.priority')).map(perm => {
                const isChecked = selectedRolePerms.includes(perm.id);
                return (
                  <label 
                    key={perm.id} 
                    className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                      isChecked 
                        ? 'bg-amber-50/60 border-amber-300 text-amber-950' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={editingRole.name === 'ADMIN'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRolePerms(prev => [...prev, perm.id]);
                        } else {
                          setSelectedRolePerms(prev => prev.filter(id => id !== perm.id));
                        }
                      }}
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block">{perm.name}</span>
                      <span className="text-[10px] text-slate-500 leading-tight block">{perm.description}</span>
                      <span className="font-mono text-[9px] text-slate-400 block">{perm.id}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Category 2: Queue & Ticket Operations */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1">
              <Ticket className="w-4 h-4 text-indigo-600" />
              <span>{isAmharic ? 'የትኬት እና የወረፋ አገልግሎት ስራዎች' : 'Queue & Ticket Operations'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissionsList.filter(p => p.id.startsWith('ticket.') && !p.id.startsWith('ticket.priority')).map(perm => {
                const isChecked = selectedRolePerms.includes(perm.id);
                return (
                  <label 
                    key={perm.id} 
                    className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                      isChecked 
                        ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={editingRole.name === 'ADMIN'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRolePerms(prev => [...prev, perm.id]);
                        } else {
                          setSelectedRolePerms(prev => prev.filter(id => id !== perm.id));
                        }
                      }}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block">{perm.name}</span>
                      <span className="text-[10px] text-slate-500 leading-tight block">{perm.description}</span>
                      <span className="font-mono text-[9px] text-slate-400 block">{perm.id}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Category 3: Services & Counter Stations */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>{isAmharic ? 'የአገልግሎቶች እና የመስኮቶች አስተዳደር' : 'Services & Counter Stations'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissionsList.filter(p => p.id.startsWith('services.') || p.id.startsWith('counters.')).map(perm => {
                const isChecked = selectedRolePerms.includes(perm.id);
                return (
                  <label 
                    key={perm.id} 
                    className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                      isChecked 
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={editingRole.name === 'ADMIN'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRolePerms(prev => [...prev, perm.id]);
                        } else {
                          setSelectedRolePerms(prev => prev.filter(id => id !== perm.id));
                        }
                      }}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block">{perm.name}</span>
                      <span className="text-[10px] text-slate-500 leading-tight block">{perm.description}</span>
                      <span className="font-mono text-[9px] text-slate-400 block">{perm.id}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Category 4: Staff, Reports & Settings */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1">
              <Settings className="w-4 h-4 text-purple-600" />
              <span>{isAmharic ? 'ሰራተኞች፣ ሪፖርቶች እና የስርዓት ቅንብሮች' : 'Staff, Reports & System Settings'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissionsList.filter(p => p.id.startsWith('staff.') || p.id.startsWith('reports.') || p.id.startsWith('settings.') || p.id.startsWith('audio.')).map(perm => {
                const isChecked = selectedRolePerms.includes(perm.id);
                return (
                  <label 
                    key={perm.id} 
                    className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                      isChecked 
                        ? 'bg-purple-50/60 border-purple-200 text-purple-950' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={editingRole.name === 'ADMIN'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRolePerms(prev => [...prev, perm.id]);
                        } else {
                          setSelectedRolePerms(prev => prev.filter(id => id !== perm.id));
                        }
                      }}
                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block">{perm.name}</span>
                      <span className="text-[10px] text-slate-500 leading-tight block">{perm.description}</span>
                      <span className="font-mono text-[9px] text-slate-400 block">{perm.id}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-[11px] text-slate-400">
            {editingRole.name === 'ADMIN' 
              ? (isAmharic ? 'የስርዓት አስተዳዳሪ ሙሉ ፈቃድ አለው (የተጠበቀ)' : 'Admin role retains full system privileges') 
              : (isAmharic ? 'ለውጦች ወዲያውኑ በተገናኙ ተጠቃሚዎች ላይ ተግባራዊ ይሆናሉ' : 'Changes apply immediately across all active users in this role')}
          </p>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="button"
              id="btn-save-role-perms"
              onClick={onSaveRolePermissions}
              disabled={isSavingRolePerms || editingRole.name === 'ADMIN'}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              {isSavingRolePerms ? (
                <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...'}</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'ፈቃዶችን አስቀምጥ' : 'Save Permissions'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
