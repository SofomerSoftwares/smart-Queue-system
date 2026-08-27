import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { 
  addisVoiceProvider,
  ADDIS_AI_VOICES, 
  buildAmharicAnnouncementText, 
  buildEnglishAnnouncementText,
  buildPhoneticAnnouncementText
} from '../services/addis-voice.service.js';
import { broadcaster } from '../websocket.js';

const router = Router();

// GET /api/audio/voices - List all Addis AI Voices
router.get('/voices', (req: Request, res: Response) => {
  res.json({
    success: true,
    provider: 'Addis AI Voice',
    voices: ADDIS_AI_VOICES
  });
});

// GET /api/audio/settings
router.get('/settings', (req: Request, res: Response) => {
  const settings = db.getAudioSetting();
  res.json({ success: true, settings });
});

// PUT /api/audio/settings (Admin only)
router.put('/settings', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateAudioSetting(req.body);
    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'UPDATE_AUDIO_SETTINGS',
      entity: 'AudioSetting',
      metadata: req.body
    });

    broadcaster.broadcast('settings:updated', { audioSetting: updated });
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/audio/test-voice - Test announcement using Addis AI Voice (Admin only)
router.post('/test-voice', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { 
      text, 
      language = 'AMHARIC', 
      voice = 'aster', 
      speed = 1.0 
    } = req.body;
    
    let phrase = text;
    if (!phrase) {
      if (language === 'ENGLISH') {
        phrase = buildEnglishAnnouncementText('A-001', 1, 'Cashier');
      } else if (language === 'BOTH') {
        phrase = `${buildAmharicAnnouncementText('A-001', 1, 'ክፍያ')} ${buildEnglishAnnouncementText('A-001', 1, 'Cashier')}`;
      } else {
        phrase = buildAmharicAnnouncementText('A-001', 1, 'ክፍያ');
      }
    }

    // Addis AI Voice synthesis
    const audioResult = await addisVoiceProvider.generateSpeech(phrase, language, voice, speed);

    res.json({
      success: true,
      text: phrase,
      audioResult
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/audio/generate
router.post('/generate', authenticate, authorize('audio.manage'), async (req: Request, res: Response) => {
  try {
    const { text, language = 'AMHARIC', voice = 'aster', speed = 1.0 } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required.' });
    }

    const audioResult = await addisVoiceProvider.generateSpeech(text, language, voice, speed);
    res.json({ success: true, audioResult });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
