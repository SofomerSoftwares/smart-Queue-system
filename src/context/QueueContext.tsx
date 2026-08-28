import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  QueueTicket, 
  PriorityLevel,
  Counter, 
  Service, 
  OfficeSetting, 
  AudioSetting, 
  QueueStats, 
  AnnouncementPayload, 
  PrintTicketData
} from '../types';
import { api } from '../lib/api';
import { audioManager } from '../lib/audioManager';
import { notificationManager, NotificationPermissionState } from '../lib/notificationManager';

interface QueueContextType {
  waitingTickets: QueueTicket[];
  servingTickets: QueueTicket[];
  completedTickets: QueueTicket[];
  counters: Counter[];
  services: Service[];
  officeSetting: OfficeSetting | null;
  audioSetting: AudioSetting | null;
  stats: QueueStats | null;
  isLoading: boolean;
  lastAnnouncement: AnnouncementPayload | null;
  uiLanguage: 'AMHARIC' | 'ENGLISH';
  setUiLanguage: (lang: 'AMHARIC' | 'ENGLISH') => void;
  isAudioUnlocked: boolean;
  unlockAudio: () => void;
  notificationPermission: NotificationPermissionState;
  isNotificationsEnabled: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  toggleNotifications: (enabled?: boolean) => void;
  sendTestNotification: () => void;
  callNextTicket: (counterId: string, specificTicketId?: string) => Promise<{ success: boolean; ticket?: QueueTicket | null; message?: string }>;
  recallTicket: (ticketId: string) => Promise<void>;
  startService: (ticketId: string) => Promise<void>;
  completeTicket: (ticketId: string) => Promise<void>;
  markNoShow: (ticketId: string) => Promise<void>;
  transferTicket: (ticketId: string, targetServiceId: string) => Promise<void>;
  cancelTicket: (ticketId: string) => Promise<void>;
  createTicket: (
    serviceId: string, 
    priority?: PriorityLevel, 
    urgencyReason?: string, 
    notes?: string
  ) => Promise<{ ticket: QueueTicket; printData: PrintTicketData }>;
  updateTicketPriority: (
    ticketId: string, 
    priority: PriorityLevel, 
    urgencyReason?: string, 
    notes?: string
  ) => Promise<{ success: boolean; ticket: QueueTicket; message: string }>;
  checkInTicket: (ticketNumber: string) => Promise<{ success: boolean; message: string; ticket: QueueTicket }>;
  updateOfficeSettingAction: (updates: Partial<OfficeSetting>) => Promise<OfficeSetting>;
  resetDailyQueue: () => Promise<void>;
  refreshQueue: () => Promise<void>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [waitingTickets, setWaitingTickets] = useState<QueueTicket[]>([]);
  const [servingTickets, setServingTickets] = useState<QueueTicket[]>([]);
  const [completedTickets, setCompletedTickets] = useState<QueueTicket[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [officeSetting, setOfficeSetting] = useState<OfficeSetting | null>(null);
  const [audioSetting, setAudioSetting] = useState<AudioSetting | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastAnnouncement, setLastAnnouncement] = useState<AnnouncementPayload | null>(null);
  const [uiLanguage, setUiLanguage] = useState<'AMHARIC' | 'ENGLISH'>('AMHARIC');
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(() => notificationManager.getPermission());
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<boolean>(() => notificationManager.isEnabled());

  const audioUnlockedRef = useRef<boolean>(false);
  const audioSettingRef = useRef<AudioSetting | null>(null);
  audioSettingRef.current = audioSetting;

