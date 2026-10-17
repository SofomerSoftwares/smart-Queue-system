import { Router } from 'express';
import { audioController } from './audio.controller.js';
import { authenticate, authorize, requireAdmin } from '../../middleware/auth.js';

const router = Router();

router.get('/voices', (req, res) => audioController.getVoices(req, res));
router.get('/settings', (req, res) => audioController.getSettings(req, res));
router.put('/settings', authenticate, requireAdmin, (req, res, next) => audioController.updateSettings(req as any, res, next));
router.post('/broadcast-personal-recording', authenticate, (req, res, next) => audioController.broadcastPersonalRecording(req as any, res, next));
router.post('/save-custom-recording', authenticate, requireAdmin, (req, res, next) => audioController.saveCustomRecording(req as any, res, next));
router.delete('/delete-custom-recording', authenticate, requireAdmin, (req, res, next) => audioController.deleteCustomRecording(req as any, res, next));
router.post('/test-voice', authenticate, requireAdmin, (req, res, next) => audioController.testVoice(req, res, next));
router.post('/generate', authenticate, authorize('audio.manage'), (req, res, next) => audioController.generate(req, res, next));

export default router;
