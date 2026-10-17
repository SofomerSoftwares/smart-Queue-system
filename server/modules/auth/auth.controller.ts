import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { config } from '../../config/index.js';
import { db } from '../../db.js';

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password, req.ip);

      res.cookie('queue_access_token', result.accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      });
    } catch (err) {
      next(err);
    }
  }

  public logout(req: AuthenticatedRequest, res: Response) {
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
  }

  public getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
      }
      const userProfile = authService.getProfile(req.user.id);
      return res.json({
        success: true,
        user: userProfile
      });
    } catch (err) {
      next(err);
    }
  }

  public changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      authService.changePassword(req.user!.id, currentPassword, newPassword);
      return res.json({
        success: true,
        message: 'Password changed successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  public forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { username } = req.body;
      const result = authService.forgotPassword(username, req.ip);
      return res.json({
        success: true,
        message: `Password reset code generated for ${result.name}.`,
        resetCode: result.resetCode,
        username: result.username,
        name: result.name,
        expiresInMinutes: result.expiresInMinutes
      });
    } catch (err) {
      next(err);
    }
  }

  public resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, resetCode, newPassword } = req.body;
      const user = authService.resetPassword(username, resetCode, newPassword, req.ip);
      return res.json({
        success: true,
        message: `Password for ${user.name} has been successfully updated! You can now sign in with your new password.`,
        username: user.username
      });
    } catch (err) {
      next(err);
    }
  }

  public directUpdatePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { targetUserId, newPassword } = req.body;
      const user = authService.directUpdatePassword(req.user!.id, req.user!.role, targetUserId, newPassword);
      return res.json({
        success: true,
        message: `Password for ${user.name} updated successfully.`
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
