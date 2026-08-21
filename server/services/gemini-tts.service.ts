import { GoogleGenAI, Modality } from '@google/genai';
import { db } from '../db.js';

export interface AudioResult {
  audioBase64?: string;
  mimeType: string;
  text: string;
  source: 'GEMINI_TTS' | 'CACHE' | 'FALLBACK_SYNTHESIS';
  durationEstimateSeconds?: number;
}

export interface VoiceProvider {
  generateSpeech(
    text: string,
    language: string,
    voice?: string,
    model?: string
  ): Promise<AudioResult>;
}

// Prefix letter to Amharic letter map
export const PREFIX_TO_AMHARIC: Record<string, string> = {
  A: 'ሀ',
  B: 'ለ',
  C: 'ቸ',
  D: 'ደ',
  E: 'አ',
  F: 'ፈ',
  G: 'ገ',
  H: 'ሐ',
  P: 'ፓ',
  R: 'ረ',
  S: 'ሰ',
  T: 'ተ',
  W: 'ወ',
  Z: 'ዘ'
};

export function getAmharicTicketNumber(ticketNumber: string): string {
  const parts = ticketNumber.split('-');
  if (parts.length === 2) {
    const prefix = parts[0].toUpperCase();
    const num = parts[1];
    const amharicLetter = PREFIX_TO_AMHARIC[prefix] || prefix;
    return `${amharicLetter}-${num}`;
  }
  return ticketNumber;
}

export function buildAmharicAnnouncementText(ticketNumber: string, counterNumber: number, serviceNameAmharic?: string): string {
  const amharicTicket = getAmharicTicketNumber(ticketNumber);
  if (serviceNameAmharic) {
    return `ቁጥር ${amharicTicket} ያላችሁ ደንበኛ ለ${serviceNameAmharic}፣ እባክዎ ወደ ቆጣሪ ቁጥር ${counterNumber} ይሂዱ።`;
  }
  return `ቁጥር ${amharicTicket} ያላችሁ ደንበኛ፣ እባክዎ ወደ ቆጣሪ ቁጥር ${counterNumber} ይሂዱ።`;
}

export function buildEnglishAnnouncementText(ticketNumber: string, counterNumber: number, serviceName?: string): string {
  if (serviceName) {
    return `Ticket number ${ticketNumber} for ${serviceName}, please proceed to Counter ${counterNumber}.`;
  }
  return `Ticket number ${ticketNumber}, please proceed to Counter ${counterNumber}.`;
}

