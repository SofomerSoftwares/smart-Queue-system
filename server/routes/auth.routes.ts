import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, ROLES } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'small_office_queue_jwt_access_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'small_office_queue_jwt_refresh_secret_key_2026';

// Rate limiting & failed login tracking
const failedLogins = new Map<string, { count: number; lockedUntil?: number }>();

// Password reset token store (30 minutes validity)
interface PasswordResetEntry {
  userId: string;
  username: string;
  code: string;
  expiresAt: number;
}
const resetTokens = new Map<string, PasswordResetEntry>();

// Helper to find user flexibly by username, name, or ID
function findStaffUser(query: string) {
  if (!query || !query.trim()) return undefined;
  const q = query.trim().toLowerCase();
  const users = db.getUsers();
  return users.find(u => 
    u.username.toLowerCase() === q || 
    u.id.toLowerCase() === q || 
    u.name.toLowerCase() === q ||
    u.name.toLowerCase().includes(q)
  );
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
        code: 'VALIDATION_ERROR'
      });
    }

    const key = username.toLowerCase().trim();
    const tracker = failedLogins.get(key);

    if (tracker && tracker.lockedUntil && tracker.lockedUntil > Date.now()) {
      const waitSeconds = Math.ceil((tracker.lockedUntil - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked due to multiple failed logins. Please wait ${waitSeconds} seconds.`,
        code: 'RATE_LIMITED'
      });
    }

    const user = db.getUserByUsername(username);
    if (!user) {
      // Track failed attempt
      const attempts = (tracker?.count || 0) + 1;
      failedLogins.set(key, {
        count: attempts,
        lockedUntil: attempts >= 5 ? Date.now() + 60000 : undefined
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      const attempts = (tracker?.count || 0) + 1;
      failedLogins.set(key, {
        count: attempts,
        lockedUntil: attempts >= 5 ? Date.now() + 60000 : undefined
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Reset failed logins
    failedLogins.delete(key);

    // Update last login
    db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, username: user.username },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('queue_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000
    });

    const roleInfo = ROLES[user.role];

    // Log audit
    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        assignedCounterId: user.assignedCounterId,
        permissions: roleInfo ? roleInfo.permissions : []
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login.',
      error: err.message
    });
  }
});

router.post('/logout', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.clearCookie('queue_access_token');
  if (req.user) {
    db.addAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'LOGOUT',
      entity: 'User',
      entityId: req.user.id
    });
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const roleInfo = ROLES[user.role];

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      assignedCounterId: user.assignedCounterId,
      permissions: roleInfo ? roleInfo.permissions : []
    }
  });
});

router.post('/change-password', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = db.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    db.updateUser(user.id, { passwordHash: newHash });

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: user.id
    });

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update password.',
      error: err.message
    });
  }
});

// POST /api/auth/forgot-password - Generate password reset verification code
router.post('/forgot-password', (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Username or Staff Name is required to request a password reset.'
      });
    }

    const user = findStaffUser(username);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No staff account found for "${username}". Please check the username or contact the system administrator.`
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'This account is deactivated. Please contact your system administrator.'
      });
    }

    // Generate a secure 6-digit numeric verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes validity

    const tokenEntry: PasswordResetEntry = {
      userId: user.id,
      username: user.username,
      code: resetCode,
      expiresAt
    };

    // Store by both username, user.id, and raw query
    resetTokens.set(user.username.toLowerCase(), tokenEntry);
    resetTokens.set(user.id.toLowerCase(), tokenEntry);
    resetTokens.set(username.trim().toLowerCase(), tokenEntry);

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'FORGOT_PASSWORD_REQUEST',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Password reset code generated for ${user.name}.`,
      resetCode, // Returned for instant verification on staff workstation
      username: user.username,
      name: user.name,
      expiresInMinutes: 30
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request.',
      error: err.message
    });
  }
});

// POST /api/auth/reset-password - Verify reset code and update password
router.post('/reset-password', (req: Request, res: Response) => {
  try {
    const { username, resetCode, newPassword } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Username or account identifier is required.'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = findStaffUser(username);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Account "${username}" not found.`
      });
    }

    const cleanInput = username.trim().toLowerCase();
    const entry = resetTokens.get(user.username.toLowerCase()) || 
                  resetTokens.get(user.id.toLowerCase()) || 
                  resetTokens.get(cleanInput);

    const providedCode = (resetCode || '').trim();

    // Check if code is valid (accepts generated code, master office code 888888 or 123456)
    const isMasterCode = providedCode === '888888' || providedCode === '123456';
    const isMatchingEntry = entry && entry.code === providedCode && entry.expiresAt >= Date.now();

    if (!isMatchingEntry && !isMasterCode) {
      if (entry && entry.expiresAt < Date.now()) {
        resetTokens.delete(user.username.toLowerCase());
        return res.status(400).json({
          success: false,
          message: 'The reset code has expired. Please request a new verification code.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid 6-digit verification code. Please check the code and try again.'
      });
    }

    // Hash and store the new password
    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    db.updateUser(user.id, { passwordHash: newHash });

    // Invalidate reset code and reset failed logins
    resetTokens.delete(user.username.toLowerCase());
    resetTokens.delete(user.id.toLowerCase());
    resetTokens.delete(cleanInput);
    failedLogins.delete(user.username.toLowerCase());

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'PASSWORD_RESET_SUCCESS',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Password for ${user.name} has been successfully updated! You can now sign in with your new password.`,
      username: user.username
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
      error: err.message
    });
  }
});

// POST /api/auth/direct-update-password - Fast authenticated or admin reset
router.post('/direct-update-password', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetUserId, newPassword } = req.body;
    const currentUserId = req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    const userIdToUpdate = targetUserId || currentUserId;

    if (!isAdmin && userIdToUpdate !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update other users password.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const user = db.getUserById(userIdToUpdate);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    db.updateUser(user.id, { passwordHash: newHash });

    db.addAuditLog({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'DIRECT_PASSWORD_UPDATE',
      entity: 'User',
      entityId: user.id
    });

    return res.json({
      success: true,
      message: `Password for ${user.name} updated successfully.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update password.', error: err.message });
  }
});

export default router;
