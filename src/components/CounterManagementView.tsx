import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Plus, 
  Edit3, 
  Trash2, 
  UserCheck, 
  ExternalLink, 
  QrCode, 
  Volume2, 
  Sparkles, 
  Layers, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Users, 
  ShieldCheck, 
  MapPin, 
  Settings, 
  AlertCircle, 
  Copy, 
  Check, 
  Monitor, 
  Flame, 
  Zap, 
  X, 
  RefreshCw,
  Sliders,
  ChevronRight,
  Radio,
  Lock
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { audioManager } from '../lib/audioManager';
import { Counter, User, Service } from '../types';

interface CounterManagementViewProps {
  onOpenCounterDisplay?: (counterId: string, counterNumber: number) => void;
}

export const CounterManagementView: React.FC<CounterManagementViewProps> = ({
  onOpenCounterDisplay
}) => {
  const { 
    counters, 
    refreshQueue, 
    services, 
    servingTickets, 
    waitingTickets, 
    uiLanguage, 
    officeSetting 
  } = useQueue();

  const { user } = useAuth();
  const isAmharic = uiLanguage === 'AMHARIC';
  const isAdmin = user?.role === 'ADMIN';

  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'SERVING' | 'CLOSED'>('ALL');
  
  // Modal states
  const [isCounterModalOpen, setIsCounterModalOpen] = useState<boolean>(false);
  const [editingCounter, setEditingCounter] = useState<Partial<Counter> | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  // QR / Pairing modal state
  const [pairingModalCounter, setPairingModalCounter] = useState<Counter | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Quick officer reassignment dropdown state
  const [reassignDropdownCounterId, setReassignDropdownCounterId] = useState<string | null>(null);

  // Load staff users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.getUsers();
        if (res?.success && res.users) {
          setUsersList(res.users);
        }
      } catch (err) {
        console.warn('Failed to load users for counter assignment:', err);
      }
    };
    fetchUsers();
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // Filtered counters
  const filteredCounters = counters.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nameAmharic && c.nameAmharic.includes(searchTerm)) ||
      String(c.number).includes(searchTerm) ||
      (c.currentOfficerName && c.currentOfficerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate high level KPIs
  const totalCountersCount = counters.length;
  const activeServingCount = counters.filter(c => c.status === 'SERVING').length;
  const availableCount = counters.filter(c => c.status === 'AVAILABLE').length;
  const closedCount = counters.filter(c => c.status === 'CLOSED').length;
  const officersAssignedCount = counters.filter(c => c.currentOfficerId || c.currentOfficerName).length;

  // Handle Save (Create or Update Counter)
  const handleSaveCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCounter) return;

    if (!editingCounter.number || editingCounter.number <= 0) {
      setModalError(isAmharic ? 'እባክዎ ትክክለኛ የመስኮት ቁጥር ያስገቡ' : 'Please provide a valid counter number.');
      return;
    }
    if (!editingCounter.name) {
      setModalError(isAmharic ? 'የመስኮቱ ስም ያስፈልጋል' : 'Counter name is required.');
      return;
    }

    setIsSaving(true);
    setModalError('');

    try {
      const payload: any = {
        number: Number(editingCounter.number),
        name: editingCounter.name,
        nameAmharic: editingCounter.nameAmharic || `መስኮት ${editingCounter.number}`,
        location: editingCounter.location || '',
        locationAmharic: editingCounter.locationAmharic || '',
        serviceIds: editingCounter.serviceIds || [],
        displayTheme: editingCounter.displayTheme || 'modern',
        status: editingCounter.status || 'AVAILABLE',
        currentOfficerId: editingCounter.currentOfficerId || null
      };

      if (editingCounter.id) {
        await api.updateCounter(editingCounter.id, payload);
        showToast(isAmharic ? 'መስኮቱ በተሳካ ሁኔታ ተሻሽሏል!' : 'Counter updated successfully!');
      } else {
        await api.createCounter(payload);
        showToast(isAmharic ? 'አዲስ መስኮት በተሳካ ሁኔታ ተፈጥሯል!' : 'New counter created successfully!');
      }

      setIsCounterModalOpen(false);
      setEditingCounter(null);
      await refreshQueue();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save counter. Please check admin permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Counter Status Toggle
  const handleToggleStatus = async (counter: Counter, newStatus: 'AVAILABLE' | 'SERVING' | 'CLOSED') => {
    try {
      await api.updateCounter(counter.id, { status: newStatus });
      showToast(isAmharic ? `የመስኮት ${counter.number} ሁኔታ ወደ ${newStatus} ተቀይሯል` : `Counter ${counter.number} status set to ${newStatus}`);
      await refreshQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to update counter status');
    }
  };

  // Quick Officer Assignment
  const handleAssignOfficer = async (counterId: string, officerId: string | null) => {
    try {
      await api.updateCounter(counterId, { currentOfficerId: officerId });
      setReassignDropdownCounterId(null);
      showToast(isAmharic ? 'ሰራተኛው ለመስኮቱ ተመድቧል' : 'Staff officer assigned to counter successfully');
      await refreshQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to assign officer');
    }
  };

  // Delete Counter
  const handleDeleteCounter = async (counter: Counter) => {
    if (!confirm(isAmharic ? `መስኮት ${counter.number} (${counter.name}) ይሰረዝ?` : `Are you sure you want to delete Counter ${counter.number}?`)) {
      return;
    }
    try {
      await api.deleteCounter(counter.id);
      showToast(isAmharic ? 'መስኮቱ ተሰርዟል' : 'Counter deleted successfully');
      await refreshQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to delete counter');
    }
  };

  // Test sound chime for counter
  const handleTestChime = (counter: Counter) => {
    audioManager.playChime().catch(() => {});
    showToast(isAmharic ? `የመስኮት ${counter.number} የድምፅ ሙከራ ተሰምቷል` : `Test chime triggered for Counter ${counter.number}`);
  };

  // Copy Counter Display URL
  const getCounterDisplayUrl = (counterNumber: number) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?view=counter-display&counter=${counterNumber}`;
  };

  const handleCopyLink = (counterNumber: number) => {
    const url = getCounterDisplayUrl(counterNumber);
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      showToast(isAmharic ? 'የመስኮቱ ስክሪን ማስፈንጠሪያ ተቀድቷል!' : 'Counter display URL copied to clipboard!');
    }).catch(() => {});
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-200 shrink-0">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {isAmharic ? 'የመስኮቶች አስተዳደር ማዕከል' : 'Counter Management Hub'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                {counters.length} {isAmharic ? 'መስኮቶች' : 'Counters'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {isAmharic 
                ? 'የአገልግሎት መስኮቶችን ያስተዳድሩ፣ ሰራተኞችን ይመድቡ እና ከመስኮት ስክሪኖች (Counter Displays) ጋር ያገናኙ'
                : 'Manage service counters, assign officers, configure service routing, and pair with dedicated counter displays.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => refreshQueue()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Refresh Counters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (onOpenCounterDisplay && counters[0]) {
                onOpenCounterDisplay(counters[0].id, counters[0].number);
              } else {
                window.open(getCounterDisplayUrl(1), '_blank');
              }
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
          >
            <Monitor className="w-4 h-4 text-indigo-400" />
            <span>{isAmharic ? 'የቀጥታ መስኮት ስክሪን' : 'Live Counter Display'}</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                const nextNum = counters.length + 1;
                setEditingCounter({
                  number: nextNum,
                  name: `Counter ${nextNum}`,
                  nameAmharic: `መስኮት ${nextNum}`,
                  location: `Window ${nextNum}`,
                  locationAmharic: `መስኮት ${nextNum}`,
                  serviceIds: [],
                  status: 'AVAILABLE',
                  displayTheme: 'modern'
                });
                setModalError('');
                setIsCounterModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isAmharic ? 'አዲስ መስኮት ጨምር' : 'Add New Counter'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{isAmharic ? 'ጠቅላላ መስኮቶች' : 'Total Counters'}</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {totalCountersCount}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            {officersAssignedCount} {isAmharic ? 'ሰራተኛ የተመደበላቸው' : 'with officers assigned'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{isAmharic ? 'በአገልግሎት ላይ' : 'Active Serving'}</span>
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2 font-mono">
            {activeServingCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {isAmharic ? 'ደንበኛ እያስተናገዱ ያሉ' : 'Serving customers now'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{isAmharic ? 'ዝግጁ / ክፍት' : 'Available / Ready'}</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-2 font-mono">
            {availableCount}
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">
            {isAmharic ? 'ቀጣይ ተረኛ የሚጠብቁ' : 'Ready for next call'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{isAmharic ? 'የተዘጉ መስኮቶች' : 'Closed Counters'}</span>
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-400 mt-2 font-mono">
            {closedCount}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            {isAmharic ? 'ከስራ ውጭ የሆኑ' : 'Offline / Inactive'}
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isAmharic ? 'መስኮት፣ ስም ወይም ሰራተኛ ይፈልጉ...' : 'Search counter by number, name, or officer...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'SERVING', 'AVAILABLE', 'CLOSED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' && (isAmharic ? 'ሁሉም' : 'All')}
              {st === 'SERVING' && (isAmharic ? 'በአገልግሎት ላይ' : 'Serving')}
              {st === 'AVAILABLE' && (isAmharic ? 'ዝግጁ' : 'Available')}
              {st === 'CLOSED' && (isAmharic ? 'የተዘጋ' : 'Closed')}
            </button>
          ))}
        </div>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCounters.map((counter) => {
          const isServing = counter.status === 'SERVING' && counter.currentTicketNumber;
          const assignedUser = usersList.find(u => u.id === counter.currentOfficerId || u.assignedCounterId === counter.id);
          const officerDisplayName = counter.currentOfficerName || (assignedUser ? assignedUser.name : null);

          // Get services handled by this counter
          const supportedServicesList = counter.serviceIds && counter.serviceIds.length > 0
            ? services.filter(s => counter.serviceIds?.includes(s.id))
            : services;

          return (
            <div 
              key={counter.id}
              className={`bg-white rounded-3xl border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden relative ${
                counter.status === 'SERVING'
                  ? 'border-indigo-300 ring-2 ring-indigo-500/20'
                  : counter.status === 'AVAILABLE'
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-slate-200 opacity-80'
              }`}
            >
              {/* Top Card Banner */}
              <div className="p-5 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg font-mono text-white shadow-sm ${
                      counter.status === 'SERVING' 
                        ? 'bg-gradient-to-tr from-emerald-600 to-emerald-500 shadow-emerald-200' 
                        : counter.status === 'AVAILABLE' 
                        ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-indigo-200' 
                        : 'bg-slate-600'
                    }`}>
                      0{counter.number}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 tracking-tight">
                        {isAmharic ? (counter.nameAmharic || counter.name) : counter.name}
                      </h3>
                      {counter.location && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{counter.location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    counter.status === 'SERVING'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse'
                      : counter.status === 'AVAILABLE'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {counter.status}
                  </span>
                </div>

                {/* Currently Serving Ticket Highlight */}
                <div className={`mt-4 p-3 rounded-2xl border flex items-center justify-between ${
                  isServing 
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                    : 'bg-slate-50 border-slate-100 text-slate-500'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isServing ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
                    <span className="text-xs font-semibold">
                      {isAmharic ? 'አሁን የሚያስተናግደው' : 'Current Serving'}:
                    </span>
                  </div>
                  <span className="text-base font-black font-mono tracking-tight text-slate-900">
                    {counter.currentTicketNumber || (counter.status === 'CLOSED' ? (isAmharic ? 'ተዘግቷል' : 'CLOSED') : (isAmharic ? 'ዝግጁ' : 'READY'))}
                  </span>
                </div>

                {/* Assigned Officer Section with Quick Change */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 min-w-0">
                    <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        {isAmharic ? 'የተመደበ ሰራተኛ' : 'Assigned Officer'}
                      </span>
                      <span className="font-bold text-slate-800 truncate block">
                        {officerDisplayName || (isAmharic ? 'የተመደበ ሰራተኛ የለም' : 'Unassigned')}
                      </span>
                    </div>
                  </div>

                  {/* Reassign Officer Dropdown Trigger */}
                  {isAdmin && (
                    <div className="relative">
                      <button
                        onClick={() => setReassignDropdownCounterId(reassignDropdownCounterId === counter.id ? null : counter.id)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition"
                      >
                        {isAmharic ? 'ቀይር' : 'Change'}
                      </button>

                      {reassignDropdownCounterId === counter.id && (
                        <div className="absolute right-0 mt-1 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95">
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                            {isAmharic ? 'ሰራተኛ ምረጥ' : 'Select Officer'}
                          </div>
                          <button
                            onClick={() => handleAssignOfficer(counter.id, null)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold"
                          >
                            {isAmharic ? 'ሰራተኛን አንሳ (Unassign)' : 'Remove Assigned Officer'}
                          </button>
                          {usersList.map(u => (
                            <button
                              key={u.id}
                              onClick={() => handleAssignOfficer(counter.id, u.id)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium truncate ${
                                u.id === counter.currentOfficerId ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              {u.name} <span className="text-[10px] text-slate-400">({u.role})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Supported Services Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {counter.serviceIds && counter.serviceIds.length > 0 ? (
                    supportedServicesList.slice(0, 3).map(s => (
                      <span 
                        key={s.id}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[120px]"
                      >
                        {isAmharic ? s.nameAmharic : s.name}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {isAmharic ? 'ሁሉንም አገልግሎቶች ያስተናግዳል' : 'All Services Handled'}
                    </span>
                  )}
                  {counter.serviceIds && counter.serviceIds.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">
                      +{counter.serviceIds.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Action Footer with Direct Display Connection */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                
                {/* Primary Button: Launch Dedicated Counter Display */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (onOpenCounterDisplay) {
                        onOpenCounterDisplay(counter.id, counter.number);
                      } else {
                        window.open(getCounterDisplayUrl(counter.number), '_blank');
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    title="Open live counter display screen for this counter"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'ስክሪን ክፈት' : 'Open Display'}</span>
                  </button>

                  <button
                    onClick={() => setPairingModalCounter(counter)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-200 border border-slate-200 rounded-xl text-xs transition"
                    title="Display Pairing Link & QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

                {/* Secondary Action Icons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTestChime(counter)}
                    className="p-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-xs transition"
                    title="Test Audio Chime"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setEditingCounter({
                            ...counter,
                            serviceIds: counter.serviceIds || []
                          });
                          setModalError('');
                          setIsCounterModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition"
                        title="Edit Counter"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteCounter(counter)}
                        className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs transition"
                        title="Delete Counter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT COUNTER MODAL */}
      {/* ========================================================================= */}
      {isCounterModalOpen && editingCounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Tv className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingCounter.id ? (isAmharic ? 'መስኮት አስተካክል' : 'Edit Counter') : (isAmharic ? 'አዲስ መስኮት ጨምር' : 'Add New Counter')}
                </h3>
              </div>
              <button 
                onClick={() => setIsCounterModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCounter} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAmharic ? 'የመስኮት ቁጥር' : 'Counter Number'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingCounter.number || ''}
                    onChange={(e) => setEditingCounter({ ...editingCounter, number: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAmharic ? 'የመስኮቱ ሁኔታ' : 'Initial Status'}
                  </label>
                  <select
                    value={editingCounter.status || 'AVAILABLE'}
                    onChange={(e) => setEditingCounter({ ...editingCounter, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    <option value="AVAILABLE">{isAmharic ? 'ዝግጁ (AVAILABLE)' : 'AVAILABLE'}</option>
                    <option value="SERVING">{isAmharic ? 'በአገልግሎት ላይ (SERVING)' : 'SERVING'}</option>
                    <option value="CLOSED">{isAmharic ? 'የተዘጋ (CLOSED)' : 'CLOSED'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAmharic ? 'የመስኮቱ ስም (English)' : 'Counter Name (English)'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter 1 (Main Registration)"
                  value={editingCounter.name || ''}
                  onChange={(e) => setEditingCounter({ ...editingCounter, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAmharic ? 'የመስኮቱ ስም (አማርኛ)' : 'Counter Name (Amharic)'}
                </label>
                <input
                  type="text"
                  placeholder="ለምሳሌ፡ መስኮት 1 (ዋና ምዝገባ)"
                  value={editingCounter.nameAmharic || ''}
                  onChange={(e) => setEditingCounter({ ...editingCounter, nameAmharic: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAmharic ? 'አካባቢ / ክፍል' : 'Location / Room'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Window 1, 1st Floor"
                    value={editingCounter.location || ''}
                    onChange={(e) => setEditingCounter({ ...editingCounter, location: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAmharic ? 'የተመደበ ሰራተኛ' : 'Assigned Officer'}
                  </label>
                  <select
                    value={editingCounter.currentOfficerId || ''}
                    onChange={(e) => setEditingCounter({ ...editingCounter, currentOfficerId: e.target.value || undefined })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    <option value="">{isAmharic ? 'ሰራተኛ አልተመደበም' : 'Unassigned'}</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supported Services Multi-select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {isAmharic ? 'የሚስተናገዱ አገልግሎቶች (Supported Services)' : 'Supported Services for this Counter'}
                </label>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 max-h-36 overflow-y-auto">
                  <div className="text-[11px] text-slate-500 mb-1 font-medium">
                    {isAmharic ? 'ምንም ካልተመረጠ ሁሉንም አገልግሎቶች ያስተናግዳል' : 'Leave empty to allow this counter to handle all services.'}
                  </div>
                  {services.map(s => {
                    const isChecked = editingCounter.serviceIds?.includes(s.id) || false;
                    return (
                      <label key={s.id} className="flex items-center space-x-2 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = editingCounter.serviceIds || [];
                            if (e.target.checked) {
                              setEditingCounter({ ...editingCounter, serviceIds: [...current, s.id] });
                            } else {
                              setEditingCounter({ ...editingCounter, serviceIds: current.filter(id => id !== s.id) });
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-semibold text-slate-800">
                          {isAmharic ? s.nameAmharic : s.name} ({s.prefix})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCounterModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  {isAmharic ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCounter.id ? (isAmharic ? 'አሻሽል' : 'Save Changes') : (isAmharic ? 'ፍጠር' : 'Create Counter')}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PAIRING / DISPLAY SETUP MODAL */}
      {/* ========================================================================= */}
      {pairingModalCounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold font-mono">
                  0{pairingModalCounter.number}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isAmharic ? `የመስኮት 0${pairingModalCounter.number} ስክሪን ቅንብር` : `Counter 0${pairingModalCounter.number} Display Setup`}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{pairingModalCounter.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setPairingModalCounter(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 font-medium">
                {isAmharic
                  ? 'ይህንን ማስፈንጠሪያ በመስኮቱ ላይ በተገጠመ ታብሌት፣ ስማርት ስክሪን ወይም ሞኒተር ላይ በመክፈት ራሱን የቻለ የቀጥታ የመስኮት ስክሪን ያድርጉት።'
                  : 'Open this direct display URL on tablet screens or overhead monitors mounted at this counter station.'}
              </p>

              {/* Direct URL Box */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAmharic ? 'የስክሪኑ ቋሚ ማስፈንጠሪያ (Display URL)' : 'Direct Screen Terminal URL'}
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono text-[11px] break-all select-all">
                  {getCounterDisplayUrl(pairingModalCounter.number)}
                </div>
                <button
                  onClick={() => handleCopyLink(pairingModalCounter.number)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? (isAmharic ? 'ተቀድቷል!' : 'Copied!') : (isAmharic ? 'ማስፈንጠሪያ ቅዳ' : 'Copy Display Link')}</span>
                </button>
              </div>

              {/* Launch in new tab button */}
              <button
                onClick={() => window.open(getCounterDisplayUrl(pairingModalCounter.number), '_blank')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4 text-indigo-400" />
                <span>{isAmharic ? 'ስክሪኑን በአዲስ ገጽ ክፈት' : 'Open in New Window / Tab'}</span>
              </button>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>Auto Addis AI Voice Sync</span>
                </span>
                <span>Port 3000 Ingress</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
