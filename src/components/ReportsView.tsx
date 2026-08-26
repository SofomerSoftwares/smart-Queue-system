import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Clock, 
  Users, 
  CheckCircle, 
  UserX, 
  TrendingUp,
  FileSpreadsheet,
  Shield,
  Lock,
  UserCheck,
  Sparkles,
  AlertCircle,
  Star,
  MessageSquare,
  MessageCircleHeart,
  ThumbsUp,
  Smile
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { QueueStats, CustomerReview } from '../types';

export const ReportsView: React.FC = () => {
  const { uiLanguage } = useQueue();
  const { user, login, demoLogin } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statsData, setStatsData] = useState<QueueStats | null>(null);
  const [reviewsList, setReviewsList] = useState<CustomerReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Admin Gate Form State
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('Admin@123');
  const [adminGateError, setAdminGateError] = useState<string>('');
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState<boolean>(false);

  const isAmharic = uiLanguage === 'AMHARIC';

  const loadReport = async (date: string) => {
    if (!user || user.role !== 'ADMIN') return;
    try {
      setIsLoading(true);
      const [res, revRes] = await Promise.all([
        api.getReportsSummary(date),
        api.getCustomerReviews(date)
      ]);
      if (res.success) {
        setStatsData(res.stats);
      }
      if (revRes.success) {
        setReviewsList(revRes.reviews || []);
      }
    } catch (err) {
      console.warn('Error loading report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadReport(selectedDate);
    }
  }, [selectedDate, user?.role]);

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
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  <Lock className="w-3 h-3" />
                  <span>{isAmharic ? 'የተገደበ መዳረሻ' : 'Restricted Access'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {isAmharic ? 'የወረፋ እና የአገልግሎት ሪፖርቶች' : 'Queue Analytics & Reports'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                  {isAmharic 
                    ? 'የወረፋ አፈፃፀም፣ የቆይታ ጊዜ እና የሰራተኞች ስታቲስቲክስ ሪፖርቶች ለአስተዳዳሪ ብቻ የተፈቀደ ነው።'
                    : 'Detailed daily queue throughput, customer wait times, and officer efficiency analytics are restricted to System Administrators.'}
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

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isLoggingInAdmin}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isLoggingInAdmin ? (isAmharic ? 'በማረጋገጥ ላይ...' : 'Verifying...') : (isAmharic ? 'እንደ አስተዳዳሪ ግባ' : 'Sign In as Administrator')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => demoLogin('ADMIN')}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isAmharic ? 'ፈጣን የአስተዳዳሪ መግቢያ (Quick Admin Sign-In)' : 'Quick Demo Admin Sign-In (admin)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const handleExportCSV = () => {
    if (!statsData) return;
    const rows = [
      ['Metric', 'Value'],
      ['Date', statsData.dateKey],
      ['Total Tickets', statsData.total],
      ['Completed', statsData.completed],
      ['Waiting', statsData.waiting],
      ['No-Show', statsData.noShow],
      ['Cancelled', statsData.cancelled],
      ['Avg Wait Minutes', statsData.avgWaitMinutes],
      ['Avg Service Minutes', statsData.avgServiceMinutes],
      [''],
      ['Service Name', 'Prefix', 'Total', 'Completed', 'Waiting', 'Avg Wait Mins', 'Avg Service Mins']
    ];

    statsData.serviceBreakdown.forEach(s => {
      rows.push([
        s.serviceName,
        s.prefix,
        s.total.toString(),
        s.completed.toString(),
        s.waiting.toString(),
        s.avgWaitMinutes.toString(),
        s.avgServiceMinutes.toString()
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `queue_report_${statsData.dateKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isAmharic ? 'የወረፋ እና የአገልግሎት ሪፖርቶች' : 'Queue Analytics & Reports'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {isAmharic ? 'የደንበኞች ቁጥር፣ የቆይታ ጊዜ እና የመስኮቶች አፈፃፀም' : 'Daily throughput, wait times and counter efficiency breakdown'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAmharic ? 'CSV አውርድ' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {statsData && (
        <>
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{isAmharic ? 'ጠቅላላ ደንበኞች' : 'Total Tickets'}</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{statsData.total}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{isAmharic ? 'የተስተናገዱ' : 'Completed'}</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-700 mt-2 font-mono">{statsData.completed}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{isAmharic ? 'አማካይ የጥበቃ ደቂቃ' : 'Avg Wait Time'}</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2 font-mono">~{statsData.avgWaitMinutes}m</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{isAmharic ? 'አማካይ የአገልግሎት ደቂቃ' : 'Avg Service Time'}</span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-indigo-900 mt-2 font-mono">~{statsData.avgServiceMinutes}m</div>
            </div>
          </div>

          {/* Service Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              {isAmharic ? 'በአገልግሎት አይነት የተከፋፈለ ሪፖርት' : 'SERVICE BREAKDOWN'}
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Prefix</th>
                    <th className="py-3 px-4">Service Name</th>
                    <th className="py-3 px-4 text-center">Total</th>
                    <th className="py-3 px-4 text-center">Served</th>
                    <th className="py-3 px-4 text-center">Waiting</th>
                    <th className="py-3 px-4 text-right">Avg Wait</th>
                    <th className="py-3 px-4 text-right">Avg Service</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {statsData.serviceBreakdown.map((s) => (
                    <tr key={s.serviceId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-black font-mono text-indigo-600">{s.prefix}</td>
                      <td className="py-3.5 px-4 text-slate-900 font-bold">
                        {isAmharic ? (s.serviceNameAmharic || s.serviceName) : s.serviceName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">{s.total}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-600 font-bold">{s.completed}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-600 font-bold">{s.waiting}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">~{s.avgWaitMinutes}m</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">~{s.avgServiceMinutes}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Counter Performance */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              {isAmharic ? 'የመስኮቶች አፈፃፀም' : 'COUNTER PRODUCTIVITY'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statsData.counterBreakdown.map((cnt) => (
                <div key={cnt.counterId} className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isAmharic ? `መስኮት 0${cnt.counterNumber}` : `Counter 0${cnt.counterNumber}`}
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                    {cnt.totalServed} {isAmharic ? 'ደንበኞች' : 'served'}
                  </div>
                  <div className="text-xs text-slate-500 mt-2 font-medium">
                    {isAmharic ? `አማካይ ደቂቃ: ~${cnt.avgServiceMinutes}m` : `Avg time: ~${cnt.avgServiceMinutes}m`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews & Feedback Dashboard */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <MessageCircleHeart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {isAmharic ? 'የደንበኞች እርካታ እና አስተያየቶች' : 'CUSTOMER SATISFACTION & REVIEWS'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {isAmharic ? 'በሞባይል መከታተያ በኩል የተሰበሰቡ የቀጥታ አስተያየቶች' : 'Real-time feedback submitted from mobile ticket tracker'}
                  </p>
                </div>
              </div>

              {reviewsList.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-3 py-1 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-xs font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>
                      {(reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)} / 5.0
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    ({reviewsList.length} {isAmharic ? 'አስተያየቶች' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            {reviewsList.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-2xl text-center space-y-2 border border-dashed border-slate-200">
                <Smile className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600">
                  {isAmharic ? 'ለዚህ ቀን እስካሁን ምንም አስተያየት አልተሰጠም' : 'No customer reviews recorded for this date yet'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isAmharic ? 'ደንበኞች በሞባይል ትራከር በኩል ደረጃ ሲሰጡ እዚህ ይታያሉ።' : 'Customer reviews will automatically appear here when submitted on mobile tracker.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reviewsList.slice(0, 8).map((rev) => (
                    <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                            {rev.ticketNumber}
                          </span>
                          <div className="flex items-center space-x-0.5">
                            {[1, 2, 3, 4, 5].map((st) => (
                              <Star
                                key={st}
                                className={`w-3.5 h-3.5 ${
                                  st <= rev.rating 
                                    ? 'text-amber-400 fill-amber-400' 
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(rev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rev.tags.map((tg, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md font-medium">
                              {tg}
                            </span>
                          ))}
                        </div>
                      )}

                      {rev.comment && (
                        <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-100 font-sans">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
