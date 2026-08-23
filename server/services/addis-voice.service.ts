import { db } from '../db.js';

export interface AudioResult {
  audioBase64?: string;
  mimeType: string;
  text: string;
  source: 'ADDIS_AI' | 'CACHE' | 'SYNTHESIS_FALLBACK';
  voice?: string;
  provider?: string;
  durationEstimateSeconds?: number;
}

export interface AddisVoiceOption {
  id: string;
  name: string;
  nameAmharic: string;
  gender: 'FEMALE' | 'MALE';
  description: string;
  descriptionAmharic: string;
}

export const ADDIS_AI_VOICES: AddisVoiceOption[] = [
  {
    id: 'aster',
    name: 'Aster (Natural Amharic)',
    nameAmharic: 'አስቴር (የተረጋጋ የሴት ድምፅ)',
    gender: 'FEMALE',
    description: 'Crisp, calm female Amharic voice optimized for public halls and counters',
    descriptionAmharic: 'ለአዳራሽ እና ለቆጣሪ ጥሪዎች የተዘጋጀ የሴት ድምፅ'
  },
  {
    id: 'abebe',
    name: 'Abebe (Clear Amharic)',
    nameAmharic: 'አበበ (ግልፅ የወንድ ድምፅ)',
    gender: 'MALE',
    description: 'Deep and clear male Amharic voice with high speech intelligibility',
    descriptionAmharic: 'ግልፅ እና ጎላ ያለ ይፋዊ የወንድ ድምፅ'
  },
  {
    id: 'selam',
    name: 'Selam (Expressive Amharic)',
    nameAmharic: 'ሰላም (ደማቅ የሴት ድምፅ)',
    gender: 'FEMALE',
    description: 'Warm and welcoming female voice for customer service desks',
    descriptionAmharic: 'ሞቅ ያለ እና እንግዳ ተቀባይ የሴት ድምፅ'
  },
  {
    id: 'dawit',
    name: 'Dawit (Official Amharic)',
    nameAmharic: 'ዳዊት (ይፋዊ የወንድ ድምፅ)',
    gender: 'MALE',
    description: 'Authoritative and formal male voice suitable for government and banking',
    descriptionAmharic: 'ለመንግስት እና ለባንክ ተቋማት የሚመጥን የወንድ ድምፅ'
  }
];

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

/**
 * Generates an audio chime + acoustic notification WAV buffer
 */
function createChimeWavBase64(sampleRate: number = 22050): string {
  const duration = 1.2;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Two-tone chime: 587.33 Hz (D5) then 880 Hz (A5)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    if (t < 0.45) {
      const decay = Math.exp(-t * 5.0);
      sample = Math.sin(2 * Math.PI * 587.33 * t) * decay * 0.7;
    } else {
      const t2 = t - 0.45;
      const decay = Math.exp(-t2 * 4.0);
      sample = Math.sin(2 * Math.PI * 880.0 * t2) * decay * 0.85;
    }
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 30000)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer.toString('base64');
}

/**
 * Addis AI Voice & Speech Provider
 * Primary speech engine for Amharic and multi-lingual queue announcements
 */
export class AddisAIVoiceProvider {
  private cache = new Map<string, { audioBase64: string; mimeType: string; timestamp: number }>();
  private defaultChimeBase64: string;

  constructor() {
    this.defaultChimeBase64 = createChimeWavBase64();
  }

  /**
   * Main speech generation method
   */
  public async generateSpeech(
    text: string,
    language: string = 'AMHARIC',
    voice: string = 'aster',
    speed: number = 1.0
  ): Promise<AudioResult> {
    const cleanText = text.trim();
    const cacheKey = `ADDIS_AI:${language}:${voice}:${speed}:${cleanText.toLowerCase()}`;

    // 1. Check in-memory persistent cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return {
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        text: cleanText,
        source: 'CACHE',
        voice,
        provider: 'Addis AI Voice',
        durationEstimateSeconds: 4
      };
    }

    // 2. Try calling Addis AI Voice API if API key or endpoint is configured
    const setting = db.getAudioSetting();
    const apiKey = (setting as any)?.addisAiApiKey || process.env.ADDIS_AI_API_KEY;
    const endpoint = setting?.addisAiEndpoint || process.env.ADDIS_AI_ENDPOINT || 'https://api.addis.ai/v1/tts';

    if (apiKey && apiKey !== 'MY_ADDIS_AI_API_KEY' && apiKey.trim().length > 0) {
      try {
        console.log(`🎙️ [Addis AI Voice] Requesting Amharic speech from ${endpoint} (voice: ${voice})...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: cleanText,
            voice: voice || 'aster',
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
              voice,
              provider: 'Addis AI Voice',
              durationEstimateSeconds: 5
            };
          }
        } else {
          const errText = await response.text().catch(() => '');
          console.warn(`⚠️ [Addis AI Voice] API returned status ${response.status}: ${errText.slice(0, 100)}`);
        }
      } catch (err: any) {
        console.warn(`⚠️ [Addis AI Voice] Remote API response notice (${err.message}). Using fallback speech generation.`);
      }
    }

    // 3. Zero-dependency audio chime announcement (with client browser synthesis)
    return {
      audioBase64: this.defaultChimeBase64,
      mimeType: 'audio/wav',
      text: cleanText,
      source: 'SYNTHESIS_FALLBACK',
      voice,
      provider: 'Addis AI Voice',
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
