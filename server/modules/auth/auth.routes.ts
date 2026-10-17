import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/logout', authenticate, (req, res) => authController.logout(req as any, res));
router.get('/me', authenticate, (req, res, next) => authController.getMe(req as any, res, next));
router.post('/change-password', authenticate, (req, res, next) => authController.changePassword(req as any, res, next));
router.post('/forgot-password', (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password', (req, res, next) => authController.resetPassword(req, res, next));
router.post('/direct-update-password', authenticate, (req, res, next) => authController.directUpdatePassword(req as any, res, next));

export default router;
