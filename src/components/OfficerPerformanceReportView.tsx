import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Star, 
  TrendingUp,
  Download,
  Search,
  Shield,
  Medal,
  Lock,
  UserCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

// Mock data for the dashboard
const officerStats = [
  { id: 'OFC-001', name: 'Abebe Kebede', role: 'Senior Officer', ticketsServed: 145, avgServiceTime: 4.5, rating: 4.8, status: 'Active' },
  { id: 'OFC-002', name: 'Tigist Alemu', role: 'Officer', ticketsServed: 132, avgServiceTime: 5.2, rating: 4.6, status: 'Active' },
  { id: 'OFC-003', name: 'Dawit Bekele', role: 'Junior Officer', ticketsServed: 98, avgServiceTime: 6.5, rating: 4.2, status: 'Active' },
  { id: 'OFC-004', name: 'Sara Tesfaye', role: 'Senior Officer', ticketsServed: 167, avgServiceTime: 3.8, rating: 4.9, status: 'Offline' },
  { id: 'OFC-005', name: 'Yared Mamo', role: 'Officer', ticketsServed: 112, avgServiceTime: 5.8, rating: 4.4, status: 'Active' },
];

const performanceTrend = [
  { date: 'Mon', tickets: 450, avgTime: 5.2 },
  { date: 'Tue', tickets: 520, avgTime: 5.0 },
  { date: 'Wed', tickets: 480, avgTime: 5.4 },
  { date: 'Thu', tickets: 610, avgTime: 4.8 },
  { date: 'Fri', tickets: 590, avgTime: 4.9 },
  { date: 'Sat', tickets: 310, avgTime: 6.1 },
  { date: 'Sun', tickets: 0, avgTime: 0 },
];

