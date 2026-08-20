import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { broadcaster } from '../websocket.js';
import { User, Service, Counter } from '../types.js';

const router = Router();

// ==================== USERS & STAFF ====================

// GET /api/users
router.get('/users', authenticate, authorize('staff.view'), (req: Request, res: Response) => {
  const users = db.getUsers().map(u => ({
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    status: u.status,
    assignedCounterId: u.assignedCounterId,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt
  }));
  res.json({ success: true, users });
});

// POST /api/users
router.post('/users', authenticate, authorize('staff.create'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, username, password, role, assignedCounterId } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, username, password, and role are required.' });
    }

    if (db.getUserByUsername(username)) {
      return res.status(400).json({ success: false, message: 'Username is already taken.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const now = new Date().toISOString();

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      username,
      passwordHash,
      roleId: `role-${role.toLowerCase().replace('_', '-')}`,
      role,
      status: 'ACTIVE',
      assignedCounterId,
      createdAt: now,
      updatedAt: now
    };

    db.createUser(newUser);

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: newUser.id,
      metadata: { username, role }
    });

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/:id
router.put('/users/:id', authenticate, authorize('staff.update'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, status, assignedCounterId, password } = req.body;

    const updates: Partial<User> = {};
    if (name) updates.name = name;
    if (role) {
      updates.role = role;
      updates.roleId = `role-${role.toLowerCase().replace('_', '-')}`;
    }
    if (status) updates.status = status;
    if (assignedCounterId !== undefined) updates.assignedCounterId = assignedCounterId;

    if (password && password.trim().length >= 6) {
      const salt = bcrypt.genSaltSync(10);
      updates.passwordHash = bcrypt.hashSync(password, salt);
    }

    const updated = db.updateUser(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: id,
      metadata: updates
    });

    const { passwordHash: _, ...safeUser } = updated;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/users/:id', authenticate, authorize('staff.delete'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user?.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const ok = db.deleteUser(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: id
    });

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== SERVICES ====================

// GET /api/services
router.get('/services', (req: Request, res: Response) => {
  const services = db.getServices();
  res.json({ success: true, services });
});

// POST /api/services
router.post('/services', authenticate, authorize('services.create'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, nameAmharic, prefix, description, estimatedDurationMinutes, color } = req.body;
    if (!name || !nameAmharic || !prefix) {
      return res.status(400).json({ success: false, message: 'Name, Amharic name, and Prefix are required.' });
    }

    const services = db.getServices();
    const newService: Service = {
      id: `srv-${Date.now()}`,
      name,
      nameAmharic,
      prefix: prefix.toUpperCase().trim().charAt(0),
      description: description || '',
      estimatedDurationMinutes: Number(estimatedDurationMinutes) || 5,
      color: color || '#2563eb',
      isActive: true,
      order: services.length + 1
    };

    db.createService(newService);

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'CREATE_SERVICE',
      entity: 'Service',
      entityId: newService.id,
      metadata: { name, prefix: newService.prefix }
    });

    broadcaster.broadcast('queue:updated', { action: 'SERVICES_CHANGED' });
    res.status(201).json({ success: true, service: newService });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/services/:id
router.put('/services/:id', authenticate, authorize('services.update'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = db.updateService(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'UPDATE_SERVICE',
      entity: 'Service',
      entityId: id,
      metadata: req.body
    });

    broadcaster.broadcast('queue:updated', { action: 'SERVICES_CHANGED' });
    res.json({ success: true, service: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/services/:id
router.delete('/services/:id', authenticate, authorize('services.delete'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ok = db.deleteService(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'DELETE_SERVICE',
      entity: 'Service',
      entityId: id
    });

    broadcaster.broadcast('queue:updated', { action: 'SERVICES_CHANGED' });
    res.json({ success: true, message: 'Service deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== COUNTERS ====================

// GET /api/counters
router.get('/counters', (req: Request, res: Response) => {
  const counters = db.getCounters();
  res.json({ success: true, counters });
});

// POST /api/counters
router.post('/counters', authenticate, authorize('counters.create'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { number, name, nameAmharic } = req.body;
    const countNum = Number(number);

    if (!countNum || !name) {
      return res.status(400).json({ success: false, message: 'Counter number and name are required.' });
    }

    if (db.getCounterByNumber(countNum)) {
      return res.status(400).json({ success: false, message: `Counter number ${countNum} already exists.` });
    }

    const newCounter: Counter = {
      id: `cnt-${countNum}`,
      number: countNum,
      name,
      nameAmharic: nameAmharic || `ቆጣሪ ${countNum}`,
      status: 'AVAILABLE',
      updatedAt: new Date().toISOString()
    };

    db.createCounter(newCounter);

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'CREATE_COUNTER',
      entity: 'Counter',
      entityId: newCounter.id,
      metadata: { number: countNum, name }
    });

    broadcaster.broadcast('counter:updated', { counter: newCounter });
    res.status(201).json({ success: true, counter: newCounter });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/counters/:id
router.put('/counters/:id', authenticate, authorize('counters.update'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = db.updateCounter(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Counter not found.' });
    }

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'UPDATE_COUNTER',
      entity: 'Counter',
      entityId: id,
      metadata: req.body
    });

    broadcaster.broadcast('counter:updated', { counter: updated });
    res.json({ success: true, counter: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/counters/:id
router.delete('/counters/:id', authenticate, authorize('counters.delete'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ok = db.deleteCounter(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Counter not found.' });
    }

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'DELETE_COUNTER',
      entity: 'Counter',
      entityId: id
    });

    res.json({ success: true, message: 'Counter deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== REPORTS & AUDIT ====================

// GET /api/reports/summary
router.get('/reports/summary', authenticate, authorize('reports.view'), (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const stats = db.getQueueStats(date as string);
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/audit-logs
router.get('/audit-logs', authenticate, authorize('reports.view'), (req: Request, res: Response) => {
  try {
    const logs = db.getAuditLogs(150);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== OFFICE SETTINGS ====================

// GET /api/settings
router.get('/settings', (req: Request, res: Response) => {
  const setting = db.getOfficeSetting();
  res.json({ success: true, setting });
});

// PUT /api/settings
router.put('/settings', authenticate, authorize('settings.update'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateOfficeSetting(req.body);
    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'UPDATE_OFFICE_SETTINGS',
      entity: 'OfficeSetting',
      metadata: req.body
    });

    broadcaster.broadcast('settings:updated', { officeSetting: updated });
    res.json({ success: true, setting: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
