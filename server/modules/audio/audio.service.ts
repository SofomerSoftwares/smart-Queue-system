import { db } from '../../db.js';
import { broadcaster } from '../../sockets/broadcaster.js';
import { 
  addisVoiceProvider,
  ADDIS_AI_VOICES, 
  buildAmharicAnnouncementText, 
  buildEnglishAnnouncementText,
  buildPhoneticAnnouncementText,
  getAmharicTicketNumber
} from '../../services/addis-voice.service.js';
import { AnnouncementPayload, AudioSetting } from '../../../shared/types/index.js';
import { BadRequestError } from '../../errors/AppError.js';

export class AudioService {
  public getVoices() {
    return {
      provider: 'Addis AI Voice',
      voices: ADDIS_AI_VOICES
    };
  }

  public getSettings(): AudioSetting {
    return db.getAudioSetting();
  }

  public updateSettings(settings: Partial<AudioSetting>, userId?: string, userName?: string): AudioSetting {
    const updated = db.updateAudioSetting(settings);
    db.addAuditLog({
      userId,
      userName,
      action: 'UPDATE_AUDIO_SETTINGS',
      entity: 'AudioSetting',
      metadata: settings
    });

    broadcaster.broadcast('settings:updated', { audioSetting: updated });
    return updated;
  }

  public broadcastPersonalRecording(data: {
    audioBase64: string;
    mimeType?: string;
    ticketNumber?: string;
    counterNumber?: number;
    serviceName?: string;
    serviceNameAmharic?: string;
    customText?: string;
    language?: string;
    userId?: string;
    userName?: string;
  }) {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      ticketNumber = 'A-001',
      counterNumber = 1,
      serviceName = 'General Service',
      serviceNameAmharic = 'አጠቃላይ አገልግሎት',
      customText,
      language = 'AMHARIC',
      userId,
      userName
    } = data;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      throw new BadRequestError('Personal audio recording data (audioBase64) is required.');
    }

    const audioSettings = db.getAudioSetting();

    const payload: AnnouncementPayload = {
      ticketNumber,
      ticketNumberAmharic: getAmharicTicketNumber(ticketNumber),
      counterNumber: Number(counterNumber) || 1,
      serviceName,
      serviceNameAmharic,
      language: (language as any) || audioSettings.language || 'AMHARIC',
      textAmharic: customText || buildAmharicAnnouncementText(ticketNumber, counterNumber, serviceNameAmharic),
      textEnglish: customText || buildEnglishAnnouncementText(ticketNumber, counterNumber, serviceName),
      phoneticText: customText || buildPhoneticAnnouncementText(ticketNumber, counterNumber, serviceNameAmharic),
      audioBase64,
      audioMimeType: mimeType,
      source: 'OFFICER_LIVE_RECORDING',
      isLiveVoiceRecord: true,
      officerName: userName || 'Officer',
      customText,
      timestamp: new Date().toISOString()
    };

    broadcaster.broadcast('announcement:play', payload);

    db.addAuditLog({
      userId,
      userName,
      action: 'BROADCAST_PERSONAL_VOICE_RECORDING',
      entity: 'QueueAnnouncement',
      metadata: {
        ticketNumber,
        counterNumber,
        officer: userName,
        mimeType
      }
    });

    return payload;
  }

  public saveCustomRecording(data: {
    customRecordingBase64: string;
    customRecordingMimeType?: string;
    customRecordingDuration?: number;
    customRecordingName?: string;
    setAsActive?: boolean;
    userId?: string;
    userName?: string;
  }) {
    const {
      customRecordingBase64,
      customRecordingMimeType = 'audio/webm',
      customRecordingDuration = 0,
      customRecordingName = 'Default Office Voice Announcement',
      setAsActive = true,
      userId,
      userName
    } = data;

    if (!customRecordingBase64) {
      throw new BadRequestError('customRecordingBase64 is required.');
    }

    const updatePayload: any = {
      customRecordingBase64,
      customRecordingMimeType,
      customRecordingDuration,
      customRecordingName,
      customRecordingCreatedAt: new Date().toISOString(),
      customRecordingRecordedBy: userName || 'Administrator'
    };

    if (setAsActive) {
      updatePayload.ttsProvider = 'CUSTOM_RECORDED';
      updatePayload.voiceMode = 'CUSTOM_RECORDED';
    }

    const updated = db.updateAudioSetting(updatePayload);

    db.addAuditLog({
      userId,
      userName,
      action: 'SAVE_CUSTOM_AUDIO_RECORDING',
      entity: 'AudioSetting',
      metadata: { name: customRecordingName, duration: customRecordingDuration }
    });

    broadcaster.broadcast('settings:updated', { audioSetting: updated });
    return updated;
  }

  public deleteCustomRecording(userId?: string, userName?: string) {
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
      userId,
      userName,
      action: 'DELETE_CUSTOM_AUDIO_RECORDING',
      entity: 'AudioSetting'
    });

    broadcaster.broadcast('settings:updated', { audioSetting: updated });
    return updated;
  }

  public async testVoice(options: {
    text?: string;
    language?: string;
    voice?: string;
    speed?: number;
    mode?: string;
    customAudioBase64?: string;
    customMimeType?: string;
  }) {
    const { 
      text, 
      language = 'AMHARIC', 
      voice = 'aster', 
      speed = 1.0,
      mode = 'ADDIS_AI',
      customAudioBase64,
      customMimeType
    } = options;
    
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
        return {
          text: phrase,
          audioResult: {
            audioBase64: base64ToUse,
            mimeType: mimeToUse,
            source: 'CUSTOM_RECORDED',
            provider: 'Personal Recorded Voice Audio',
            latencyMs: 15
          }
        };
      }
    }

    const audioResult = await addisVoiceProvider.generateSpeech(phrase, language, voice, speed);
    return {
      text: phrase,
      audioResult
    };
  }

  public async generateSpeech(text: string, language = 'AMHARIC', voice = 'aster', speed = 1.0) {
    if (!text) {
      throw new BadRequestError('Text is required.');
    }
    return await addisVoiceProvider.generateSpeech(text, language, voice, speed);
  }
}

export const audioService = new AudioService();
