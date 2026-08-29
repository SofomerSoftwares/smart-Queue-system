import React from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { Service } from '../../types';

interface AdminServicesTabProps {
  services: Service[];
  isAmharic: boolean;
  onAddNewService: () => void;
  onEditService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
}

export const AdminServicesTab: React.FC<AdminServicesTabProps> = ({
  services,
  isAmharic,
  onAddNewService,
  onEditService,
  onDeleteService
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-slate-900">
          {isAmharic ? 'የቢሮው አገልግሎቶች አስተዳደር' : 'Office Services Management'}
        </h2>
        <button
          onClick={onAddNewService}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAmharic ? 'አዲስ አገልግሎት ጨምር' : 'Add New Service'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-sm">
                  {s.prefix}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  ~{s.estimatedDurationMinutes} mins
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-3">{s.nameAmharic}</h3>
              <p className="text-xs text-slate-500 font-medium">{s.name}</p>
              {s.description && <p className="text-xs text-slate-400 mt-2">{s.description}</p>}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => onEditService(s)}
                className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteService(s.id)}
                className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
