import React from 'react';
import { AlertCircle, Save } from 'lucide-react';
import { Service } from '../../types';

interface ServiceModalProps {
  isOpen: boolean;
  editingService: Partial<Service> | null;
  setEditingService: React.Dispatch<React.SetStateAction<Partial<Service> | null>>;
  serviceModalError: string;
  setServiceModalError: (err: string) => void;
  isSavingService: boolean;
  onSaveService: () => void;
  onClose: () => void;
  isAmharic: boolean;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  editingService,
  setEditingService,
  serviceModalError,
  setServiceModalError,
  isSavingService,
  onSaveService,
  onClose,
  isAmharic
}) => {
  if (!isOpen || !editingService) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-sm font-bold text-slate-900">
          {editingService.id ? (isAmharic ? 'አገልግሎት አስተካክል' : 'Edit Service') : (isAmharic ? 'አዲስ አገልግሎት ጨምር' : 'Add New Service')}
        </h3>

        {serviceModalError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serviceModalError}</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAmharic ? 'መለያ ፊደል (Prefix)' : 'Ticket Prefix (e.g. A, B, P)'}
          </label>
          <input
            type="text"
            placeholder="A"
            maxLength={2}
            value={editingService.prefix || ''}
            onChange={(e) => setEditingService({ ...editingService, prefix: e.target.value.toUpperCase() })}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAmharic ? 'የአገልግሎቱ ስም በአማርኛ' : 'Service Name (Amharic)'}
          </label>
          <input
            type="text"
            placeholder="ለምሳሌ፡ የፓስፖርት አገልግሎት"
            value={editingService.nameAmharic || ''}
            onChange={(e) => setEditingService({ ...editingService, nameAmharic: e.target.value })}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAmharic ? 'የአገልግሎቱ ስም በእንግሊዝኛ' : 'Service Name (English)'}
          </label>
          <input
            type="text"
            placeholder="e.g. Passport Renewal"
            value={editingService.name || ''}
            onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAmharic ? 'የሚፈጀው አማካይ ደቂቃ' : 'Estimated Duration (Minutes)'}
          </label>
          <input
            type="number"
            min={1}
            max={120}
            placeholder="5"
            value={editingService.estimatedDurationMinutes || 5}
            onChange={(e) => setEditingService({ ...editingService, estimatedDurationMinutes: Number(e.target.value) })}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              setServiceModalError('');
            }}
            disabled={isSavingService}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
          >
            {isAmharic ? 'ሰርዝ' : 'Cancel'}
          </button>
          <button
            type="button"
            id="btn-save-service"
            onClick={onSaveService}
            disabled={isSavingService}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            {isSavingService ? (
              <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...'}</span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'አስቀምጥ' : 'Save Service'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
