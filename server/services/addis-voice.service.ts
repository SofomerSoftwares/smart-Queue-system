import { GoogleGenAI, Modality } from '@google/genai';
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
  source: 'ADDIS_AI' | 'GEMINI_TTS' | 'CACHE' | 'SYNTHESIS_FALLBACK';
  voice?: string;
  provider?: string;
  durationEstimateSeconds?: number;
}

export interface AddisVoiceOption {
  id: string;
  name: string;
  nameAmharic: string;
  gender: 'FEMALE' | 'MALE';
  geminiVoice: string;
  description: string;
  descriptionAmharic: string;
}

export const ADDIS_AI_VOICES: AddisVoiceOption[] = [
  {
    id: 'aster',
    name: 'Aster (Natural Amharic)',
    nameAmharic: 'አስቴር (የተረጋጋ የሴት ድምፅ)',
    gender: 'FEMALE',
    geminiVoice: 'Kore',
    description: 'Crisp, calm female Amharic voice optimized for public halls and counters',
    descriptionAmharic: 'ለአዳራሽ እና ለቆጣሪ ጥሪዎች የተዘጋጀ የሴት ድምፅ'
  },
  {
    id: 'abebe',
    name: 'Abebe (Clear Amharic)',
    nameAmharic: 'አበበ (ግልፅ የወንድ ድምፅ)',
    gender: 'MALE',
    geminiVoice: 'Charon',
    description: 'Deep and clear male Amharic voice with high speech intelligibility',
    descriptionAmharic: 'ግልፅ እና ጎላ ያለ ይፋዊ የወንድ ድምፅ'
  },
  {
    id: 'selam',
    name: 'Selam (Expressive Amharic)',
    nameAmharic: 'ሰላም (ደማቅ የሴት ድምፅ)',
    gender: 'FEMALE',
    geminiVoice: 'Zephyr',
    description: 'Warm and welcoming female voice for customer service desks',
    descriptionAmharic: 'ሞቅ ያለ እና እንግዳ ተቀባይ የሴት ድምፅ'
  },
  {
    id: 'dawit',
    name: 'Dawit (Official Amharic)',
    nameAmharic: 'ዳዊት (ይፋዊ የወንድ ድምፅ)',
    gender: 'MALE',
    geminiVoice: 'Puck',
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
 * Wraps raw 16-bit PCM audio samples in a standard 44-byte RIFF/WAVE header
 */
function pcmToWavBase64(pcmBuffer: Buffer, sampleRate: number = 24000, channels: number = 1, bitsPerSample: number = 16): string {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]).toString('base64');
}

/**
 * Addis AI Voice & Speech Provider
 * Primary speech engine for Amharic and multi-lingual queue announcements
 */
export class AddisAIVoiceProvider {
  private cache = new Map<string, { audioBase64: string; mimeType: string; timestamp: number }>();
  private aiClient: GoogleGenAI | null = null;

  private getGenAI(): GoogleGenAI | null {
    if (!this.aiClient && process.env.GEMINI_API_KEY) {
      this.aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return this.aiClient;
  }

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
    const cacheKey = `ADDIS_VOICE:${language}:${voiceId}:${speed}:${cleanText.toLowerCase()}`;

    // 1. Check in-memory persistent cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return {
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        text: cleanText,
        source: 'CACHE',
        voice: voiceId,
        provider: 'Addis AI Voice Engine (Cached)',
        durationEstimateSeconds: 4
      };
    }

    const matchedVoice = ADDIS_AI_VOICES.find(v => v.id === voiceId) || ADDIS_AI_VOICES[0];

    // 2. Try calling Addis AI Voice API if API key or custom endpoint is configured
    const setting = db.getAudioSetting();
    const apiKey = (setting as any)?.addisAiApiKey || process.env.ADDIS_AI_API_KEY;
    const endpoint = setting?.addisAiEndpoint || process.env.ADDIS_AI_ENDPOINT || 'https://api.addis.ai/v1/tts';

    if (apiKey && apiKey !== 'MY_ADDIS_AI_API_KEY' && apiKey.trim().length > 0) {
      try {
        console.log(`🎙️ [Addis AI Voice] Requesting Amharic speech from ${endpoint} (voice: ${voiceId})...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: cleanText,
            voice: voiceId || 'aster',
            language: language === 'AMHARIC' ? 'am' : 'en',
            speed: speed || 1.0,
            format: 'mp3'
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          if (arrayBuffer.byteLength > 0) {
            const audioBase64 = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = response.headers.get('content-type') || 'audio/mp3';
            
            this.cache.set(cacheKey, {
              audioBase64,
              mimeType,
              timestamp: Date.now()
            });

            return {
              audioBase64,
              mimeType,
              text: cleanText,
              source: 'ADDIS_AI',
              voice: voiceId,
              provider: `Addis AI (${matchedVoice.name})`,
              durationEstimateSeconds: 5
            };
          }
        }
      } catch (err: any) {
        console.warn(`⚠️ [Addis AI Voice] Remote API response notice (${err.message}). Trying Gemini TTS engine.`);
      }
    }

    // 3. Try Gemini Text-to-Speech API
    const ai = this.getGenAI();
    if (ai) {
      try {
        console.log(`🎙️ [Gemini TTS Engine] Synthesizing announcement voice (${matchedVoice.geminiVoice})...`);
        const promptInstruction = language === 'AMHARIC'
          ? `Read the following queue announcement clearly in a professional public service announcement tone: "${cleanText}"`
          : `Read the following queue announcement clearly and politely: "${cleanText}"`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: promptInstruction }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: matchedVoice.geminiVoice }
              }
            }
          }
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const rawAudioBase64 = part?.inlineData?.data;
        const responseMime = part?.inlineData?.mimeType || 'audio/pcm;rate=24000';

        if (rawAudioBase64 && rawAudioBase64.length > 0) {
          let playableBase64 = rawAudioBase64;
          let finalMime = responseMime;

          // Convert raw PCM into standard WAV container if needed
          if (responseMime.includes('pcm') || !responseMime.includes('wav') && !responseMime.includes('mp3')) {
            const rawPcm = Buffer.from(rawAudioBase64, 'base64');
            playableBase64 = pcmToWavBase64(rawPcm, 24000, 1, 16);
            finalMime = 'audio/wav';
          }

          this.cache.set(cacheKey, {
            audioBase64: playableBase64,
            mimeType: finalMime,
            timestamp: Date.now()
          });

          return {
            audioBase64: playableBase64,
            mimeType: finalMime,
            text: cleanText,
            source: 'GEMINI_TTS',
            voice: voiceId,
            provider: `Addis AI Voice • Powered by Gemini (${matchedVoice.name})`,
            durationEstimateSeconds: 4
          };
        }
      } catch (err: any) {
        console.warn(`⚠️ [Gemini TTS Engine] Notice (${err.message}). Using client speech synthesis fallback.`);
      }
    }

    // 4. Fallback for client-side browser speech synthesis & acoustic announcement
    return {
      text: cleanText,
      mimeType: 'audio/wav',
      source: 'SYNTHESIS_FALLBACK',
      voice: voiceId,
      provider: 'Addis AI Voice (Browser Synthesis)',
      durationEstimateSeconds: 3
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
