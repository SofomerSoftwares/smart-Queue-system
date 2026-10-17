import { Response, NextFunction } from 'express';
import { notificationService } from './notification.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

export class NotificationController {
  public getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { filter, limit, offset } = req.query;
      const result = notificationService.getNotifications({
        filter: filter ? String(filter) : 'ALL',
        limit: limit ? parseInt(String(limit), 10) : 30,
        offset: offset ? parseInt(String(offset), 10) : 0,
        role: req.user?.role
      });

      return res.json({
        success: true,
        ...result,
        serverTime: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  public getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const unreadCount = notificationService.getUnreadCount();
      return res.json({
        success: true,
        unreadCount,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  public markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = notificationService.markAsRead(id);
      return res.json({
        success: true,
        notification: result.notification,
        unreadCount: result.unreadCount
      });
    } catch (err) {
      next(err);
    }
  }

  public markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = notificationService.markAllAsRead();
      return res.json({
        success: true,
        message: `Marked ${result.count} notifications as read.`,
        updatedCount: result.count,
        unreadCount: result.unreadCount
      });
    } catch (err) {
      next(err);
    }
  }

  public getSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = notificationService.getSettings();
      return res.json({
        success: true,
        settings
      });
    } catch (err) {
      next(err);
    }
  }

  public updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = notificationService.updateSettings(req.body);
      return res.json({
        success: true,
        message: 'Notification preferences updated successfully.',
        settings
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