export const OfficerPerformanceReportView: React.FC = () => {
  const { uiLanguage } = useQueue();
  const { user, login } = useAuth();
  const isAmharic = uiLanguage === 'AMHARIC';
  const [searchTerm, setSearchTerm] = useState('');
  
  // Admin Gate Form State
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminGateError, setAdminGateError] = useState<string>('');
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  const [reportData, setReportData] = useState<{ officerStats: any[], performanceTrend: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchReport();
    }
  }, [user]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/reports/officer-performance');
      const data = await res.json();
      if (data.success) {
        setReportData({ officerStats: data.officerStats, performanceTrend: data.performanceTrend });
      }
    } catch (err) {
      console.error('Failed to fetch officer performance report', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentOfficerStats = reportData?.officerStats || [];
  const currentPerformanceTrend = reportData?.performanceTrend || [];

  const filteredOfficers = currentOfficerStats.filter(officer => 
    officer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    officer.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      const dataUrl = await toPng(reportRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        filter: (node) => {
          // exclude elements that have 'print:hidden' in their classList, or have data-html2canvas-ignore
          if (node instanceof HTMLElement) {
            if (node.dataset.html2canvasIgnore !== undefined) return false;
            if (node.classList && node.classList.contains('print:hidden')) return false;
          }
          return true;
        }
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      // Calculate height maintaining aspect ratio based on original element dimensions
      const props = pdf.getImageProperties(dataUrl);
      const pdfHeight = (props.height * pdfWidth) / props.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('officer-performance-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAdminGateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminGateError('');
    setIsLoggingInAdmin(true);
    try {
      await login(adminUsername, adminPassword);
    } catch (err: any) {
      setAdminGateError(err.message || (isAmharic ? 'የአስተዳዳሪ መለያ ስም ወይም የይለፍ ቃል ትክክል አይደለም' : 'Invalid administrator credentials'));
    } finally {
      setIsLoggingInAdmin(false);
    }
  };

  // Guard: Analytics & Reports are only accessible to ADMIN role
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20 border border-indigo-400/30 shrink-0">
                <Medal className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  <Lock className="w-3 h-3" />
                  <span>{isAmharic ? 'የተገደበ መዳረሻ' : 'Restricted Access'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {isAmharic ? 'የሰራተኞች አፈፃፀም ሪፖርት' : 'Officer Performance Report'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                  {isAmharic 
                    ? 'የሰራተኞች የስራ አፈፃፀም ሪፖርቶች ለአስተዳዳሪ ብቻ የተፈቀደ ነው።'
                    : 'Detailed officer productivity and performance analytics are restricted to System Administrators.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm shrink-0">
                  {user ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : <Lock className="w-4 h-4 text-slate-500" />}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">
                    {isAmharic ? 'የአሁኑ መለያ' : 'Current Session'}
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {user ? `${user.name} (${user.role.replace('_', ' ')})` : (isAmharic ? 'ምንም የገባ ተጠቃሚ የለም' : 'No active session (Guest)')}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold self-start sm:self-auto">
                {isAmharic ? 'የአስተዳዳሪ ፈቃድ ያስፈልጋል' : 'Admin Privileges Required'}
              </span>
            </div>

            <form onSubmit={handleAdminGateLogin} className="space-y-4 max-w-md mx-auto pt-2">
              <div className="text-center space-y-1 mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  {isAmharic ? 'በአስተዳዳሪ መለያ ይግቡ' : 'Authenticate as Administrator'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isAmharic ? 'ሪፖርቶችን ለማየት የአስተዳዳሪ መለያ ይጠቀሙ' : 'Sign in with administrator privileges to view analytics.'}
                </p>
              </div>

              {adminGateError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{adminGateError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAmharic ? 'የተጠቃሚ ስም (Username)' : 'Username'}
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAmharic ? 'የይለፍ ቃል (Password)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoggingInAdmin}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isLoggingInAdmin ? (isAmharic ? 'በማረጋገጥ ላይ...' : 'Verifying...') : (isAmharic ? 'እንደ አስተዳዳሪ ግባ' : 'Sign In as Administrator')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div ref={reportRef} className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
            <Medal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isAmharic ? 'የሰራተኞች አፈፃፀም ሪፖርት' : 'Officer Performance Report'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {isAmharic ? 'የእያንዳንዱ ሰራተኛ አገልግሎት እና የስራ አፈፃፀም መከታተያ' : 'Comprehensive dashboard for tracking officer productivity and service quality'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          data-html2canvas-ignore
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition shadow-sm print:hidden cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>
            {isExporting 
              ? (isAmharic ? 'በማዘጋጀት ላይ...' : 'Exporting...') 
              : (isAmharic ? 'ሪፖርት አውርድ (PDF)' : 'Export Report')}
          </span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAmharic ? 'ጠቅላላ ሰራተኞች' : 'Total Officers'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 font-mono">{currentOfficerStats.length}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{isAmharic ? `በስራ ላይ ያሉ ${currentOfficerStats.filter(o => o.status === 'Active').length}` : `${currentOfficerStats.filter(o => o.status === 'Active').length} currently active`}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAmharic ? 'አማካይ የአገልግሎት ጊዜ' : 'Avg Service Time'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 font-mono">
              {currentOfficerStats.length > 0 
                ? (currentOfficerStats.reduce((acc, o) => acc + o.avgServiceTime, 0) / currentOfficerStats.length).toFixed(1) 
                : '0'}m
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span>{isAmharic ? 'የሁሉም ሰራተኞች አማካይ' : 'Across all officers'}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAmharic ? 'የተስተናገዱ ደንበኞች' : 'Tickets Resolved'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 font-mono">
              {currentOfficerStats.reduce((acc, o) => acc + o.ticketsServed, 0)}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span>{isAmharic ? 'በጠቅላላ የተስተናገዱ' : 'Total resolved'}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAmharic ? 'አማካይ የእርካታ ደረጃ' : 'Avg Customer Rating'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 font-mono">
              {currentOfficerStats.length > 0 && currentOfficerStats.some(o => o.rating > 0)
                ? (currentOfficerStats.reduce((acc, o) => acc + o.rating, 0) / currentOfficerStats.filter(o => o.rating > 0).length).toFixed(1)
                : '0'}<span className="text-lg text-slate-400">/5</span></h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {isAmharic ? 'ከተሰጡ አስተያየቶች' : 'Based on reviews'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Performance by Officer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {isAmharic ? 'የሰራተኞች የደንበኛ መስተንግዶ መጠን' : 'Tickets Served by Officer'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAmharic ? 'የዚህ ሳምንት አፈፃፀም' : 'Performance for the current week'}
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentOfficerStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="ticketsServed" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart: Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {isAmharic ? 'የሳምንቱ አጠቃላይ አፈፃፀም' : 'Weekly Performance Trend'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAmharic ? 'በየቀኑ የተስተናገዱ ደንበኞች ብዛት' : 'Total tickets resolved per day'}
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentPerformanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="tickets" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Officers Detailed Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {isAmharic ? 'የሰራተኞች ዝርዝር ሪፖርት' : 'Detailed Officer Metrics'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAmharic ? 'የእያንዳንዱ ሰራተኛ ሙሉ መረጃ' : 'Full breakdown of individual performance'}
            </p>
          </div>
          <div className="relative print:hidden">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={isAmharic ? 'ሰራተኛ ፈልግ...' : 'Search officers...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors w-full sm:w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-6">{isAmharic ? 'መለያ' : 'ID'}</th>
                <th className="py-4 px-6">{isAmharic ? 'ስም' : 'Name'}</th>
                <th className="py-4 px-6">{isAmharic ? 'የስራ ድርሻ' : 'Role'}</th>
                <th className="py-4 px-6 text-center">{isAmharic ? 'የተስተናገዱ' : 'Tickets Served'}</th>
                <th className="py-4 px-6 text-center">{isAmharic ? 'አማካይ ጊዜ' : 'Avg Time'}</th>
                <th className="py-4 px-6 text-center">{isAmharic ? 'እርካታ' : 'Rating'}</th>
                <th className="py-4 px-6 text-center">{isAmharic ? 'ሁኔታ' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOfficers.map((officer) => (
                <tr key={officer.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-indigo-600">{officer.id}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">{officer.name}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                      <Shield className="w-3 h-3" />
                      {officer.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center font-mono font-bold text-slate-700">{officer.ticketsServed}</td>
                  <td className="py-4 px-6 text-center font-mono text-slate-600">{officer.avgServiceTime}m</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-1 text-amber-500 font-bold font-mono">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {officer.rating.toFixed(1)}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      officer.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {isAmharic && officer.status === 'Active' ? 'በስራ ላይ' : 
                       isAmharic && officer.status === 'Offline' ? 'ከመስመር ውጭ' : 
                       officer.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredOfficers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 px-6 text-center text-slate-500 text-sm">
                    {isAmharic ? 'ምንም ሰራተኛ አልተገኘም' : 'No officers found matching your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