  const notificationsEnabledRef = useRef<boolean>(isNotificationsEnabled);
  notificationsEnabledRef.current = isNotificationsEnabled;

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    const granted = await notificationManager.requestPermission();
    setNotificationPermission(notificationManager.getPermission());
    setIsNotificationsEnabled(granted);
    return granted;
  }, []);

  const toggleNotifications = useCallback((enabled?: boolean) => {
    const nextState = typeof enabled === 'boolean' ? enabled : !isNotificationsEnabled;
    notificationManager.setEnabled(nextState);
    setIsNotificationsEnabled(nextState);
    if (nextState && notificationPermission !== 'granted') {
      requestNotificationPermission();
    }
  }, [isNotificationsEnabled, notificationPermission, requestNotificationPermission]);

  const sendTestNotification = useCallback(() => {
    notificationManager.sendTestNotification(uiLanguage === 'AMHARIC');
  }, [uiLanguage]);

  const refreshQueue = useCallback(async () => {
    try {
      const res = await api.getQueueStatus();

      if (res.success) {
        setWaitingTickets(res.waitingTickets || []);
        setServingTickets(res.servingTickets || []);
        setCompletedTickets(res.completedTickets || []);
        setCounters(res.counters || []);
        setServices(res.services || []);
        setOfficeSetting(res.officeSetting);
        setAudioSetting(res.audioSetting);
        setStats(res.stats);
      }
    } catch (err) {
      console.warn('Error fetching queue status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unlockAudio = useCallback(async () => {
    setIsAudioUnlocked(true);
    audioUnlockedRef.current = true;
    await audioManager.unlock();
    await audioManager.playChime();
  }, []);

  // Global user interaction listener to seamlessly unlock browser audio context
  useEffect(() => {
    const handleUserGesture = () => {
      if (!audioUnlockedRef.current) {
        audioUnlockedRef.current = true;
        setIsAudioUnlocked(true);
        audioManager.unlock().catch(() => {});
      }
    };

    window.addEventListener('click', handleUserGesture, { passive: true });
    window.addEventListener('touchstart', handleUserGesture, { passive: true });
    window.addEventListener('keydown', handleUserGesture, { passive: true });

    return () => {
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('touchstart', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
    };
  }, []);

  // Initial load and periodic safety sync
  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, 5000);
    return () => clearInterval(interval);
  }, [refreshQueue]);

  // Connect SSE for real-time events
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/events');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'queue:updated' || payload.type === 'ticket:called' || payload.type === 'counter:updated') {
            refreshQueue();
          }

          if (payload.type === 'settings:updated' && payload.data?.officeSetting) {
            setOfficeSetting(payload.data.officeSetting);
          }

          if (payload.type === 'announcement:play') {
            const announcement: AnnouncementPayload = payload.data;
            setLastAnnouncement(announcement);

            // Play voice announcement
            const textToSpeak = announcement.language === 'ENGLISH' 
              ? announcement.textEnglish 
              : announcement.language === 'BOTH'
                ? `${announcement.textAmharic} ${announcement.textEnglish}`
                : announcement.textAmharic;

            const repeatCount = audioSettingRef.current?.repeatCount || 1;
            const delaySec = audioSettingRef.current?.announcementDelaySeconds || 0;
            const volume = audioSettingRef.current?.volume || 85;

            audioManager.playAnnouncement(
              textToSpeak,
              announcement.audioBase64,
              announcement.audioMimeType || 'audio/mp3',
              volume,
              announcement.phoneticText,
              repeatCount,
              delaySec
            ).catch(err => {
              console.warn('Playback error:', err);
            });

            // Trigger Browser Push Notification if enabled
            if (notificationsEnabledRef.current) {
              notificationManager.notifyTicketCalled({
                ticketNumber: announcement.ticketNumber,
                counterNumber: announcement.counterNumber,
                language: announcement.language
              });
            }
          }
        } catch (e) {
          console.warn('SSE parsing error:', e);
        }
      };

      eventSource.onerror = () => {
        // SSE will auto-reconnect
      };
    } catch (err) {
      console.warn('SSE setup error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [refreshQueue]);

  // Queue Operations
  const callNextTicket = async (counterId: string, specificTicketId?: string) => {
    const res = await api.callNextTicket({ counterId, specificTicketId });
    await refreshQueue();
    if (res?.success && res.ticket && notificationsEnabledRef.current) {
      notificationManager.notifyTicketCalled({
        ticketNumber: res.ticket.ticketNumber,
        counterNumber: res.counter?.number || res.ticket.counterNumber || 1,
        serviceName: res.ticket.serviceName,
        serviceNameAmharic: res.ticket.serviceNameAmharic,
        language: uiLanguage === 'AMHARIC' ? 'AMHARIC' : 'BOTH'
      });
    }
    return res;
  };

  const recallTicket = async (ticketId: string) => {
    const res = await api.recallTicket(ticketId);
    await refreshQueue();
    if (res?.success && res.ticket && notificationsEnabledRef.current) {
      notificationManager.notifyTicketCalled({
        ticketNumber: res.ticket.ticketNumber,
        counterNumber: res.ticket.counterNumber || 1,
        serviceName: res.ticket.serviceName,
        serviceNameAmharic: res.ticket.serviceNameAmharic,
        language: uiLanguage === 'AMHARIC' ? 'AMHARIC' : 'BOTH'
      });
    }
    return res;
  };

  const startService = async (ticketId: string) => {
    await api.startTicketService(ticketId);
    await refreshQueue();
  };

  const completeTicket = async (ticketId: string) => {
    await api.completeTicket(ticketId);
    await refreshQueue();
  };

  const markNoShow = async (ticketId: string) => {
    await api.noShowTicket(ticketId);
    await refreshQueue();
  };

  const transferTicket = async (ticketId: string, targetServiceId: string) => {
    await api.transferTicket(ticketId, targetServiceId);
    await refreshQueue();
  };

  const cancelTicket = async (ticketId: string) => {
    await api.cancelTicket(ticketId);
    await refreshQueue();
  };

  const createTicket = async (
    serviceId: string, 
    priority?: PriorityLevel, 
    urgencyReason?: string, 
    notes?: string
  ) => {
    const res = await api.createTicket({ serviceId, priority, urgencyReason, notes });
    await refreshQueue();
    return { ticket: res.ticket, printData: res.printData };
  };

  const updateTicketPriority = async (
    ticketId: string, 
    priority: PriorityLevel, 
    urgencyReason?: string, 
    notes?: string
  ) => {
    const res = await api.updateTicketPriority(ticketId, { priority, urgencyReason, notes });
    await refreshQueue();
    return res;
  };

  const checkInTicket = async (ticketNumber: string) => {
    const res = await api.checkInTicket(ticketNumber);
    await refreshQueue();
    return res;
  };

  const updateOfficeSettingAction = async (updates: Partial<OfficeSetting>): Promise<OfficeSetting> => {
    const res = await api.updateOfficeSettings(updates);
    if (res && res.success && res.setting) {
      setOfficeSetting(res.setting);
      return res.setting;
    }
    throw new Error('Failed to update office settings');
  };

  const resetDailyQueue = async () => {
    await api.resetDailyQueue();
    await refreshQueue();
  };

  return (
    <QueueContext.Provider
      value={{
        waitingTickets,
        servingTickets,
        completedTickets,
        counters,
        services,
        officeSetting,
        audioSetting,
        stats,
        isLoading,
        lastAnnouncement,
        uiLanguage,
        setUiLanguage,
        isAudioUnlocked,
        unlockAudio,
        notificationPermission,
        isNotificationsEnabled,
        requestNotificationPermission,
        toggleNotifications,
        sendTestNotification,
        callNextTicket,
        recallTicket,
        startService,
        completeTicket,
        markNoShow,
        transferTicket,
        cancelTicket,
        createTicket,
        updateTicketPriority,
        checkInTicket,
        updateOfficeSettingAction,
        resetDailyQueue,
        refreshQueue
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}
