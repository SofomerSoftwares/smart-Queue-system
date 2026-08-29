import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  Volume2, 
  Users, 
  Layers, 
  Tv, 
  FileText, 
  CheckCircle2, 
  Database, 
  Building2, 
  Sliders
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { audioManager } from '../lib/audioManager';
import { 
  Service, 
  Counter, 
  User, 
  AudioSetting, 
  OfficeSetting, 
  AuditLog, 
  AddisVoiceOption, 
  Role, 
  RoleName, 
  PriorityPolicy, 
  PermissionDefinition 
} from '../types';
import { PRESET_VIDEOS } from './DisplayVideoPlayer';
import { videoStorage, StoredVideo, formatBytes } from '../lib/videoStorage';
import { CounterManagementView } from './CounterManagementView';

// Subcomponents
import { AdminGate } from './admin/AdminGate';
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { AdminServicesTab } from './admin/AdminServicesTab';
import { AdminStaffTab } from './admin/AdminStaffTab';
import { AdminRolesTab } from './admin/AdminRolesTab';
import { AdminAudioTab } from './admin/AdminAudioTab';
import { AdminDatabaseTab } from './admin/AdminDatabaseTab';
import { AdminOfficeTab } from './admin/AdminOfficeTab';
import { AdminAuditTab } from './admin/AdminAuditTab';

