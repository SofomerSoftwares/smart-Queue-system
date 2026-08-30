import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { 
  addisVoiceProvider,
  ADDIS_AI_VOICES, 
  buildAmharicAnnouncementText, 
  buildEnglishAnnouncementText,
  buildPhoneticAnnouncementText,
  getAmharicTicketNumber
} from '../services/addis-voice.service.js';
import { broadcaster } from '../websocket.js';
import { AnnouncementPayload } from '../types.js';

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

// POST /api/audio/broadcast-personal-recording - Broadcast live officer personal voice recording
router.post('/broadcast-personal-recording', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      ticketNumber,
      counterNumber = 1,
      serviceName = 'General Service',
      serviceNameAmharic = 'አጠቃላይ አገልግሎት',
      customText,
      language = 'AMHARIC'
    } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Personal audio recording data (audioBase64) is required.'
      });
    }

    const tktNumber = ticketNumber || 'A-001';
    const audioSettings = db.getAudioSetting();

    const payload: AnnouncementPayload = {
      ticketNumber: tktNumber,
      ticketNumberAmharic: getAmharicTicketNumber(tktNumber),
      counterNumber: Number(counterNumber) || 1,
      serviceName: serviceName || 'General Service',
      serviceNameAmharic: serviceNameAmharic || 'አጠቃላይ አገልግሎት',
      language: (language as any) || audioSettings.language || 'AMHARIC',
      textAmharic: customText || buildAmharicAnnouncementText(tktNumber, counterNumber, serviceNameAmharic),
      textEnglish: customText || buildEnglishAnnouncementText(tktNumber, counterNumber, serviceName),
      phoneticText: customText || buildPhoneticAnnouncementText(tktNumber, counterNumber, serviceNameAmharic),
      audioBase64,
      audioMimeType: mimeType,
      source: 'OFFICER_LIVE_RECORDING',
      isLiveVoiceRecord: true,
      officerName: req.user?.name || req.user?.username || 'Officer',
      customText,
      timestamp: new Date().toISOString()
    };

    // Broadcast announcement event to all listening displays, counters, and stations
    broadcaster.broadcast('announcement:play', payload);

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'BROADCAST_PERSONAL_VOICE_RECORDING',
      entity: 'QueueAnnouncement',
      metadata: {
        ticketNumber: tktNumber,
        counterNumber,
        officer: req.user?.name,
        mimeType
      }
    });

    return res.json({
      success: true,
      message: `Personal voice announcement for Ticket ${tktNumber} broadcasted successfully.`,
      payload
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/audio/save-custom-recording - Admin saves default personal recorded voice clip
router.post('/save-custom-recording', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      customRecordingBase64,
      customRecordingMimeType = 'audio/webm',
      customRecordingDuration = 0,
      customRecordingName = 'Default Office Voice Announcement',
      setAsActive = true
    } = req.body;

    if (!customRecordingBase64) {
      return res.status(400).json({
        success: false,
        message: 'customRecordingBase64 is required.'
      });
    }

    const updatePayload: any = {
      customRecordingBase64,
      customRecordingMimeType,
      customRecordingDuration,
      customRecordingName,
      customRecordingCreatedAt: new Date().toISOString(),
      customRecordingRecordedBy: req.user?.name || 'Administrator'
    };

    if (setAsActive) {
      updatePayload.ttsProvider = 'CUSTOM_RECORDED';
      updatePayload.voiceMode = 'CUSTOM_RECORDED';
    }

    const updated = db.updateAudioSetting(updatePayload);

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'SAVE_CUSTOM_AUDIO_RECORDING',
      entity: 'AudioSetting',
      metadata: { name: customRecordingName, duration: customRecordingDuration }
    });

    broadcaster.broadcast('settings:updated', { audioSetting: updated });

    return res.json({
      success: true,
      message: 'Custom personal audio recording saved successfully.',
      settings: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/audio/delete-custom-recording - Admin removes custom recording
router.delete('/delete-custom-recording', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateAudioSetting({
      customRecordingBase64: undefined,
      customRecordingMimeType: undefined,
      customRecordingDuration: undefined,
      customRecordingName: undefined,
      customRecordingCreatedAt: undefined,
      customRecordingRecordedBy: undefined,
      ttsProvider: 'ADDIS_AI',
      voiceMode: 'ADDIS_AI'
    });

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'DELETE_CUSTOM_AUDIO_RECORDING',
      entity: 'AudioSetting'
    });

    broadcaster.broadcast('settings:updated', { audioSetting: updated });

    return res.json({
      success: true,
      message: 'Custom personal audio recording removed. Reset to Addis AI.',
      settings: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/audio/test-voice - Test announcement using Addis AI Voice or Custom Recording (Admin only)
router.post('/test-voice', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { 
      text, 
      language = 'AMHARIC', 
      voice = 'aster', 
      speed = 1.0,
      mode = 'ADDIS_AI',
      customAudioBase64,
      customMimeType
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

    if (mode === 'CUSTOM_RECORDED' || customAudioBase64) {
      const audioSettings = db.getAudioSetting();
      const base64ToUse = customAudioBase64 || audioSettings.customRecordingBase64;
      const mimeToUse = customMimeType || audioSettings.customRecordingMimeType || 'audio/webm';

      if (base64ToUse) {
        return res.json({
          success: true,
          text: phrase,
          audioResult: {
            audioBase64: base64ToUse,
            mimeType: mimeToUse,
            source: 'CUSTOM_RECORDED',
            provider: 'Personal Recorded Voice Audio',
            latencyMs: 15
          }
        });
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
