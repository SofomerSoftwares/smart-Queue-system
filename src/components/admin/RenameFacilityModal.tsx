import React from 'react';
import { Building2, X, AlertCircle, RefreshCw, Check } from 'lucide-react';

interface RenameFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  renameAmharic: string;
  setRenameAmharic: (val: string) => void;
  renameEnglish: string;
  setRenameEnglish: (val: string) => void;
  renameModalError: string;
  isSavingRenameModal: boolean;
  onSaveQuickRename: () => void;
  isAmharic: boolean;
}

export const RenameFacilityModal: React.FC<RenameFacilityModalProps> = ({
  isOpen,
  onClose,
  renameAmharic,
  setRenameAmharic,
  renameEnglish,
  setRenameEnglish,
  renameModalError,
  isSavingRenameModal,
  onSaveQuickRename,
  isAmharic
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isAmharic ? 'የቢሮ ስም መቀየሪያ' : 'Rename Office / Organization'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAmharic ? 'በስክሪኑ እና በቲኬቶች ላይ የሚታየውን ስም ይለውጡ' : 'Update the official name shown across screens, kiosks, and tickets.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {renameModalError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{renameModalError}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {isAmharic ? 'ፈጣን የአማራጭ ስሞች' : 'Quick Presets'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { am: 'የኢትዮጵያ አገልግሎት መስጫ ማዕከል', en: 'ETHIOPIA SERVICE CENTER' },
              { am: 'የኢትዮጵያ ገቢዎች ሚኒስቴር', en: 'MINISTRY OF REVENUES ETHIOPIA' },
              { am: 'የኢሚግሬሽን እና ዜግነት አገልግሎት', en: 'IMMIGRATION & CITIZENSHIP SERVICE' },
              { am: 'የቂርቆስ ክፍለ ከተማ አገልግሎት ማዕከል', en: 'KIRKOS SUB-CITY SERVICE CENTER' },
              { am: 'የቦሌ ክፍለ ከተማ ወሳኝ ኩነት ምዝገባ', en: 'BOLE SUB-CITY VITAL EVENTS' }
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setRenameAmharic(p.am);
                  setRenameEnglish(p.en);
                }}
                className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 transition cursor-pointer"
              >
                {isAmharic ? p.am : p.en}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAmharic ? 'የቢሮ ስም (አማርኛ) *' : 'Office Name (Amharic) *'}
            </label>
            <input
              id="modal-input-office-name-amharic"
              type="text"
              value={renameAmharic}
              onChange={(e) => setRenameAmharic(e.target.value)}
              placeholder="ለምሳሌ፡ የቂርቆስ ክፍለ ከተማ አገልግሎት ማዕከል"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAmharic ? 'የቢሮ ስም (English) *' : 'Office Name (English) *'}
            </label>
            <input
              id="modal-input-office-name-english"
              type="text"
              value={renameEnglish}
              onChange={(e) => setRenameEnglish(e.target.value)}
              placeholder="e.g. KIRKOS SUB-CITY SERVICE CENTER"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900"
            />
          </div>
        </div>

        {/* Live Preview Inside Modal */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-white flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0 text-xs">
            HQ
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {isAmharic 
                ? (renameAmharic || renameEnglish || 'የቢሮ ስም') 
                : (renameEnglish || renameAmharic || 'OFFICE NAME')}
            </p>
            <p className="text-[10px] text-slate-400">
              {isAmharic ? 'በስክሪን እና በቲኬት ላይ እንዲህ ይታያል' : 'Preview on public displays & tickets'}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSavingRenameModal}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
          >
            {isAmharic ? 'ሰርዝ' : 'Cancel'}
          </button>
          <button
            type="button"
            id="btn-save-rename-modal"
            onClick={onSaveQuickRename}
            disabled={isSavingRenameModal}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            {isSavingRenameModal ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'ስሙን ቀይር እና አስቀምጥ' : 'Apply & Save Name'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