function pcmToWavBase64(pcmBase64: string, sampleRate: number = 24000, channels: number = 1, bitsPerSample: number = 16): string {
  try {
    const pcmBuffer = Buffer.from(pcmBase64, 'base64');
    
    // If it already has a RIFF header, return as is
    if (pcmBuffer.length > 4 && pcmBuffer.toString('utf8', 0, 4) === 'RIFF') {
      return pcmBase64;
    }

    const byteRate = (sampleRate * channels * bitsPerSample) / 8;
    const blockAlign = (channels * bitsPerSample) / 8;
    const dataSize = pcmBuffer.length;
    const chunkSize = 36 + dataSize;

    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(chunkSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size for PCM
    header.writeUInt16LE(1, 20);  // AudioFormat 1 = PCM
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    const wavBuffer = Buffer.concat([header, pcmBuffer]);
    return wavBuffer.toString('base64');
  } catch {
    return pcmBase64;
  }
}

class GeminiVoiceProvider implements VoiceProvider {
  private cache = new Map<string, { audioBase64: string; mimeType: string; timestamp: number }>();
  private aiClient: GoogleGenAI | null = null;
  private rateLimitCooldownUntil: number = 0;

  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return null;
    }
    if (!this.aiClient) {
      this.aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
    return this.aiClient;
  }

  public async generateSpeech(
    text: string,
    language: string = 'AMHARIC',
    voice: string = 'Kore',
    model: string = 'gemini-3.1-flash-tts-preview'
  ): Promise<AudioResult> {
    const cleanText = text.trim();
    const cacheKey = `${language}:${voice}:${cleanText.toLowerCase()}`;
    
    // 1. Check in-memory persistent cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return {
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        text: cleanText,
        source: 'CACHE',
        durationEstimateSeconds: 4
      };
    }

    // 2. Check if we are in a rate-limit / 429 quota cooldown period
    const now = Date.now();
    if (now < this.rateLimitCooldownUntil) {
      const remainingSeconds = Math.ceil((this.rateLimitCooldownUntil - now) / 1000);
      console.warn(`[Gemini TTS] Rate limit cooldown active (${remainingSeconds}s remaining). Using local voice synthesis fallback.`);
      return {
        mimeType: 'audio/wav',
        text: cleanText,
        source: 'FALLBACK_SYNTHESIS',
        durationEstimateSeconds: 3
      };
    }

    const ai = this.getClient();
    if (!ai) {
      console.warn('Gemini API Key is not configured in environment. Using fallback voice synthesis.');
      return {
        mimeType: 'audio/wav',
        text: cleanText,
        source: 'FALLBACK_SYNTHESIS',
        durationEstimateSeconds: 3
      };
    }

    try {
      // Formulate prompt for Gemini TTS
      let ttsPrompt = cleanText;
      if (language === 'AMHARIC') {
        ttsPrompt = `Please read the following Ethiopian Amharic queue announcement clearly, calmly, and professionally:\n"${cleanText}"`;
      } else {
        ttsPrompt = `Say clearly in a professional office queue tone: "${cleanText}"`;
      }

      const response = await ai.models.generateContent({
        model: model || 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: ttsPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice || 'Kore'
              }
            }
          }
        }
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
      let audioBase64 = audioPart?.inlineData?.data;
      let mimeType = audioPart?.inlineData?.mimeType || 'audio/wav';

      if (audioBase64) {
        let sampleRate = 24000;
        const rateMatch = mimeType.match(/rate=(\d+)/);
        if (rateMatch) {
          sampleRate = parseInt(rateMatch[1], 10) || 24000;
        }

        // Convert raw PCM to proper standard WAV audio
        if (mimeType.includes('pcm') || !audioBase64.startsWith('UklGR')) {
          audioBase64 = pcmToWavBase64(audioBase64, sampleRate);
          mimeType = 'audio/wav';
        }

        this.cache.set(cacheKey, {
          audioBase64,
          mimeType,
          timestamp: Date.now()
        });

        // Limit cache size to 500 entries
        if (this.cache.size > 500) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey) this.cache.delete(firstKey);
        }

        return {
          audioBase64,
          mimeType,
          text: cleanText,
          source: 'GEMINI_TTS',
          durationEstimateSeconds: 4
        };
      }

      return {
        mimeType: 'audio/wav',
        text: cleanText,
        source: 'FALLBACK_SYNTHESIS'
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      
      // Handle 429 Quota Exceeded / RESOURCE_EXHAUSTED smoothly
      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        // Extract retryDelay or default to 40 seconds cooldown
        let retrySeconds = 40;
        const match = errMsg.match(/retry in ([\d\.]+)s/i) || errMsg.match(/retryDelay":"(\d+)s"/i);
        if (match && match[1]) {
          retrySeconds = Math.ceil(parseFloat(match[1])) + 2;
        }
        this.rateLimitCooldownUntil = Date.now() + (retrySeconds * 1000);
        console.warn(`[Gemini TTS] Quota limit reached (Free tier RPM limit). Activating ${retrySeconds}s cooldown with seamless local speech fallback.`);
      } else {
        console.warn('[Gemini TTS] Announcement synthesis notice:', errMsg);
      }

      // Safe, resilient fallback ensuring zero interruption to queue flow
      return {
        mimeType: 'audio/wav',
        text: cleanText,
        source: 'FALLBACK_SYNTHESIS',
        durationEstimateSeconds: 3
      };
    }
  }
}

export const geminiVoiceProvider = new GeminiVoiceProvider();
