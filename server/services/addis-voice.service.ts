import { db } from '../db.js';
import {
  LATIN_PREFIX_TO_AMHARIC,
  transliterateToPhonetic,
  formatTicketNumberAmharic,
  buildAmharicAnnouncement,
  buildEnglishAnnouncement
} from '../lib/amharic.js';

export interface AudioResult {
  audioBase64?: string;
  mimeType: string;
  text: string;
  phoneticText?: string;
  source: 'ADDIS_AI' | 'CACHE' | 'SYNTHESIS_FALLBACK';
  voice?: string;
  provider?: string;
  durationEstimateSeconds?: number;
  diagnostic?: string;
}

export interface AddisVoiceOption {
  id: string;
  apiVoiceId?: string;
  name: string;
  nameAmharic: string;
  gender: 'FEMALE' | 'MALE';
  description: string;
  descriptionAmharic: string;
}

export const ADDIS_AI_VOICES: AddisVoiceOption[] = [
  {
    id: 'aster',
    apiVoiceId: 'am-aster',
    name: 'Aster (Natural Amharic)',
    nameAmharic: 'አስቴር (የተረጋጋ የሴት ድምፅ)',
    gender: 'FEMALE',
    description: 'Crisp, calm female Amharic voice optimized for public halls and counters',
    descriptionAmharic: 'ለአዳራሽ እና ለመስኮት ጥሪዎች የተዘጋጀ የሴት ድምፅ'
  },
  {
    id: 'abebe',
    apiVoiceId: 'am-abebe',
    name: 'Abebe (Clear Amharic)',
    nameAmharic: 'አበበ (ግልፅ የወንድ ድምፅ)',
    gender: 'MALE',
    description: 'Deep and clear male Amharic voice with high speech intelligibility',
    descriptionAmharic: 'ግልፅ እና ጎላ ያለ ይፋዊ የወንድ ድምፅ'
  },
  {
    id: 'selam',
    apiVoiceId: 'am-selam',
    name: 'Selam (Expressive Amharic)',
    nameAmharic: 'ሰላም (ደማቅ የሴት ድምፅ)',
    gender: 'FEMALE',
    description: 'Warm and welcoming female voice for customer service desks',
    descriptionAmharic: 'ሞቅ ያለ እና እንግዳ ተቀባይ የሴት ድምፅ'
  },
  {
    id: 'dawit',
    apiVoiceId: 'am-dawit',
    name: 'Dawit (Official Amharic)',
    nameAmharic: 'ዳዊት (ይፋዊ የወንድ ድምፅ)',
    gender: 'MALE',
    description: 'Authoritative and formal male voice suitable for government and banking',
    descriptionAmharic: 'ለመንግስት እና ለባንክ ተቋማት የሚመጥን የወንድ ድምፅ'
  }
];

// Prefix letter to Amharic letter map
export const PREFIX_TO_AMHARIC = LATIN_PREFIX_TO_AMHARIC;

export function getAmharicTicketNumber(ticketNumber: string): string {
  return formatTicketNumberAmharic(ticketNumber);
}

export function buildAmharicAnnouncementText(ticketNumber: string, counterNumber: number, serviceNameAmharic?: string): string {
  return buildAmharicAnnouncement(ticketNumber, counterNumber, serviceNameAmharic);
}

export function buildEnglishAnnouncementText(ticketNumber: string, counterNumber: number, serviceName?: string): string {
  return buildEnglishAnnouncement(ticketNumber, counterNumber, serviceName);
}

export function buildPhoneticAnnouncementText(ticketNumber: string, counterNumber: number, serviceName?: string): string {
  const amharicText = buildAmharicAnnouncement(ticketNumber, counterNumber, serviceName);
  return transliterateToPhonetic(amharicText);
}

/**
 * Addis AI Voice & Speech Provider
 * Backend Text-to-Speech service for Amharic and multi-lingual queue announcements
 */
export class AddisAIVoiceProvider {
  private cache = new Map<string, { audioBase64: string; mimeType: string; timestamp: number }>();

  /**
   * Main speech generation method
   */
  public async generateSpeech(
    text: string,
    language: string = 'AMHARIC',
    voiceId: string = 'aster',
    speed: number = 1.0
  ): Promise<AudioResult> {
    const cleanText = text.trim();
    const normalizedVoice = voiceId || 'aster';
    const cacheKey = `ADDIS_VOICE:${language}:${normalizedVoice}:${speed}:${cleanText.toLowerCase()}`;

    // 1. Check in-memory persistent cache for instant audio replay
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return {
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        text: cleanText,
        source: 'CACHE',
        voice: normalizedVoice,
        provider: 'Addis AI Voice (Cached Audio)',
        durationEstimateSeconds: 4,
        diagnostic: 'Audio served instantly from high-speed cache'
      };
    }

    const matchedVoice = ADDIS_AI_VOICES.find(v => v.id === normalizedVoice) || ADDIS_AI_VOICES[0];
    const resolvedApiVoice = matchedVoice.apiVoiceId || matchedVoice.id;

    // 2. Call Addis AI Voice Backend API
    const setting = db.getAudioSetting();
    const apiKey = ((setting as any)?.addisAiApiKey || process.env.ADDIS_AI_API_KEY || '').trim();
    let configuredEndpoint = (setting?.addisAiEndpoint || process.env.ADDIS_AI_ENDPOINT || 'https://api.addisassistant.com/api/v1/voice/generations').trim();

    // Automatically correct invalid or outdated routes (e.g. /v1/audio/speech -> /api/v1/voice/generations)
    if (configuredEndpoint.includes('api.addisassistant.com/v1/audio/speech') || configuredEndpoint.endsWith('addisassistant.com') || configuredEndpoint.endsWith('addisassistant.com/')) {
      configuredEndpoint = 'https://api.addisassistant.com/api/v1/voice/generations';
    }

