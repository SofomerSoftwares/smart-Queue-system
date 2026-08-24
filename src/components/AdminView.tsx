import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  Volume2, 
  VolumeX,
  Users, 
  Layers, 
  Tv, 
  FileText, 
  Play, 
  Pause,
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  RotateCcw, 
  Music, 
  Disc,
  Sparkles, 
  Upload, 
  Activity,
  BarChart,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Server,
  Radio,
  RefreshCw,
  Cpu,
  Lock,
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  X,
  Printer,
  Smartphone,
  Mic,
  Headphones,
  Sliders,
  Languages,
  Zap
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { audioManager } from '../lib/audioManager';
import { Service, Counter, User, AudioSetting, OfficeSetting, AuditLog, AudioAsset, AddisVoiceOption } from '../types';

export const AdminView: React.FC = () => {
  const { 
    services, 
    counters, 
    officeSetting, 
    audioSetting, 
    audioAssets: contextAudioAssets,
    changeBackgroundMusicTrack,
    setBackgroundVolume,
    stats, 
    uiLanguage, 
    resetDailyQueue,
    refreshQueue 
  } = useQueue();

  const { user, login, demoLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'counters' | 'staff' | 'audio' | 'database' | 'office' | 'audit'>('overview');

  const isAmharic = uiLanguage === 'AMHARIC';

  // Admin Gate Form State
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('Admin@123');
  const [adminGateError, setAdminGateError] = useState<string>('');
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState<boolean>(false);

  // State for Users & Audit
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [audioAssets, setAudioAssets] = useState<any[]>([]);

  // MongoDB Atlas State
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [mongoUriInput, setMongoUriInput] = useState<string>('');
  const [isConnectingDb, setIsConnectingDb] = useState<boolean>(false);
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);
  const [dbActionMsg, setDbActionMsg] = useState<string>('');

  // Modals & Form States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [isSavingService, setIsSavingService] = useState<boolean>(false);
  const [serviceModalError, setServiceModalError] = useState<string>('');

  const [isCounterModalOpen, setIsCounterModalOpen] = useState<boolean>(false);
  const [editingCounter, setEditingCounter] = useState<Partial<Counter> | null>(null);
  const [isSavingCounter, setIsSavingCounter] = useState<boolean>(false);
  const [counterModalError, setCounterModalError] = useState<string>('');

  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isSavingUser, setIsSavingUser] = useState<boolean>(false);
  const [userModalError, setUserModalError] = useState<string>('');
  const [showUserPassword, setShowUserPassword] = useState<boolean>(false);

  // AI & Local Music Library State
  const [musicPrompt, setMusicPrompt] = useState<string>('Gentle calm Addis Krar ambient office lounge background relaxing');
  const [isGeneratingMusic, setIsGeneratingMusic] = useState<boolean>(false);
  const [currentlyPreviewingId, setCurrentlyPreviewingId] = useState<string | null>(null);
  const [isRestoringDefaults, setIsRestoringDefaults] = useState<boolean>(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState<boolean>(false);
  const [musicActionMessage, setMusicActionMessage] = useState<string>('');

  // Addis Voice API State
  const [addisVoiceStatus, setAddisVoiceStatus] = useState<any>(null);
  const [addisVoices, setAddisVoices] = useState<AddisVoiceOption[]>([]);
  const [testVoiceText, setTestVoiceText] = useState<string>('ቁጥር ሀ ሃያ አራት ያላችሁ ደንበኛ ወደ ቆጣሪ ሁለት ይሂዱ።');
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [testVoiceStatusMsg, setTestVoiceStatusMsg] = useState<string>('');
  const [audioStudioTab, setAudioStudioTab] = useState<'voice' | 'music'>('voice');

  // Office & Audio Settings Form
  const [officeForm, setOfficeForm] = useState<Partial<OfficeSetting>>({});
  const [isOfficeFormDirty, setIsOfficeFormDirty] = useState<boolean>(false);
  const [audioForm, setAudioForm] = useState<Partial<AudioSetting>>({
    voiceEnabled: true,
    language: 'AMHARIC',
    volume: 85,
    repeatCount: 1,
    announcementDelaySeconds: 1,
    addisVoiceEnabled: true,
    addisVoice: 'aster',
    voiceSpeed: 1.0,
    backgroundMusicEnabled: true,
    backgroundMusicVolume: 14
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [isSavingAudio, setIsSavingAudio] = useState<boolean>(false);
  const [isSavingOffice, setIsSavingOffice] = useState<boolean>(false);
  const [officeSaveSuccess, setOfficeSaveSuccess] = useState<string>('');
  const [officeSaveError, setOfficeSaveError] = useState<string>('');

  // Quick Rename Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [renameAmharic, setRenameAmharic] = useState<string>('');
  const [renameEnglish, setRenameEnglish] = useState<string>('');
  const [isSavingRenameModal, setIsSavingRenameModal] = useState<boolean>(false);
  const [renameModalError, setRenameModalError] = useState<string>('');

  useEffect(() => {
    if (officeSetting) {
      if (!isOfficeFormDirty) {
        setOfficeForm(officeSetting);
      }
      setRenameAmharic(officeSetting.officeNameAmharic || '');
      setRenameEnglish(officeSetting.officeName || '');
    }
    if (audioSetting) {
      setAudioForm(prev => ({
        ...prev,
        ...audioSetting,
        addisVoiceEnabled: audioSetting.addisVoiceEnabled !== undefined ? audioSetting.addisVoiceEnabled : true,
        addisVoice: audioSetting.addisVoice || 'aster',
        voiceSpeed: audioSetting.voiceSpeed || 1.0
      }));
    }
  }, [officeSetting, audioSetting, isOfficeFormDirty]);

  const loadAdminData = async () => {
    try {
      const [uRes, aRes, audRes, dbRes, vStatusRes, vListRes] = await Promise.all([
        api.getUsers().catch(() => ({ success: false, users: [] })),
        api.getAuditLogs().catch(() => ({ success: false, logs: [] })),
        api.getAudioAssets().catch(() => ({ success: false, assets: [] })),
        api.getDatabaseStatus().catch(() => ({ success: false })),
        api.getAddisVoiceStatus().catch(() => ({ success: false, status: { configured: false, apiUrl: '', activeModel: '', availableVoicesCount: 0, provider: '' } })),
        api.getAddisVoices().catch(() => ({ success: false, voices: [] }))
      ]);

      if (uRes.success) setUsersList(uRes.users);
      if (aRes.success) setAuditLogs(aRes.logs);
      if (audRes.success) setAudioAssets(audRes.assets);
      if (dbRes.success) setDbStatus(dbRes);
      if (vStatusRes.success && vStatusRes.status) setAddisVoiceStatus(vStatusRes.status);
      if (vListRes.success && vListRes.voices) setAddisVoices(vListRes.voices);
    } catch (err) {
      console.warn('Error loading admin data:', err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  // Test Live Addis Voice Announcement
  const handleTestAddisVoice = async (customPhrase?: string) => {
    const textToAnnounce = customPhrase || testVoiceText;
    try {
      setIsTestingVoice(true);
      setTestVoiceStatusMsg(isAmharic ? 'በ Addis Voice API ድምፅ በማመንጨት ላይ...' : 'Synthesizing voice via Addis Voice API...');
      
      const res = await api.testAddisVoice({
        text: textToAnnounce,
        voice: audioForm.addisVoice || 'aster',
        speed: audioForm.voiceSpeed || 1.0,
        language: audioForm.language === 'ENGLISH' ? 'en' : 'am'
      });

      if (res.success && res.audioBase64) {
        setTestVoiceStatusMsg(isAmharic ? 'የ Addis Voice ጥሪ በመጫወት ላይ...' : 'Playing Addis Voice crystal-clear audio...');
        await audioManager.playAnnouncement(
          textToAnnounce,
          res.audioBase64,
          res.mimeType || 'audio/wav',
          audioForm.volume || 85
        );
        setTestVoiceStatusMsg(isAmharic ? 'የ Addis Voice ጥሪ ተጫውቷል!' : 'Addis Voice audio announcement played successfully!');
      } else {
        setTestVoiceStatusMsg(isAmharic ? 'በአሳሽ የድምፅ ሞተር በመጫወት ላይ...' : 'Playing browser speech announcement...');
        await audioManager.playAnnouncement(
          textToAnnounce,
          undefined,
          'audio/wav',
          audioForm.volume || 85
        );
        setTestVoiceStatusMsg(isAmharic ? 'የድምፅ ጥሪ ተጫውቷል' : 'Announcement played');
      }
      setTimeout(() => setTestVoiceStatusMsg(''), 5000);
    } catch (err: any) {
      setTestVoiceStatusMsg(`Error: ${err.message}`);
    } finally {
      setIsTestingVoice(false);
    }
  };

  // Save Complete Audio & Voice Settings
  const handleSaveAudioSettings = async () => {
    try {
      setIsSavingAudio(true);
      setSaveSuccessMsg('');
      const res = await api.updateAudioSettings(audioForm);
      if (res.success && res.settings) {
        setAudioForm(res.settings);
        const msg = isAmharic ? 'የድምፅ ጥሪ እና የሙዚቃ ቅንብሮች በተሳካ ሁኔታ ተቀምጠዋል!' : 'Addis Voice and Audio settings saved successfully!';
        setSaveSuccessMsg(msg);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
        await refreshQueue();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save audio settings');
    } finally {
      setIsSavingAudio(false);
    }
  };

  // Background Music Toggle
  const handleToggleBackgroundMusic = async (enabled: boolean) => {
    setAudioForm(prev => ({ ...prev, backgroundMusicEnabled: enabled }));
    try {
      setIsSavingAudio(true);
      await api.updateAudioSettings({ backgroundMusicEnabled: enabled });
      setMusicActionMessage(
        enabled
          ? (isAmharic ? 'የቢሮ ዳራ ሙዚቃ ነቅቷል' : 'Background music enabled')
          : (isAmharic ? 'የቢሮ ዳራ ሙዚቃ ቆሟል' : 'Background music disabled')
      );
      setTimeout(() => setMusicActionMessage(''), 3000);
      await refreshQueue();
    } catch (err: any) {
      console.warn('Error toggling music:', err);
    } finally {
      setIsSavingAudio(false);
    }
  };

  // Background Music Volume Update
  const handleUpdateBackgroundVolume = async (volume: number) => {
    setAudioForm(prev => ({ ...prev, backgroundMusicVolume: volume }));
    if (setBackgroundVolume) setBackgroundVolume(volume);
    try {
      await api.updateAudioSettings({ backgroundMusicVolume: volume });
    } catch (err: any) {
      console.warn('Error updating volume:', err);
    }
  };

  // Generate Local / AI Music
  const handleGenerateAIMusic = async (customPrompt?: string) => {
    const promptToUse = customPrompt || musicPrompt;
    try {
      setIsGeneratingMusic(true);
      setMusicActionMessage(isAmharic ? 'የዳራ ሙዚቃ በ AI / በአካባቢ ዳታቤዝ እየተፈጠረ ነው...' : 'Generating ambient music track into database...');
      const res = await api.generateAIMusic(promptToUse);
      if (res.success && res.result) {
        setMusicActionMessage(isAmharic ? 'አዲስ ሙዚቃ በዳታቤዝ ውስጥ በተሳካ ሁኔታ ተቀምጧል!' : 'New music track generated and saved to database!');
        await loadAdminData();
        await refreshQueue();
        setTimeout(() => setMusicActionMessage(''), 4000);
      }
    } catch (err: any) {
      setMusicActionMessage(`Generation error: ${err.message}`);
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  // Upload Local Music File to Database
  const handleUploadMusicFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingMusic(true);
      setMusicActionMessage(isAmharic ? 'ሙዚቃ ወደ ዳታቤዝ በመጫን ላይ...' : 'Uploading music file to database storage...');
      
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const title = file.name.replace(/\.[^/.]+$/, '');
          const res = await api.uploadMusic({
            title,
            base64Data,
            mimeType: file.type || 'audio/mp3',
            durationSeconds: 180
          });

          if (res.success) {
            setMusicActionMessage(isAmharic ? 'የሙዚቃ ፋይሉ በዳታቤዝ ውስጥ ተቀምጧል!' : 'Music file successfully saved to database storage!');
            await loadAdminData();
            await refreshQueue();
            setTimeout(() => setMusicActionMessage(''), 4000);
          }
        } catch (err: any) {
          setMusicActionMessage(`Upload failed: ${err.message}`);
        } finally {
          setIsUploadingMusic(false);
        }
      };
      reader.onerror = () => {
        setMusicActionMessage('Failed to read audio file.');
        setIsUploadingMusic(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setMusicActionMessage(`Upload error: ${err.message}`);
      setIsUploadingMusic(false);
    }
  };

  // Restore Default Ethiopian Ambient Tracks
  const handleRestoreDefaultTracks = async () => {
    try {
      setIsRestoringDefaults(true);
      setMusicActionMessage(isAmharic ? 'ነባሪ የዳራ ሙዚቃዎች ወደ ዳታቤዝ እየተመለሱ ነው...' : 'Restoring default ambient tracks to database...');
      const res = await api.restoreDefaultAudioAssets();
      if (res.success) {
        setMusicActionMessage(isAmharic ? 'ነባሪ የኢትዮጵያ እና የቢሮ ዳራ ሙዚቃዎች ተመልሰዋል!' : 'Default ambient tracks restored to database!');
        await loadAdminData();
        await refreshQueue();
        setTimeout(() => setMusicActionMessage(''), 4000);
      }
    } catch (err: any) {
      setMusicActionMessage(`Restore error: ${err.message}`);
    } finally {
      setIsRestoringDefaults(false);
    }
  };

  // Track Preview Toggle
  const handleTogglePreviewTrack = (asset: any) => {
    if (currentlyPreviewingId === asset.id) {
      audioManager.stopPreview();
      setCurrentlyPreviewingId(null);
    } else {
      audioManager.previewTrack(asset.url, 30);
      setCurrentlyPreviewingId(asset.id);
    }
  };

  // Delete Track from Database
  const handleDeleteTrack = async (assetId: string) => {
    try {
      if (currentlyPreviewingId === assetId) {
        audioManager.stopPreview();
        setCurrentlyPreviewingId(null);
      }
      await api.deleteAudioAsset(assetId);
      await loadAdminData();
      await refreshQueue();
      setMusicActionMessage(isAmharic ? 'ሙዚቃው ከዳታቤዝ ተሰርዟል' : 'Music track deleted from database');
      setTimeout(() => setMusicActionMessage(''), 3000);
    } catch (err: any) {
      setMusicActionMessage(`Delete error: ${err.message}`);
    }
  };

  // Select Active Background Music Track
  const handleSelectActiveTrack = async (assetId: string) => {
    setAudioForm(prev => ({ ...prev, currentMusicAssetId: assetId }));
    try {
      await api.updateAudioSettings({ currentMusicAssetId: assetId });
      if (changeBackgroundMusicTrack) {
        await changeBackgroundMusicTrack(assetId);
      }
      setMusicActionMessage(isAmharic ? 'የቢሮ ዳራ ሙዚቃ ተቀይሯል!' : 'Active background track updated!');
      setTimeout(() => setMusicActionMessage(''), 3000);
    } catch (err: any) {
      console.warn('Error selecting track:', err);
    }
  };

  // Save Service Handler
  const handleSaveService = async () => {
    if (!editingService) return;
    setServiceModalError('');

    const nameAmharic = (editingService.nameAmharic || '').trim();
    const name = (editingService.name || '').trim();
    const prefix = (editingService.prefix || 'S').trim().toUpperCase().charAt(0) || 'S';

    if (!nameAmharic && !name) {
      setServiceModalError(isAmharic ? 'እባክዎ የአገልግሎት ስም ያስገቡ' : 'Please enter the service name');
      return;
    }

    try {
      setIsSavingService(true);
      const payload = {
        ...editingService,
        name: name || nameAmharic,
        nameAmharic: nameAmharic || name,
        prefix,
        estimatedDurationMinutes: Number(editingService.estimatedDurationMinutes) || 5,
        color: editingService.color || '#4f46e5'
      };

      if (editingService.id) {
        await api.updateService(editingService.id, payload);
        setSaveSuccessMsg(isAmharic ? 'አገልግሎቱ በተሳካ ሁኔታ ተሻሽሏል!' : 'Service updated successfully!');
      } else {
        await api.createService(payload);
        setSaveSuccessMsg(isAmharic ? 'አዲስ አገልግሎት በተሳካ ሁኔታ ተፈጥሯል!' : 'New service created successfully!');
      }

      setIsServiceModalOpen(false);
      setEditingService(null);
      setTimeout(() => setSaveSuccessMsg(''), 3500);
      refreshQueue();
    } catch (err: any) {
      console.error('Error saving service:', err);
      setServiceModalError(err.message || (isAmharic ? 'አገልግሎቱን ማስቀመጥ አልተቻለም። እባክዎ እንደ አስተዳዳሪ መግባትዎን ያረጋግጡ።' : 'Failed to save service. Please verify admin login.'));
    } finally {
      setIsSavingService(false);
    }
  };

  // Save Counter Handler
  const handleSaveCounter = async () => {
    if (!editingCounter) return;
    setCounterModalError('');

    const num = Number(editingCounter.number);
    if (!num || num < 1) {
      setCounterModalError(isAmharic ? 'እባክዎ ትክክለኛ የቆጣሪ ቁጥር ያስገቡ' : 'Please enter a valid counter number');
      return;
    }

    try {
      setIsSavingCounter(true);
      const payload = {
        ...editingCounter,
        number: num,
        name: editingCounter.name?.trim() || `Counter ${num}`,
        nameAmharic: editingCounter.nameAmharic?.trim() || `ቆጣሪ ${num}`
      };

      if (editingCounter.id) {
        await api.updateCounter(editingCounter.id, payload);
        setSaveSuccessMsg(isAmharic ? 'ቆጣሪው በተሳካ ሁኔታ ተሻሽሏል!' : 'Counter updated successfully!');
      } else {
        await api.createCounter(payload);
        setSaveSuccessMsg(isAmharic ? 'አዲስ ቆጣሪ በተሳካ ሁኔታ ተፈጥሯል!' : 'New counter created successfully!');
      }

      setIsCounterModalOpen(false);
      setEditingCounter(null);
      setTimeout(() => setSaveSuccessMsg(''), 3500);
      refreshQueue();
    } catch (err: any) {
      console.error('Error saving counter:', err);
      setCounterModalError(err.message || 'Failed to save counter. Please verify admin privileges.');
    } finally {
      setIsSavingCounter(false);
    }
  };

  // Save User Handler
  const handleSaveUser = async () => {
    if (!editingUser) return;
    setUserModalError('');

    const name = editingUser.name?.trim();
    const username = editingUser.username?.trim();

    if (!name || !username) {
      setUserModalError(isAmharic ? 'እባክዎ ሙሉ ስም እና የተጠቃሚ ስም ያስገቡ' : 'Please enter name and username');
      return;
    }

    if (!editingUser.id && (!editingUser.password || editingUser.password.length < 6)) {
      setUserModalError(isAmharic ? 'የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት' : 'Password must be at least 6 characters');
      return;
    }

    if (editingUser.id && editingUser.password && editingUser.password.trim().length > 0 && editingUser.password.trim().length < 6) {
      setUserModalError(isAmharic ? 'አዲሱ የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት' : 'New password must be at least 6 characters long');
      return;
    }

    try {
      setIsSavingUser(true);
      if (editingUser.id) {
        await api.updateUser(editingUser.id, editingUser);
        setSaveSuccessMsg(isAmharic ? 'የሰራተኛ መረጃ እና የይለፍ ቃል በተሳካ ሁኔታ ተሻሽሏል!' : 'Staff details & password updated successfully!');
      } else {
        await api.createUser(editingUser);
        setSaveSuccessMsg(isAmharic ? 'አዲስ ሰራተኛ በተሳካ ሁኔታ ተመዝግቧል!' : 'New staff user created successfully!');
      }

      setIsUserModalOpen(false);
      setEditingUser(null);
      setTimeout(() => setSaveSuccessMsg(''), 3500);
      loadAdminData();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setUserModalError(err.message || 'Failed to save user account.');
    } finally {
      setIsSavingUser(false);
    }
  };

  // Save Office Settings
  const handleSaveOfficeSettings = async () => {
    try {
      setIsSavingOffice(true);
      setOfficeSaveError('');
      setOfficeSaveSuccess('');

      // Validation
      const amName = (officeForm.officeNameAmharic || '').trim();
      const enName = (officeForm.officeName || '').trim();
      if (!amName && !enName) {
        throw new Error(isAmharic ? 'እባክዎ ቢያንስ የአማርኛ ወይም የእንግሊዝኛ የቢሮ ስም ያስገቡ' : 'Please provide at least an Amharic or English office name');
      }

      const res = await api.updateOfficeSettings({
        ...officeForm,
        officeNameAmharic: amName || enName,
        officeName: enName || amName
      });

      if (res.success && res.setting) {
        setOfficeForm(res.setting);
        setIsOfficeFormDirty(false);
      }
      const msg = isAmharic ? 'የቢሮ ስም እና ቅንብሮች በተሳካ ሁኔታ ተቀምጠዋል!' : 'Office name & settings saved successfully!';
      setOfficeSaveSuccess(msg);
      setSaveSuccessMsg(msg);
      setTimeout(() => {
        setOfficeSaveSuccess('');
        setSaveSuccessMsg('');
      }, 3500);
      await refreshQueue();
      loadAdminData();
    } catch (err: any) {
      console.error('Error saving office settings:', err);
      setOfficeSaveError(err.message || (isAmharic ? 'የቢሮ ቅንብሮችን ማስቀመጥ አልተቻለም' : 'Failed to save office settings'));
    } finally {
      setIsSavingOffice(false);
    }
  };

  // Quick Rename Office Name
  const handleSaveQuickRename = async () => {
    const am = renameAmharic.trim();
    const en = renameEnglish.trim();
    if (!am && !en) {
      setRenameModalError(isAmharic ? 'እባክዎ የቢሮውን ስም ያስገቡ' : 'Please provide an office name');
      return;
    }

    try {
      setIsSavingRenameModal(true);
      setRenameModalError('');
      const res = await api.updateOfficeSettings({
        officeNameAmharic: am || en,
        officeName: en || am
      });

      if (res.success && res.setting) {
        setOfficeForm(res.setting);
        setIsOfficeFormDirty(false);
        setIsRenameModalOpen(false);
        const msg = isAmharic ? 'የቢሮ ስም ተቀይሯል!' : 'Office name updated successfully!';
        setSaveSuccessMsg(msg);
        setTimeout(() => setSaveSuccessMsg(''), 3500);
        await refreshQueue();
        loadAdminData();
      }
    } catch (err: any) {
      setRenameModalError(err.message || 'Failed to rename office');
    } finally {
      setIsSavingRenameModal(false);
    }
  };

  // Connect MongoDB Atlas
  const handleConnectDb = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsConnectingDb(true);
      setDbActionMsg(isAmharic ? 'ከ MongoDB Atlas ጋር በመገናኘት ላይ...' : 'Connecting to MongoDB Atlas...');
      const res = await api.connectDatabase(mongoUriInput || undefined);
      if (res.success) {
        setDbStatus(res);
        setDbActionMsg(
          res.connected
            ? (isAmharic ? 'በተሳካ ሁኔታ ከ MongoDB Atlas ጋር ተገናኝቷል!' : 'Successfully connected to MongoDB Atlas!')
            : (isAmharic ? 'ከዳታቤዙ ጋር መገናኘት አልተቻለም፡ ' + res.error : 'Failed to connect: ' + res.error)
        );
        setTimeout(() => setDbActionMsg(''), 5000);
      }
    } catch (err: any) {
      setDbActionMsg(`Error: ${err.message}`);
    } finally {
      setIsConnectingDb(false);
    }
  };

  // Disconnect MongoDB Atlas / Switch to Local Resilient Mode
  const handleDisconnectDb = async () => {
    try {
      setIsConnectingDb(true);
      setDbActionMsg(isAmharic ? 'ወደ አካባቢ ማከማቻ በመቀየር ላይ...' : 'Switching to Local Resilient Storage...');
      const res = await api.disconnectDatabase();
      if (res.success) {
        setDbStatus(res);
        setMongoUriInput('');
        setDbActionMsg(isAmharic ? 'ወደ አካባቢ ማከማቻ (Local Mode) ተቀይሯል!' : 'Switched to Resilient Local Storage mode!');
        setTimeout(() => setDbActionMsg(''), 4000);
      }
    } catch (err: any) {
      setDbActionMsg(`Error: ${err.message}`);
    } finally {
      setIsConnectingDb(false);
    }
  };

  // Sync state to MongoDB Atlas
  const handleSyncDb = async () => {
    try {
      setIsSyncingDb(true);
      setDbActionMsg(isAmharic ? 'መረጃዎችን ወደ MongoDB Atlas በማስተላለፍ ላይ...' : 'Synchronizing state to MongoDB Atlas...');
      const res = await api.syncDatabase();
      if (res.success) {
        setDbActionMsg(isAmharic ? 'መረጃዎች ወደ MongoDB Atlas ተልከዋል!' : 'All queue collections synchronized to Atlas!');
        setTimeout(() => setDbActionMsg(''), 4000);
      }
    } catch (err: any) {
      setDbActionMsg(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Admin Gate Login Form Handler
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

  // Strict Admin Gate: Only ADMIN role can access the management portal
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20 border border-indigo-400/30 shrink-0">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                    <Lock className="w-3 h-3" />
                    <span>{isAmharic ? 'የተገደበ መዳረሻ' : 'Restricted Access'}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {isAmharic ? 'የስርዓት አስተዳደር ማዕከል' : 'Management Portal'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                    {isAmharic 
                      ? 'ይህ የስራ ክፍል ለአስተዳዳሪ (Admin) ብቻ የተፈቀደ ነው። አገልግሎቶች፣ ቆጣሪዎች፣ ሰራተኞች፣ የአማርኛ ድምፅ እና የቢሮ ቅንብሮች እዚህ ይዋቀራሉ።'
                      : 'This portal is strictly restricted to System Administrators. Service catalog, counter routing, staff accounts, Voice parameters, MongoDB Atlas sync, and audit logs are managed here.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Current User Status Banner */}
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

            {/* Admin Login Form */}
            <form onSubmit={handleAdminGateLogin} className="space-y-4 max-w-md mx-auto pt-2">
              <div className="text-center space-y-1 mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  {isAmharic ? 'በአስተዳዳሪ መለያ ይግቡ' : 'Authenticate as Administrator'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isAmharic ? 'የአስተዳዳሪ ምስክር ወረቀቶችን ያስገቡ' : 'Enter your system administrator credentials to unlock.'}
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
              {isAmharic ? 'አገልግሎቶች፣ ቆጣሪዎች፣ ሰራተኞች፣ የዳራ ሙዚቃ እና የቢሮ ቅንብሮች' : 'Manage services, counters, staff, background music and office settings'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Rename Office Button */}
          <button
            id="btn-quick-rename-office"
            onClick={() => {
              setRenameAmharic(officeSetting?.officeNameAmharic || officeForm.officeNameAmharic || '');
              setRenameEnglish(officeSetting?.officeName || officeForm.officeName || '');
              setRenameModalError('');
              setIsRenameModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition shadow-2xs"
            title="Rename Office Name"
          >
            <Building2 className="w-4 h-4" />
            <span>{isAmharic ? 'የቢሮ ስም ቀይር' : 'Rename Office'}</span>
          </button>

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
            <span>{isAmharic ? 'የዛሬውን ወረፋ አድስ' : 'Reset Daily Queue'}</span>
          </button>
        </div>
      </div>

      {/* Admin Session Notice if not signed in */}
      {!user && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950">
                {isAmharic ? 'የአስተዳዳሪ ፈቃድ ያስፈልጋል' : 'Admin Authorization Required'}
              </p>
              <p className="text-[11px] text-indigo-700">
                {isAmharic ? 'አገልግሎቶችን፣ ቆጣሪዎችን እና ሰራተኞችን ለማስተካከል በአስተዳዳሪ መለያ ይግቡ' : 'To save services, counters, and office configurations, sign in as Administrator.'}
              </p>
            </div>
          </div>
          <button
            id="btn-admin-quick-login"
            onClick={() => demoLogin('ADMIN')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap self-start sm:self-auto"
          >
            {isAmharic ? 'በአስተዳዳሪ ግባ (Admin Login)' : 'Authorize as Admin'}
          </button>
        </div>
      )}

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
          { id: 'audio', label: isAmharic ? 'ድምፅ እና ሙዚቃ (Addis Voice)' : 'Voice & Audio Studio (Addis Voice)', icon: Volume2 },
          { id: 'database', label: isAmharic ? 'ዳታቤዝ (MongoDB)' : 'Database (MongoDB Atlas)', icon: Database },
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
                        try {
                          await api.deleteService(s.id);
                          setSaveSuccessMsg(isAmharic ? 'አገልግሎቱ ተሰርዟል' : 'Service deleted successfully');
                          setTimeout(() => setSaveSuccessMsg(''), 3000);
                          refreshQueue();
                        } catch (err: any) {
                          alert(err.message || 'Failed to delete service. Please check admin permissions.');
                        }
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
            {counters.map((c) => {
              const assignedUser = usersList.find(u => u.assignedCounterId === c.id || (c.currentOfficerId && u.id === c.currentOfficerId));
              return (
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
                    
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center space-x-1.5 text-xs">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold text-slate-700">
                        {assignedUser ? assignedUser.name : (c.currentOfficerName || (isAmharic ? 'የተመደበ ሰራተኛ የለም' : 'No officer assigned'))}
                      </span>
                    </div>
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
                          try {
                            await api.deleteCounter(c.id);
                            setSaveSuccessMsg(isAmharic ? 'ቆጣሪው ተሰርዟል' : 'Counter deleted successfully');
                            setTimeout(() => setSaveSuccessMsg(''), 3000);
                            refreshQueue();
                          } catch (err: any) {
                            alert(err.message || 'Failed to delete counter. Please check admin permissions.');
                          }
                        }
                      }}
                      className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
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
                setEditingUser({ name: '', username: '', password: '', role: 'SERVICE_OFFICER', assignedCounterId: '' });
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
                  <th className="py-3 px-4">{isAmharic ? 'የተመደበ ቆጣሪ' : 'Assigned Station'}</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {usersList.map((u) => {
                  const assignedCnt = counters.find(cnt => cnt.id === u.assignedCounterId);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{u.username}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {assignedCnt ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Lock className="w-3 h-3 text-indigo-500" />
                            <span>{isAmharic ? `ቆጣሪ 0${assignedCnt.number}` : `Counter 0${assignedCnt.number}`}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">{isAmharic ? 'አልተመደበም' : 'Unassigned'}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-700 font-bold">ACTIVE</span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={async () => {
                            const newPass = prompt(
                              isAmharic 
                                ? `ለ ${u.name} አዲስ የይለፍ ቃል ያስገቡ (ቢያንስ 6 ፊደላት):` 
                                : `Enter new password for ${u.name} (min 6 characters):`
                            );
                            if (newPass && newPass.trim().length >= 6) {
                              try {
                                const res = await api.adminResetUserPassword(u.id, newPass.trim());
                                setSaveSuccessMsg(res.message || (isAmharic ? 'የይለፍ ቃል ተቀይሯል' : 'Password reset successfully'));
                                setTimeout(() => setSaveSuccessMsg(''), 3500);
                              } catch (err: any) {
                                alert(err.message || 'Failed to reset password');
                              }
                            } else if (newPass !== null) {
                              alert(isAmharic ? 'የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት' : 'Password must be at least 6 characters');
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center space-x-1"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>{isAmharic ? 'ይለፍ ቃል ቀይር' : 'Reset Pass'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setShowUserPassword(false);
                            setIsUserModalOpen(true);
                          }}
                          className="text-slate-600 hover:text-slate-900 font-bold ml-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete user ${u.name}?`)) {
                              try {
                                await api.deleteUser(u.id);
                                setSaveSuccessMsg(isAmharic ? 'ሰራተኛው ተሰርዟል' : 'User deleted successfully');
                                setTimeout(() => setSaveSuccessMsg(''), 3000);
                                loadAdminData();
                              } catch (err: any) {
                                alert(err.message || 'Failed to delete user.');
                              }
                            }
                          }}
                          className="text-rose-600 hover:text-rose-700 ml-2 font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: VOICE ANNOUNCEMENT & BACKGROUND MUSIC STUDIO (ADDIS VOICE API) */}
      {activeTab === 'audio' && (
        <div className="space-y-6">
          {/* Sub-Header Tabs: Addis Voice vs Background Music */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isAmharic ? 'የድምፅ ጥሪ እና የሙዚቃ ስቱዲዮ' : 'Voice Announcement & Music Studio'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isAmharic ? 'በ Addis Voice AI የሚሰሩ የአማርኛ እና አፋን ኦሮሞ የድምፅ ጥሪዎች እና የቢሮ ዳራ ሙዚቃዎች' : 'High-fidelity Addis Voice Amharic neural speech & ambient lobby soundtracks'}
                </p>
              </div>
            </div>

            {/* Sub-tab Switcher */}
            <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setAudioStudioTab('voice')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  audioStudioTab === 'voice'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'Addis Voice የድምፅ ጥሪ' : 'Addis Voice Engine'}</span>
              </button>
              <button
                type="button"
                onClick={() => setAudioStudioTab('music')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  audioStudioTab === 'music'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'የቢሮ ዳራ ሙዚቃ' : 'Background Music'}</span>
              </button>
            </div>
          </div>

          {/* SUB-VIEW 1: ADDIS VOICE ANNOUNCEMENT ENGINE */}
          {audioStudioTab === 'voice' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left 6 Cols: Addis Voice Persona Selection & Speech Parameters */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Addis Voice API Status Banner */}
                <div className="p-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl border border-indigo-500/30 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                          {isAmharic ? 'Addis Voice AI ሞተር' : 'Addis Voice Neural TTS'}
                        </h3>
                        <p className="text-xs text-white font-medium">
                          {addisVoiceStatus?.activeModel || 'Addis Voices 2 (አሌፍ-Audio-AM)'}
                        </p>
                      </div>
                    </div>
                    
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                      {addisVoiceStatus?.configured ? (isAmharic ? 'API ንቁ ነው' : 'API Active') : (isAmharic ? 'Addis Voice ዝግጁ' : 'Engine Ready')}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 grid grid-cols-2 gap-2 pt-1 font-mono">
                    <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-slate-400 block text-[10px]">API Endpoint:</span>
                      <span className="truncate block font-semibold text-white">
                        {addisVoiceStatus?.apiUrl ? addisVoiceStatus.apiUrl.replace('https://', '') : 'api.addisassistant.com'}
                      </span>
                    </div>
                    <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-slate-400 block text-[10px]">Available Personas:</span>
                      <span className="block font-semibold text-white">
                        {addisVoices.length || 8} Amharic/Oromo Voices
                      </span>
                    </div>
                  </div>
                </div>

                {/* Master Voice Announcement Controls */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <Mic className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-900 text-base">
                        {isAmharic ? 'የድምፅ ጥሪ ዋና ቅንብሮች' : 'Voice Announcement Parameters'}
                      </h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={audioForm.voiceEnabled ?? true}
                        onChange={(e) => setAudioForm(prev => ({ ...prev, voiceEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Addis Voice API Toggle */}
                  <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isAmharic ? 'Addis Voice AI ጥሪ ተጠቀም' : 'Use Addis Voice AI Synthesis'}</span>
                      </p>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        {isAmharic ? 'ተፈጥሯዊ እና ግልጽ የአማርኛ ንባብ በከፍተኛ ጥራት' : 'Crystal-clear native Amharic voice synthesis for queue calling'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={audioForm.addisVoiceEnabled ?? true}
                        onChange={(e) => setAudioForm(prev => ({ ...prev, addisVoiceEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Language Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isAmharic ? 'የጥሪ ቋንቋ (Announcement Language)' : 'Announcement Language'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'AMHARIC', label: 'አማርኛ (Amharic)', sub: 'Primary' },
                        { id: 'ENGLISH', label: 'English', sub: 'Standard' },
                        { id: 'BOTH', label: 'ሁለቱም (Both)', sub: 'Bilingual' }
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setAudioForm(prev => ({ ...prev, language: lang.id as any }))}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                            audioForm.language === lang.id
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <span className="block text-xs">{lang.label}</span>
                          <span className={`block text-[10px] mt-0.5 ${audioForm.language === lang.id ? 'text-indigo-200' : 'text-slate-400'}`}>{lang.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speech Speed / Rate Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isAmharic ? 'የንግግር ፍጥነት (Voice Speed)' : 'Speech Rate / Speed'}</span>
                      </span>
                      <span className="font-mono font-bold text-indigo-600">{audioForm.voiceSpeed || 1.0}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.3"
                      step="0.05"
                      value={audioForm.voiceSpeed || 1.0}
                      onChange={(e) => setAudioForm(prev => ({ ...prev, voiceSpeed: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>{isAmharic ? 'ዝግ ያለ (0.8x)' : 'Slow (0.8x)'}</span>
                      <span>{isAmharic ? 'መደበኛ (1.0x)' : 'Natural (1.0x)'}</span>
                      <span>{isAmharic ? 'ፈጣን (1.3x)' : 'Fast (1.3x)'}</span>
                    </div>
                  </div>

                  {/* Announcement Volume */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isAmharic ? 'የድምፅ መጠን (Announcement Volume)' : 'Announcement Master Volume'}</span>
                      </span>
                      <span className="font-mono font-bold text-indigo-600">{audioForm.volume || 85}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={audioForm.volume || 85}
                      onChange={(e) => setAudioForm(prev => ({ ...prev, volume: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Repeats & Delay Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        {isAmharic ? 'የጥሪ ድግግሞሽ' : 'Repeat Count'}
                      </label>
                      <select
                        value={audioForm.repeatCount || 1}
                        onChange={(e) => setAudioForm(prev => ({ ...prev, repeatCount: parseInt(e.target.value) }))}
                        className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="1">{isAmharic ? 'አንድ ጊዜ (1x)' : '1 Time (1x)'}</option>
                        <option value="2">{isAmharic ? 'ሁለት ጊዜ (2x)' : '2 Times (2x)'}</option>
                      </select>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        {isAmharic ? 'የደወል ቅድመ-ጊዜ' : 'Chime Delay'}
                      </label>
                      <select
                        value={audioForm.announcementDelaySeconds || 1}
                        onChange={(e) => setAudioForm(prev => ({ ...prev, announcementDelaySeconds: parseInt(e.target.value) }))}
                        className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="0">{isAmharic ? 'ወዲያውኑ (0 ሰከንድ)' : 'Instant (0s)'}</option>
                        <option value="1">{isAmharic ? '1 ሰከንድ በኋላ' : '1 Second'}</option>
                        <option value="2">{isAmharic ? '2 ሰከንድ በኋላ' : '2 Seconds'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Save Settings Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveAudioSettings}
                      disabled={isSavingAudio}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingAudio ? (isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...') : (isAmharic ? 'የድምፅ ቅንብሮችን አስቀምጥ' : 'Save Voice Configuration')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 6 Cols: Addis Voice Personas & Live Testing Console */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Addis Voice Persona Selector Cards */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <Headphones className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-900 text-base">
                        {isAmharic ? 'የ Addis Voice ድምፅ ምርጫ (Personas)' : 'Select Addis Voice Persona'}
                      </h3>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                      {audioForm.addisVoice || 'aster'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {isAmharic
                      ? 'ለቢሮዎ ተስማሚ የሆነውን የተፈጥሮ ድምፅ ይምረጡ። እያንዳንዱ ድምፅ ለቢሮ ጥሪ እና ለወረፋ አዋጅ የተዘጋጀ ነው።'
                      : 'Choose an authentic persona calibrated for queue ticket calling and lobby acoustic projection.'}
                  </p>

                  {/* Personas Grid */}
                  <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {(addisVoices.length > 0 ? addisVoices : [
                      { id: 'aster', name: 'Aster', amharicName: 'አስቴር', gender: 'FEMALE', language: 'am', description: 'Natural Front Desk (Default)' },
                      { id: 'abebe', name: 'Abebe', amharicName: 'አበበ', gender: 'MALE', language: 'am', description: 'Clear Professional' },
                      { id: 'selam', name: 'Selam', amharicName: 'ሰላም', gender: 'FEMALE', language: 'am', description: 'Warm Service' },
                      { id: 'dawit', name: 'Dawit', amharicName: 'ዳዊት', gender: 'MALE', language: 'am', description: 'Official Teller' },
                      { id: 'tsehay', name: 'Tsehay', amharicName: 'ፀሐይ', gender: 'FEMALE', language: 'am', description: 'Crisp Announcer' },
                      { id: 'yared', name: 'Yared', amharicName: 'ያሬድ', gender: 'MALE', language: 'am', description: 'Deep Broadcaster' },
                      { id: 'chala', name: 'Chala', amharicName: 'ጫላ', gender: 'MALE', language: 'om', description: 'Afaan Oromo Male' },
                      { id: 'hawi', name: 'Hawi', amharicName: 'ሀዊ', gender: 'FEMALE', language: 'om', description: 'Afaan Oromo Female' }
                    ]).map((voice) => {
                      const isSelected = (audioForm.addisVoice || 'aster').toLowerCase() === voice.id.toLowerCase();
                      return (
                        <div
                          key={voice.id}
                          onClick={() => setAudioForm(prev => ({ ...prev, addisVoice: voice.id }))}
                          className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-1.5 ${
                            isSelected
                              ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-200'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                              <span className="text-xs font-bold text-slate-900">{voice.amharicName || voice.name}</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              voice.gender === 'FEMALE' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {voice.gender === 'FEMALE' ? (isAmharic ? 'ሴት' : 'Female') : (isAmharic ? 'ወንድ' : 'Male')}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {voice.description || `${voice.name} - ${voice.language.toUpperCase()}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Live Addis Voice Announcement Tester */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>{isAmharic ? 'የ Addis Voice የቀጥታ ድምፅ መፈተኛ' : 'Live Voice Announcement Tester'}</span>
                    </div>
                    {isTestingVoice && (
                      <div className="flex gap-1 items-end h-3">
                        <div className="w-1 h-3 bg-indigo-600 rounded-full animate-pulse" />
                        <div className="w-1 h-2 bg-indigo-500 rounded-full animate-pulse" />
                        <div className="w-1 h-4 bg-indigo-600 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>

                  {testVoiceStatusMsg && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                      <Volume2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{testVoiceStatusMsg}</span>
                    </div>
                  )}

                  {/* Preset Test Phrases */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600">
                      {isAmharic ? 'የሙከራ ጥሪ ሐረጎች (Quick Presets)' : 'Quick Announcement Presets:'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'ቁጥር ሀ ሃያ አራት ያላችሁ ደንበኛ ወደ ቆጣሪ ሁለት ይሂዱ።',
                        'ቁጥር ለ አስራ ሁለት ወደ ቆጣሪ አንድ ይሂዱ።',
                        'ቁጥር ሐ አምስት ያላችሁ ደንበኛ ወደ ቆጣሪ አራት ይሂዱ።',
                        'ቁጥር መ ዘጠኝ ወደ ቆጣሪ ሶስት ይሂዱ።'
                      ].map((phrase, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setTestVoiceText(phrase);
                            handleTestAddisVoice(phrase);
                          }}
                          disabled={isTestingVoice}
                          className="text-[11px] px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200 hover:border-indigo-200 text-slate-700 rounded-xl font-medium transition cursor-pointer text-left"
                        >
                          ▶ {phrase.length > 25 ? phrase.slice(0, 25) + '...' : phrase}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Test Phrase Input */}
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      value={testVoiceText}
                      onChange={(e) => setTestVoiceText(e.target.value)}
                      placeholder="የሚጠራውን ጽሑፍ እዚህ ያስገቡ..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 font-medium resize-none"
                    />

                    <button
                      type="button"
                      onClick={() => handleTestAddisVoice()}
                      disabled={isTestingVoice || !testVoiceText.trim()}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <Play className={`w-3.5 h-3.5 fill-current ${isTestingVoice ? 'animate-spin' : ''}`} />
                      <span>{isTestingVoice ? (isAmharic ? 'ድምፅ በመፍጠር ላይ...' : 'Synthesizing & Playing...') : (isAmharic ? 'የ Addis Voice ጥሪ ሞክር (Test Audio)' : 'Test Addis Voice Announcement')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: BACKGROUND MUSIC STUDIO */}
          {audioStudioTab === 'music' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left 6 Cols: Background Music Controls & Music Generator */}
              <div className="lg:col-span-6 space-y-6">
                {/* Master Music Toggle & Volume */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <Music className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-900 text-base">
                        {isAmharic ? 'የቢሮ ዳራ ሙዚቃ መቆጣጠሪያ' : 'Background Music Master Controls'}
                      </h3>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${audioForm.backgroundMusicEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                      {audioForm.backgroundMusicEnabled ? (isAmharic ? 'ሙዚቃ ነቅቷል' : 'Active') : (isAmharic ? 'ሙዚቃ ቆሟል' : 'Disabled')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {isAmharic
                      ? 'በደንበኞች መመልከቻ ስክሪን ላይ የሚጫወት የተረጋጋ የቢሮ ዳራ ሙዚቃ። ሁሉም ሙዚቃዎች በዳታቤዝ ውስጥ ይቀመጣሉ።'
                      : 'Gentle ambient loops for public lobby display screens and waiting areas. All tracks are stored in the database.'}
                  </p>

                  {/* Action Feedback Banner */}
                  {musicActionMessage && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{musicActionMessage}</span>
                    </div>
                  )}

                  {/* Toggle Switch */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {isAmharic ? 'የዳራ ሙዚቃ አጫውት' : 'Enable Background Ambient Music'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isAmharic ? 'በስክሪኑ (Display) ላይ ቀጣይነት ያለው ጸጥ ያለ ሙዚቃ' : 'Continuous gentle soothing audio loops'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={audioForm.backgroundMusicEnabled ?? false}
                        onChange={(e) => handleToggleBackgroundMusic(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Volume Slider */}
                  {audioForm.backgroundMusicEnabled && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                          <Volume2 className="w-4 h-4 text-indigo-600" />
                          <span>{isAmharic ? 'የዳራ ሙዚቃ መጠን' : 'Background Music Volume'}</span>
                        </span>
                        <span className="font-mono font-bold text-indigo-600 text-sm">{audioForm.backgroundMusicVolume || 14}%</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="45"
                        step="1"
                        value={audioForm.backgroundMusicVolume || 14}
                        onChange={(e) => handleUpdateBackgroundVolume(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>{isAmharic ? 'ቀስ ያለ (2%)' : 'Subtle (2%)'}</span>
                        <span>{isAmharic ? 'መካከለኛ (15%)' : 'Comfortable (15%)'}</span>
                        <span>{isAmharic ? 'ከፍተኛ (45%)' : 'Loud (45%)'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI & Procedural Ambient Music Generator */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>{isAmharic ? 'የ AI / የአካባቢ ዳራ ሙዚቃ ማመንጫ' : 'Generate Ambient Music Track'}</span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {isAmharic
                      ? 'ከስር ያሉትን ባህላዊ እና ዘመናዊ የሙዚቃ ምርጫዎች በመጫን ወይም የራስዎን ገለጻ በመጻፍ አዲስ የቢሮ ዳራ ሙዚቃ ያመንጩ።'
                      : 'Select an Ethiopian pentatonic or relaxing acoustic preset, or describe your desired office ambience.'}
                  </p>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Krar Lounge', prompt: 'Addis Krar Pentatonic lounge relaxing gentle acoustic' },
                      { name: 'Tizita Lo-Fi', prompt: 'Ethiopian Tizita Lo-Fi chill subtle peaceful office' },
                      { name: 'Bati Horizon', prompt: 'Ethiopian Bati modal serene slow atmospheric' },
                      { name: 'Masenqo Cafe', prompt: 'Traditional Masenqo coffee cafe gentle acoustic ambient' },
                      { name: 'Corporate Zen', prompt: 'Gentle corporate office waiting room pentatonic chords' }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMusicPrompt(item.prompt);
                          handleGenerateAIMusic(item.prompt);
                        }}
                        disabled={isGeneratingMusic}
                        className="text-[11px] px-2.5 py-1.5 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl font-bold transition truncate cursor-pointer"
                      >
                        + {item.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={musicPrompt}
                      onChange={(e) => setMusicPrompt(e.target.value)}
                      placeholder="Calm relaxing lobby lounge chords..."
                      className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 font-medium"
                    />

                    <button
                      type="button"
                      onClick={() => handleGenerateAIMusic()}
                      disabled={isGeneratingMusic}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingMusic ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingMusic ? (isAmharic ? 'በማመንጨት ላይ...' : 'Generating...') : (isAmharic ? 'ሙዚቃ ፍጠር' : 'Generate')}</span>
                    </button>
                  </div>
                </div>

                {/* Upload Local Audio File */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {isAmharic ? 'ከኮምፒውተር የሙዚቃ ፋይል ጫን' : 'Upload Audio File to Database'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {isAmharic ? 'MP3, WAV ወይም OGG ፋይል ይምረጡ' : 'Supports MP3, WAV, or OGG audio files'}
                    </p>
                  </div>

                  <label className="px-3.5 py-2 bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isUploadingMusic ? (isAmharic ? 'በመጫን ላይ...' : 'Uploading...') : (isAmharic ? 'ፋይል ምረጥ' : 'Choose File')}</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleUploadMusicFile}
                      disabled={isUploadingMusic}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Right 6 Cols: Local Database Track Library */}
              <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Disc className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-base">
                      {isAmharic ? 'የተቀመጡ የዳራ ሙዚቃዎች ዝርዝር' : 'Database Music Library'}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      {audioAssets.filter(a => a.type === 'MUSIC').length} {isAmharic ? 'ሙዚቃዎች' : 'Tracks'}
                    </span>
                    <button
                      type="button"
                      onClick={handleRestoreDefaultTracks}
                      disabled={isRestoringDefaults}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 transition cursor-pointer ml-1"
                    >
                      <RotateCcw className={`w-3 h-3 ${isRestoringDefaults ? 'animate-spin' : ''}`} />
                      <span>{isAmharic ? 'ነባሪዎችን መልስ' : 'Restore Defaults'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {isAmharic
                    ? 'በዳታቤዝ ውስጥ የተቀመጡትን ሙዚቃዎች ቅድመ-ዕይታ (Preview) ያዳምጡ፣ ዋናውን የቢሮ ሙዚቃ ይምረጡ ወይም አላስፈላጊ የሆኑትን ያስወግዱ።'
                    : 'Preview audio tracks, select the active lobby soundtrack, or remove custom uploads.'}
                </p>

                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {audioAssets.filter(a => a.type === 'MUSIC').length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-2">
                      <p>{isAmharic ? 'ምንም የተቀመጠ ሙዚቃ የለም።' : 'No music tracks found in database.'}</p>
                      <button
                        type="button"
                        onClick={handleRestoreDefaultTracks}
                        className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                      >
                        {isAmharic ? 'ነባሪ ሙዚቃዎችን መልስ' : 'Restore Default Tracks'}
                      </button>
                    </div>
                  ) : (
                    audioAssets
                      .filter(a => a.type === 'MUSIC')
                      .map((track) => {
                        const isActive = (audioForm.currentMusicAssetId === track.id) || (!audioForm.currentMusicAssetId && track.id === 'asset-music-1');
                        const isPreviewing = currentlyPreviewingId === track.id;

                        return (
                          <div
                            key={track.id}
                            className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                              isActive
                                ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleTogglePreviewTrack(track)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition cursor-pointer ${
                                  isPreviewing
                                    ? 'bg-indigo-600 text-white animate-pulse'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title={isPreviewing ? 'Stop Preview' : 'Preview Track'}
                              >
                                {isPreviewing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                              </button>

                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {track.title}
                                </p>
                                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mt-0.5">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-medium">
                                    {track.source || 'DATABASE'}
                                  </span>
                                  {track.durationSeconds && (
                                    <span>{Math.round(track.durationSeconds / 60)} min</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              {isActive ? (
                                <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-xl text-[11px] font-bold flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isAmharic ? 'የተመረጠ' : 'Active'}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSelectActiveTrack(track.id)}
                                  className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
                                >
                                  {isAmharic ? 'ምረጥ' : 'Select'}
                                </button>
                              )}

                              {track.source === 'UPLOAD' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTrack(track.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                  title="Delete Track"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: DATABASE (MONGODB ATLAS INTEGRATION) */}
      {activeTab === 'database' && (
        <div className="max-w-4xl bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-xs ${
                dbStatus?.connected ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
              }`}>
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isAmharic ? 'የዳታቤዝ እና የክላውድ ማከማቻ ማዕከል' : 'Database & Storage Engine'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isAmharic ? 'የወረፋ፣ የአገልግሎቶች፣ የቆጣሪዎች እና የተጠቃሚዎች መረጃ በክላውድ እና በአካባቢ ማከማቻ ማስተዳደር' : 'Local resilient persistence with optional MongoDB Atlas cloud synchronization'}
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                dbStatus?.connected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-1.5 ${dbStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
                {dbStatus?.connected 
                  ? (isAmharic ? 'MongoDB Atlas የተገናኘ' : 'MongoDB Atlas Active')
                  : (isAmharic ? 'Local Resilient Storage (ንቁ)' : 'Local Resilient Storage (Active)')}
              </span>
            </div>
          </div>

          {dbActionMsg && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{dbActionMsg}</span>
            </div>
          )}

          {/* Diagnostic Banner if Atlas Authentication or Connection Error */}
          {!dbStatus?.connected && dbStatus?.error && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900">
                    {dbStatus?.errorCode === 'AUTH_FAILED'
                      ? (isAmharic ? 'የ MongoDB Atlas ማረጋገጫ (Authentication) ማስታወሻ' : 'MongoDB Atlas Authentication Notice')
                      : (isAmharic ? 'የ MongoDB Atlas ግንኙነት ማስታወሻ' : 'MongoDB Atlas Connection Notice')}
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    {dbStatus.error}
                  </p>
                  {dbStatus?.diagnosticTip && (
                    <p className="text-[11px] text-amber-900 bg-amber-100/70 p-2 rounded-lg font-mono">
                      💡 {dbStatus.diagnosticTip}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-amber-100 space-y-1">
                <span className="font-bold text-slate-800">
                  {isAmharic ? 'እንዴት ማስተካከል እንደሚቻል፡' : 'Quick Troubleshooting Steps:'}
                </span>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-700">
                  <li>{isAmharic ? 'ወደ MongoDB Atlas በመግባት Database Access -> Users የሚለውን ይመልከቱ።' : 'Open MongoDB Atlas -> Security -> Database Access to verify or reset your database user password.'}</li>
                  <li>{isAmharic ? 'ተጠቃሚው Read and Write to any database ፍቃድ እንዳለው ያረጋግጡ።' : 'Ensure the database user has "Read and write to any database" privileges.'}</li>
                  <li>{isAmharic ? 'በ Network Access ውስጥ 0.0.0.0/0 (Allow access from anywhere) መኖሩን ያረጋግጡ።' : 'In Network Access, make sure IP 0.0.0.0/0 (Allow access from anywhere) is configured.'}</li>
                  <li>{isAmharic ? 'ትክክለኛውን Connection URI ከታች አስገብተው "ከ Atlas ጋር አገናኝ" የሚለውን ይጫኑ።' : 'Paste the updated connection string below and click "Connect / Re-test Atlas".'}</li>
                </ol>
              </div>
            </div>
          )}

          {/* Database Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold block">Target Database</span>
              <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">{dbStatus?.database || 'SmartQ'}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold block">Cluster Host / Target</span>
              <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block truncate">
                {dbStatus?.clusterUri ? dbStatus.clusterUri.replace(/mongodb\+srv:\/\/[^@]+@/, 'mongodb+srv://***@') : (isAmharic ? 'የአካባቢ ማከማቻ (Local Mode)' : 'Local Resilient Storage')}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold block">Active Storage Engine</span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${
                dbStatus?.connected ? 'text-emerald-700' : 'text-indigo-700'
              }`}>
                {dbStatus?.connected ? 'MongoDB Atlas (Cloud)' : 'Local Resilient (Active)'}
              </span>
            </div>
          </div>

          {/* MongoDB Connection Form */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">
                {isAmharic ? 'የ MongoDB Atlas Connection URI ማስተካከያ' : 'MongoDB Atlas Connection String'}
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">mongodb+srv://...</span>
            </div>
            
            <form onSubmit={handleConnectDb} className="space-y-3">
              <input
                type="text"
                value={mongoUriInput}
                onChange={(e) => setMongoUriInput(e.target.value)}
                placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/SmartQ?retryWrites=true&w=majority"
                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-slate-900"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isConnectingDb}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>{isConnectingDb ? (isAmharic ? 'በመገናኘት ላይ...' : 'Connecting...') : (isAmharic ? 'ከ Atlas ጋር አገናኝ' : 'Connect / Re-test Atlas')}</span>
                </button>

                {(dbStatus?.connected || dbStatus?.error) && (
                  <button
                    type="button"
                    onClick={handleDisconnectDb}
                    disabled={isConnectingDb}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-slate-300 cursor-pointer"
                  >
                    <span>{isAmharic ? 'ወደ አካባቢ ማከማቻ ቀይር (Use Local Storage)' : 'Use Local Storage Mode'}</span>
                  </button>
                )}

                {dbStatus?.connected && (
                  <button
                    type="button"
                    onClick={handleSyncDb}
                    disabled={isSyncingDb}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingDb ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDb ? (isAmharic ? 'በማመሳሰል ላይ...' : 'Syncing...') : (isAmharic ? 'ሁሉንም መረጃዎች ወደ Atlas ላክ (Sync Now)' : 'Sync All Collections Now')}</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Sync Information */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-900 font-medium leading-relaxed">
              {isAmharic
                ? 'በዚህ ስርዓት ውስጥ የሚከናወኑ ማናቸውም ቲኬቶች፣ የአገልግሎት ለውጦች እና የቆጣሪ ጥሪዎች በአካባቢ ማከማቻ ውስጥ ያለምንም መቆራረጥ የሚቀመጡ ሲሆን MongoDB Atlas ሲገናኝ ደግሞ በራስ-ሰር ወደ ክላውድ ይተላለፋሉ።'
                : 'All queue tickets, service definitions, counters, staff accounts, audit logs, and audio settings are safely persisted locally with zero downtime and seamlessly replicate to MongoDB Atlas when connected.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB 6: OFFICE SETTINGS */}
      {activeTab === 'office' && (
        <div className="space-y-6">
          {/* Top Feedback Alerts */}
          {officeSaveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{officeSaveSuccess}</span>
            </div>
          )}
          {officeSaveError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{officeSaveError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Office Identity Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {isAmharic ? 'የቢሮ እና የተቋም መለያ ስም' : 'Office & Organization Identity'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {isAmharic ? 'በስክሪኖች፣ በቲኬት ማተሚያዎች እና በሰራተኞች ዴስክ ላይ የሚታይ ይፋዊ ስም' : 'Official title displayed across public TV displays, thermal tickets, and navigation'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Office Presets Pills */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {isAmharic ? 'ፈጣን የአማራጭ ስሞች (One-Click Presets)' : 'Quick Presets (Click to fill)'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { am: 'የኢትዮጵያ አገልግሎት መስጫ ማዕከል', en: 'ETHIOPIA SERVICE CENTER' },
                    { am: 'የኢትዮጵያ ገቢዎች ሚኒስቴር', en: 'MINISTRY OF REVENUES ETHIOPIA' },
                    { am: 'የኢሚግሬሽን እና ዜግነት አገልግሎት', en: 'IMMIGRATION & CITIZENSHIP SERVICE' },
                    { am: 'የቂርቆስ ክፍለ ከተማ አገልግሎት ማዕከል', en: 'KIRKOS SUB-CITY SERVICE CENTER' },
                    { am: 'የቦሌ ክፍለ ከተማ ወሳኝ ኩነት ምዝገባ', en: 'BOLE SUB-CITY VITAL EVENTS' },
                    { am: 'የኢትዮጵያ ንግድ ባንክ - ዋና ቅርንጫፍ', en: 'COMMERCIAL BANK OF ETHIOPIA' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setOfficeForm(prev => ({
                          ...prev,
                          officeNameAmharic: preset.am,
                          officeName: preset.en
                        }));
                        setIsOfficeFormDirty(true);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 transition cursor-pointer"
                    >
                      {isAmharic ? preset.am : preset.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      {isAmharic ? 'የቢሮ ስም (አማርኛ) *' : 'Office Name (Amharic) *'}
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(officeForm.officeNameAmharic || '').length} chars
                    </span>
                  </div>
                  <input
                    id="input-office-name-amharic"
                    type="text"
                    placeholder="ለምሳሌ፡ የቂርቆስ ክፍለ ከተማ አገልግሎት ማዕከል"
                    value={officeForm.officeNameAmharic || ''}
                    onChange={(e) => {
                      setOfficeForm({ ...officeForm, officeNameAmharic: e.target.value });
                      setIsOfficeFormDirty(true);
                    }}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900 shadow-2xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      {isAmharic ? 'የቢሮ ስም (English) *' : 'Office Name (English) *'}
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(officeForm.officeName || '').length} chars
                    </span>
                  </div>
                  <input
                    id="input-office-name-english"
                    type="text"
                    placeholder="e.g. KIRKOS SUB-CITY SERVICE CENTER"
                    value={officeForm.officeName || ''}
                    onChange={(e) => {
                      setOfficeForm({ ...officeForm, officeName: e.target.value });
                      setIsOfficeFormDirty(true);
                    }}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAmharic ? 'በስክሪኑ ግርጌ የሚታይ ማስታወቂያ (አማርኛ ዜና/ማሳሰቢያ)' : 'Bottom Ticker Notice (Amharic)'}
                  </label>
                  <textarea
                    rows={2}
                    value={officeForm.displayNoticeAmharic || ''}
                    onChange={(e) => {
                      setOfficeForm({ ...officeForm, displayNoticeAmharic: e.target.value });
                      setIsOfficeFormDirty(true);
                    }}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900"
                    placeholder="እንኳን ወደ አገልግሎት መስጫ ማዕከላችን በደህና መጡ..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAmharic ? 'በስክሪኑ ግርጌ የሚታይ ማስታወቂያ (English)' : 'Bottom Ticker Notice (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={officeForm.displayNoticeEnglish || ''}
                    onChange={(e) => {
                      setOfficeForm({ ...officeForm, displayNoticeEnglish: e.target.value });
                      setIsOfficeFormDirty(true);
                    }}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900"
                    placeholder="Welcome to our official service center..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAmharic ? 'ለአንድ ሰው የሚገመት የጥበቃ ደቂቃ' : 'Estimated Wait Minutes Per Customer'}
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={officeForm.estimatedWaitPerPersonMinutes || 4}
                      onChange={(e) => {
                        setOfficeForm({ ...officeForm, estimatedWaitPerPersonMinutes: Number(e.target.value) });
                        setIsOfficeFormDirty(true);
                      }}
                      className="w-28 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-900"
                    />
                    <span className="text-xs text-slate-500">
                      {isAmharic ? 'ደቂቃዎች በአንድ ደንበኛ' : 'minutes per queue ticket'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2 border-t border-slate-100">
                <button
                  id="btn-save-office-settings"
                  onClick={handleSaveOfficeSettings}
                  disabled={isSavingOffice}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSavingOffice ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving Office Name...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isAmharic ? 'የቢሮውን ስም እና ቅንብሮች አስቀምጥ' : 'Save Office Name & Settings'}</span>
                    </>
                  )}
                </button>

                {isOfficeFormDirty && (
                  <button
                    type="button"
                    onClick={() => {
                      if (officeSetting) {
                        setOfficeForm(officeSetting);
                        setIsOfficeFormDirty(false);
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {isAmharic ? 'ወደ ነበረበት መልስ' : 'Revert Changes'}
                  </button>
                )}
              </div>
            </div>

            {/* Right: Live Real-Time Previews */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Tv className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'የቀጥታ ስክሪን ቅድመ-እይታ (TV Display)' : 'TV Public Display Preview'}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/60">
                    Live
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shrink-0">
                    Q
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white uppercase tracking-tight truncate">
                      {isAmharic 
                        ? (officeForm.officeNameAmharic || officeForm.officeName || 'የአገልግሎት መስጫ ቢሮ')
                        : (officeForm.officeName || officeForm.officeNameAmharic || 'ABC SERVICE OFFICE')}
                    </p>
                    <p className="text-[10px] text-indigo-400 font-medium truncate mt-0.5">
                      {isAmharic ? 'የቀጥታ የወረፋ መከታተያ ስክሪን • የድምፅ ጥሪ' : 'Live Official Queue Display • Voice Announcements'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar Header Preview */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isAmharic ? 'የሳይድባር ቅድመ-እይታ (Sidebar Header)' : 'Navigation Sidebar Preview'}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {isAmharic 
                        ? (officeForm.officeNameAmharic || officeForm.officeName || 'የኢትዮጵያ አገልግሎት መስጫ ማዕከል')
                        : (officeForm.officeName || officeForm.officeNameAmharic || 'ETHIOPIA SERVICE CENTER')}
                    </p>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">
                        {isAmharic ? 'የወረፋ ስርዓት' : 'Smart Queue'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Printed Thermal Ticket Preview */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-700 font-bold border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isAmharic ? 'የማተሚያ ቲኬት ቅድመ-እይታ (80mm Thermal Ticket)' : '80mm Thermal Ticket Print Preview'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl text-center font-mono space-y-2">
                  <div className="border-b border-dashed border-slate-400 pb-2">
                    <p className="text-xs font-black uppercase text-slate-900">
                      {officeForm.officeNameAmharic || officeForm.officeName || 'ETHIOPIA SERVICE CENTER'}
                    </p>
                    <p className="text-[10px] text-slate-600 uppercase">
                      {officeForm.officeName || officeForm.officeNameAmharic || 'ETHIOPIA SERVICE CENTER'}
                    </p>
                  </div>
                  <div className="py-1">
                    <p className="text-[9px] text-slate-500 uppercase font-bold">QUEUE TICKET / የወረፋ ቲኬት</p>
                    <p className="text-2xl font-black text-slate-900 tracking-wider">A-001</p>
                  </div>
                  <div className="border-t border-dashed border-slate-400 pt-2 text-[9px] text-slate-500">
                    <p>{isAmharic ? 'እናመሰግናለን! • በሰላም ይቆዩ' : 'Thank you for your patience'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                  setIsServiceModalOpen(false);
                  setServiceModalError('');
                }}
                disabled={isSavingService}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                {isAmharic ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="button"
                id="btn-save-service"
                onClick={handleSaveService}
                disabled={isSavingService}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5"
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
      )}

      {/* Counter Modal */}
      {isCounterModalOpen && editingCounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900">
              {editingCounter.id ? (isAmharic ? 'ቆጣሪ አስተካክል' : 'Edit Counter') : (isAmharic ? 'አዲስ ቆጣሪ ጨምር' : 'Add Counter')}
            </h3>

            {counterModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{counterModalError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isAmharic ? 'የቆጣሪ ቁጥር' : 'Counter Number'}
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
                {isAmharic ? 'የቆጣሪ ስም (English)' : 'Counter Name (English)'}
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
                  setIsCounterModalOpen(false);
                  setCounterModalError('');
                }}
                disabled={isSavingCounter}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                {isAmharic ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="button"
                id="btn-save-counter"
                onClick={handleSaveCounter}
                disabled={isSavingCounter}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5"
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
      )}

      {/* User Modal */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900">
              {editingUser.id ? (isAmharic ? 'የሰራተኛ መረጃ አስተካክል' : 'Edit Staff User') : (isAmharic ? 'አዲስ ሰራተኛ ጨምር' : 'Add Staff User')}
            </h3>

            {userModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{userModalError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isAmharic ? 'ሙሉ ስም' : 'Full Name'}
              </label>
              <input
                type="text"
                placeholder="Abebe Kebede"
                value={editingUser.name || ''}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isAmharic ? 'የተጠቃሚ ስም (Username)' : 'Username'}
              </label>
              <input
                type="text"
                placeholder="abebe1"
                value={editingUser.username || ''}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isAmharic ? 'የይለፍ ቃል (Password)' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showUserPassword ? 'text' : 'password'}
                  placeholder={editingUser.id ? (isAmharic ? 'ሳይቀየር እንዲቆይ ባዶ ይተዉ (ወይም አዲስ ይፃፉ)' : 'Leave blank to keep password or type new') : 'At least 6 chars'}
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full p-2.5 pr-9 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowUserPassword(!showUserPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {editingUser.id 
                  ? (isAmharic ? 'የይለፍ ቃል ለመቀየር ቢያንስ 6 ፊደላት ይፃፉ' : 'Enter 6+ characters to change password') 
                  : (isAmharic ? 'ቢያንስ 6 ፊደላት መሆን አለበት' : 'Must be at least 6 characters')}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isAmharic ? 'የስራ ሃላፊነት / ሚና' : 'Role'}
              </label>
              <select
                value={editingUser.role || 'SERVICE_OFFICER'}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="ADMIN">ADMIN (አስተዳዳሪ)</option>
                <option value="RECEPTIONIST">RECEPTIONIST (አስተናጋጅ / ኪዮስክ)</option>
                <option value="SERVICE_OFFICER">SERVICE_OFFICER (ቆጣሪ ሰራተኛ)</option>
              </select>
            </div>

            {editingUser.role === 'SERVICE_OFFICER' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {isAmharic ? 'የተመደበ ቆጣሪ (የስራ ጣቢያ ገደብ)' : 'Assigned Counter (Station Lock)'}
                </label>
                <select
                  value={editingUser.assignedCounterId || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, assignedCounterId: e.target.value || undefined })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">{isAmharic ? '-- የተመደበ ቆጣሪ የለም (Unassigned) --' : '-- No Counter Assigned --'}</option>
                  {counters.map(c => (
                    <option key={c.id} value={c.id}>
                      {isAmharic ? `ቆጣሪ 0${c.number} (${c.nameAmharic || c.name})` : `Counter 0${c.number} (${c.name})`}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isAmharic ? 'ይህ ሰራተኛ በቆጣሪ ጣቢያው ላይ በዚህ ቆጣሪ ብቻ እንዲጠቀም ይገደባል።' : 'Limits this officer to only call and serve tickets at this specific counter.'}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsUserModalOpen(false);
                  setUserModalError('');
                }}
                disabled={isSavingUser}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                {isAmharic ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="button"
                id="btn-save-user"
                onClick={handleSaveUser}
                disabled={isSavingUser}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5"
              >
                {isSavingUser ? (
                  <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...'}</span>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'አስቀምጥ' : 'Save Staff'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK RENAME OFFICE MODAL */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isAmharic ? 'የቢሮ ስም መቀየሪያ' : 'Rename Office / Organization'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAmharic ? 'በስክሪኑ እና በቲኬቶች ላይ የሚታየውን ስም ይለውጡ' : 'Update the official name shown across screens, kiosks, and tickets.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renameModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{renameModalError}</span>
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {isAmharic ? 'ፈጣን የአማራጭ ስሞች' : 'Quick Presets'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { am: 'የኢትዮጵያ አገልግሎት መስጫ ማዕከል', en: 'ETHIOPIA SERVICE CENTER' },
                  { am: 'የኢትዮጵያ ገቢዎች ሚኒስቴር', en: 'MINISTRY OF REVENUES ETHIOPIA' },
                  { am: 'የኢሚግሬሽን እና ዜግነት አገልግሎት', en: 'IMMIGRATION & CITIZENSHIP SERVICE' },
                  { am: 'የቂርቆስ ክፍለ ከተማ አገልግሎት ማዕከል', en: 'KIRKOS SUB-CITY SERVICE CENTER' },
                  { am: 'የቦሌ ክፍለ ከተማ ወሳኝ ኩነት ምዝገባ', en: 'BOLE SUB-CITY VITAL EVENTS' }
                ].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRenameAmharic(p.am);
                      setRenameEnglish(p.en);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 transition"
                  >
                    {isAmharic ? p.am : p.en}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAmharic ? 'የቢሮ ስም (አማርኛ) *' : 'Office Name (Amharic) *'}
                </label>
                <input
                  id="modal-input-office-name-amharic"
                  type="text"
                  value={renameAmharic}
                  onChange={(e) => setRenameAmharic(e.target.value)}
                  placeholder="ለምሳሌ፡ የቂርቆስ ክፍለ ከተማ አገልግሎት ማዕከል"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAmharic ? 'የቢሮ ስም (English) *' : 'Office Name (English) *'}
                </label>
                <input
                  id="modal-input-office-name-english"
                  type="text"
                  value={renameEnglish}
                  onChange={(e) => setRenameEnglish(e.target.value)}
                  placeholder="e.g. KIRKOS SUB-CITY SERVICE CENTER"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Live Preview Inside Modal */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-white flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0 text-xs">
                HQ
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {isAmharic 
                    ? (renameAmharic || renameEnglish || 'የቢሮ ስም') 
                    : (renameEnglish || renameAmharic || 'OFFICE NAME')}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isAmharic ? 'በስክሪን እና በቲኬት ላይ እንዲህ ይታያል' : 'Preview on public displays & tickets'}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                disabled={isSavingRenameModal}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                {isAmharic ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="button"
                id="btn-save-rename-modal"
                onClick={handleSaveQuickRename}
                disabled={isSavingRenameModal}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                {isSavingRenameModal ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'ስሙን ቀይር እና አስቀምጥ' : 'Apply & Save Name'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
