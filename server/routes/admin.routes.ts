import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authenticate, authorize, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { broadcaster } from '../websocket.js';
import { User, Service, Counter, OfficeSetting } from '../types.js';

const router = Router();

// ==================== USERS & STAFF ====================

// GET /api/users (Strict Admin only)
router.get('/users', authenticate, requireAdmin, (req: Request, res: Response) => {
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

// POST /api/users (Strict Admin only)
router.post('/users', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
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
router.put('/users/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, username, role, status, assignedCounterId, password } = req.body;

    const existingUser = db.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updates: Partial<User> = {};
    if (name && name.trim()) updates.name = name.trim();
    if (username && username.trim() && username.trim() !== existingUser.username) {
      const cleanUsername = username.trim().toLowerCase();
      const conflict = db.getUserByUsername(cleanUsername);
      if (conflict && conflict.id !== id) {
        return res.status(400).json({ success: false, message: 'Username is already taken by another user.' });
      }
      updates.username = cleanUsername;
    }

    if (role) {
      updates.role = role;
      updates.roleId = `role-${role.toLowerCase().replace('_', '-')}`;
    }
    if (status) updates.status = status;
    if (assignedCounterId !== undefined) updates.assignedCounterId = assignedCounterId;

    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      }
      const salt = bcrypt.genSaltSync(10);
      updates.passwordHash = bcrypt.hashSync(password.trim(), salt);
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
      metadata: { ...updates, passwordHash: updates.passwordHash ? '[UPDATED]' : undefined }
    });

    const { passwordHash: _, ...safeUser } = updated;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/:id/reset-password (Admin direct reset)
router.post('/users/:id/reset-password', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const user = db.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword.trim(), salt);
    db.updateUser(id, { passwordHash });

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'ADMIN_RESET_PASSWORD',
      entity: 'User',
      entityId: id
    });

    res.json({ success: true, message: `Password for ${user.name} has been reset successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/users/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
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

// POST /api/services (Admin only)
router.post('/services', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    let { name, nameAmharic, prefix, description, estimatedDurationMinutes, color } = req.body;
    
    name = (name || '').trim();
    nameAmharic = (nameAmharic || '').trim();
    
    // Auto fallback if only one language name is provided
    if (!name && nameAmharic) name = nameAmharic;
    if (!nameAmharic && name) nameAmharic = name;
    
    prefix = (prefix || 'S').trim().toUpperCase().charAt(0) || 'S';

    if (!name) {
      return res.status(400).json({ success: false, message: 'Service name is required.' });
    }

    const services = db.getServices();
    const newService: Service = {
      id: `srv-${Date.now()}`,
      name,
      nameAmharic,
      prefix,
      description: description ? String(description).trim() : '',
      estimatedDurationMinutes: Number(estimatedDurationMinutes) > 0 ? Number(estimatedDurationMinutes) : 5,
      color: color || '#4f46e5',
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
      metadata: { name: newService.name, prefix: newService.prefix }
    });

    broadcaster.broadcast('queue:updated', { action: 'SERVICES_CHANGED' });
    res.status(201).json({ success: true, service: newService });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create service' });
  }
});

// PUT /api/services/:id (Admin only)
router.put('/services/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    let { name, nameAmharic, prefix, description, estimatedDurationMinutes, color, isActive } = req.body;

    const updates: Partial<Service> = {};
    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (trimmed) updates.name = trimmed;
    }
    if (nameAmharic !== undefined) {
      const trimmed = String(nameAmharic).trim();
      if (trimmed) updates.nameAmharic = trimmed;
    }
    if (updates.name && !updates.nameAmharic) updates.nameAmharic = updates.name;
    if (updates.nameAmharic && !updates.name) updates.name = updates.nameAmharic;

    if (prefix !== undefined) {
      updates.prefix = String(prefix).trim().toUpperCase().charAt(0) || 'S';
    }
    if (description !== undefined) updates.description = String(description).trim();
    if (estimatedDurationMinutes !== undefined) {
      const num = Number(estimatedDurationMinutes);
      if (num > 0) updates.estimatedDurationMinutes = num;
    }
    if (color !== undefined) updates.color = color;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const updated = db.updateService(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'UPDATE_SERVICE',
      entity: 'Service',
      entityId: id,
      metadata: updates
    });

    broadcaster.broadcast('queue:updated', { action: 'SERVICES_CHANGED' });
    res.json({ success: true, service: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update service' });
  }
});

// DELETE /api/services/:id (Admin only)
router.delete('/services/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
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

// POST /api/counters (Admin only)
router.post('/counters', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
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

// PUT /api/counters/:id (Admin only)
router.put('/counters/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
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

// DELETE /api/counters/:id (Admin only)
router.delete('/counters/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
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

// GET /api/reports/summary (Admin only)
router.get('/reports/summary', authenticate, requireAdmin, (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const stats = db.getQueueStats(date as string);
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/audit-logs (Admin only)
router.get('/audit-logs', authenticate, requireAdmin, (req: Request, res: Response) => {
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

// PUT /api/settings (Admin only)
router.put('/settings', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    let { 
      officeName, 
      officeNameAmharic, 
      displayNoticeAmharic, 
      displayNoticeEnglish, 
      estimatedWaitPerPersonMinutes,
      ticketNumberResetDaily,
      themeColor
    } = req.body;

    const updates: Partial<OfficeSetting> = {};

    if (officeName !== undefined) {
      const trimmed = String(officeName).trim();
      if (trimmed) updates.officeName = trimmed;
    }

    if (officeNameAmharic !== undefined) {
      const trimmedAm = String(officeNameAmharic).trim();
      if (trimmedAm) updates.officeNameAmharic = trimmedAm;
    }

    // If only one language name was provided and the other is empty in current setting, fallback
    const current = db.getOfficeSetting();
    if (updates.officeName && !updates.officeNameAmharic && !current.officeNameAmharic) {
      updates.officeNameAmharic = updates.officeName;
    }
    if (updates.officeNameAmharic && !updates.officeName && !current.officeName) {
      updates.officeName = updates.officeNameAmharic;
    }

    if (displayNoticeAmharic !== undefined) {
      updates.displayNoticeAmharic = String(displayNoticeAmharic).trim();
    }
    if (displayNoticeEnglish !== undefined) {
      updates.displayNotice = String(displayNoticeEnglish).trim();
    } else if (req.body.displayNotice !== undefined) {
      updates.displayNotice = String(req.body.displayNotice).trim();
    }
    if (estimatedWaitPerPersonMinutes !== undefined) {
      const num = Number(estimatedWaitPerPersonMinutes);
      if (!isNaN(num) && num >= 1 && num <= 120) {
        updates.estimatedWaitPerPersonMinutes = num;
      }
    }

    const updated = db.updateOfficeSetting(updates);
    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'UPDATE_OFFICE_SETTINGS',
      entity: 'OfficeSetting',
      metadata: updates
    });

    broadcaster.broadcast('settings:updated', { officeSetting: updated });
    broadcaster.broadcast('queue:updated', { action: 'SETTINGS_CHANGED' });
    res.json({ success: true, setting: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== DATABASE / MONGODB ATLAS ====================

// GET /api/database/status
router.get('/database/status', (req: Request, res: Response) => {
  const status = db.getMongoStatus();
  res.json({ success: true, ...status });
});

// POST /api/database/connect (Admin only)
router.post('/database/connect', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uri } = req.body;
    const status = await db.connectMongo(uri);
    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'CONNECT_MONGODB_ATLAS',
      entity: 'Database',
      metadata: { connected: status.connected, database: status.database }
    });
    res.json({ success: true, ...status });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/database/sync (Admin only)
router.post('/database/sync', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.syncMongoNow();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