    let apiDiagnostic = '';
    const hasValidKey = apiKey.length >= 8 && !apiKey.startsWith('MY_') && !apiKey.startsWith('your_');

    if (hasValidKey) {
      // List of candidate endpoints to try in order
      const candidateEndpoints = [
        configuredEndpoint,
        'https://api.addisassistant.com/api/v1/voice/generations',
        'https://api.addisassistant.com/api/v1/audio'
      ];
      const endpointsToTry = Array.from(new Set(candidateEndpoints));

      for (const endpoint of endpointsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 7000);

          // Send payload compatible with Addis Voices 2 (/api/v1/voice/generations)
          const requestBody = {
            text: cleanText,
            voice_id: resolvedApiVoice,
            voice: resolvedApiVoice,
            language: language === 'AMHARIC' ? 'am' : 'en',
            output_format: 'mp3',
            format: 'mp3',
            speed: Number(speed) || 1.0,
            model: 'addis-voices-2',
            input: cleanText
          };

          const headers: Record<string, string> = {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json, audio/mpeg, audio/mp3, audio/wav, */*'
          };

          // Addis Assistant accepts x-api-key or Bearer JWT token
          if (apiKey.startsWith('eyJ')) {
            headers['Authorization'] = `Bearer ${apiKey}`;
          }

          const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            
            if (contentType.includes('application/json') || contentType.includes('text/json')) {
              const json = await response.json();
              let audioData = json.audio || json.audio_base64 || json.audioBase64 || json.data || json.audio_content;
              const audioUrl = json.url || json.audio_url || json.download_url;

              // If API returned a URL instead of inline base64, fetch the audio binary
              if (!audioData && audioUrl && typeof audioUrl === 'string') {
                try {
                  const urlResp = await fetch(audioUrl);
                  if (urlResp.ok) {
                    const buf = await urlResp.arrayBuffer();
                    audioData = Buffer.from(buf).toString('base64');
                  }
                } catch (e: any) {
                  console.warn('Could not fetch audio URL from Addis AI:', e.message);
                }
              }

              if (audioData && typeof audioData === 'string') {
                const audioBase64 = audioData.startsWith('data:') 
                  ? audioData.split(',')[1] 
                  : audioData;
                const mimeType = json.mime_type || json.mimeType || (audioData.startsWith('data:audio/wav') ? 'audio/wav' : 'audio/mp3');

                this.cache.set(cacheKey, {
                  audioBase64,
                  mimeType,
                  timestamp: Date.now()
                });

                console.log(`✅ [Addis AI Voice] Successfully synthesized audio via ${endpoint}`);
                return {
                  audioBase64,
                  mimeType,
                  text: cleanText,
                  source: 'ADDIS_AI',
                  voice: normalizedVoice,
                  provider: `Addis AI (${matchedVoice.name})`,
                  durationEstimateSeconds: 5,
                  diagnostic: `Connected to Addis AI (${endpoint})`
                };
              }
            } else {
              const arrayBuffer = await response.arrayBuffer();
              if (arrayBuffer.byteLength > 0) {
                const audioBase64 = Buffer.from(arrayBuffer).toString('base64');
                const mimeType = contentType.includes('audio') ? contentType : 'audio/mp3';
                
                this.cache.set(cacheKey, {
                  audioBase64,
                  mimeType,
                  timestamp: Date.now()
                });

                console.log(`✅ [Addis AI Voice] Successfully received audio stream via ${endpoint}`);
                return {
                  audioBase64,
                  mimeType,
                  text: cleanText,
                  source: 'ADDIS_AI',
                  voice: normalizedVoice,
                  provider: `Addis AI (${matchedVoice.name})`,
                  durationEstimateSeconds: 5,
                  diagnostic: `Direct Addis AI Cloud Audio Stream (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`
                };
              }
            }
          } else {
            const errText = await response.text().catch(() => '');
            
            // If Unauthorized or Forbidden, break immediately instead of hammering candidate endpoints
            if (response.status === 401 || response.status === 403) {
              apiDiagnostic = `Addis AI API Key is unauthorized or expired (HTTP ${response.status}). Seamlessly using phonetic voice synthesis.`;
              console.info(`ℹ️ [Addis AI Voice] ${apiDiagnostic}`);
              break;
            }

            apiDiagnostic = `Addis AI API HTTP ${response.status} (${endpoint}): ${errText.substring(0, 80)}`;
            // Continue to try next candidate endpoint on 404/405
            if (response.status === 404 || response.status === 405) {
              continue;
            }
          }
        } catch (err: any) {
          apiDiagnostic = `Addis AI cloud notice: ${err.message || 'Connection timeout'}`;
        }
      }
    } else {
      apiDiagnostic = 'Phonetic Amharic speech synthesis active (Configure Addis AI API Key in Admin for cloud voices)';
    }

    // 3. Fallback for client-side browser speech synthesis
    const phonetic = transliterateToPhonetic(cleanText);
    return {
      text: cleanText,
      phoneticText: phonetic,
      mimeType: 'audio/wav',
      source: 'SYNTHESIS_FALLBACK',
      voice: normalizedVoice,
      provider: `Addis AI Voice (${matchedVoice.name})`,
      durationEstimateSeconds: 4,
      diagnostic: apiDiagnostic || 'Phonetic browser speech synthesis active'
    };
  }

  public getAvailableVoices(): AddisVoiceOption[] {
    return ADDIS_AI_VOICES;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const addisVoiceProvider = new AddisAIVoiceProvider();
