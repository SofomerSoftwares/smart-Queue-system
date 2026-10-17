import { db } from '../../db.js';
import { broadcaster } from '../../sockets/broadcaster.js';
import { NotFoundError } from '../../errors/AppError.js';
import { NotificationSettings } from '../../../shared/types/index.js';

export class NotificationService {
  public getNotifications(options: { filter?: string; limit?: number; offset?: number; role?: string }) {
    return db.getNotifications({
      filter: options.filter || 'ALL',
      limit: options.limit || 30,
      offset: options.offset || 0,
      role: options.role
    });
  }

  public getUnreadCount(): number {
    return db.getUnreadNotificationCount();
  }

  public markAsRead(id: string) {
    const notification = db.markNotificationAsRead(id);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    const unreadCount = db.getUnreadNotificationCount();

    // Broadcast read update so all connected receptionists sync badge immediately
    broadcaster.broadcast('notification:read', {
      id: notification.id,
      unreadCount
    });

    return { notification, unreadCount };
  }

  public markAllAsRead() {
    const count = db.markAllNotificationsAsRead();
    const unreadCount = db.getUnreadNotificationCount();

    broadcaster.broadcast('notification:read', {
      all: true,
      count,
      unreadCount
    });

    return { count, unreadCount };
  }

  public getSettings(): NotificationSettings {
    return db.getNotificationSettings();
  }

  public updateSettings(updates: Partial<NotificationSettings>): NotificationSettings {
    const settings = db.updateNotificationSettings(updates);
    broadcaster.broadcast('notification:settings_updated', { settings });
    return settings;
  }
}

export const notificationService = new NotificationService();