// Modals
import { ServiceModal } from './admin/ServiceModal';
import { CounterModal } from './admin/CounterModal';
import { UserModal } from './admin/UserModal';
import { RoleModal } from './admin/RoleModal';
import { RenameFacilityModal } from './admin/RenameFacilityModal';

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

  const { user, login, demoLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'counters' | 'staff' | 'roles' | 'audio' | 'database' | 'office' | 'audit'>('overview');

  const isAmharic = uiLanguage === 'AMHARIC';

  // Admin Gate Form State
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('Admin@123');
  const [adminGateError, setAdminGateError] = useState<string>('');
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState<boolean>(false);

  // State for Users & Audit
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Role Management & Priority Policy State
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [permissionsList, setPermissionsList] = useState<PermissionDefinition[]>([]);
  const [priorityPolicy, setPriorityPolicy] = useState<PriorityPolicy>({
    requireReasonForUrgent: true,
    allowOfficerTriage: true,
    allowReceptionTriage: true,
    autoAuditPriorityChanges: true
  });
  const [isSavingPolicy, setIsSavingPolicy] = useState<boolean>(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRolePerms, setSelectedRolePerms] = useState<string[]>([]);
  const [isSavingRolePerms, setIsSavingRolePerms] = useState<boolean>(false);
  const [roleModalError, setRoleModalError] = useState<string>('');

  // Addis AI Voice Options & DB Status
  const [addisVoices, setAddisVoices] = useState<AddisVoiceOption[]>([
    { id: 'aster', name: 'Aster (Natural Amharic)', nameAmharic: 'አስቴር (የተረጋጋ የሴት ድምፅ)', gender: 'FEMALE', description: 'Crisp, calm female Amharic voice', descriptionAmharic: 'ለአዳራሽ እና ለመስኮት ጥሪዎች የተዘጋጀ የሴት ድምፅ' },
    { id: 'abebe', name: 'Abebe (Clear Amharic)', nameAmharic: 'አበበ (ግልፅ የወንድ ድምፅ)', gender: 'MALE', description: 'Deep and clear male Amharic voice', descriptionAmharic: 'ግልፅ እና ጎላ ያለ ይፋዊ የወንድ ድምፅ' },
    { id: 'selam', name: 'Selam (Expressive Amharic)', nameAmharic: 'ሰላም (ደማቅ የሴት ድምፅ)', gender: 'FEMALE', description: 'Warm and welcoming female voice', descriptionAmharic: 'ሞቅ ያለ እና እንግዳ ተቀባይ የሴት ድምፅ' },
    { id: 'dawit', name: 'Dawit (Official Amharic)', nameAmharic: 'ዳዊት (ይፋዊ የወንድ ድምፅ)', gender: 'MALE', description: 'Authoritative and formal male voice', descriptionAmharic: 'ለመንግስት እና ለባንክ ተቋማት የሚመጥን የወንድ ድምፅ' }
  ]);
  const [selectedAddisVoice, setSelectedAddisVoice] = useState<string>('aster');
  const [selectedTtsProvider, setSelectedTtsProvider] = useState<'ADDIS_AI'>('ADDIS_AI');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);

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

  // Audio Testing State
  const [testVoiceText, setTestVoiceText] = useState<string>('ቲኬት ቁጥር ኤ-001 እባክዎ ወደ መስኮት 1 ይቅረቡ።');
  const [testLanguage, setTestLanguage] = useState<'AMHARIC' | 'ENGLISH'>('AMHARIC');
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [testVoiceStatus, setTestVoiceStatus] = useState<string>('');
  const [testVoiceDiagnostic, setTestVoiceDiagnostic] = useState<{ source?: string; latency?: number; message?: string } | null>(null);

  // Office & Audio Settings Form
  const [officeForm, setOfficeForm] = useState<Partial<OfficeSetting>>({});
  const [isOfficeFormDirty, setIsOfficeFormDirty] = useState<boolean>(false);
  const [audioForm, setAudioForm] = useState<Partial<AudioSetting>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [isSavingAudio, setIsSavingAudio] = useState<boolean>(false);
  const [audioSaveSuccess, setAudioSaveSuccess] = useState<string>('');
  const [audioSaveError, setAudioSaveError] = useState<string>('');
  const [isSavingOffice, setIsSavingOffice] = useState<boolean>(false);
  const [officeSaveSuccess, setOfficeSaveSuccess] = useState<string>('');
  const [officeSaveError, setOfficeSaveError] = useState<string>('');

  // Quick Rename Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [renameAmharic, setRenameAmharic] = useState<string>('');
  const [renameEnglish, setRenameEnglish] = useState<string>('');
  const [isSavingRenameModal, setIsSavingRenameModal] = useState<boolean>(false);
  const [renameModalError, setRenameModalError] = useState<string>('');

  // Local Video Storage in Admin
  const [adminStoredVideos, setAdminStoredVideos] = useState<StoredVideo[]>([]);
  const [isAdminUploadingVideo, setIsAdminUploadingVideo] = useState<boolean>(false);
  const [adminVideoStorageMsg, setAdminVideoStorageMsg] = useState<string>('');
  const [adminStorageUsage, setAdminStorageUsage] = useState<{ count: number; totalBytes: number; formattedSize: string }>({
    count: 0,
    totalBytes: 0,
    formattedSize: '0 B'
  });

  const refreshAdminStoredVideos = async () => {
    try {
      const list = videoStorage.getStoredVideos();
      setAdminStoredVideos(list);
      const usage = await videoStorage.getStorageUsage();
      setAdminStorageUsage(usage);
    } catch (err) {
      console.warn('Error loading admin stored videos:', err);
    }
  };

  useEffect(() => {
    refreshAdminStoredVideos();
  }, []);

  const handleAdminVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAdminUploadingVideo(true);
      setAdminVideoStorageMsg(isAmharic ? 'ቪዲዮ ወደ Local Storage በመጫን ላይ...' : 'Uploading video to local storage...');
      
      const stored = await videoStorage.storeLocalVideoFile(file, {
        title: file.name.replace(/\.[^/.]+$/, ''),
        titleAmharic: file.name.replace(/\.[^/.]+$/, ''),
        description: `Admin uploaded (${file.type || 'video/mp4'})`
      });

      const { playbackUrl } = await videoStorage.getStoredVideoById(stored.id, true);
      if (playbackUrl) {
        setOfficeForm({
          ...officeForm,
          displayVideoUrl: playbackUrl,
          displayVideoTitle: stored.title,
          displayVideoTitleAmharic: stored.titleAmharic
        });
        setIsOfficeFormDirty(true);
      }

      setAdminVideoStorageMsg(isAmharic ? 'ቪዲዮ በተሳካ ሁኔታ በ Local Storage ተቀምጧል!' : 'Video stored to local storage successfully!');
      await refreshAdminStoredVideos();
      setTimeout(() => setAdminVideoStorageMsg(''), 3000);
    } catch (err: any) {
      setAdminVideoStorageMsg('Upload failed: ' + (err?.message || ''));
    } finally {
      setIsAdminUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleAdminSelectStoredVideo = async (video: StoredVideo) => {
    try {
      videoStorage.setActiveVideoId(video.id);
      const { playbackUrl } = await videoStorage.getStoredVideoById(video.id, true);
      if (playbackUrl) {
        setOfficeForm({
          ...officeForm,
          displayVideoUrl: playbackUrl,
          displayVideoTitle: video.title,
          displayVideoTitleAmharic: video.titleAmharic || video.title
        });
        setIsOfficeFormDirty(true);
        await refreshAdminStoredVideos();
      }
    } catch (err) {
      console.error('Error selecting stored video in admin:', err);
    }
  };

  const handleAdminDeleteStoredVideo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(isAmharic ? 'ይህን ቪዲዮ ከ Local Storage መሰረዝ ይፈልጋሉ?' : 'Delete this video from Local Storage?')) {
      await videoStorage.deleteStoredVideo(id);
      await refreshAdminStoredVideos();
    }
  };

  useEffect(() => {
    if (officeSetting) {
      if (!isOfficeFormDirty) {
        setOfficeForm(officeSetting);
      }
      setRenameAmharic(officeSetting.officeNameAmharic || '');
      setRenameEnglish(officeSetting.officeName || '');
    }
    if (audioSetting) {
      setAudioForm(audioSetting);
      setSelectedAddisVoice(audioSetting.addisVoice || 'aster');
      setSelectedTtsProvider(audioSetting.ttsProvider || 'ADDIS_AI');
      setVoiceSpeed(audioSetting.addisAiSpeed || 1.0);
    }
  }, [officeSetting, audioSetting, isOfficeFormDirty]);

  const loadAdminData = async () => {
    try {
      const [uRes, aRes, vRes, dbRes, rRes] = await Promise.all([
        api.getUsers().catch(() => ({ success: false, users: [] })),
        api.getAuditLogs().catch(() => ({ success: false, logs: [] })),
        api.getAddisVoices().catch(() => ({ success: false, voices: [] })),
        api.getDatabaseStatus().catch(() => ({ success: false })),
        api.getRoles().catch(() => ({ success: false, roles: [], permissions: [], priorityPolicy: null }))
      ]);

      if (uRes.success) setUsersList(uRes.users);
      if (aRes.success) setAuditLogs(aRes.logs);
      if (vRes.success && vRes.voices?.length > 0) setAddisVoices(vRes.voices);
      if (dbRes.success) setDbStatus(dbRes);
      if (rRes.success) {
        if (rRes.roles) setRolesList(rRes.roles);
        if (rRes.permissions) setPermissionsList(rRes.permissions);
        if (rRes.priorityPolicy) setPriorityPolicy(rRes.priorityPolicy);
      }
    } catch (err) {
      console.warn('Error loading admin data:', err);
    }
  };

  // Toggle role-level priority management permission
  const handleToggleRolePriority = async (roleName: RoleName, currentEnabled: boolean) => {
    try {
      const res = await api.toggleRolePriority(roleName, !currentEnabled);
      if (res.success) {
        setRolesList(prev => prev.map(r => r.name === roleName ? res.role : r));
        setSaveSuccessMsg(
          isAmharic 
            ? `የ ${roleName} የቅድሚያ አስተዳደር ፈቃድ ተቀይሯል!` 
            : `Priority management for ${roleName} updated!`
        );
        setTimeout(() => setSaveSuccessMsg(''), 3000);
        loadAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update role priority access');
    }
  };

  // Save global priority policy
  const handleSavePriorityPolicy = async () => {
    try {
      setIsSavingPolicy(true);
      const res = await api.updatePriorityPolicy(priorityPolicy);
      if (res.success) {
        setPriorityPolicy(res.policy);
        if (res.roles) setRolesList(res.roles);
        setSaveSuccessMsg(
          isAmharic 
            ? 'የቢሮው የቅድሚያ አሰራር ፖሊሲ በተሳካ ሁኔታ ተቀምጧል!' 
            : 'Office priority triage policy saved successfully!'
        );
        setTimeout(() => setSaveSuccessMsg(''), 3500);
        loadAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save priority policy');
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // Open role permissions modal
  const handleOpenRoleModal = (role: Role) => {
    setEditingRole(role);
    setSelectedRolePerms([...role.permissions]);
    setRoleModalError('');
    setIsRoleModalOpen(true);
  };

  // Save updated permissions for a role
  const handleSaveRolePermissions = async () => {
    if (!editingRole) return;
    try {
      setIsSavingRolePerms(true);
      setRoleModalError('');
      const res = await api.updateRolePermissions(editingRole.name, selectedRolePerms);
      if (res.success) {
        setRolesList(prev => prev.map(r => r.name === editingRole.name ? res.role : r));
        setIsRoleModalOpen(false);
        setEditingRole(null);
        setSaveSuccessMsg(
          isAmharic 
            ? `የ ${editingRole.name} ፈቃዶች በተሳካ ሁኔታ ተሻሽለዋል!` 
            : `Role permissions for ${editingRole.name} updated successfully!`
        );
        setTimeout(() => setSaveSuccessMsg(''), 3500);
        loadAdminData();
      }
    } catch (err: any) {
      setRoleModalError(err.message || 'Failed to update role permissions');
    } finally {
      setIsSavingRolePerms(false);
    }
  };

  // Toggle user-level priority management access override
  const handleToggleUserPriority = async (userId: string, currentVal: boolean | undefined) => {
    try {
      const nextVal = currentVal === true ? false : true;
      const res = await api.updateUserPriorityAccess(userId, nextVal);
      if (res.success) {
        setUsersList(prev => prev.map(u => u.id === userId ? res.user : u));
        setSaveSuccessMsg(
          isAmharic 
            ? 'የሰራተኛው የቅድሚያ መብት ተሻሽሏል!' 
            : 'Staff priority access updated!'
        );
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user priority');
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  // Voice Test Handler (Addis AI Voice on backend)
  const handleTestVoice = async (customVoiceId?: string) => {
    try {
      setIsTestingVoice(true);
      setTestVoiceDiagnostic(null);
      await audioManager.unlock();
      const voiceToUse = customVoiceId || selectedAddisVoice;

      setTestVoiceStatus(isAmharic ? 'በአዲስ AI (Addis AI) ድምፅ በማመንጨት ላይ...' : 'Synthesizing with Addis AI Voice...');
      const startTime = Date.now();

      const res = await api.testVoice({
        text: testVoiceText,
        language: testLanguage,
        provider: 'ADDIS_AI',
        voice: voiceToUse,
        speed: voiceSpeed
      });

      const totalLatency = Date.now() - startTime;

      if (res.success && res.audioResult) {
        setTestVoiceDiagnostic({
          source: res.audioResult.source || 'ADDIS_AI_API',
          latency: res.audioResult.latencyMs || totalLatency,
          message: res.audioResult.diagnostic
        });

        setTestVoiceStatus(isAmharic ? 'ድምፅ እየተጫወተ ነው...' : 'Playing Addis AI voice announcement...');
        await audioManager.playAnnouncement(
          testVoiceText,
          res.audioResult?.audioBase64,
          res.audioResult?.mimeType || 'audio/mp3',
          audioForm.volume || 85,
          res.audioResult?.phoneticText
        );
        setTestVoiceStatus(isAmharic ? 'ድምፅ ተጠናቅቋል' : 'Voice playback finished');
        setTimeout(() => setTestVoiceStatus(''), 3000);
      } else {
        setTestVoiceStatus(isAmharic ? 'ድምፅ ተፈትኗል' : 'Voice synthesis complete');
        setTimeout(() => setTestVoiceStatus(''), 3000);
      }
    } catch (err: any) {
      setTestVoiceStatus('');
      setAudioSaveError(`Voice test error: ${err.message}`);
    } finally {
      setIsTestingVoice(false);
    }
  };

  // Save Audio Settings
  const handleSaveAudioSettings = async () => {
    try {
      setIsSavingAudio(true);
      setAudioSaveError('');
      setAudioSaveSuccess('');

      const payload: Partial<AudioSetting> = {
        ...audioForm,
        ttsProvider: 'ADDIS_AI',
        addisVoice: selectedAddisVoice,
        addisAiSpeed: Number(voiceSpeed) || 1.0,
        addisAiEndpoint: (audioForm.addisAiEndpoint || '').trim() || 'https://api.addis.ai/v1/tts',
        addisAiApiKey: (audioForm.addisAiApiKey || '').trim(),
        language: audioForm.language || 'AMHARIC',
        voiceEnabled: audioForm.voiceEnabled ?? true,
        volume: Number(audioForm.volume) || 85,
        repeatCount: Number(audioForm.repeatCount) || 1,
        announcementDelaySeconds: Number(audioForm.announcementDelaySeconds) || 0
      };

      const res = await api.updateAudioSettings(payload);
      if (res.success && res.settings) {
        setAudioForm(res.settings);
        setSelectedAddisVoice(res.settings.addisVoice || 'aster');
        setSelectedTtsProvider('ADDIS_AI');
        setVoiceSpeed(res.settings.addisAiSpeed || 1.0);
      }

      const msg = isAmharic 
        ? 'የአዲስ AI ድምፅ ቅንብሮች በ MongoDB ዳታቤዝ ውስጥ በተሳካ ሁኔታ ተቀምጠዋል!' 
        : 'Addis AI Voice Announcement Configuration saved to MongoDB successfully!';
      setAudioSaveSuccess(msg);
      setSaveSuccessMsg(msg);
      setTimeout(() => {
        setAudioSaveSuccess('');
        setSaveSuccessMsg('');
      }, 4000);
      await refreshQueue();
      loadAdminData();
    } catch (err: any) {
      console.error('Error saving audio settings:', err);
      const errMsg = err.message || (isAmharic ? 'የድምፅ ቅንብሮችን ማስቀመጥ አልተቻለም። እባክዎ እንደ አስተዳዳሪ መግባትዎን ያረጋግጡ።' : 'Failed to save Addis AI voice settings. Please check admin authorization.');
      setAudioSaveError(errMsg);
    } finally {
      setIsSavingAudio(false);
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
      setCounterModalError(isAmharic ? 'እባክዎ ትክክለኛ የመስኮት ቁጥር ያስገቡ' : 'Please enter a valid counter number');
      return;
    }

    try {
      setIsSavingCounter(true);
      const payload = {
        ...editingCounter,
        number: num,
        name: editingCounter.name?.trim() || `Counter ${num}`,
        nameAmharic: editingCounter.nameAmharic?.trim() || `መስኮት ${num}`
      };

      if (editingCounter.id) {
        await api.updateCounter(editingCounter.id, payload);
        setSaveSuccessMsg(isAmharic ? 'መስኮቱ በተሳካ ሁኔታ ተሻሽሏል!' : 'Counter updated successfully!');
      } else {
        await api.createCounter(payload);
        setSaveSuccessMsg(isAmharic ? 'አዲስ መስኮት በተሳካ ሁኔታ ተፈጥሯል!' : 'New counter created successfully!');
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
            : (isAmharic ? 'ከዳታቤዙ ጋር መገናኘት አልተቻለም፡ ' + (res.error || 'Check credentials') : 'Failed to connect: ' + (res.error || 'Check credentials'))
        );
        setTimeout(() => setDbActionMsg(''), 5000);
      }
    } catch (err: any) {
      setDbActionMsg(`Error: ${err.message}`);
    } finally {
      setIsConnectingDb(false);
    }
  };

  // Disconnect MongoDB Atlas and revert to local mode
  const handleDisconnectDb = async () => {
    try {
      setIsConnectingDb(true);
      setDbActionMsg(isAmharic ? 'ወደ አካባቢያዊ ዳታቤዝ (Local Mode) በመመለስ ላይ...' : 'Switching to local storage mode...');
      const res = await api.connectDatabase('disconnect');
      if (res.success) {
        setDbStatus(res);
        setMongoUriInput('');
        setDbActionMsg(isAmharic ? 'ስርዓቱ በአካባቢያዊ ዳታቤዝ (Local Resilient Mode) እየሰራ ነው።' : 'Switched to local resilient storage mode.');
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
      <AdminGate
        isAmharic={isAmharic}
        adminUsername={adminUsername}
        setAdminUsername={setAdminUsername}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        adminGateError={adminGateError}
        isLoggingInAdmin={isLoggingInAdmin}
        handleAdminGateLogin={handleAdminGateLogin}
        onQuickDemoLogin={() => demoLogin('ADMIN')}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {isAmharic ? 'የስርዓት አስተዳደር ማዕከል' : 'System Administration & Control'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAmharic 
                ? `${officeSetting?.officeNameAmharic || 'የኢትዮጵያ አገልግሎት ማዕከል'} • ሙሉ የአገልግሎት፣ ሰራተኛ እና የድምፅ ቁጥጥር`
                : `${officeSetting?.officeName || 'Ethiopia Service Center'} • Service catalog, staff, counter displays & audio settings`}
            </p>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Modern Horizontal Navigation Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-thin">
        {[
          { id: 'overview', label: isAmharic ? 'አጠቃላይ እይታ' : 'Overview', icon: Tv },
          { id: 'services', label: isAmharic ? 'አገልግሎቶች' : 'Services', icon: Layers },
          { id: 'counters', label: isAmharic ? 'የመስኮት አስተዳደር' : 'Counter Stations', icon: Tv },
          { id: 'staff', label: isAmharic ? 'ሰራተኞች' : 'Staff Users', icon: Users },
          { id: 'roles', label: isAmharic ? 'ሚና እና ፈቃድ' : 'Roles & Access', icon: Sliders },
          { id: 'audio', label: isAmharic ? 'የአዲስ AI ድምፅ' : 'Addis AI Voice', icon: Volume2 },
          { id: 'database', label: isAmharic ? 'ዳታቤዝ (Atlas)' : 'Database & Atlas', icon: Database },
          { id: 'office', label: isAmharic ? 'የቢሮ መለያ' : 'Office Identity', icon: Building2 },
          { id: 'audit', label: isAmharic ? 'የእንቅስቃሴ መዝገብ' : 'Audit Logs', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT SECTIONS */}
      {activeTab === 'overview' && (
        <AdminOverviewTab
          stats={stats}
          servicesCount={services.length}
          countersCount={counters.length}
          staffCount={usersList.length}
          officeSetting={officeSetting}
          audioSetting={audioSetting}
          dbStatus={dbStatus}
          onResetDailyQueue={resetDailyQueue}
          onQuickRenameClick={() => setIsRenameModalOpen(true)}
          isAmharic={isAmharic}
        />
      )}

      {activeTab === 'services' && (
        <AdminServicesTab
          services={services}
          onAddService={() => {
            setEditingService({ name: '', nameAmharic: '', prefix: 'S', estimatedDurationMinutes: 5, color: '#4f46e5' });
            setServiceModalError('');
            setIsServiceModalOpen(true);
          }}
          onEditService={(service) => {
            setEditingService(service);
            setServiceModalError('');
            setIsServiceModalOpen(true);
          }}
          onDeleteService={async (id) => {
            if (confirm(isAmharic ? 'ይህን አገልግሎት መሰረዝ ይፈልጋሉ?' : 'Delete this service?')) {
              try {
                await api.deleteService(id);
                refreshQueue();
              } catch (err: any) {
                alert(err.message || 'Failed to delete service');
              }
            }
          }}
          isAmharic={isAmharic}
        />
      )}

      {activeTab === 'counters' && (
        <CounterManagementView />
      )}

      {activeTab === 'staff' && (
        <AdminStaffTab
          users={usersList}
          counters={counters}
          onAddUser={() => {
            setEditingUser({ name: '', username: '', password: '', role: 'SERVICE_OFFICER' });
            setUserModalError('');
            setShowUserPassword(false);
            setIsUserModalOpen(true);
          }}
          onEditUser={(u) => {
            setEditingUser({ ...u, password: '' });
            setUserModalError('');
            setShowUserPassword(false);
            setIsUserModalOpen(true);
          }}
          onDeleteUser={async (id) => {
            if (confirm(isAmharic ? 'ይህን ሰራተኛ መሰረዝ ይፈልጋሉ?' : 'Delete this user?')) {
              try {
                await api.deleteUser(id);
                loadAdminData();
              } catch (err: any) {
                alert(err.message || 'Failed to delete user');
              }
            }
          }}
          onToggleUserPriority={handleToggleUserPriority}
          isAmharic={isAmharic}
        />
      )}

      {activeTab === 'roles' && (
        <AdminRolesTab
          rolesList={rolesList}
          permissionsList={permissionsList}
          priorityPolicy={priorityPolicy}
          setPriorityPolicy={setPriorityPolicy}
          isSavingPolicy={isSavingPolicy}
          onSavePriorityPolicy={handleSavePriorityPolicy}
          onToggleRolePriority={handleToggleRolePriority}
          onOpenRoleModal={handleOpenRoleModal}
          isAmharic={isAmharic}
        />
      )}

      {activeTab === 'audio' && (
        <AdminAudioTab
          audioForm={audioForm}
          setAudioForm={setAudioForm}
          addisVoices={addisVoices}
          selectedAddisVoice={selectedAddisVoice}
          setSelectedAddisVoice={setSelectedAddisVoice}
          voiceSpeed={voiceSpeed}
          setVoiceSpeed={setVoiceSpeed}
          testVoiceText={testVoiceText}
          setTestVoiceText={setTestVoiceText}
          testLanguage={testLanguage}
          setTestLanguage={setTestLanguage}
          isTestingVoice={isTestingVoice}
          testVoiceStatus={testVoiceStatus}
          testVoiceDiagnostic={testVoiceDiagnostic}
          onTestVoice={handleTestVoice}
          isSavingAudio={isSavingAudio}
          audioSaveSuccess={audioSaveSuccess}
          audioSaveError={audioSaveError}
          onSaveAudioSettings={handleSaveAudioSettings}
          isAmharic={isAmharic}
        />
      )}

      {activeTab === 'database' && (
        <AdminDatabaseTab
          dbStatus={dbStatus}
          dbActionMsg={dbActionMsg}
          mongoUriInput={mongoUriInput}
          setMongoUriInput={setMongoUriInput}
          isConnectingDb={isConnectingDb}
          isSyncingDb={isSyncingDb}
          onConnectDb={handleConnectDb}
          onDisconnectDb={handleDisconnectDb}
          onSyncDb={handleSyncDb}
          isAmharic={isAmharic}
        />
      )}

      {activeTab === 'office' && (
        <AdminOfficeTab
          officeForm={officeForm}
          setOfficeForm={setOfficeForm}
          officeSetting={officeSetting}
          isOfficeFormDirty={isOfficeFormDirty}
          setIsOfficeFormDirty={setIsOfficeFormDirty}
          officeSaveSuccess={officeSaveSuccess}
          officeSaveError={officeSaveError}
          isSavingOffice={isSavingOffice}
          onSaveOfficeSettings={handleSaveOfficeSettings}
          adminStorageUsage={adminStorageUsage}
          isAdminUploadingVideo={isAdminUploadingVideo}
          onAdminVideoUpload={handleAdminVideoUpload}
          adminVideoStorageMsg={adminVideoStorageMsg}
          adminStoredVideos={adminStoredVideos}
          onAdminSelectStoredVideo={handleAdminSelectStoredVideo}
          onAdminDeleteStoredVideo={handleAdminDeleteStoredVideo}
          formatBytes={formatBytes}
          presetVideos={PRESET_VIDEOS}
          isAmharic={isAmharic}
        />
      )}

      {activeTab === 'audit' && (
        <AdminAuditTab
          auditLogs={auditLogs}
          isAmharic={isAmharic}
        />
      )}

      {/* Modals */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        editingService={editingService}
        setEditingService={setEditingService}
        serviceModalError={serviceModalError}
        setServiceModalError={setServiceModalError}
        isSavingService={isSavingService}
        onSaveService={handleSaveService}
        onClose={() => setIsServiceModalOpen(false)}
        isAmharic={isAmharic}
      />

      <CounterModal
        isOpen={isCounterModalOpen}
        editingCounter={editingCounter}
        setEditingCounter={setEditingCounter}
        counterModalError={counterModalError}
        setCounterModalError={setCounterModalError}
        isSavingCounter={isSavingCounter}
        onSaveCounter={handleSaveCounter}
        onClose={() => setIsCounterModalOpen(false)}
        isAmharic={isAmharic}
      />

      <UserModal
        isOpen={isUserModalOpen}
        editingUser={editingUser}
        setEditingUser={setEditingUser}
        userModalError={userModalError}
        setUserModalError={setUserModalError}
        showUserPassword={showUserPassword}
        setShowUserPassword={setShowUserPassword}
        counters={counters}
        isSavingUser={isSavingUser}
        onSaveUser={handleSaveUser}
        onClose={() => setIsUserModalOpen(false)}
        isAmharic={isAmharic}
      />

      <RoleModal
        isOpen={isRoleModalOpen}
        editingRole={editingRole}
        selectedRolePerms={selectedRolePerms}
        setSelectedRolePerms={setSelectedRolePerms}
        permissionsList={permissionsList}
        roleModalError={roleModalError}
        isSavingRolePerms={isSavingRolePerms}
        onSaveRolePermissions={handleSaveRolePermissions}
        onClose={() => setIsRoleModalOpen(false)}
        isAmharic={isAmharic}
      />

      <RenameFacilityModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        renameAmharic={renameAmharic}
        setRenameAmharic={setRenameAmharic}
        renameEnglish={renameEnglish}
        setRenameEnglish={setRenameEnglish}
        renameModalError={renameModalError}
        isSavingRenameModal={isSavingRenameModal}
        onSaveQuickRename={handleSaveQuickRename}
        isAmharic={isAmharic}
      />
    </div>
  );
};
