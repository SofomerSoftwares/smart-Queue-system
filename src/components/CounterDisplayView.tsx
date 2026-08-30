import React, { useState, useEffect, useMemo } from 'react';
import { 
  Monitor, 
  Tv, 
  Search, 
  MapPin, 
  UserCheck, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Maximize2, 
  Minimize2, 
  Filter, 
  Volume2, 
  Layers, 
  Sparkles, 
  Flame, 
  Zap, 
  Building2, 
  Radio, 
  HelpCircle,
  ChevronRight,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQueue } from '../context/QueueContext';
import { Counter, QueueTicket } from '../types';

export const CounterDisplayView: React.FC = () => {
  const { 
    counters, 
    waitingTickets, 
    servingTickets, 
    services, 
    officeSetting, 
    uiLanguage, 
    isAudioUnlocked, 
    unlockAudio 
  } = useQueue();

  const isAmharic = uiLanguage === 'AMHARIC';

  // Mode: 'grid' (All Counter Stations) | 'overhead' (Dedicated Single Counter Overhead Sign)
  const [viewMode, setViewMode] = useState<'grid' | 'overhead'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('counter') ? 'overhead' : 'grid';
    } catch {
      return 'grid';
    }
  });

  // Selected counter for single-counter overhead screen
  const [selectedCounterId, setSelectedCounterId] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const cntParam = params.get('counter');
      if (cntParam && counters.length > 0) {
        const found = counters.find(c => c.number.toString() === cntParam || c.id === cntParam);
        if (found) return found.id;
      }
    } catch {}
    return counters[0]?.id || '';
  });

  // If selectedCounterId is empty but counters load, select first
  useEffect(() => {
    if (!selectedCounterId && counters.length > 0) {
      setSelectedCounterId(counters[0].id);
    }
  }, [counters, selectedCounterId]);

  // Customer Station Finder Search
  const [searchTicketQuery, setSearchTicketQuery] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Active single counter object
  const activeSingleCounter = useMemo(() => {
    return counters.find(c => c.id === selectedCounterId) || counters[0];
  }, [counters, selectedCounterId]);

  // Get active ticket for a counter
  const getCounterActiveTicket = (counter: Counter): QueueTicket | undefined => {
    if (!counter.currentTicketId && !counter.currentTicketNumber) return undefined;
    return servingTickets.find(t => t.id === counter.currentTicketId || t.ticketNumber === counter.currentTicketNumber);
  };

  // Find tickets waiting for services handled at a given counter
  const getCounterWaitCount = (counter: Counter): number => {
    return waitingTickets.filter(t => t.counterNumber === counter.number || !t.counterNumber).length;
  };

  // Customer Ticket Finder Search Result
  const searchResult = useMemo(() => {
    if (!searchTicketQuery.trim()) return null;
    const clean = searchTicketQuery.trim().toUpperCase();

    // Check serving tickets first
    const servingMatch = servingTickets.find(t => t.ticketNumber.toUpperCase() === clean);
    if (servingMatch) {
      const counter = counters.find(c => c.number === servingMatch.counterNumber || c.id === servingMatch.counterId);
      return {
        ticket: servingMatch,
        status: 'SERVING' as const,
        counter,
        message: isAmharic 
          ? `የእርስዎ ቲኬት ${servingMatch.ticketNumber} አሁን በመስኮት ${servingMatch.counterNumber || 1} እየተስተናገደ ነው!`
          : `Your ticket ${servingMatch.ticketNumber} is NOW SERVING at Counter ${servingMatch.counterNumber || 1}!`
      };
    }

    // Check waiting tickets
    const waitingIdx = waitingTickets.findIndex(t => t.ticketNumber.toUpperCase() === clean);
    if (waitingIdx !== -1) {
      const waitTicket = waitingTickets[waitingIdx];
      const assignedCounter = counters.find(c => c.number === waitTicket.counterNumber);
      return {
        ticket: waitTicket,
        status: 'WAITING' as const,
        position: waitingIdx + 1,
        counter: assignedCounter,
        message: isAmharic
          ? `ቲኬት ${waitTicket.ticketNumber} በወረፋ ላይ ነው። ከእርስዎ በፊት ${waitingIdx} ደንበኞች አሉ።`
          : `Ticket ${waitTicket.ticketNumber} is waiting in queue. Position: #${waitingIdx + 1}.`
      };
    }

    return { notFound: true, query: clean };
  }, [searchTicketQuery, servingTickets, waitingTickets, counters, isAmharic]);

  // Filtered counters for grid
  const filteredCounters = useMemo(() => {
    return counters.filter(cnt => {
      // Status filter
      if (statusFilter === 'ACTIVE' && cnt.status === 'CLOSED') return false;
      if (statusFilter === 'CLOSED' && cnt.status !== 'CLOSED') return false;

      // Service filter
      if (serviceFilter !== 'ALL') {
        const activeTicket = getCounterActiveTicket(cnt);
        if (activeTicket && activeTicket.serviceId !== serviceFilter) return false;
      }

      return true;
    });
  }, [counters, statusFilter, serviceFilter, servingTickets]);

  const activeServingCount = counters.filter(c => c.status === 'SERVING').length;
  const readyAvailableCount = counters.filter(c => c.status === 'AVAILABLE').length;
  const closedCount = counters.filter(c => c.status === 'CLOSED').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Audio Unlock Banner */}
      {!isAudioUnlocked && (
        <div 
          onClick={unlockAudio}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors shadow-md z-40 border-b border-indigo-400/30"
        >
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 animate-bounce" />
            <span>
              {isAmharic 
                ? '🔊 የድምፅ ማስታወቂያዎችን ለማንቃት እዚህ ይጫኑ (የቀጥታ ጥሪዎች እንዲሰሙ)' 
                : '🔊 Click here to enable station audio announcements & counter chimes'}
            </span>
          </div>
          <span className="bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded text-[11px] font-black uppercase">
            {isAmharic ? 'አግብር' : 'Enable'}
          </span>
        </div>
      )}

      {/* Top Controls & Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-16 z-20 shadow-md">
        
        {/* Left: View Title & Station Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-950/60">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                {isAmharic ? 'የመስኮት አገልግሎት መከታተያ ስክሪን' : 'Counter Station Directory & Overhead Display'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                {counters.length} {isAmharic ? 'መስኮቶች' : 'STATIONS'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isAmharic 
                ? 'ለደንበኞች መስኮቶችን በቀላሉ ለመለየት እና የተመደቡበትን መስኮት ለመመልከት' 
                : 'Interactive station overview and dedicated overhead desk signs for customers'}
            </p>
          </div>
        </div>

        {/* Center & Right: Mode Switcher + Live Clock + Fullscreen */}
        <div className="flex items-center gap-2.5 flex-wrap ml-auto">
          
          {/* Mode Tabs */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              id="btn-counter-view-grid"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'የሁሉም መስኮቶች እይታ' : 'All Counters'}</span>
            </button>
            <button
              id="btn-counter-view-overhead"
              onClick={() => setViewMode('overhead')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'overhead'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'የአንድ መስኮት ታብሌት ስክሪን' : 'Overhead Sign Mode'}</span>
            </button>
          </div>

          {/* Station Selector Dropdown (When in overhead sign mode) */}
          {viewMode === 'overhead' && (
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">
                {isAmharic ? 'መስኮት ምረጥ:' : 'Counter:'}
              </span>
              <select
                id="select-overhead-counter"
                value={selectedCounterId}
                onChange={(e) => setSelectedCounterId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-2 py-1 focus:outline-hidden focus:border-indigo-500"
              >
                {counters.map(cnt => (
                  <option key={cnt.id} value={cnt.id}>
                    {isAmharic ? `መስኮት ${cnt.number}` : `Counter ${cnt.number}`} - {cnt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Live Clock Pill */}
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{currentTime || '00:00:00'}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            id="btn-counter-fullscreen"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen Display"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ALL COUNTERS GRID & CUSTOMER FINDER MODULE */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
          
          {/* Customer Ticket Station Finder Search Box */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-2">
                    <Search className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'የቲኬት መፈለጊያ' : 'Station Ticket Locator'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {isAmharic ? 'የእርስዎን መስኮት በቀላሉ ያግኙ' : 'Find Your Service Counter'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {isAmharic 
                      ? 'የቲኬት ቁጥርዎን በማስገባት የተመደቡበትን መስኮት እና የመስተንግዶ ሁኔታ ይመልከቱ' 
                      : 'Type your ticket number (e.g. A-101) to locate your assigned counter station and live queue status.'}
                  </p>
                </div>

                {/* Status Summary Chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{activeServingCount} {isAmharic ? 'እያስተናገዱ ያሉ' : 'Serving'}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-blue-950/50 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>{readyAvailableCount} {isAmharic ? 'ዝግጁ' : 'Ready'}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span>{closedCount} {isAmharic ? 'ዝግ' : 'Closed'}</span>
                  </div>
                </div>
              </div>

              {/* Input Box */}
              <div className="flex items-center gap-2 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="input-find-counter-ticket"
                    type="text"
                    value={searchTicketQuery}
                    onChange={(e) => setSearchTicketQuery(e.target.value)}
                    placeholder={isAmharic ? 'የቲኬት ቁጥር ያስገቡ (ምሳሌ፡ A-101)...' : 'Enter ticket number (e.g. A-101)...'}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 rounded-xl text-white font-mono font-bold placeholder:font-sans placeholder:text-slate-500 focus:outline-hidden transition shadow-inner"
                  />
                  {searchTicketQuery && (
                    <button
                      onClick={() => setSearchTicketQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Search Result Banner */}
              <AnimatePresence>
                {searchResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      searchResult.notFound
                        ? 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                        : searchResult.status === 'SERVING'
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100 shadow-lg shadow-emerald-950/50'
                        : 'bg-indigo-950/60 border-indigo-500/50 text-indigo-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
                        searchResult.notFound
                          ? 'bg-rose-800 text-white'
                          : searchResult.status === 'SERVING'
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : 'bg-indigo-600 text-white'
                      }`}>
                        {searchResult.notFound ? '?' : <MapPin className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm sm:text-base">
                          {searchResult.notFound 
                            ? (isAmharic ? `ቲኬት "${searchResult.query}" አልተገኘም` : `Ticket "${searchResult.query}" not found`)
                            : searchResult.message}
                        </div>
                        {!searchResult.notFound && searchResult.counter && (
                          <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                            <span>
                              {isAmharic 
                                ? `አገልግሎት፡ ${searchResult.ticket?.serviceNameAmharic || searchResult.ticket?.serviceName}` 
                                : `Service: ${searchResult.ticket?.serviceName}`}
                            </span>
                            {searchResult.counter.name && (
                              <span>• {searchResult.counter.name}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {!searchResult.notFound && searchResult.counter && (
                      <button
                        id="btn-goto-counter-sign"
                        onClick={() => {
                          setSelectedCounterId(searchResult.counter!.id);
                          setViewMode('overhead');
                        }}
                        className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-slate-200 transition shrink-0 flex items-center gap-1.5"
                      >
                        <span>{isAmharic ? 'የዚህን መስኮት ስክሪን ክፈት' : 'View Station Sign'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isAmharic ? 'አጣራ:' : 'Filter:'}</span>
              </span>

              {/* Status Filter Buttons */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['ALL', 'ACTIVE', 'CLOSED'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      statusFilter === st 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st === 'ALL' && (isAmharic ? 'ሁሉም' : 'All')}
                    {st === 'ACTIVE' && (isAmharic ? 'ክፍት የሆኑ' : 'Open')}
                    {st === 'CLOSED' && (isAmharic ? 'ዝግ የሆኑ' : 'Closed')}
                  </button>
                ))}
              </div>

              {/* Service Filter */}
              <select
                id="select-filter-service"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="ALL">{isAmharic ? 'ሁሉም አገልግሎቶች' : 'All Services'}</option>
                {services.map(srv => (
                  <option key={srv.id} value={srv.id}>
                    {isAmharic ? srv.nameAmharic : srv.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              {isAmharic 
                ? `${filteredCounters.length} ከመስኮቶች መካከል እየታዩ ነው` 
                : `Showing ${filteredCounters.length} counter stations`}
            </div>
          </div>

          {/* Counters Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            <AnimatePresence>
              {filteredCounters.map((cnt) => {
                const activeTicket = getCounterActiveTicket(cnt);
                const isServing = cnt.status === 'SERVING' && activeTicket;
                const isReady = cnt.status === 'AVAILABLE';
                const isClosed = cnt.status === 'CLOSED';
                const waitCount = getCounterWaitCount(cnt);
                const isHighlighted = searchResult && !searchResult.notFound && searchResult.counter?.id === cnt.id;

                return (
                  <motion.div
                    key={cnt.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative ${
                      isHighlighted
                        ? 'ring-4 ring-indigo-500 shadow-2xl shadow-indigo-950 bg-slate-900 border-indigo-400'
                        : isServing
                        ? 'bg-slate-900/95 border-emerald-500/50 hover:border-emerald-400 shadow-lg shadow-slate-950/80'
                        : isReady
                        ? 'bg-slate-900/80 border-blue-500/40 hover:border-blue-400 shadow-md shadow-slate-950/60'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Header Banner */}
                    <div className={`p-4 pb-3 border-b flex items-center justify-between ${
                      isServing
                        ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/20'
                        : isReady
                        ? 'bg-gradient-to-r from-blue-950/40 to-slate-900 border-blue-500/20'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono text-base ${
                          isServing 
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950' 
                            : isReady
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {cnt.number}
                        </div>
                        <div>
                          <div className="text-sm font-black text-white tracking-tight">
                            {isAmharic ? `መስኮት ${cnt.number}` : `Counter ${cnt.number}`}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                            {isAmharic ? (cnt.nameAmharic || cnt.name) : cnt.name}
                          </div>
                        </div>
                      </div>

                      {/* Status Pill */}
                      <div>
                        {isServing ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{isAmharic ? 'በመስተንግዶ ላይ' : 'SERVING'}</span>
                          </span>
                        ) : isReady ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span>{isAmharic ? 'ዝግጁ' : 'READY'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                            {isAmharic ? 'ዝግ' : 'CLOSED'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body: Active Ticket Display */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center text-center space-y-3">
                      <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
                        {isAmharic ? 'አሁን የሚስተናገድ ቲኬት' : 'Now Serving Ticket'}
                      </div>

                      {isServing && activeTicket ? (
                        <div className="space-y-2">
                          <motion.div
                            key={activeTicket.ticketNumber}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-md"
                          >
                            {activeTicket.ticketNumber}
                          </motion.div>

                          {/* Priority Badge if any */}
                          {activeTicket.priority === 'URGENT' && (
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase animate-pulse">
                              <Flame className="w-3 h-3" />
                              <span>{isAmharic ? 'አስቸኳይ' : 'URGENT'}</span>
                            </div>
                          )}
                          {activeTicket.priority === 'PRIORITY' && (
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase">
                              <Zap className="w-3 h-3" />
                              <span>{isAmharic ? 'ቅድሚያ VIP' : 'VIP'}</span>
                            </div>
                          )}

                          <div className="text-xs font-semibold text-indigo-300 truncate max-w-full px-2">
                            {isAmharic ? (activeTicket.serviceNameAmharic || activeTicket.serviceName) : activeTicket.serviceName}
                          </div>
                        </div>
                      ) : isReady ? (
                        <div className="py-2 text-slate-400 space-y-1">
                          <div className="text-2xl font-black font-mono text-blue-400/80">READY</div>
                          <div className="text-xs text-slate-400">
                            {isAmharic ? 'ቀጣዩን ደንበኛ በመጠበቅ ላይ' : 'Awaiting next customer call'}
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 text-slate-600 space-y-1">
                          <div className="text-2xl font-bold font-mono text-slate-700">--</div>
                          <div className="text-xs text-slate-500">
                            {isAmharic ? 'ይህ መስኮት በአሁኑ ሰዓት ዝግ ነው' : 'Station currently inactive'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Officer & Queue Info + Action Button */}
                    <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate font-medium">
                          {cnt.currentOfficerName || (isAmharic ? 'ያልተመደበ' : 'Unassigned')}
                        </span>
                      </div>

                      {/* Launch Single Screen Button */}
                      <button
                        id={`btn-open-sign-cnt-${cnt.number}`}
                        onClick={() => {
                          setSelectedCounterId(cnt.id);
                          setViewMode('overhead');
                        }}
                        title={isAmharic ? 'የዚህን መስኮት ታብሌት ስክሪን ክፈት' : 'Open Overhead Tablet Sign'}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition text-[11px] font-bold flex items-center gap-1"
                      >
                        <span>{isAmharic ? 'ስክሪን' : 'Sign'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: DEDICATED OVERHEAD DIGITAL SIGN (DESK / TABLET MOUNT MODE) */}
      {/* ========================================================================= */}
      {viewMode === 'overhead' && activeSingleCounter && (
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative overflow-hidden">
          
          {/* Ambient Glows */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Main Overhead Sign Container */}
          <div className="w-full max-w-5xl bg-slate-900/90 backdrop-blur-md border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xl shadow-slate-950 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[520px]">
            
            {/* Top Station Bar */}
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-5">
              
              {/* Counter Name & Number */}
              <div className="flex items-center gap-4 text-left">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-mono font-black text-3xl sm:text-4xl shadow-xl shadow-indigo-950">
                  {activeSingleCounter.number}
                </div>
                <div>
                  <div className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    {isAmharic ? `መስኮት ${activeSingleCounter.number}` : `COUNTER ${activeSingleCounter.number}`}
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-slate-400">
                    {isAmharic ? (activeSingleCounter.nameAmharic || activeSingleCounter.name) : activeSingleCounter.name}
                  </div>
                </div>
              </div>

              {/* Live Status Badge */}
              <div>
                {activeSingleCounter.status === 'SERVING' ? (
                  <div className="px-5 py-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/40 text-sm sm:text-base font-black uppercase tracking-wider flex items-center gap-2.5 shadow-lg shadow-emerald-950/60">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{isAmharic ? 'በመስተንግዶ ላይ' : 'SERVING NOW'}</span>
                  </div>
                ) : activeSingleCounter.status === 'AVAILABLE' ? (
                  <div className="px-5 py-2.5 rounded-2xl bg-blue-500/20 text-blue-300 border-2 border-blue-500/40 text-sm sm:text-base font-black uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-blue-400" />
                    <span>{isAmharic ? 'ዝግጁ' : 'READY / WAITING'}</span>
                  </div>
                ) : (
                  <div className="px-5 py-2.5 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 text-sm sm:text-base font-bold uppercase tracking-wider">
                    {isAmharic ? 'ዝግ ነው' : 'STATION CLOSED'}
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Giant Serving Ticket Display with Animations */}
            <div className="my-8 sm:my-12 w-full flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {(() => {
                  const activeTicket = getCounterActiveTicket(activeSingleCounter);

                  if (activeSingleCounter.status === 'SERVING' && activeTicket) {
                    return (
                      <motion.div
                        key={activeTicket.ticketNumber + (activeTicket.calledAt || '')}
                        initial={{ scale: 0.85, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0, y: -20 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                        className="space-y-4 sm:space-y-6 w-full"
                      >
                        {/* Priority Badge */}
                        {activeTicket.priority === 'URGENT' && (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-600 text-white rounded-full text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-rose-950 animate-pulse">
                            <Flame className="w-4 h-4" />
                            <span>{isAmharic ? '⚡ አስቸኳይ ቅድሚያ' : '⚡ URGENT PRIORITY'}</span>
                          </div>
                        )}
                        {activeTicket.priority === 'PRIORITY' && (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-slate-950 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider shadow-md">
                            <Zap className="w-4 h-4" />
                            <span>{isAmharic ? '★ የክብር ደንበኛ (VIP)' : '★ VIP CUSTOMER'}</span>
                          </div>
                        )}

                        <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-400">
                          {isAmharic ? 'እባክዎ ወደዚህ መስኮት ይቅረቡ' : 'PLEASE STEP FORWARD TO THIS COUNTER'}
                        </div>

                        {/* GIANT TICKET NUMBER */}
                        <div className="text-7xl sm:text-9xl lg:text-[11rem] font-black font-mono tracking-tight text-white leading-none drop-shadow-xl text-center select-all">
                          {activeTicket.ticketNumber}
                        </div>

                        {/* Amharic Letter */}
                        {activeTicket.ticketNumberAmharic && activeTicket.ticketNumberAmharic !== activeTicket.ticketNumber && (
                          <div className="text-2xl sm:text-3xl font-light text-slate-400 font-sans italic">
                            {activeTicket.ticketNumberAmharic}
                          </div>
                        )}

                        {/* Service Category Badge */}
                        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-sm sm:text-lg font-bold text-indigo-300">
                          <span>{isAmharic ? (activeTicket.serviceNameAmharic || activeTicket.serviceName) : activeTicket.serviceName}</span>
                        </div>
                      </motion.div>
                    );
                  }

                  if (activeSingleCounter.status === 'AVAILABLE') {
                    return (
                      <motion.div
                        key="ready-state"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-12 space-y-4"
                      >
                        <div className="w-20 h-20 rounded-full bg-blue-500/10 border-2 border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center animate-pulse">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="text-4xl sm:text-6xl font-black font-mono text-blue-300 tracking-wide">
                          {isAmharic ? 'ክፍት / ዝግጁ' : 'READY FOR NEXT'}
                        </div>
                        <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto font-medium">
                          {isAmharic 
                            ? 'ይህ መስኮት ዝግጁ ነው። ቀጣዩ ደንበኛ ሲጠራ ቲኬቱ እዚህ ይገለጻል።' 
                            : 'This station is ready. Next customer ticket number will appear here when called.'}
                        </p>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key="closed-state"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-12 space-y-4"
                    >
                      <div className="text-6xl sm:text-8xl font-black font-mono text-slate-700">
                        --
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-500 uppercase tracking-wider">
                        {isAmharic ? 'መስኮቱ ዝግ ነው' : 'STATION CLOSED'}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {isAmharic ? 'እባክዎ ወደ ሌሎች ክፍት መስኮቶች ይሂዱ።' : 'Please proceed to other active stations in the hall.'}
                      </p>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>

            {/* Bottom Station Footer Bar */}
            <div className="w-full pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>
                  {isAmharic ? 'የመስኮት ባለሙያ:' : 'Service Officer:'}{' '}
                  <strong className="text-white">
                    {activeSingleCounter.currentOfficerName || (isAmharic ? 'ያልተመደበ' : 'Unassigned')}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('grid')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'ሁሉንም መስኮቶች ይመልከቱ' : 'Back to All Stations'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
