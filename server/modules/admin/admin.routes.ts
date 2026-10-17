import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate, authorize, requireAdmin } from '../../middleware/auth.js';

const router = Router();

// Users
router.get('/users', authenticate, requireAdmin, (req, res, next) => adminController.getUsers(req, res, next));
router.post('/users', authenticate, requireAdmin, (req, res, next) => adminController.createUser(req as any, res, next));
router.put('/users/:id', authenticate, requireAdmin, (req, res, next) => adminController.updateUser(req as any, res, next));
router.delete('/users/:id', authenticate, requireAdmin, (req, res, next) => adminController.deleteUser(req as any, res, next));
router.patch('/users/:id/priority-access', authenticate, requireAdmin, (req, res, next) => adminController.setUserPriorityAccess(req as any, res, next));

// Priority Policy
router.get('/priority-policy', authenticate, (req, res, next) => adminController.getPriorityPolicy(req, res, next));
router.put('/priority-policy', authenticate, requireAdmin, (req, res, next) => adminController.updatePriorityPolicy(req as any, res, next));

// Roles & Permissions
router.get('/roles', authenticate, (req, res, next) => adminController.getRoles(req, res, next));
router.get('/permissions', authenticate, (req, res, next) => adminController.getPermissions(req, res, next));
router.put('/roles/:name/permissions', authenticate, requireAdmin, (req, res, next) => adminController.updateRolePermissions(req as any, res, next));
router.post('/roles/reset', authenticate, requireAdmin, (req, res, next) => adminController.resetRoles(req as any, res, next));

// Services
router.get('/services', (req, res, next) => adminController.getServices(req, res, next));
router.post('/services', authenticate, authorize('services.manage'), (req, res, next) => adminController.createService(req as any, res, next));
router.put('/services/:id', authenticate, authorize('services.manage'), (req, res, next) => adminController.updateService(req as any, res, next));
router.delete('/services/:id', authenticate, authorize('services.manage'), (req, res, next) => adminController.deleteService(req as any, res, next));

// Counters
router.get('/counters', (req, res, next) => adminController.getCounters(req, res, next));
router.post('/counters', authenticate, authorize('counters.manage'), (req, res, next) => adminController.createCounter(req as any, res, next));
router.put('/counters/:id', authenticate, authorize('counters.manage'), (req, res, next) => adminController.updateCounter(req as any, res, next));
router.delete('/counters/:id', authenticate, authorize('counters.manage'), (req, res, next) => adminController.deleteCounter(req as any, res, next));

// Office Settings
router.get('/settings/office', (req, res, next) => adminController.getOfficeSetting(req, res, next));
router.put('/settings/office', authenticate, requireAdmin, (req, res, next) => adminController.updateOfficeSetting(req as any, res, next));

// Audit Logs & Reports
router.get('/audit-logs', authenticate, requireAdmin, (req, res, next) => adminController.getAuditLogs(req as any, res, next));
router.get('/reports/daily', authenticate, (req, res, next) => adminController.getDailyStats(req as any, res, next));
router.get('/reports/officers', authenticate, (req, res, next) => adminController.getOfficerPerformanceReport(req as any, res, next));

// Backup & Restore
router.get('/system/backup', authenticate, requireAdmin, (req, res, next) => adminController.exportBackup(req as any, res, next));
router.post('/system/restore', authenticate, requireAdmin, (req, res, next) => adminController.importRestore(req as any, res, next));

export default router;
