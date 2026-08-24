import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { geminiMusicProvider, getLocalPresetTracks } from '../services/music.service.js';
import { addisVoiceService } from '../services/addisVoice.service.js';
import { AudioAsset } from '../types.js';
import { broadcaster } from '../websocket.js';

const router = Router();

// GET /api/audio/settings
router.get('/settings', (req: Request, res: Response) => {
  const settings = db.getAudioSetting();
  res.json({ success: true, settings });
});

// GET /api/audio/addis-voice/status
router.get('/addis-voice/status', (req: Request, res: Response) => {
  const status = addisVoiceService.getStatus();
  res.json({ success: true, status });
});

// GET /api/audio/addis-voice/voices
router.get('/addis-voice/voices', (req: Request, res: Response) => {
  const voices = addisVoiceService.getVoices();
  res.json({ success: true, voices });
});

// POST /api/audio/addis-voice/synthesize
router.post('/addis-voice/synthesize', async (req: Request, res: Response) => {
  try {
    const { text, language, voice, speed } = req.body;
    const result = await addisVoiceService.synthesize({ text, language, voice, speed });
    res.json({ success: result.success, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/audio/addis-voice/test
router.post('/addis-voice/test', authenticate, authorize('audio.manage'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, voice, speed, language } = req.body;
    const sampleText = text || 'ቁጥር ሀ ሃያ አራት ያላችሁ ደንበኛ ወደ ቆጣሪ ሁለት ይሂዱ።';
    const result = await addisVoiceService.synthesize({
      text: sampleText,
      voice: voice || 'aster',
      speed: speed || 1.0,
      language: language || 'am'
    });

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'TEST_ADDIS_VOICE',
      entity: 'AudioSetting',
      metadata: { text: sampleText, voice, provider: result.provider }
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
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

// GET /api/audio/assets
router.get('/assets', (req: Request, res: Response) => {
  const assets = db.getAudioAssets();
  res.json({ success: true, assets });
});

// POST /api/audio/assets/reset-defaults (Restore default background music tracks)
router.post('/assets/reset-defaults', authenticate, authorize('audio.manage'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const defaults = getLocalPresetTracks();
    const existing = db.getAudioAssets();
    
    // Add default tracks that don't exist yet
    for (const d of defaults) {
      if (!existing.some(a => a.id === d.id)) {
        db.addAudioAsset(d);
      }
    }

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'RESTORE_DEFAULT_AUDIO_ASSETS',
      entity: 'AudioAsset'
    });

    const updated = db.getAudioAssets();
    res.json({ success: true, assets: updated, message: 'Default background music tracks restored to database.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/audio/music/generate
router.post('/music/generate', authenticate, authorize('audio.manage'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, model } = req.body;
    const result = await geminiMusicProvider.generateMusic(prompt, model);

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'GENERATE_AI_MUSIC',
      entity: 'AudioAsset',
      metadata: { prompt, source: result.source }
    });

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/audio/music/upload
router.post('/music/upload', authenticate, authorize('audio.manage'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, base64Data, mimeType, durationSeconds } = req.body;

    if (!title || !base64Data) {
      return res.status(400).json({ success: false, message: 'Title and audio data are required.' });
    }

    const asset: AudioAsset = {
      id: `music-upl-${Date.now()}`,
      title,
      type: 'MUSIC',
      url: base64Data.startsWith('data:') ? base64Data : `data:${mimeType || 'audio/mp3'};base64,${base64Data}`,
      source: 'UPLOAD',
      durationSeconds: durationSeconds || 120,
      createdAt: new Date().toISOString()
    };

    db.addAudioAsset(asset);

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'UPLOAD_AUDIO',
      entity: 'AudioAsset',
      entityId: asset.id,
      metadata: { title }
    });

    res.status(201).json({ success: true, asset });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/audio/assets/:id
router.delete('/assets/:id', authenticate, authorize('audio.manage'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ok = db.deleteAudioAsset(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Audio asset not found.' });
    }

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'DELETE_AUDIO_ASSET',
      entity: 'AudioAsset',
      entityId: id
    });

    res.json({ success: true, message: 'Audio asset deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
