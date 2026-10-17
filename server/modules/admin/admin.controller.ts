import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

export class AdminController {
  // Users
  public getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = adminService.getUsers();
      return res.json({ success: true, users });
    } catch (err) {
      next(err);
    }
  }

  public createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = adminService.createUser({
        ...req.body,
        adminUserId: req.user?.id,
        adminUserName: req.user?.name
      });
      return res.status(201).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  public updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = adminService.updateUser(id, req.body, req.user?.id, req.user?.name);
      return res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  public deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      adminService.deleteUser(id, req.user?.id, req.user?.name);
      return res.json({ success: true, message: 'User deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  public setUserPriorityAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { canManagePriority } = req.body;
      const result = adminService.setUserPriorityAccess(id, canManagePriority, req.user?.id, req.user?.name);
      return res.json({ success: true, user: result });
    } catch (err) {
      next(err);
    }
  }

  // Priority Policy
  public getPriorityPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const policy = adminService.getPriorityPolicy();
      return res.json({ success: true, policy });
    } catch (err) {
      next(err);
    }
  }

  public updatePriorityPolicy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const policy = adminService.updatePriorityPolicy(req.body, req.user?.id, req.user?.name);
      return res.json({ success: true, policy, message: 'Priority triage policy updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Roles & Permissions
  public getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = adminService.getRoles();
      return res.json({ success: true, roles });
    } catch (err) {
      next(err);
    }
  }

  public getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = adminService.getPermissions();
      return res.json({ success: true, permissions });
    } catch (err) {
      next(err);
    }
  }

  public updateRolePermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name } = req.params;
      const { permissions } = req.body;
      const role = adminService.updateRolePermissions(name, permissions, req.user?.id, req.user?.name);
      return res.json({ success: true, role, message: `Permissions for ${name} updated successfully.` });
    } catch (err) {
      next(err);
    }
  }

  public resetRoles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const roles = adminService.resetRoles(req.user?.id, req.user?.name);
      return res.json({ success: true, roles, message: 'Default system roles and permissions restored.' });
    } catch (err) {
      next(err);
    }
  }

  // Services
  public getServices(req: Request, res: Response, next: NextFunction) {
    try {
      const services = adminService.getServices();
      return res.json({ success: true, services });
    } catch (err) {
      next(err);
    }
  }

  public createService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const service = adminService.createService(req.body, req.user?.id, req.user?.name);
      return res.status(201).json({ success: true, service });
    } catch (err) {
      next(err);
    }
  }

  public updateService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = adminService.updateService(id, req.body, req.user?.id, req.user?.name);
      return res.json({ success: true, service });
    } catch (err) {
      next(err);
    }
  }

  public deleteService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      adminService.deleteService(id, req.user?.id, req.user?.name);
      return res.json({ success: true, message: 'Service deleted.' });
    } catch (err) {
      next(err);
    }
  }

  // Counters
  public getCounters(req: Request, res: Response, next: NextFunction) {
    try {
      const counters = adminService.getCounters();
      return res.json({ success: true, counters });
    } catch (err) {
      next(err);
    }
  }

  public createCounter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const counter = adminService.createCounter(req.body, req.user?.id, req.user?.name);
      return res.status(201).json({ success: true, counter });
    } catch (err) {
      next(err);
    }
  }

  public updateCounter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const counter = adminService.updateCounter(id, req.body, req.user?.id, req.user?.name);
      return res.json({ success: true, counter });
    } catch (err) {
      next(err);
    }
  }

  public deleteCounter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      adminService.deleteCounter(id, req.user?.id, req.user?.name);
      return res.json({ success: true, message: 'Counter deleted.' });
    } catch (err) {
      next(err);
    }
  }

  // Office Settings
  public getOfficeSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const setting = adminService.getOfficeSetting();
      return res.json({ success: true, setting });
    } catch (err) {
      next(err);
    }
  }

  public updateOfficeSetting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const setting = adminService.updateOfficeSetting(req.body, req.user?.id, req.user?.name);
      return res.json({ success: true, setting });
    } catch (err) {
      next(err);
    }
  }

  // Audit Logs & Reports
  public getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 200;
      const logs = adminService.getAuditLogs(limit);
      return res.json({ success: true, logs });
    } catch (err) {
      next(err);
    }
  }

  public getDailyStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const stats = adminService.getDailyStats(date ? String(date) : undefined);
      return res.json({ success: true, stats });
    } catch (err) {
      next(err);
    }
  }

  public getOfficerPerformanceReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = adminService.getOfficerPerformanceReport();
      return res.json({ success: true, ...report });
    } catch (err) {
      next(err);
    }
  }

  // Backup & Restore
  public exportBackup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = adminService.exportBackup();
      return res.json({
        success: true,
        exportedAt: new Date().toISOString(),
        data
      });
    } catch (err) {
      next(err);
    }
  }

  public importRestore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ success: false, message: 'Backup data is required.' });
      }
      adminService.importRestore(data, req.user?.id, req.user?.name);
      return res.json({ success: true, message: 'Database state restored successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
