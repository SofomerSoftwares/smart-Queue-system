import React from 'react';
import { Sliders, RefreshCw, Save, Shield, Lock } from 'lucide-react';
import { Role, RoleName, PriorityPolicy, PermissionDefinition, User } from '../../types';

interface AdminRolesTabProps {
  rolesList: Role[];
  permissionsList: PermissionDefinition[];
  priorityPolicy: PriorityPolicy;
  setPriorityPolicy: React.Dispatch<React.SetStateAction<PriorityPolicy>>;
  usersList: User[];
  isAmharic: boolean;
  isSavingPolicy: boolean;
  onSavePriorityPolicy: () => void;
  onToggleRolePriority: (roleName: RoleName, currentHasPriority: boolean) => void;
  onOpenRoleModal: (role: Role) => void;
}

export const AdminRolesTab: React.FC<AdminRolesTabProps> = ({
  rolesList,
  permissionsList,
  priorityPolicy,
  setPriorityPolicy,
  usersList,
  isAmharic,
  isSavingPolicy,
  onSavePriorityPolicy,
  onToggleRolePriority,
  onOpenRoleModal
}) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              {isAmharic ? 'የስልጣን እና የቅድሚያ ቁጥጥር ማዕከል' : 'Role Management & Priority Policy'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {isAmharic 
              ? 'የተጠቃሚ ሚናዎችን ፈቃዶች ያስተካክሉ፣ ለአስቸኳይ እና ልዩ ፍላጎት ላላቸው ደንበኞች ቅድሚያ የመስጠት መመሪያዎችን ያዋቅሩ፣ እንዲሁም የቢሮውን የቅድሚያ አሰራር ደንቦች ይቆጣጠሩ።'
              : 'Manage dynamic role permissions, configure ticket urgency triage policies, and control customer prioritization rules across reception and service counters.'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            id="btn-save-priority-policy"
            onClick={onSavePriorityPolicy}
            disabled={isSavingPolicy}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSavingPolicy ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving Policy...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isAmharic ? 'ፖሊሲውን አስቀምጥ' : 'Save Policy'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Section 1: Office Priority Policy & Triage Rules */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {isAmharic ? 'የቢሮው የቅድሚያ አሰራር ፖሊሲ እና ደንቦች' : 'Office Priority Policy & Triage Rules'}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {isAmharic ? 'ቅድሚያ ደንቦች' : 'Triage Rules'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Policy 1: Require Reason for Urgent */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-slate-900">
                  {isAmharic ? 'ለአስቸኳይ ትኬቶች አስገዳጅ ምክንያት' : 'Require Specific Reason for Urgent Tickets'}
                </span>
                {priorityPolicy.requireReasonForUrgent && (
                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md">
                    {isAmharic ? 'አስገዳጅ' : 'Mandatory'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isAmharic 
                  ? 'ትኬት እንደ «አስቸኳይ» (Urgent) ሲመደብ የተረጋገጠ ምክንያት (የህክምና፣ አረጋውያን፣ ነፍሰ ጡር፣ አካል ጉዳት) እንዲገባ ያስገድዳል። ያለ ምክንያት መቀየር አይፈቀድም።'
                  : 'Enforces mandatory concrete reason (medical, elderly, pregnant, disability, or official escalation) when classifying a ticket as Urgent.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPriorityPolicy(prev => ({ ...prev, requireReasonForUrgent: !prev.requireReasonForUrgent }))}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 cursor-pointer ${
                priorityPolicy.requireReasonForUrgent ? 'bg-amber-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Policy 2: Allow Officer Triage */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-slate-900">
                  {isAmharic ? 'የመስኮት ሰራተኛ ቅድሚያ የመስጠት ፈቃድ' : 'Counter Officer Priority Triage'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isAmharic 
                  ? 'የመስኮት አገልግሎት ሰራተኞች በመስኮት ጣቢያቸው ላይ ሆነው ወረፋ ላይ ያሉ ደንበኞችን አስቸኳይ ወይም ቅድሚያ እንዲሰጣቸው ማድረግ ይችላሉ።'
                  : 'Allows Counter Service Officers to triage and escalate ticket priorities directly from their station screen.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPriorityPolicy(prev => ({ ...prev, allowOfficerTriage: !prev.allowOfficerTriage }))}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 cursor-pointer ${
                priorityPolicy.allowOfficerTriage ? 'bg-amber-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Policy 3: Allow Reception Triage */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-slate-900">
                  {isAmharic ? 'የመስተንግዶ እና ኪዮስክ ቅድሚያ የመስጠት ፈቃድ' : 'Reception & Kiosk Priority Intake'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isAmharic 
                  ? 'የመስተንግዶ ዴስክ እና ኪዮስክ ኦፕሬተሮች ትኬት ሲቆርጡ ቅድሚያ ወይም አስቸኳይ ትኬት በቀጥታ እንዲያወጡ ይፈቅዳል።'
                  : 'Permits front desk staff and reception intake to assign Priority or Urgent classification during ticket creation.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPriorityPolicy(prev => ({ ...prev, allowReceptionTriage: !prev.allowReceptionTriage }))}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 cursor-pointer ${
                priorityPolicy.allowReceptionTriage ? 'bg-amber-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Policy 4: Auto-Audit Priority Changes */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-slate-900">
                  {isAmharic ? 'የቅድሚያ ለውጦችን በራስ-ሰር ኦዲት መመዝገብ' : 'Auto-Audit Priority Actions'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isAmharic 
                  ? 'ማናቸውም የትኬት ቅድሚያ ለውጦች፣ ምክንያቶች እና ያሻሻለው ሰራተኛ ስም በማይሰረዝ የእንቅስቃሴ መዝገብ (Audit Trail) ውስጥ እንዲቀመጥ ያደርጋል።'
                  : 'Automatically writes an immutable audit trail record whenever a ticket is flagged, upgraded, or reset.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPriorityPolicy(prev => ({ ...prev, autoAuditPriorityChanges: !prev.autoAuditPriorityChanges }))}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 cursor-pointer ${
                priorityPolicy.autoAuditPriorityChanges ? 'bg-amber-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Roles & Permissions Matrix */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isAmharic ? 'የተጠቃሚ ሚናዎች እና የፈቃድ መዋቅር' : 'System Roles & Permissions Matrix'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAmharic 
                ? 'ለእያንዳንዱ ሚና የተሰጡ ዝርዝር ፈቃዶችን ይመልከቱ እና የቅድሚያ አስተዳደር ስልጣን ይስጡ ወይም ያግዱ።' 
                : 'Configure access controls and toggle priority triage capabilities per role.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {rolesList.map((role) => {
            const isRoleAdmin = role.name === 'ADMIN';
            const hasPriorityPerm = role.permissions.includes('ticket.priority');
            const members = usersList.filter(u => u.role === role.name);

            return (
              <div 
                key={role.name} 
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-sm text-slate-900">
                          {role.displayName || role.name}
                        </span>
                        {isRoleAdmin && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            SYSTEM
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {role.name}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      {members.length} {isAmharic ? 'ሰራተኞች' : 'Users'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                    {isAmharic && role.descriptionAmharic ? role.descriptionAmharic : role.description}
                  </p>

                  {/* Priority Management Privilege Box */}
                  <div className={`p-3 rounded-xl border transition ${
                    hasPriorityPerm || isRoleAdmin
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Sliders className={`w-3.5 h-3.5 ${hasPriorityPerm || isRoleAdmin ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold">
                          {isAmharic ? 'የቅድሚያ ትኬት አስተዳደር' : 'Priority Management'}
                        </span>
                      </div>
                      {isRoleAdmin ? (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          {isAmharic ? 'ሁሌም ነቅቷል' : 'Always Active'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleRolePriority(role.name, hasPriorityPerm)}
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                            hasPriorityPerm ? 'bg-amber-600 justify-end' : 'bg-slate-300 justify-start'
                          }`}
                        >
                          <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {hasPriorityPerm || isRoleAdmin
                        ? (isAmharic ? 'ይህ ሚና አስቸኳይ እና ቅድሚያ ትኬቶችን መመደብ ይችላል።' : 'Members of this role can assign and adjust ticket priority levels.')
                        : (isAmharic ? 'ይህ ሚና የቅድሚያ ትኬቶችን መቀየር አይችልም።' : 'Members of this role cannot triage or escalate ticket priorities.')}
                    </p>
                  </div>

                  {/* Permissions Summary Badges */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500">
                        {isAmharic ? 'የፈቃዶች ብዛት:' : 'Active Permissions:'}
                      </span>
                      <span className="font-bold text-slate-800">
                        {isRoleAdmin ? (permissionsList.length || 22) : role.permissions.length} / {permissionsList.length || 22}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 4).map(p => (
                        <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 font-mono">
                          {p}
                        </span>
                      ))}
                      {role.permissions.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">
                          +{role.permissions.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenRoleModal(role)}
                  className="w-full mt-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAmharic ? 'ሁሉንም ፈቃዶች አዋቅር' : 'Configure Permissions'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
