import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  Volume2, 
  Users, 
  Layers, 
  Tv, 
  FileText, 
  Play, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  RotateCcw, 
  Music, 
  Sparkles, 
  Upload, 
  Activity,
  BarChart,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { audioManager } from '../lib/audioManager';
import { Service, Counter, User, AudioSetting, OfficeSetting, AuditLog } from '../types';

export const AdminView: React.FC = () => {
  const { 
    services, 
    counters, 
    officeSetting, 
    audioSetting, 
    stats, 
    uiLanguage, 
    resetDailyQueue,
    refreshQueue 
  } = useQueue();

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'counters' | 'staff' | 'audio' | 'office' | 'audit'>('overview');

  const isAmharic = uiLanguage === 'AMHARIC';

  // State for Users & Audit
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [audioAssets, setAudioAssets] = useState<any[]>([]);

  // Modals & Form States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

  const [isCounterModalOpen, setIsCounterModalOpen] = useState<boolean>(false);
  const [editingCounter, setEditingCounter] = useState<Partial<Counter> | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Audio Testing State
  const [testVoiceText, setTestVoiceText] = useState<string>('ቁጥር ሀ ሃያ አራት ወደ ቆጣሪ ሁለት ይሂዱ');
  const [testLanguage, setTestLanguage] = useState<'AMHARIC' | 'ENGLISH'>('AMHARIC');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [testVoiceStatus, setTestVoiceStatus] = useState<string>('');

  // AI Music Generator State
  const [musicPrompt, setMusicPrompt] = useState<string>('Gentle calm ambient office lounge background chords relaxing');
  const [isGeneratingMusic, setIsGeneratingMusic] = useState<boolean>(false);

  // Office Settings Form
  const [officeForm, setOfficeForm] = useState<Partial<OfficeSetting>>({});
  const [audioForm, setAudioForm] = useState<Partial<AudioSetting>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (officeSetting) setOfficeForm(officeSetting);
    if (audioSetting) {
      setAudioForm(audioSetting);
      setSelectedVoice(audioSetting.ttsVoice || 'Kore');
    }
  }, [officeSetting, audioSetting]);

  const loadAdminData = async () => {
    try {
      const [uRes, aRes, audRes] = await Promise.all([
        api.getUsers().catch(() => ({ success: false, users: [] })),
        api.getAuditLogs().catch(() => ({ success: false, logs: [] })),
        api.getAudioAssets().catch(() => ({ success: false, assets: [] }))
      ]);

      if (uRes.success) setUsersList(uRes.users);
      if (aRes.success) setAuditLogs(aRes.logs);
      if (audRes.success) setAudioAssets(audRes.assets);
    } catch (err) {
      console.warn('Error loading admin data:', err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  // Voice Test Handler
  const handleTestVoice = async () => {
    try {
      setIsTestingVoice(true);
      setTestVoiceStatus(isAmharic ? 'የድምፅ ቅንብር በማመንጨት ላይ...' : 'Synthesizing voice announcement...');
      const res = await api.testVoice({
        text: testVoiceText,
        language: testLanguage,
        voice: selectedVoice,
        model: audioForm.ttsModel || 'gemini-3.1-flash-tts-preview'
      });

      if (res.success) {
        setTestVoiceStatus(isAmharic ? 'ድምፅ እየተጫወተ ነው...' : 'Playing generated voice...');
        await audioManager.playAnnouncement(
          testVoiceText,
          res.audioResult?.audioBase64,
          res.audioResult?.mimeType || 'audio/wav',
          audioForm.volume || 85
        );
        setTestVoiceStatus(isAmharic ? 'ድምፅ ተጠናቅቋል' : 'Voice playback finished');
        setTimeout(() => setTestVoiceStatus(''), 2500);
      } else {
        setTestVoiceStatus(isAmharic ? 'ድምፅ ተፈትኗል' : 'Voice synthesis complete');
        setTimeout(() => setTestVoiceStatus(''), 3000);
      }
    } catch (err: any) {
      alert(`Voice error: ${err.message}`);
      setTestVoiceStatus('');
    } finally {
      setIsTestingVoice(false);
    }
  };

  // Save Audio Settings
  const handleSaveAudioSettings = async () => {
    try {
      await api.updateAudioSettings({
        ...audioForm,
        ttsVoice: selectedVoice
      });
      setSaveSuccessMsg(isAmharic ? 'የድምፅ ቅንብሮች በተሳካ ሁኔታ ተቀምጠዋል' : 'Audio settings saved successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
      refreshQueue();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save Office Settings
  const handleSaveOfficeSettings = async () => {
    try {
      await api.updateOfficeSettings(officeForm);
      setSaveSuccessMsg(isAmharic ? 'የቢሮ ቅንብሮች በተሳካ ሁኔታ ተቀምጠዋል' : 'Office settings saved successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
      refreshQueue();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Generate AI Music
  const handleGenerateAIMusic = async () => {
    try {
      setIsGeneratingMusic(true);
      const res = await api.generateAIMusic(musicPrompt);
      if (res.success) {
        alert(isAmharic ? 'የቢሮ ሙዚቃ በተሳካ ሁኔታ ተዘጋጅቷል!' : 'AI Music generated successfully!');
        loadAdminData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isAmharic ? 'የአስተዳዳሪ መቆጣጠሪያ ማዕከል' : 'Administrator Control Center'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {isAmharic ? 'አገልግሎቶች፣ ቆጣሪዎች፣ ሰራተኞች፣ የአማርኛ ድምፅ እና የቢሮ ቅንብሮች' : 'Manage services, counters, staff, Amharic voice and office settings'}
            </p>
          </div>
        </div>

        {/* Daily Reset Queue Button */}
        <button
          onClick={() => {
            if (confirm(isAmharic ? 'የዛሬው የወረፋ ዝርዝር ሙሉ ለሙሉ እንዲጸዳ ይፈልጋሉ?' : 'Reset today queue tickets?')) {
              resetDailyQueue();
            }
          }}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{isAmharic ? 'የዛሬውን ወረፋ አድስ (Daily Reset)' : 'Reset Daily Queue'}</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'overview', label: isAmharic ? 'አጠቃላይ እይታ' : 'Overview', icon: Activity },
          { id: 'services', label: isAmharic ? 'አገልግሎቶች' : 'Services', icon: Layers },
          { id: 'counters', label: isAmharic ? 'ቆጣሪዎች' : 'Counters', icon: Tv },
          { id: 'staff', label: isAmharic ? 'ሰራተኞች' : 'Staff & Roles', icon: Users },
          { id: 'audio', label: isAmharic ? 'የድምፅ ስቱዲዮ' : 'Voice & Audio', icon: Volume2 },
          { id: 'office', label: isAmharic ? 'የቢሮ ቅንብር' : 'Office Settings', icon: Settings },
          { id: 'audit', label: isAmharic ? 'የእንቅስቃሴ መዝገብ' : 'Audit Trail', icon: FileText }
        ].map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">{isAmharic ? 'የዛሬ ጠቅላላ ቲኬቶች' : 'Total Tickets Today'}</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono tracking-tight">{stats?.total || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">{isAmharic ? 'የተስተናገዱ ደንበኞች' : 'Completed Served'}</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1 font-mono tracking-tight">{stats?.completed || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">{isAmharic ? 'በመጠባበቅ ላይ' : 'Currently Waiting'}</div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1 font-mono tracking-tight">{stats?.waiting || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">{isAmharic ? 'አማካይ የጥበቃ ጊዜ' : 'Avg. Wait Time'}</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 font-mono tracking-tight">~{stats?.avgWaitMinutes || 0}m</div>
            </div>
          </div>

          {/* Service Breakdown Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4">
              {isAmharic ? 'የአገልግሎቶች አፈፃፀም ዝርዝር' : 'Service Queue Distribution'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Prefix</th>
                    <th className="py-2.5 px-3">Service Name</th>
                    <th className="py-2.5 px-3 text-center">Total</th>
                    <th className="py-2.5 px-3 text-center">Waiting</th>
                    <th className="py-2.5 px-3 text-center">Completed</th>
                    <th className="py-2.5 px-3 text-right">Avg Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {stats?.serviceBreakdown.map((s) => (
                    <tr key={s.serviceId} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold font-mono text-indigo-600">{s.prefix}</td>
                      <td className="py-3 px-3 text-slate-900 font-bold">
                        {isAmharic ? (s.serviceNameAmharic || s.serviceName) : s.serviceName}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{s.total}</td>
                      <td className="py-3 px-3 text-center font-mono text-amber-600 font-bold">{s.waiting}</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-600 font-bold">{s.completed}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">~{s.avgServiceMinutes}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">
              {isAmharic ? 'የቢሮው አገልግሎቶች አስተዳደር' : 'Office Services Management'}
            </h2>
            <button
              onClick={() => {
                setEditingService({ prefix: 'G', name: '', nameAmharic: '', estimatedDurationMinutes: 5, color: '#4f46e5', isActive: true });
                setIsServiceModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
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
                    onClick={() => {
                      setEditingService(s);
                      setIsServiceModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(isAmharic ? 'ይህ አገልግሎት ይሰረዝ?' : 'Delete this service?')) {
                        await api.deleteService(s.id);
                        refreshQueue();
                      }
                    }}
                    className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COUNTERS */}
      {activeTab === 'counters' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">
              {isAmharic ? 'የቆጣሪዎች አስተዳደር' : 'Counters Management'}
            </h2>
            <button
              onClick={() => {
                const nextNum = counters.length + 1;
                setEditingCounter({ number: nextNum, name: `Counter ${nextNum}`, nameAmharic: `ቆጣሪ ${nextNum}` });
                setIsCounterModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isAmharic ? 'አዲስ ቆጣሪ ጨምር' : 'Add New Counter'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {counters.map((c) => (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                      {isAmharic ? `ቆጣሪ ${c.number}` : `Counter ${c.number}`}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">{c.name}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => {
                      setEditingCounter(c);
                      setIsCounterModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(isAmharic ? 'ይህ ቆጣሪ ይሰረዝ?' : 'Delete this counter?')) {
                        await api.deleteCounter(c.id);
                        refreshQueue();
                      }
                    }}
                    className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STAFF & USERS */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">
              {isAmharic ? 'የሰራተኞች እና የተጠቃሚዎች መዝገብ' : 'Staff Accounts & Roles'}
            </h2>
            <button
              onClick={() => {
                setEditingUser({ name: '', username: '', password: '', role: 'SERVICE_OFFICER' });
                setIsUserModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
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
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{u.username}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-700 font-bold">ACTIVE</span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setIsUserModalOpen(true);
                        }}
                        className="text-slate-600 hover:text-slate-900 font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete user ${u.name}?`)) {
                            await api.deleteUser(u.id);
                            loadAdminData();
                          }
                        }}
                        className="text-rose-600 hover:text-rose-700 ml-2 font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: VOICE & AUDIO STUDIO */}
      {activeTab === 'audio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left 7 Cols: Gemini Voice Settings & Live Test */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Volume2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">
                {isAmharic ? 'የአማርኛ እና የእንግሊዝኛ የድምፅ ማስታወቂያ ቅንብር' : 'Gemini AI Voice Configuration'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAmharic ? 'የማስታወቂያ ቋንቋ' : 'Announcement Language'}
                </label>
                <select
                  value={audioForm.language || 'AMHARIC'}
                  onChange={(e) => setAudioForm({ ...audioForm, language: e.target.value as any })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
                >
                  <option value="AMHARIC">አማርኛ (Amharic Primary)</option>
                  <option value="ENGLISH">English</option>
                  <option value="BOTH">አማርኛ & English</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAmharic ? 'የድምፅ ሞዴል (Gemini Voice)' : 'Gemini Voice Preset'}
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-slate-900"
                >
                  <option value="Kore">Kore (Clear & Calm - Recommended)</option>
                  <option value="Zephyr">Zephyr (Warm & Professional)</option>
                  <option value="Puck">Puck (Energetic & Sharp)</option>
                  <option value="Fenrir">Fenrir (Authoritative)</option>
                  <option value="Aoede">Aoede (Gentle & Smooth)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAmharic ? 'ድምፅ አንቃ / አጥፋ' : 'Voice Announcements Enabled'}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="voiceEnabled"
                  checked={audioForm.voiceEnabled ?? true}
                  onChange={(e) => setAudioForm({ ...audioForm, voiceEnabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="voiceEnabled" className="text-xs text-slate-600 font-medium">
                  {isAmharic ? 'ጥሪ ሲደረግ በራስ-ሰር ድምፅ እንዲያሰማ' : 'Automatically broadcast voice announcements on ticket call'}
                </label>
              </div>
            </div>

            {/* Live Voice Announcement Tester */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {isAmharic ? 'የድምፅ መሞከሪያ (Live Voice Preview)' : 'Test Voice Output'}
                </span>
                <span className="text-[10px] text-indigo-600 font-mono font-bold">
                  Powered by Gemini TTS
                </span>
              </div>

              <textarea
                rows={2}
                value={testVoiceText}
                onChange={(e) => setTestVoiceText(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
                placeholder="Enter phrase to synthesize..."
              />

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs font-medium text-slate-500">
                  {testVoiceStatus}
                </div>
                <button
                  onClick={handleTestVoice}
                  disabled={isTestingVoice}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isTestingVoice ? (isAmharic ? 'በማመንጨት ላይ...' : 'Synthesizing...') : (isAmharic ? 'ድምፅ ሞክር' : 'Test Voice')}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveAudioSettings}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isAmharic ? 'የድምፅ ቅንብሮችን አስቀምጥ' : 'Save Voice Settings'}</span>
            </button>
          </div>

          {/* Right 5 Cols: Background Music & Audio Ducking Studio */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Music className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">
                {isAmharic ? 'የቢሮ ዳራ ሙዚቃ እና ድምፅ ማስታገሻ' : 'Background Music & Ducking'}
              </h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {isAmharic
                ? 'የማስታወቂያ ጥሪ ሲደረግ የቢሮው ዳራ ሙዚቃ በራስ-ሰር ቀስ ብሎ ይቆማል፤ ማስታወቂያው ሲጠናቀቅ ደግሞ ይቀጥላል።'
                : 'Background music automatically ducks/pauses during queue announcements and smoothly resumes after.'}
            </p>

            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{isAmharic ? 'የ AI ዳራ ሙዚቃ ማመንጫ' : 'Generate AI Office Music'}</span>
              </div>

              <input
                type="text"
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                placeholder="Calm relaxing lobby lounge chords..."
                className="w-full p-2.5 text-xs bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 font-medium"
              />

              <button
                onClick={handleGenerateAIMusic}
                disabled={isGeneratingMusic}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingMusic ? (isAmharic ? 'በማመንጨት ላይ...' : 'Generating...') : (isAmharic ? 'በ AI ሙዚቃ ፍጠር' : 'Generate with AI')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: OFFICE SETTINGS */}
      {activeTab === 'office' && (
        <div className="max-w-2xl bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            {isAmharic ? 'አጠቃላይ የቢሮ እና የስክሪን ቅንብሮች' : 'General Office Settings'}
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAmharic ? 'የቢሮ ስም (አማርኛ)' : 'Office Name (Amharic)'}
              </label>
              <input
                type="text"
                value={officeForm.officeNameAmharic || ''}
                onChange={(e) => setOfficeForm({ ...officeForm, officeNameAmharic: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAmharic ? 'የቢሮ ስም (English)' : 'Office Name (English)'}
              </label>
              <input
                type="text"
                value={officeForm.officeName || ''}
                onChange={(e) => setOfficeForm({ ...officeForm, officeName: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAmharic ? 'በስክሪኑ ግርጌ የሚታይ ማስታወቂያ (አማርኛ)' : 'Bottom Ticker Notice (Amharic)'}
              </label>
              <textarea
                rows={2}
                value={officeForm.displayNoticeAmharic || ''}
                onChange={(e) => setOfficeForm({ ...officeForm, displayNoticeAmharic: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAmharic ? 'ለአንድ ሰው የሚገመት የጥበቃ ደቂቃ' : 'Estimated Wait Minutes Per Customer'}
              </label>
              <input
                type="number"
                value={officeForm.estimatedWaitPerPersonMinutes || 4}
                onChange={(e) => setOfficeForm({ ...officeForm, estimatedWaitPerPersonMinutes: Number(e.target.value) })}
                className="w-32 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
              />
            </div>
          </div>

          <button
            onClick={handleSaveOfficeSettings}
            className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{isAmharic ? 'ቅንብሮችን አስቀምጥ' : 'Save Office Settings'}</span>
          </button>
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            {isAmharic ? 'የስርዓት እንቅስቃሴዎች መዝገብ' : 'Audit Logs & Action History'}
          </h2>

          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Staff / User</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{log.userName || 'System'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{log.entity}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {isServiceModalOpen && editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              {editingService.id ? (isAmharic ? 'አገልግሎት አስተካክል' : 'Edit Service') : (isAmharic ? 'አዲስ አገልግሎት' : 'Add Service')}
            </h3>

            <input
              type="text"
              placeholder="Prefix (Single Letter, e.g. A, B)"
              maxLength={1}
              value={editingService.prefix || ''}
              onChange={(e) => setEditingService({ ...editingService, prefix: e.target.value.toUpperCase() })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Service Name (Amharic)"
              value={editingService.nameAmharic || ''}
              onChange={(e) => setEditingService({ ...editingService, nameAmharic: e.target.value })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Service Name (English)"
              value={editingService.name || ''}
              onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Duration (Minutes)"
              value={editingService.estimatedDurationMinutes || 5}
              onChange={(e) => setEditingService({ ...editingService, estimatedDurationMinutes: Number(e.target.value) })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (editingService.id) {
                    await api.updateService(editingService.id, editingService);
                  } else {
                    await api.createService(editingService);
                  }
                  setIsServiceModalOpen(false);
                  refreshQueue();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Modal */}
      {isCounterModalOpen && editingCounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              {editingCounter.id ? 'Edit Counter' : 'Add Counter'}
            </h3>
            <input
              type="number"
              placeholder="Counter Number (1-5)"
              value={editingCounter.number || ''}
              onChange={(e) => setEditingCounter({ ...editingCounter, number: Number(e.target.value) })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Name (e.g. Counter 1)"
              value={editingCounter.name || ''}
              onChange={(e) => setEditingCounter({ ...editingCounter, name: e.target.value })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsCounterModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (editingCounter.id) {
                    await api.updateCounter(editingCounter.id, editingCounter);
                  } else {
                    await api.createCounter(editingCounter);
                  }
                  setIsCounterModalOpen(false);
                  refreshQueue();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              {editingUser.id ? 'Edit Staff User' : 'Add Staff User'}
            </h3>
            <input
              type="text"
              placeholder="Full Name"
              value={editingUser.name || ''}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Username"
              value={editingUser.username || ''}
              onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder={editingUser.id ? 'Leave blank to keep password' : 'Password (min 6 chars)'}
              value={editingUser.password || ''}
              onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <select
              value={editingUser.role || 'SERVICE_OFFICER'}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="RECEPTIONIST">RECEPTIONIST</option>
              <option value="SERVICE_OFFICER">SERVICE_OFFICER</option>
            </select>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (editingUser.id) {
                    await api.updateUser(editingUser.id, editingUser);
                  } else {
                    await api.createUser(editingUser);
                  }
                  setIsUserModalOpen(false);
                  loadAdminData();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
