import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { broadcaster } from '../websocket.js';

const router = Router();

// 1. GET /api/notifications - List notifications with filters & pagination
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filter, limit, offset } = req.query;

    const result = db.getNotifications({
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
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch notifications' });
  }
});

// 2. GET /api/notifications/unread-count - Fast unread badge counter
router.get('/unread-count', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const unreadCount = db.getUnreadNotificationCount();
    return res.json({
      success: true,
      unreadCount,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to get unread count' });
  }
});

// 3. PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notification = db.markNotificationAsRead(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = db.getUnreadNotificationCount();

    // Broadcast read update so all connected receptionists sync badge immediately
    broadcaster.broadcast('notification:read', {
      id: notification.id,
      unreadCount
    });

    return res.json({
      success: true,
      notification,
      unreadCount
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to mark notification as read' });
  }
});

// 4. PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = db.markAllNotificationsAsRead();
    const unreadCount = db.getUnreadNotificationCount();

    broadcaster.broadcast('notification:read', {
      all: true,
      count,
      unreadCount
    });

    return res.json({
      success: true,
      message: `Marked ${count} notifications as read.`,
      updatedCount: count,
      unreadCount
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to mark all as read' });
  }
});

// 5. GET /api/notifications/settings - Retrieve current notification preferences
router.get('/settings', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = db.getNotificationSettings();
    return res.json({
      success: true,
      settings
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to get notification settings' });
  }
});

// 6. PATCH /api/notifications/settings - Update notification preferences
router.patch('/settings', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updates = req.body;
    const settings = db.updateNotificationSettings(updates);

    broadcaster.broadcast('notification:settings_updated', { settings });

    return res.json({
      success: true,
      message: 'Notification preferences updated successfully.',
      settings
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to update notification settings' });
  }
});

export default router;
