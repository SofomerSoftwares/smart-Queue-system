import React from 'react';
import { Volume2, Database, CheckCircle2, AlertCircle, Play, RefreshCw, Save, Sparkles } from 'lucide-react';
import { AudioSetting, AddisVoiceOption } from '../../types';

interface AdminAudioTabProps {
  audioForm: Partial<AudioSetting>;
  setAudioForm: React.Dispatch<React.SetStateAction<Partial<AudioSetting>>>;
  addisVoices: AddisVoiceOption[];
  selectedAddisVoice: string;
  setSelectedAddisVoice: (voiceId: string) => void;
  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;
  dbStatus: any;
  audioSaveSuccess: string;
  audioSaveError: string;
  isSavingAudio: boolean;
  onSaveAudioSettings: () => void;
  testVoiceText: string;
  setTestVoiceText: (text: string) => void;
  testVoiceStatus: string;
  testVoiceDiagnostic: { source?: string; latency?: number; message?: string } | null;
  isTestingVoice: boolean;
  onTestVoice: (voiceId?: string) => void;
  isAmharic: boolean;
}

export const AdminAudioTab: React.FC<AdminAudioTabProps> = ({
  audioForm,
  setAudioForm,
  addisVoices,
  selectedAddisVoice,
  setSelectedAddisVoice,
  voiceSpeed,
  setVoiceSpeed,
  dbStatus,
  audioSaveSuccess,
  audioSaveError,
  isSavingAudio,
  onSaveAudioSettings,
  testVoiceText,
  setTestVoiceText,
  testVoiceStatus,
  testVoiceDiagnostic,
  isTestingVoice,
  onTestVoice,
  isAmharic
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
      {/* Left 7 Cols: Addis AI Voice Engine & Configuration */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {isAmharic ? 'የአዲስ AI (Addis AI) ድምፅ ማስታወቂያ ቅንብር' : 'Addis AI Voice Announcement Configuration'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
              dbStatus?.connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              <Database className="w-3 h-3" />
              <span>{dbStatus?.connected ? (isAmharic ? 'MongoDB ተገናኝቷል' : 'MongoDB Synced') : 'MongoDB Ready'}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Addis AI Active
            </span>
          </div>
        </div>

        {/* Inline Feedback Alerts */}
        {audioSaveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{audioSaveSuccess}</span>
          </div>
        )}
        {audioSaveError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{audioSaveError}</span>
          </div>
        )}

        {/* Addis AI Voice Persona Selection */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800">
              {isAmharic ? 'የአዲስ AI ድምፅ ምርጫ (Addis Voice Persona)' : 'Select Addis AI Voice Persona'}
            </label>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Addis Voices 2 Standard
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {addisVoices.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedAddisVoice(v.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  selectedAddisVoice === v.id
                    ? 'border-indigo-600 bg-white shadow-xs ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {isAmharic ? v.nameAmharic : v.name}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAddisVoice(v.id);
                        onTestVoice(v.id);
                      }}
                      disabled={isTestingVoice}
                      className="p-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold transition flex items-center space-x-0.5 cursor-pointer"
                      title="Quick preview voice"
                    >
                      <Play className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {v.gender}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isAmharic ? v.descriptionAmharic : v.description}
                </p>
              </div>
            ))}
          </div>

          {/* Voice Speed Multiplier */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">
                {isAmharic ? 'የንግግር ፍጥነት (Speed)' : 'Speech Rate Speed'}
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600">{voiceSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0.8x (Slower)</span>
              <span>1.0x (Normal)</span>
              <span>1.3x (Faster)</span>
            </div>
          </div>

          {/* Addis Voice API Endpoint & API Key */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isAmharic ? 'የአዲስ AI ድምፅ API Endpoint' : 'Addis AI Voice API Endpoint'}
                </label>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setAudioForm({ ...audioForm, addisAiEndpoint: 'https://api.addisassistant.com/api/v1/voice/generations' })}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono font-bold border border-indigo-200 cursor-pointer"
                  >
                    Addis Voices 2 (Canonical)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudioForm({ ...audioForm, addisAiEndpoint: 'https://api.addisassistant.com/api/v1/audio' })}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono cursor-pointer"
                  >
                    /api/v1/audio
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={audioForm.addisAiEndpoint || ''}
                onChange={(e) => setAudioForm({ ...audioForm, addisAiEndpoint: e.target.value })}
                placeholder="https://api.addisassistant.com/api/v1/voice/generations"
                className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAmharic ? 'የአዲስ AI API ቁልፍ (API Key)' : 'Addis AI API Key'}
              </label>
              <input
                type="password"
                value={audioForm.addisAiApiKey || ''}
                onChange={(e) => setAudioForm({ ...audioForm, addisAiApiKey: e.target.value })}
                placeholder="sk-addis-ai-..."
                className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {isAmharic ? 'በሰርቨሩ ውስጥ ደህንነቱ ተጠብቆ ይቀመጣል ወይም በ .env ውስጥ ADDIS_AI_API_KEY መጠቀም ይቻላል' : 'Stored securely on backend; or set ADDIS_AI_API_KEY in environment'}
              </p>
            </div>
          </div>
        </div>

        {/* Volume, Repeat, and Language Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                {isAmharic ? 'ዋና የድምፅ መጠን' : 'Announcement Volume'}
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600">{audioForm.volume || 85}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={audioForm.volume || 85}
              onChange={(e) => setAudioForm({ ...audioForm, volume: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isAmharic ? 'ድምፅ አንቃ / አጥፋ' : 'Voice Announcements'}
            </label>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="voiceEnabled"
                checked={audioForm.voiceEnabled ?? true}
                onChange={(e) => setAudioForm({ ...audioForm, voiceEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="voiceEnabled" className="text-xs text-slate-600 font-medium cursor-pointer">
                {isAmharic ? 'ጥሪ ሲደረግ በድምፅ ይጥራ' : 'Broadcast on ticket call'}
              </label>
            </div>
          </div>
        </div>

        <button
          id="btn-save-addis-voice-settings"
          onClick={onSaveAudioSettings}
          disabled={isSavingAudio}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isSavingAudio ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{isAmharic ? 'ቅንብሮችን በማስቀመጥ ላይ...' : 'Saving Addis AI Voice Settings...'}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isAmharic ? 'የአዲስ AI ድምፅ ቅንብሮችን አስቀምጥ' : 'Save Addis AI Voice Settings'}</span>
            </>
          )}
        </button>
      </div>

      {/* Right 5 Cols: Addis AI Voice Testing & Live Preview */}
      <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Play className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {isAmharic ? 'የአዲስ AI ድምፅ መሞከሪያ' : 'Addis AI Voice Studio'}
            </h3>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
            Backend Synthesis
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          {isAmharic
            ? 'የድምፅ ጥሪዎች በቀጥታ በሰርቨሩ (Backend) በኩል በአዲስ AI ሞዴል ተመንጭተው ወደ አዳራሽ ማሳያ እና መስኮቶች ይተላለፋሉ።'
            : 'All ticket call announcements are synthesized securely on the backend using the Addis AI API and streamed to displays and reception.'}
        </p>

        {/* Live Voice Announcement Tester */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              {isAmharic ? 'የድምፅ መሞከሪያ ሐረጎች (Sample Callouts)' : 'Sample Callout Phrases'}
            </span>
            <span className="text-[10px] text-indigo-600 font-mono font-bold">
              Addis AI ({selectedAddisVoice})
            </span>
          </div>

          {/* Sample Preset Phrases */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: isAmharic ? 'መደበኛ ጥሪ' : 'Standard Call', phrase: 'ቲኬት ቁጥር ኤ-001 እባክዎ ወደ መስኮት 1 ይቅረቡ።' },
              { label: isAmharic ? 'ከአገልግሎት ጋር' : 'With Service', phrase: 'ቲኬት ቁጥር ኤ-001 ለፈጣን ክፍያ እባክዎ ወደ መስኮት 1 ይቅረቡ።' },
              { label: 'English Call', phrase: 'Ticket number A-001, please proceed to counter 1.' },
              { label: isAmharic ? 'ሁለቱም ቋንቋ' : 'Bilingual', phrase: 'ቲኬት ቁጥር ኤ-001 እባክዎ ወደ መስኮት 1 ይቅረቡ። Ticket number A-001, please proceed to counter 1.' }
            ].map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTestVoiceText(item.phrase)}
                className="text-[10px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition font-medium shadow-2xs text-left cursor-pointer"
              >
                <span className="font-bold text-slate-900 block">{item.label}</span>
                <span className="text-[9px] text-slate-500 truncate block max-w-[200px]">{item.phrase}</span>
              </button>
            ))}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAmharic ? 'የሚፈተን ፅሁፍ (Custom Text to Synthesize)' : 'Custom Text to Synthesize'}
            </label>
            <textarea
              rows={3}
              value={testVoiceText}
              onChange={(e) => setTestVoiceText(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900"
              placeholder="Enter phrase to synthesize..."
            />
          </div>

          {/* Diagnostic badge if available */}
          {testVoiceDiagnostic && (
            <div className="p-2.5 rounded-xl bg-white border border-indigo-200 text-[11px] space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className="text-indigo-900 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>{testVoiceDiagnostic.source === 'ADDIS_AI_API' ? 'Cloud Addis AI Active' : 'Phonetic Fallback Used'}</span>
                </span>
                <span className="font-mono text-slate-500">{testVoiceDiagnostic.latency}ms</span>
              </div>
              {testVoiceDiagnostic.message && (
                <p className="text-slate-600 text-[10px] font-mono leading-tight">{testVoiceDiagnostic.message}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs font-medium text-slate-500">
              {testVoiceStatus}
            </div>
            <button
              onClick={() => onTestVoice()}
              disabled={isTestingVoice}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:bg-indigo-400"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isTestingVoice ? (isAmharic ? 'በማመንጨት ላይ...' : 'Synthesizing...') : (isAmharic ? 'ድምፅ ሞክር (Addis AI)' : 'Test Addis AI Voice')}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>{isAmharic ? 'የአዲስ AI ድምፅ ሞዴል መረጃ' : 'Addis AI Audio Engine Info'}</span>
          </div>
          <p className="text-[11px] text-indigo-800 leading-relaxed">
            {isAmharic
              ? 'ተፈጥሯዊ እና ጥራት ያላቸው የአማርኛ ድምፆችን በደቂቃዎች ውስጥ ወደ አዳራሽ ለማድረስ የ Addis AI API በሰርቨር ላይ ተዋቅሯል።'
              : 'Addis AI TTS produces natural, high-clarity Amharic & English voice broadcasts specifically tailored for public lobby acoustics.'}
          </p>
        </div>
      </div>
    </div>
  );
};
