import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Radio, 
  Volume2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Flame, 
  Zap, 
  Sparkles,
  Info,
  Layers,
  Save,
  Trash2,
  Upload,
  Bot,
  RefreshCw,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { QueueTicket, Counter } from '../types';
import { audioRecorder, AudioRecorderService, RecordingResult } from '../lib/audioRecorder';
import { audioManager } from '../lib/audioManager';
import { api } from '../lib/api';

interface OfficerVoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: QueueTicket | null;
  counter: Counter | null;
  isAmharic?: boolean;
  onSuccess?: (ticket: QueueTicket) => void;
}

export const OfficerVoiceRecorderModal: React.FC<OfficerVoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  ticket,
  counter,
  isAmharic = true,
  onSuccess
}) => {
  const [recorderState, setRecorderState] = useState<'IDLE' | 'RECORDING' | 'RECORDED' | 'PLAYING' | 'BROADCASTING'>('IDLE');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [recordedResult, setRecordedResult] = useState<RecordingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [customText, setCustomText] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<'AMHARIC' | 'ENGLISH' | 'URGENT' | 'CUSTOM'>('AMHARIC');
  const [savedStationClip, setSavedStationClip] = useState<string | null>(null);
  const [isGeneratingAiVoice, setIsGeneratingAiVoice] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const maxDuration = 30;

  const ticketNumber = ticket?.ticketNumber || 'A-001';
  const counterNumber = counter?.number || 1;
  const serviceName = ticket?.serviceName || 'General Service';
  const serviceNameAmharic = ticket?.serviceNameAmharic || 'አጠቃላይ አገልግሎት';

  // Templates
  const templateAmharic = `የቲኬት ቁጥር ${ticketNumber}፣ እባክዎ ወደ መስኮት ${counterNumber} ይምጡ።`;
  const templateEnglish = `Ticket ${ticketNumber}, please proceed to Counter ${counterNumber}.`;
  const templateUrgent = `አስቸኳይ ቅድሚያ ተገልጋይ የቲኬት ቁጥር ${ticketNumber}፣ እባክዎ ወደ መስኮት ${counterNumber} ይቅረቡ።`;

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      setRecorderState('IDLE');
      setRecordingSeconds(0);
      setVolumeLevel(0);
      setRecordedResult(null);
      setErrorMessage('');
      setSuccessMessage('');
      setShowTroubleshoot(false);
      setActiveTemplate('AMHARIC');
      setCustomText(templateAmharic);

      // Check for saved local quick voice
      const saved = localStorage.getItem(`officer_voice_clip_counter_${counterNumber}`);
      if (saved) {
        setSavedStationClip(saved);
      }
    } else {
      handleStopAll();
    }
  }, [isOpen, ticketNumber, counterNumber]);

  // Handle template selection
  const handleSelectTemplate = (type: 'AMHARIC' | 'ENGLISH' | 'URGENT' | 'CUSTOM') => {
    setActiveTemplate(type);
    if (type === 'AMHARIC') setCustomText(templateAmharic);
    else if (type === 'ENGLISH') setCustomText(templateEnglish);
    else if (type === 'URGENT') setCustomText(templateUrgent);
  };

  const handleStopAll = () => {
    audioRecorder.cancelRecording();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
  };

  // Start Recording via Microphone
  const handleStartRecording = async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      setShowTroubleshoot(false);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      await audioRecorder.startRecording(
        (secs) => setRecordingSeconds(secs),
        (vol) => setVolumeLevel(vol),
        maxDuration
      );

      setRecorderState('RECORDING');
    } catch (err: any) {
      setRecorderState('IDLE');
      const msg = err.message || 'Failed to start microphone recording.';
      setErrorMessage(msg);
      setShowTroubleshoot(true);
    }
  };

  // Stop Recording
  const handleStopRecording = async () => {
    try {
      setRecorderState('IDLE');
      const result = await audioRecorder.stopRecording();
      setRecordedResult(result);
      setRecorderState('RECORDED');
      setVolumeLevel(0);
      setSuccessMessage(isAmharic ? 'ድምፅ ተቀርጾ ተጠናቋል!' : 'Audio captured successfully!');
    } catch (err: any) {
      setRecorderState('IDLE');
      setErrorMessage(err.message || 'Failed to finish audio recording.');
    }
  };

  // Toggle playback of recorded voice
  const handleTogglePlayback = () => {
    if (!recordedResult) return;

    if (recorderState === 'PLAYING') {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setRecorderState('RECORDED');
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      const audio = new Audio(recordedResult.url);
      audioPlayerRef.current = audio;
      setRecorderState('PLAYING');

      audio.onended = () => {
        setRecorderState('RECORDED');
      };
      audio.onerror = () => {
        setRecorderState('RECORDED');
        setErrorMessage('Could not play back audio preview.');
      };

      audio.play().catch((err) => {
        console.warn('Playback error:', err);
        setRecorderState('RECORDED');
      });
    }
  };

  // Re-record
  const handleReRecord = () => {
    handleStopAll();
    setRecordedResult(null);
    setRecordingSeconds(0);
    setVolumeLevel(0);
    setRecorderState('IDLE');
  };

  // Upload Local Audio File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingFile(true);
      setErrorMessage('');
      setSuccessMessage('');

      const result = await AudioRecorderService.fileToBase64(file);
      const blob = new Blob([file], { type: file.type || 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      setRecordedResult({
        blob,
        base64: result.base64,
        mimeType: result.mimeType,
        durationSeconds: result.duration || 4,
        url
      });

      setRecorderState('RECORDED');
      setSuccessMessage(
        isAmharic 
          ? `የድምፅ ፋይል "${file.name}" በተሳካ ሁኔታ ተጭኗል!` 
          : `Audio file "${file.name}" uploaded successfully!`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to read audio file.');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Generate with Addis AI Voice
  const handleGenerateAiVoice = async () => {
    const textToSpeak = customText.trim() || templateAmharic;
    try {
      setIsGeneratingAiVoice(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await api.testVoice({
        text: textToSpeak,
        language: activeTemplate === 'ENGLISH' ? 'ENGLISH' : 'AMHARIC',
        voice: 'Ababa',
        speed: 1.0,
        provider: 'ADDIS_AI'
      });

      const audioBase64 = res.audioResult?.audioBase64;
      if (res.success && audioBase64) {
        const base64Url = audioBase64.startsWith('data:') 
          ? audioBase64 
          : `data:${res.audioResult?.mimeType || 'audio/wav'};base64,${audioBase64}`;

        const blobRes = await fetch(base64Url);
        const blob = await blobRes.blob();
        const url = URL.createObjectURL(blob);

        setRecordedResult({
          blob,
          base64: base64Url,
          mimeType: res.audioResult?.mimeType || 'audio/wav',
          durationSeconds: 4,
          url
        });

        setRecorderState('RECORDED');
        setSuccessMessage(
          isAmharic 
            ? 'በአዲስ AI ድምፅ የተቀነባበረ የጥሪ ቅንብር ተዘጋጅቷል!' 
            : 'Addis AI announcement generated successfully!'
        );
      } else {
        setErrorMessage('Could not generate AI voice audio.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating AI voice.');
    } finally {
      setIsGeneratingAiVoice(false);
    }
  };

  // Save clip as officer station preset
  const handleSaveStationPreset = () => {
    if (!recordedResult) return;
    try {
      localStorage.setItem(`officer_voice_clip_counter_${counterNumber}`, recordedResult.base64);
      setSavedStationClip(recordedResult.base64);
      setSuccessMessage(isAmharic ? 'የግል ድምፅዎ ለመስኮትዎ ተቀምጧል!' : 'Station voice preset saved!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Could not save preset to local browser storage.');
    }
  };

  // Use Saved Station Preset
  const handleLoadSavedPreset = () => {
    if (!savedStationClip) return;
    setRecordedResult({
      blob: new Blob([]),
      base64: savedStationClip,
      mimeType: 'audio/webm',
      durationSeconds: 4,
      url: savedStationClip
    });
    setRecorderState('RECORDED');
    setSuccessMessage(isAmharic ? 'የተቀመጠው የመስኮት ድምፅ ተመርጧል' : 'Loaded station preset clip');
  };

  // Delete Saved Preset
  const handleDeleteSavedPreset = () => {
    localStorage.removeItem(`officer_voice_clip_counter_${counterNumber}`);
    setSavedStationClip(null);
  };

  // Broadcast Voice Call to TV Display Screens and Speakers
  const handleBroadcastVoiceCall = async () => {
    if (!recordedResult || !ticket) {
      setErrorMessage('No voice audio available to broadcast.');
      return;
    }

    try {
      setRecorderState('BROADCASTING');
      setErrorMessage('');

      // Play local confirmation chime
      audioManager.playChime().catch(() => {});

      const res = await api.broadcastPersonalRecording({
        audioBase64: recordedResult.base64,
        mimeType: recordedResult.mimeType || 'audio/webm',
        ticketNumber: ticket.ticketNumber,
        counterNumber: counterNumber,
        serviceName: ticket.serviceName,
        serviceNameAmharic: ticket.serviceNameAmharic,
        customText: customText.trim(),
        language: activeTemplate === 'ENGLISH' ? 'ENGLISH' : 'AMHARIC'
      });

      if (res.success) {
        setSuccessMessage(
          isAmharic 
            ? `የቲኬት ${ticket.ticketNumber} የግል ድምፅ ጥሪ በሁሉም ስክሪኖች እና ድምፅ ማጉያዎች ተላልፏል!` 
            : `Personal voice announcement for Ticket ${ticket.ticketNumber} broadcasted live!`
        );

        if (onSuccess) {
          onSuccess(ticket);
        }

        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(res.message || 'Failed to broadcast voice announcement.');
        setRecorderState('RECORDED');
      }
    } catch (err: any) {
      setRecorderState('RECORDED');
      setErrorMessage(err.message || 'Failed to broadcast personal audio announcement.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200">
        
        {/* Hidden File Input for Audio Upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm" 
          onChange={handleFileUpload} 
          className="hidden" 
        />

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center shadow-inner">
                <Mic className="w-6 h-6 text-indigo-200" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-black tracking-tight">
                    {isAmharic ? 'የግል ድምፅ ጥሪ መቅረጫ' : 'Personal Voice Call Studio'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                    LIVE MIC
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-0.5 font-medium">
                  {isAmharic 
                    ? 'በራስዎ ድምፅ የደንበኛ ጥሪ በመቅረጽ በዋናው አዳራሽ ስክሪኖች እና ማጉያዎች ያስተላልፉ'
                    : 'Record your voice or upload audio to call customers live on TV displays & speakers'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-indigo-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ticket Target Banner */}
          {ticket && (
            <div className="mt-4 pt-3 border-t border-indigo-700/50 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-indigo-300 font-medium">
                  {isAmharic ? 'የሚጠራው ደንበኛ:' : 'Target Ticket:'}
                </span>
                <span className="px-3 py-1 bg-white text-slate-900 rounded-xl font-black font-mono text-sm shadow-xs">
                  {ticket.ticketNumber}
                </span>
                {ticket.priority === 'URGENT' && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    URGENT
                  </span>
                )}
                {ticket.priority === 'PRIORITY' && (
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-lg text-[11px] font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    VIP
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-indigo-200 bg-indigo-950/60 px-3 py-1 rounded-xl border border-indigo-700/60">
                {isAmharic ? `መስኮት ${counterNumber}` : `Counter ${counterNumber}`} • {isAmharic ? serviceNameAmharic : serviceName}
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Troubleshoot / Permission Helper Box */}
          {showTroubleshoot && (
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{isAmharic ? 'የማይክሮፎን ፈቃድ ማስተካከያ እና አማራጮች:' : 'Microphone Permission & Alternatives:'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTroubleshoot(false)}
                  className="text-amber-600 hover:text-amber-800 text-[11px] font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-amber-800 leading-relaxed">
                {isAmharic 
                  ? 'የብራውዘር ማይክሮፎን ፈቃድ አልተሰጠም ወይም በቅድመ-ዕይታ መስኮት ውስጥ ተገድቧል። ከታች ካሉት ፈጣን አማራጮች አንዱን ይምረጡ፡'
                  : 'Microphone permission was not granted or is restricted inside this preview window. You can use any of the quick alternatives below:'}
              </p>

              {/* Quick Action Alternative Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGenerateAiVoice}
                  disabled={isGeneratingAiVoice}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  {isGeneratingAiVoice ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Bot className="w-3.5 h-3.5" />
                  )}
                  <span>{isAmharic ? 'በአዲስ AI ድምፅ ጥራ' : 'Use Addis AI Voice'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isAmharic ? 'የድምፅ ፋይል ጫን' : 'Upload Audio'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.open(window.location.href, '_blank', 'noopener,noreferrer');
                    } catch {}
                  }}
                  className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isAmharic ? 'በአዲስ ታብ ክፈት' : 'Open in New Tab'}</span>
                </button>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-2.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-bold">{successMessage}</div>
            </div>
          )}

          {/* Quick Announcement Script Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                {isAmharic ? 'የሚነበብ ረቂቅ ጽሁፍ (Suggested Script)' : 'Announcement Script'}
              </label>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('AMHARIC')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                    activeTemplate === 'AMHARIC' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🇪🇹 አማርኛ
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('ENGLISH')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                    activeTemplate === 'ENGLISH' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('URGENT')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                    activeTemplate === 'URGENT' 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ⚡ አስቸኳይ
                </button>
              </div>
            </div>

            <textarea
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setActiveTemplate('CUSTOM');
              }}
              rows={2}
              placeholder={isAmharic ? 'የሚናገሩትን ማስታወቂያ እዚህ ይጻፉ...' : 'Type or read your announcement script here...'}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition"
            />
          </div>

          {/* Interactive Recording Visualizer Box */}
          <div className={`p-5 rounded-3xl border-2 flex flex-col items-center justify-center text-center transition-all ${
            recorderState === 'RECORDING' 
              ? 'bg-rose-50/70 border-rose-400 shadow-lg shadow-rose-100'
              : recorderState === 'RECORDED' || recorderState === 'PLAYING'
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50 border-slate-200'
          }`}>
            
            {/* Live Audio Equalizer Waveform Bars (Reacting to microphone volume) */}
            <div className="flex items-center justify-center space-x-1.5 h-10 mb-3 w-full max-w-xs">
              {[0.4, 0.7, 1.0, 0.6, 0.9, 0.5, 0.8, 1.0, 0.7, 0.4, 0.8, 0.6].map((multiplier, idx) => {
                const barHeight = recorderState === 'RECORDING'
                  ? Math.max(6, Math.min(40, Math.round((volumeLevel * multiplier * 0.40) + 6)))
                  : recorderState === 'PLAYING'
                    ? Math.max(6, Math.round(Math.sin(Date.now() / 150 + idx) * 14 + 18))
                    : 6;

                return (
                  <div
                    key={idx}
                    style={{ height: `${barHeight}px` }}
                    className={`w-2 rounded-full transition-all duration-75 ${
                      recorderState === 'RECORDING'
                        ? 'bg-rose-500'
                        : recorderState === 'PLAYING'
                          ? 'bg-indigo-600'
                          : 'bg-slate-300'
                    }`}
                  />
                );
              })}
            </div>

            {/* Timer & Status */}
            <div className="mb-3">
              <div className="text-2xl font-black font-mono tracking-tight text-slate-900">
                00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                <span className="text-xs text-slate-400 font-sans font-normal ml-1.5">
                  / 00:{maxDuration}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 mt-0.5 uppercase tracking-wider">
                {recorderState === 'RECORDING' && (
                  <span className="text-rose-600 animate-pulse flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                    {isAmharic ? 'ድምፅ በመቅረጽ ላይ... (ይናገሩ)' : 'Recording Voice... (Speak Now)'}
                  </span>
                )}
                {recorderState === 'RECORDED' && (
                  <span className="text-emerald-700 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isAmharic ? 'ድምፅ ተዘጋጅቷል' : 'Voice Clip Ready'}
                  </span>
                )}
                {recorderState === 'PLAYING' && (
                  <span className="text-indigo-600 flex items-center justify-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                    {isAmharic ? 'ድምፁን በማዳመጥ ላይ...' : 'Playing Back Preview...'}
                  </span>
                )}
                {recorderState === 'IDLE' && (
                  <span>{isAmharic ? 'የማይክሮፎን ቁልፉን ተጭነው ይቅረጹ ወይም ፋይል ይጫኑ' : 'Press Mic Button, Upload, or Generate Voice'}</span>
                )}
              </p>
            </div>

            {/* Primary Action Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {recorderState === 'IDLE' && (
                <>
                  <button
                    type="button"
                    id="btn-start-mic-record"
                    onClick={handleStartRecording}
                    className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs shadow-md shadow-rose-200 hover:scale-105 active:scale-95 transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{isAmharic ? 'መቅረጽ ጀምር (Record)' : 'Start Recording'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFile}
                    className="px-4 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>{isAmharic ? 'ፋይል ጫን (Upload)' : 'Upload Audio'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAiVoice}
                    disabled={isGeneratingAiVoice}
                    className="px-4 py-3 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-2xl font-bold text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isGeneratingAiVoice ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-indigo-600" />
                    )}
                    <span>{isAmharic ? 'አዲስ AI ድምፅ አዘጋጅ' : 'Addis AI Voice'}</span>
                  </button>
                </>
              )}

              {recorderState === 'RECORDING' && (
                <button
                  type="button"
                  id="btn-stop-mic-record"
                  onClick={handleStopRecording}
                  className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs shadow-lg shadow-slate-300 active:scale-95 transition flex items-center space-x-2 cursor-pointer animate-pulse"
                >
                  <Square className="w-4 h-4 text-rose-400 fill-rose-400" />
                  <span>{isAmharic ? 'ቅጂውን ጨርስ (Stop)' : 'Stop Recording'}</span>
                </button>
              )}

              {(recorderState === 'RECORDED' || recorderState === 'PLAYING') && (
                <>
                  <button
                    type="button"
                    onClick={handleTogglePlayback}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 transition flex items-center space-x-2 cursor-pointer"
                  >
                    {recorderState === 'PLAYING' ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>{isAmharic ? 'አቁም' : 'Pause'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>{isAmharic ? 'ድምፅህን አዳምጥ' : 'Listen Preview'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReRecord}
                    className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isAmharic ? 'እንደገና' : 'Reset'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'ሌላ ጫን' : 'Change File'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Station Preset Quick Clip Toolbar */}
          <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-800">
                {isAmharic ? 'የመስኮት ፈጣን ድምፅ ቅንብር:' : 'Station Quick Preset:'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {savedStationClip ? (
                <>
                  <button
                    type="button"
                    onClick={handleLoadSavedPreset}
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
                  >
                    {isAmharic ? 'የተቀመጠውን ድምፅ ተጠቀም' : 'Use Saved Clip'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSavedPreset}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Delete Preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : recordedResult ? (
                <button
                  type="button"
                  onClick={handleSaveStationPreset}
                  className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg font-bold hover:bg-indigo-50 transition flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  {isAmharic ? 'ለመስኮትህ አስቀምጥ' : 'Save Preset'}
                </button>
              ) : (
                <span className="text-slate-400 italic">
                  {isAmharic ? 'ምንም የተቀመጠ ድምፅ የለም' : 'No preset saved'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer / Broadcast Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {isAmharic ? 'ሰርዝ' : 'Cancel'}
          </button>

          <button
            type="button"
            id="btn-broadcast-personal-voice"
            disabled={!recordedResult || recorderState === 'RECORDING' || recorderState === 'BROADCASTING'}
            onClick={handleBroadcastVoiceCall}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 flex items-center space-x-2 transition cursor-pointer active:scale-95 disabled:cursor-not-allowed"
          >
            <Radio className={`w-4 h-4 ${recorderState === 'BROADCASTING' ? 'animate-spin' : ''}`} />
            <span>
              {recorderState === 'BROADCASTING'
                ? (isAmharic ? 'ጥሪ በማስተላለፍ ላይ...' : 'Broadcasting...')
                : (isAmharic ? 'በግል ድምፅ ወደ አዳራሽ ጥራ (Broadcast)' : 'Broadcast Live Voice Call')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
