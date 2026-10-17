import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.get('/', authenticate, (req, res, next) => notificationController.getNotifications(req as any, res, next));
router.get('/unread-count', authenticate, (req, res, next) => notificationController.getUnreadCount(req as any, res, next));
router.patch('/:id/read', authenticate, (req, res, next) => notificationController.markAsRead(req as any, res, next));
router.patch('/read-all', authenticate, (req, res, next) => notificationController.markAllAsRead(req as any, res, next));
router.get('/settings', authenticate, (req, res, next) => notificationController.getSettings(req as any, res, next));
router.patch('/settings', authenticate, (req, res, next) => notificationController.updateSettings(req as any, res, next));

export default router;
