import React from 'react';
import { AlertCircle, Save } from 'lucide-react';
import { Counter } from '../../types';

interface CounterModalProps {
  isOpen: boolean;
  editingCounter: Partial<Counter> | null;
  setEditingCounter: React.Dispatch<React.SetStateAction<Partial<Counter> | null>>;
  counterModalError: string;
  setCounterModalError: (err: string) => void;
  isSavingCounter: boolean;
  onSaveCounter: () => void;
  onClose: () => void;
  isAmharic: boolean;
}

export const CounterModal: React.FC<CounterModalProps> = ({
  isOpen,
  editingCounter,
  setEditingCounter,
  counterModalError,
  setCounterModalError,
  isSavingCounter,
  onSaveCounter,
  onClose,
  isAmharic
}) => {
  if (!isOpen || !editingCounter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-sm font-bold text-slate-900">
          {editingCounter.id ? (isAmharic ? 'መስኮት አስተካክል' : 'Edit Counter') : (isAmharic ? 'አዲስ መስኮት ጨምር' : 'Add Counter')}
        </h3>

        {counterModalError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{counterModalError}</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAmharic ? 'የመስኮት ቁጥር' : 'Counter Number'}
          </label>
          <input
            type="number"
            min={1}
            max={50}
            placeholder="1"
            value={editingCounter.number || ''}
            onChange={(e) => setEditingCounter({ ...editingCounter, number: Number(e.target.value) })}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAmharic ? 'የመስኮት ስም (English)' : 'Counter Name (English)'}
          </label>
          <input
            type="text"
            placeholder="e.g. Counter 1"
            value={editingCounter.name || ''}
            onChange={(e) => setEditingCounter({ ...editingCounter, name: e.target.value })}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              setCounterModalError('');
            }}
            disabled={isSavingCounter}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
          >
            {isAmharic ? 'ሰርዝ' : 'Cancel'}
          </button>
          <button
            type="button"
            id="btn-save-counter"
            onClick={onSaveCounter}
            disabled={isSavingCounter}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            {isSavingCounter ? (
              <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...'}</span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'አስቀምጥ' : 'Save Counter'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
