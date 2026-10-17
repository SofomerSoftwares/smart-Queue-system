import { Request, Response, NextFunction } from 'express';
import { audioService } from './audio.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

export class AudioController {
  public getVoices(req: Request, res: Response) {
    const data = audioService.getVoices();
    return res.json({
      success: true,
      ...data
    });
  }

  public getSettings(req: Request, res: Response) {
    const settings = audioService.getSettings();
    return res.json({ success: true, settings });
  }

  public updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = audioService.updateSettings(req.body, req.user?.id, req.user?.name);
      return res.json({ success: true, settings: updated });
    } catch (err) {
      next(err);
    }
  }

  public broadcastPersonalRecording(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const payload = audioService.broadcastPersonalRecording({
        ...req.body,
        userId: req.user?.id,
        userName: req.user?.name || req.user?.username
      });
      return res.json({
        success: true,
        message: `Personal voice announcement for Ticket ${payload.ticketNumber} broadcasted successfully.`,
        payload
      });
    } catch (err) {
      next(err);
    }
  }

  public saveCustomRecording(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = audioService.saveCustomRecording({
        ...req.body,
        userId: req.user?.id,
        userName: req.user?.name
      });
      return res.json({
        success: true,
        message: 'Custom personal audio recording saved successfully.',
        settings: updated
      });
    } catch (err) {
      next(err);
    }
  }

  public deleteCustomRecording(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = audioService.deleteCustomRecording(req.user?.id, req.user?.name);
      return res.json({
        success: true,
        message: 'Custom personal audio recording removed. Reset to Addis AI.',
        settings: updated
      });
    } catch (err) {
      next(err);
    }
  }

  public async testVoice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await audioService.testVoice(req.body);
      return res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  public async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, language = 'AMHARIC', voice = 'aster', speed = 1.0 } = req.body;
      const audioResult = await audioService.generateSpeech(text, language, voice, speed);
      return res.json({ success: true, audioResult });
    } catch (err) {
      next(err);
    }
  }
}

export const audioController = new AudioController();
