import bcrypt from 'bcryptjs';
import { db, PERMISSIONS } from '../../db.js';
import { broadcaster } from '../../sockets/broadcaster.js';
import { 
  User, 
  Service, 
  Counter, 
  OfficeSetting, 
  Role, 
  RoleName, 
  PriorityPolicy, 
  DatabaseSchema 
} from '../../../shared/types/index.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../errors/AppError.js';

export class AdminService {
  // --- USERS & STAFF ---
  public getUsers() {
    return db.getUsers().map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      status: u.status,
      assignedCounterId: u.assignedCounterId,
      canManagePriority: u.canManagePriority,
      permissions: db.getUserPermissions(u),
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt
    }));
  }

  public createUser(userData: {
    name: string;
    username: string;
    password: string;
    role: RoleName;
    assignedCounterId?: string;
    canManagePriority?: boolean;
    adminUserId?: string;
    adminUserName?: string;
  }) {
    const { name, username, password, role, assignedCounterId, canManagePriority, adminUserId, adminUserName } = userData;
    if (!name || !username || !password || !role) {
      throw new BadRequestError('Name, username, password, and role are required.');
    }

    if (db.getUserByUsername(username)) {
      throw new BadRequestError('Username is already taken.');
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
      canManagePriority: canManagePriority !== undefined ? canManagePriority : undefined,
      createdAt: now,
      updatedAt: now
    };

    db.createUser(newUser);

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: newUser.id,
      metadata: { username, role, canManagePriority: newUser.canManagePriority }
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return { ...safeUser, permissions: db.getUserPermissions(newUser) };
  }

  public updateUser(id: string, updates: any, adminUserId?: string, adminUserName?: string) {
    const existingUser = db.getUserById(id);
    if (!existingUser) {
      throw new NotFoundError('User not found.');
    }

    const updatePayload: Partial<User> = {};
    if (updates.name && updates.name.trim()) updatePayload.name = updates.name.trim();
    if (updates.username && updates.username.trim() && updates.username.trim() !== existingUser.username) {
      const cleanUsername = updates.username.trim().toLowerCase();
      const conflict = db.getUserByUsername(cleanUsername);
      if (conflict && conflict.id !== id) {
        throw new BadRequestError('Username is already taken by another user.');
      }
      updatePayload.username = cleanUsername;
    }
    if (updates.role) updatePayload.role = updates.role;
    if (updates.status) updatePayload.status = updates.status;
    if (updates.assignedCounterId !== undefined) updatePayload.assignedCounterId = updates.assignedCounterId || undefined;
    if (updates.canManagePriority !== undefined) updatePayload.canManagePriority = updates.canManagePriority === null ? undefined : updates.canManagePriority;
    if (updates.password && updates.password.trim()) {
      const salt = bcrypt.genSaltSync(10);
      updatePayload.passwordHash = bcrypt.hashSync(updates.password.trim(), salt);
    }

    const updated = db.updateUser(id, updatePayload);
    if (!updated) {
      throw new NotFoundError('User not found.');
    }

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: id,
      metadata: { ...updates, password: updates.password ? '[REDACTED]' : undefined }
    });

    broadcaster.broadcast('user:updated', { user: updated });
    const { passwordHash: _, ...safeUser } = updated;
    return { ...safeUser, permissions: db.getUserPermissions(updated) };
  }

  public deleteUser(id: string, adminUserId?: string, adminUserName?: string) {
    if (adminUserId && id === adminUserId) {
      throw new BadRequestError('Cannot delete currently authenticated active account.');
    }

    const success = db.deleteUser(id);
    if (!success) {
      throw new NotFoundError('User not found.');
    }

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: id
    });

    return true;
  }

  public setUserPriorityAccess(id: string, canManagePriority: boolean | null, adminUserId?: string, adminUserName?: string) {
    const updated = db.setUserPriorityAccess(id, canManagePriority);
    if (!updated) {
      throw new NotFoundError('User not found.');
    }

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'UPDATE_USER_PRIORITY_ACCESS',
      entity: 'User',
      entityId: id,
      metadata: { canManagePriority: updated.canManagePriority }
    });

    broadcaster.broadcast('user:updated', { user: updated });
    return {
      id: updated.id,
      name: updated.name,
      canManagePriority: updated.canManagePriority,
      permissions: db.getUserPermissions(updated)
    };
  }

  // --- PRIORITY POLICY ---
  public getPriorityPolicy(): PriorityPolicy {
    return db.getPriorityPolicy();
  }

  public updatePriorityPolicy(updates: Partial<PriorityPolicy>, adminUserId?: string, adminUserName?: string): PriorityPolicy {
    const updated = db.updatePriorityPolicy(updates);

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'UPDATE_PRIORITY_POLICY',
      entity: 'PriorityPolicy',
      metadata: updates
    });

    broadcaster.broadcast('settings:updated', { priorityPolicy: updated });
    return updated;
  }

  // --- ROLES & PERMISSIONS ---
  public getRoles(): Role[] {
    return db.getRoles();
  }

  public getPermissions() {
    return PERMISSIONS;
  }

  public updateRolePermissions(name: string, permissions: string[], adminUserId?: string, adminUserName?: string): Role {
    if (!Array.isArray(permissions)) {
      throw new BadRequestError('permissions must be an array of strings');
    }

    const validRoleNames = ['ADMIN', 'RECEPTIONIST', 'SERVICE_OFFICER'];
    const uppercaseRole = name.toUpperCase() as RoleName;
    if (!validRoleNames.includes(uppercaseRole)) {
      throw new NotFoundError(`Role '${name}' not found.`);
    }

    const updatedRole = db.updateRolePermissions(uppercaseRole, permissions);
    if (!updatedRole) {
      throw new NotFoundError(`Role '${name}' not found.`);
    }

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'UPDATE_ROLE_PERMISSIONS',
      entity: 'Role',
      metadata: { role: uppercaseRole, permissions }
    });

    broadcaster.broadcast('role:updated', { role: updatedRole });
    return updatedRole;
  }

  public resetRoles(adminUserId?: string, adminUserName?: string): Role[] {
    const roles = db.resetRolesToDefault();
    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'RESET_ROLES_DEFAULT',
      entity: 'Role'
    });

    broadcaster.broadcast('role:updated', { roles });
    return roles;
  }

  // --- SERVICES ---
  public getServices(): Service[] {
    return db.getServices();
  }

  public createService(serviceData: Omit<Service, 'id'>, adminUserId?: string, adminUserName?: string): Service {
    const { name, nameAmharic, prefix, description, estimatedDurationMinutes, color, isActive, order } = serviceData;
    if (!name || !nameAmharic || !prefix) {
      throw new BadRequestError('name, nameAmharic, and prefix are required.');
    }

    const newService: Service = {
      id: `srv-${Date.now()}`,
      name,
      nameAmharic,
      prefix: prefix.toUpperCase().charAt(0),
      description,
      estimatedDurationMinutes: Number(estimatedDurationMinutes) || 5,
      color: color || '#4F46E5',
      isActive: isActive !== undefined ? isActive : true,
      order: Number(order) || (db.getServices().length + 1)
    };

    db.createService(newService);

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'CREATE_SERVICE',
      entity: 'Service',
      entityId: newService.id,
      metadata: { name: newService.name, prefix: newService.prefix }
    });

    broadcaster.broadcast('queue:updated', { action: 'SERVICE_CREATED' });
    return newService;
  }

  public updateService(id: string, updates: Partial<Service>, adminUserId?: string, adminUserName?: string): Service {
    const updated = db.updateService(id, updates);
    if (!updated) {
      throw new NotFoundError('Service not found.');
    }

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'UPDATE_SERVICE',
      entity: 'Service',
      entityId: id,
      metadata: updates
    });

    broadcaster.broadcast('queue:updated', { action: 'SERVICE_UPDATED' });
    return updated;
  }

  public deleteService(id: string, adminUserId?: string, adminUserName?: string): boolean {
    const success = db.deleteService(id);
    if (!success) {
      throw new NotFoundError('Service not found.');
    }

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'DELETE_SERVICE',
      entity: 'Service',
      entityId: id
    });

    broadcaster.broadcast('queue:updated', { action: 'SERVICE_DELETED' });
    return true;
  }

  // --- COUNTERS ---
  public getCounters(): Counter[] {
    return db.getCounters();
  }

  public createCounter(counterData: Omit<Counter, 'id' | 'updatedAt' | 'status'>, adminUserId?: string, adminUserName?: string): Counter {
    const { number, name, nameAmharic, serviceIds } = counterData;
    if (!number || !name) {
      throw new BadRequestError('Counter number and name are required.');
    }

    if (db.getCounterByNumber(Number(number))) {
      throw new BadRequestError(`Counter number ${number} is already in use.`);
    }

    const newCounter: Counter = {
      id: `cnt-${Date.now()}`,
      number: Number(number),
      name,
      nameAmharic: nameAmharic || name,
      status: 'AVAILABLE',
      serviceIds: Array.isArray(serviceIds) ? serviceIds : [],
      updatedAt: new Date().toISOString()
    };

    db.createCounter(newCounter);

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'CREATE_COUNTER',
      entity: 'Counter',
      entityId: newCounter.id,
      metadata: { number: newCounter.number, name: newCounter.name }
    });

    broadcaster.broadcast('counter:updated', { counter: newCounter });
    return newCounter;
  }

  public updateCounter(id: string, updates: Partial<Counter>, adminUserId?: string, adminUserName?: string): Counter {
    const updated = db.updateCounter(id, updates);
    if (!updated) {
      throw new NotFoundError('Counter not found.');
    }

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'UPDATE_COUNTER',
      entity: 'Counter',
      entityId: id,
      metadata: updates
    });

    broadcaster.broadcast('counter:updated', { counter: updated });
    return updated;
  }

  public deleteCounter(id: string, adminUserId?: string, adminUserName?: string): boolean {
    const success = db.deleteCounter(id);
    if (!success) {
      throw new NotFoundError('Counter not found.');
    }

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'DELETE_COUNTER',
      entity: 'Counter',
      entityId: id
    });

    return true;
  }

  // --- OFFICE SETTINGS ---
  public getOfficeSetting(): OfficeSetting {
    return db.getOfficeSetting();
  }

  public updateOfficeSetting(updates: Partial<OfficeSetting>, adminUserId?: string, adminUserName?: string): OfficeSetting {
    const updated = db.updateOfficeSetting(updates);

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'UPDATE_OFFICE_SETTINGS',
      entity: 'OfficeSetting',
      metadata: updates
    });

    broadcaster.broadcast('settings:updated', { officeSetting: updated });
    return updated;
  }

  // --- AUDIT LOGS & REPORTS ---
  public getAuditLogs(limit?: number) {
    return db.getAuditLogs(limit || 200);
  }

  public getDailyStats(dateKey?: string) {
    return db.getQueueStats(dateKey);
  }

  public getOfficerPerformanceReport() {
    return db.getOfficerPerformanceReport();
  }

  // --- BACKUP & RESTORE ---
  public exportBackup(): DatabaseSchema {
    return db.exportData();
  }

  public importRestore(backupData: Partial<DatabaseSchema>, adminUserId?: string, adminUserName?: string) {
    const success = db.importData(backupData);
    if (!success) {
      throw new BadRequestError('Failed to import database backup data.');
    }

    db.addAuditLog({
      userId: adminUserId,
      userName: adminUserName,
      action: 'DATABASE_RESTORE',
      entity: 'System'
    });

    broadcaster.broadcast('settings:updated', { message: 'Database state restored from backup' });
    return true;
  }
}

export const adminService = new AdminService();
