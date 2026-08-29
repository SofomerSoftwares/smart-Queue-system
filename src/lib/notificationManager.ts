/**
 * Browser Notification Manager
 * Handles Web Notifications API permissions, lifecycle, sound chime, and ticket call alerts.
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

class NotificationManager {
  private isNotificationSupported: boolean;
  private audioContext: AudioContext | null = null;
  private lastNotifiedMap: Map<string, number> = new Map();

  constructor() {
    this.isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Check if browser supports HTML5 Notifications
   */
  public isSupported(): boolean {
    return this.isNotificationSupported;
  }

  /**
   * Get current permission state
   */
  public getPermission(): NotificationPermissionState {
    if (!this.isNotificationSupported) return 'unsupported';
    return Notification.permission as NotificationPermissionState;
  }

  /**
   * Check if notifications are enabled and permission is granted
   */
  public isEnabled(): boolean {
    if (!this.isNotificationSupported) return false;
    const storedPref = localStorage.getItem('app_browser_notifications_enabled');
    // If permission is already granted and not explicitly disabled, return true
    if (Notification.permission === 'granted') {
      return storedPref !== 'false';
    }
    return false;
  }

  /**
   * Enable or disable browser notification preference in localStorage
   */
  public setEnabled(enabled: boolean): void {
    localStorage.setItem('app_browser_notifications_enabled', enabled ? 'true' : 'false');
  }

  /**
   * Request permission from user
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isNotificationSupported) {
      console.warn('Browser notifications are not supported on this device/browser.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const isGranted = permission === 'granted';
      this.setEnabled(isGranted);
      return isGranted;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return false;
    }
  }

  /**
   * Play an audible chime for notification alerts (via Web Audio API)
   */
  public playAlertChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext || this.audioContext.state === 'suspended') {
        this.audioContext = new AudioCtx();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // First pleasant high chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Second harmonic chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);

      // Trigger mobile vibration if available
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }

  /**
   * Display a browser notification when a ticket is called
   */
  public notifyTicketCalled(params: {
    ticketNumber: string;
    counterNumber: number | string;
    serviceName?: string;
    serviceNameAmharic?: string;
    language?: 'AMHARIC' | 'ENGLISH' | 'BOTH';
    customBody?: string;
  }): Notification | null {
    if (!this.isNotificationSupported || Notification.permission !== 'granted') {
      return null;
    }

    const {
      ticketNumber,
      counterNumber,
      serviceName,
      serviceNameAmharic,
      language = 'AMHARIC',
      customBody
    } = params;

    // Deduplicate within 4 seconds for the same ticket call
    const now = Date.now();
    const lastTime = this.lastNotifiedMap.get(ticketNumber) || 0;
    if (now - lastTime < 4000) {
      return null;
    }
    this.lastNotifiedMap.set(ticketNumber, now);

    const counterStr = counterNumber.toString();
    const isAmharic = language === 'AMHARIC';
    const isBilingual = language === 'BOTH';

    let title = `📢 Ticket ${ticketNumber} Called! (Counter ${counterStr})`;
    let body = `Please proceed to Counter ${counterStr}${serviceName ? ` for ${serviceName}` : ''}.`;

    if (isAmharic) {
      title = `📢 ቲኬት ቁጥር ${ticketNumber} ተጠርቷል! (መስኮት ${counterStr})`;
      body = `እባክዎ ወደ መስኮት ${counterStr}${serviceNameAmharic || serviceName ? ` ለ${serviceNameAmharic || serviceName}` : ''} ይሂዱ።`;
    } else if (isBilingual) {
      title = `📢 Ticket ${ticketNumber} / ቲኬት ${ticketNumber}`;
      body = `ወደ መስኮት ${counterStr} ይሂዱ | Proceed to Counter ${counterStr}${serviceName ? ` (${serviceName})` : ''}.`;
    }

    if (customBody) {
      body = customBody;
    }

    try {
      // Sound chime
      this.playAlertChime();

      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `ticket-${ticketNumber}-${Date.now()}`,
        requireInteraction: true,
        silent: false
      });

      notification.onclick = (e) => {
        e.preventDefault();
        window.focus();
        notification.close();
      };

      // Auto close after 12 seconds
      setTimeout(() => {
        try {
          notification.close();
        } catch {}
      }, 12000);

      return notification;
    } catch (err) {
      console.warn('Failed to display browser notification:', err);
      return null;
    }
  }

  /**
   * Send a test browser notification
   */
  public sendTestNotification(isAmharic = false): Notification | null {
    if (!this.isNotificationSupported || Notification.permission !== 'granted') {
      return null;
    }

    const title = isAmharic 
      ? '🔔 የሙከራ የወረፋ ማሳወቂያ (Test Notification)' 
      : '🔔 Test Queue Notification';
    const body = isAmharic
      ? 'የወረፋ ጥሪ ማሳወቂያ በትክክል እየሰራ ነው። ተራዎ ሲደርስ እዚህ መልእክት ይደርስዎታል።'
      : 'Ticket call browser notifications are active! You will receive an instant alert when your ticket is called.';

    this.playAlertChime();

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `test-notification-${Date.now()}`,
        requireInteraction: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (e) {
      console.warn('Failed to send test notification:', e);
      return null;
    }
  }
}

export const notificationManager = new NotificationManager();
