import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  QueueTicket, 
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
  callNextTicket: (counterId: string, specificTicketId?: string) => Promise<{ success: boolean; ticket?: QueueTicket | null; message?: string }>;
  recallTicket: (ticketId: string) => Promise<void>;
  startService: (ticketId: string) => Promise<void>;
  completeTicket: (ticketId: string) => Promise<void>;
  markNoShow: (ticketId: string) => Promise<void>;
  transferTicket: (ticketId: string, targetServiceId: string) => Promise<void>;
  cancelTicket: (ticketId: string) => Promise<void>;
  createTicket: (serviceId: string, priority?: 'NORMAL' | 'PRIORITY') => Promise<{ ticket: QueueTicket; printData: PrintTicketData }>;
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

  const audioUnlockedRef = useRef<boolean>(false);
  const audioSettingRef = useRef<AudioSetting | null>(null);
  audioSettingRef.current = audioSetting;

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

  const unlockAudio = useCallback(() => {
    setIsAudioUnlocked(true);
    audioUnlockedRef.current = true;
    audioManager.playChime();
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

            // Play voice announcement if audio is unlocked
            if (audioUnlockedRef.current) {
              const textToSpeak = announcement.language === 'ENGLISH' 
                ? announcement.textEnglish 
                : announcement.textAmharic;

              audioManager.playAnnouncement(
                textToSpeak,
                announcement.audioBase64,
                announcement.audioMimeType || 'audio/wav',
                audioSettingRef.current?.volume || 85,
                announcement.phoneticText
              );
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
    return res;
  };

  const recallTicket = async (ticketId: string) => {
    await api.recallTicket(ticketId);
    await refreshQueue();
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

  const createTicket = async (serviceId: string, priority?: 'NORMAL' | 'PRIORITY') => {
    const res = await api.createTicket({ serviceId, priority });
    await refreshQueue();
    return { ticket: res.ticket, printData: res.printData };
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
        callNextTicket,
        recallTicket,
        startService,
        completeTicket,
        markNoShow,
        transferTicket,
        cancelTicket,
        createTicket,
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
