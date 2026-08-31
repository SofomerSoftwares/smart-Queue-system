import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, ROLES } from '../db.js';
import { RoleName } from '../types.js';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'small_office_queue_jwt_access_secret_key_2026';

export interface AuthenticatedUser {
  id: string;
  name: string;
  username: string;
  role: RoleName;
  assignedCounterId?: string;
  permissions: string[];
  canManagePriority?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // Check authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Check cookies
    if (!token && req.cookies && req.cookies.queue_access_token) {
      token = req.cookies.queue_access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in with an authorized account to call tickets or perform counter actions.',
        code: 'UNAUTHORIZED'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = db.getUserById(decoded.id);

      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({
          success: false,
          message: 'User session is invalid, expired, or account deactivated.',
          code: 'UNAUTHORIZED'
        });
      }

      const permissions = db.getUserPermissions(user);

      req.user = {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        assignedCounterId: user.assignedCounterId,
        permissions,
        canManagePriority: user.canManagePriority
      };

      next();
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please sign in again.',
        code: 'TOKEN_EXPIRED'
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error occurred.'
    });
  }
}

/**
 * Optional authentication middleware for public kiosk customer ticket dispensing
 */
export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token && req.cookies && req.cookies.queue_access_token) {
      token = req.cookies.queue_access_token;
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const user = db.getUserById(decoded.id);
        if (user && user.status === 'ACTIVE') {
          const roleInfo = ROLES[user.role];
          req.user = {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            assignedCounterId: user.assignedCounterId,
            permissions: roleInfo ? roleInfo.permissions : []
          };
        }
      } catch {
        // ignore invalid token for optional auth
      }
    }
    next();
  } catch {
    next();
  }
}

/**
 * Backend permission authorization middleware
 */
export function authorize(requiredPermission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'UNAUTHORIZED'
      });
    }

    // ADMIN always has full access
    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to perform this action (${requiredPermission}).`,
        code: 'FORBIDDEN'
      });
    }

    next();
  };
}

/**
 * Strict Administrator-only authorization middleware
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in as an Administrator.',
      code: 'UNAUTHORIZED'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Management portal and administrative actions are restricted exclusively to Administrators.',
      code: 'FORBIDDEN'
    });
  }

  next();
}
