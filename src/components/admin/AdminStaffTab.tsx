import React from 'react';
import { Plus, Lock, Shield, Sliders, KeyRound } from 'lucide-react';
import { User, Counter } from '../../types';

interface AdminStaffTabProps {
  usersList: User[];
  counters: Counter[];
  isAmharic: boolean;
  onAddNewUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onResetPassword: (user: User) => void;
  onToggleUserPriority: (userId: string, currentStatus?: boolean) => void;
}

export const AdminStaffTab: React.FC<AdminStaffTabProps> = ({
  usersList,
  counters,
  isAmharic,
  onAddNewUser,
  onEditUser,
  onDeleteUser,
  onResetPassword,
  onToggleUserPriority
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-slate-900">
          {isAmharic ? 'የሰራተኞች እና የተጠቃሚዎች መዝገብ' : 'Staff Accounts & Roles'}
        </h2>
        <button
          onClick={onAddNewUser}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAmharic ? 'አዲስ ሰራተኛ መዝግብ' : 'Add Staff Member'}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">{isAmharic ? 'የተመደበ መስኮት' : 'Assigned Station'}</th>
              <th className="py-3 px-4">{isAmharic ? 'የቅድሚያ ፈቃድ' : 'Priority Access'}</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {usersList.map((u) => {
              const assignedCnt = counters.find(cnt => cnt.id === u.assignedCounterId);
              const hasPriority = u.canManagePriority === true || (u.canManagePriority === undefined && u.permissions?.includes('ticket.priority'));
              return (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{u.username}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {assignedCnt ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Lock className="w-3 h-3 text-indigo-500" />
                        <span>{isAmharic ? `መስኮት 0${assignedCnt.number}` : `Counter 0${assignedCnt.number}`}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">{isAmharic ? 'አልተመደበም' : 'Unassigned'}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {u.role === 'ADMIN' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Shield className="w-3 h-3" />
                        <span>{isAmharic ? 'ሙሉ ፈቃድ' : 'Unrestricted'}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggleUserPriority(u.id, u.canManagePriority)}
                        title={isAmharic ? 'የቅድሚያ አስተዳደር መብት ይቀይሩ' : 'Toggle user priority access'}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                          hasPriority
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <Sliders className="w-3 h-3" />
                        <span>
                          {hasPriority
                            ? (isAmharic ? 'ፈቃድ አለው' : 'Priority Granted')
                            : (isAmharic ? 'የተከለከለ' : 'Standard Only')}
                        </span>
                      </button>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-emerald-700 font-bold">ACTIVE</span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => onResetPassword(u)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>{isAmharic ? 'ይለፍ ቃል ቀይር' : 'Reset Pass'}</span>
                    </button>
                    <button
                      onClick={() => onEditUser(u)}
                      className="text-slate-600 hover:text-slate-900 font-bold ml-2 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteUser(u)}
                      className="text-rose-600 hover:text-rose-700 ml-2 font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
