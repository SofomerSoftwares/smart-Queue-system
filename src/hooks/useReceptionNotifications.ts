import { useState, useEffect, useCallback, useRef } from 'react';
import { ReceptionNotification, NotificationSettings, NotificationEventType } from '../types';
import { api } from '../lib/api';
import { notificationManager, NotificationPermissionState } from '../lib/notificationManager';

export type NotificationFilter = 'ALL' | 'UNREAD' | 'CALLS' | 'COMPLETED' | 'SYSTEM';

const DEFAULT_LOCAL_SETTINGS: NotificationSettings = {
  inAppEnabled: true,
  desktopEnabled: false,
  soundEnabled: true,
  eventTypes: {
    TICKET_CALLED: true,
    TICKET_RECALLED: true,
    TICKET_COMPLETED: true,
    TICKET_SKIPPED: true,
    TICKET_HOLD: true,
    TICKET_RESUMED: true,
    TICKET_TRANSFERRED: true,
    COUNTER_OFFLINE: true,
    COUNTER_ONLINE: true,
    COUNTER_BREAK: true,
    COUNTER_AVAILABLE: true
  }
};

export function useReceptionNotifications(activeFilter: NotificationFilter = 'ALL') {
  const [notifications, setNotifications] = useState<ReceptionNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_LOCAL_SETTINGS);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermissionState>(() => notificationManager.getPermission());
  
  // Track recently processed notification IDs to guarantee effectively-once handling
  const seenIdsRef = useRef<Set<string>>(new Set());
  const settingsRef = useRef<NotificationSettings>(settings);
  settingsRef.current = settings;
  const activeFilterRef = useRef<NotificationFilter>(activeFilter);
  activeFilterRef.current = activeFilter;

  // Load settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.getNotificationSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      // Fallback to local
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (filterToUse?: NotificationFilter) => {
    try {
      const targetFilter = filterToUse || activeFilterRef.current;
      const res = await api.getNotifications(targetFilter, 50, 0);
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
        setTotalCount(res.total || 0);
        
        // Populate seen IDs to prevent duplicate alerts for historical records
        res.notifications.forEach(n => seenIdsRef.current.add(n.id));
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update permission state
  useEffect(() => {
    setDesktopPermission(notificationManager.getPermission());
  }, []);

  // Initial load
  useEffect(() => {
    fetchSettings();
    fetchNotifications(activeFilter);
  }, [fetchSettings, fetchNotifications, activeFilter]);

  // Request desktop notification permission
  const requestDesktopPermission = useCallback(async (): Promise<'granted' | 'denied' | 'unsupported'> => {
    const granted = await notificationManager.requestPermission();
    const perm = notificationManager.getPermission();
    setDesktopPermission(perm);
    if (granted) {
      // Auto-enable desktop notifications in settings
      const newSettings = { ...settingsRef.current, desktopEnabled: true };
      setSettings(newSettings);
      api.updateNotificationSettings({ desktopEnabled: true }).catch(() => {});
      return 'granted';
    }
    return perm === 'denied' ? 'denied' : 'unsupported';
  }, []);

  // Toggle or update settings
  const updateSettings = useCallback(async (updates: Partial<NotificationSettings>) => {
    const nextSettings = {
      ...settingsRef.current,
      ...updates,
      eventTypes: {
        ...settingsRef.current.eventTypes,
        ...(updates.eventTypes || {})
      }
    };
    setSettings(nextSettings);
    try {
      await api.updateNotificationSettings(nextSettings);
    } catch (err) {
      console.warn('Error saving notification settings:', err);
    }
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const res = await api.markNotificationAsRead(id);
      if (res.success && res.unreadCount !== undefined) {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.warn('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);

    try {
      const res = await api.markAllNotificationsAsRead();
      if (res.success && res.unreadCount !== undefined) {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.warn('Error marking all notifications as read:', err);
    }
  }, []);

  // Real-time EventSource (SSE) integration for reception notifications
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          setConnectionStatus('connected');
          // Synchronize missed notifications after reconnection
          fetchNotifications(activeFilterRef.current);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle incoming real-time reception notifications
            if (data.type === 'reception:notification' || data.type === 'notification:created') {
              const notif: ReceptionNotification = data.data;
              if (!notif || !notif.id) return;

              // Deduplicate
              if (seenIdsRef.current.has(notif.id)) {
                return;
              }
              seenIdsRef.current.add(notif.id);

              // Check if notification type is enabled in settings
              const currentPrefs = settingsRef.current;
              const isTypeAllowed = currentPrefs.eventTypes[notif.type] !== false;

              if (currentPrefs.inAppEnabled && isTypeAllowed) {
                // Update notifications list
                setNotifications(prev => {
                  const filter = activeFilterRef.current;
                  let shouldInclude = true;
                  if (filter === 'UNREAD') shouldInclude = true;
                  else if (filter === 'CALLS') shouldInclude = notif.type === 'TICKET_CALLED' || notif.type === 'TICKET_RECALLED';
                  else if (filter === 'COMPLETED') shouldInclude = notif.type === 'TICKET_COMPLETED' || notif.type === 'TICKET_SKIPPED' || notif.type === 'TICKET_HOLD' || notif.type === 'TICKET_RESUMED' || notif.type === 'TICKET_TRANSFERRED';
                  else if (filter === 'SYSTEM') shouldInclude = notif.type.startsWith('COUNTER_');

                  if (shouldInclude) {
                    return [notif, ...prev.filter(item => item.id !== notif.id)];
                  }
                  return prev;
                });

                setUnreadCount(prev => prev + 1);
                setTotalCount(prev => prev + 1);
              }

              // Play sound alert if enabled
              const shouldPlaySound = currentPrefs.soundEnabled && isTypeAllowed;

              // Display Desktop Browser Notification if enabled and permitted
              if (currentPrefs.desktopEnabled && isTypeAllowed) {
                notificationManager.notifyReceptionEvent({
                  id: notif.id,
                  type: notif.type,
                  title: notif.title,
                  message: notif.message,
                  ticketNumber: notif.ticketNumber,
                  counterName: notif.counterName,
                  serviceName: notif.serviceName,
                  playSound: shouldPlaySound
                });
              } else if (shouldPlaySound) {
                notificationManager.playAlertChime();
              }
            }

            // Sync read status
            if (data.type === 'notification:read') {
              if (data.data?.all) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
              } else if (data.data?.id) {
                setNotifications(prev => prev.map(n => n.id === data.data.id ? { ...n, isRead: true } : n));
                if (data.data.unreadCount !== undefined) {
                  setUnreadCount(data.data.unreadCount);
                }
              }
            }

            // Sync settings update
            if (data.type === 'notification:settings_updated' && data.data?.settings) {
              setSettings(data.data.settings);
            }
          } catch (e) {
            console.warn('Error handling SSE message in useReceptionNotifications:', e);
          }
        };

        eventSource.onerror = () => {
          setConnectionStatus('reconnecting');
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Retry after 3 seconds
          reconnectTimeout = setTimeout(setupSSE, 3000);
        };
      } catch (err) {
        setConnectionStatus('disconnected');
        reconnectTimeout = setTimeout(setupSSE, 4000);
      }
    };

    setupSSE();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, []);

  return {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    settings,
    connectionStatus,
    desktopPermission,
    requestDesktopPermission,
    updateSettings,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };
}
