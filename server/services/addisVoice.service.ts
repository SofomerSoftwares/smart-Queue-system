import { AddisVoiceOption, AddisVoiceSynthesizeResponse } from '../types.js';

export const ADDIS_VOICES: AddisVoiceOption[] = [
  {
    id: 'aster',
    name: 'Aster',
    nameAmharic: 'አስቴር',
    gender: 'FEMALE',
    language: 'am',
    description: 'Natural & clear Amharic female voice, ideal for reception announcements',
    descriptionAmharic: 'የተረጋጋ እና ግልፅ የአማርኛ የሴት ድምፅ - ለደንበኞች ጥሪ ተመራጭ',
    samplePhrase: 'ቁጥር ሀ ሃያ አራት ያላችሁ ደንበኛ ወደ ቆጣሪ ሁለት ይሂዱ'
  },
  {
    id: 'abebe',
    name: 'Abebe',
    nameAmharic: 'አበበ',
    gender: 'MALE',
    language: 'am',
    description: 'Authoritative and articulate Amharic male voice',
    descriptionAmharic: 'ይፋዊ እና ጎላ ያለ የአማርኛ የወንድ ድምፅ',
    samplePhrase: 'ቁጥር ለ አስራ ሁለት ወደ ቆጣሪ አንድ ይሂዱ'
  },
  {
    id: 'selam',
    name: 'Selam',
    nameAmharic: 'ሰላም',
    gender: 'FEMALE',
    language: 'am',
    description: 'Warm, pleasant, and friendly Amharic tone',
    descriptionAmharic: 'ደማቅ፣ ተግባቢ እና አስደሳች የአማርኛ ድምፅ',
    samplePhrase: 'እንኳን ወደ ቢሮአችን በደህና መጡ'
  },
  {
    id: 'dawit',
    name: 'Dawit',
    nameAmharic: 'ዳዊት',
    gender: 'MALE',
    language: 'am',
    description: 'Official corporate queue broadcasting voice',
    descriptionAmharic: 'መደበኛ እና አስተማማኝ የቆጣሪ ጥሪ ድምፅ',
    samplePhrase: 'የተከበሩ ደንበኛ እባክዎ ወደ ቆጣሪ ሶስት ይሂዱ'
  },
  {
    id: 'tsehay',
    name: 'Tsehay',
    nameAmharic: 'ፀሐይ',
    gender: 'FEMALE',
    language: 'am',
    description: 'High intelligibility and crisp cadence for crowded lobbies',
    descriptionAmharic: 'ፈጣን፣ ግልፅ እና ለተጨናነቀ አዳራሽ ተስማሚ ድምፅ',
    samplePhrase: 'ቁጥር ሐ አምስት ወደ ቆጣሪ አራት ይቅረቡ'
  },
  {
    id: 'yared',
    name: 'Yared',
    nameAmharic: 'ያሬድ',
    gender: 'MALE',
    language: 'am',
    description: 'Deep resonant broadcast tone',
    descriptionAmharic: 'ጥልቅ እና የተረጋጋ የዜና እና የማስታወቂያ ድምፅ',
    samplePhrase: 'ቀጣይ ቁጥር ወደ ቆጣሪ ሁለት ይሂዱ'
  },
  {
    id: 'chala',
    name: 'Chala',
    nameAmharic: 'ጫላ (Afaan Oromo)',
    gender: 'MALE',
    language: 'om',
    description: 'Fluent Afaan Oromo male voice for regional announcements',
    descriptionAmharic: 'ግልፅ እና ተደማጭ የአፋን ኦሮሞ የወንድ ድምፅ',
    samplePhrase: 'Lakkoofsa A digdami afur gara fuuldura lakkoofsa lamatti kottu'
  },
  {
    id: 'hawi',
    name: 'Hawi',
    nameAmharic: 'ሀዊ (Afaan Oromo)',
    gender: 'FEMALE',
    language: 'om',
    description: 'Natural Afaan Oromo female voice',
    descriptionAmharic: 'ደማቅ እና የተረጋጋ የአፋን ኦሮሞ የሴት ድምፅ',
    samplePhrase: 'Baga nagaan dhuftan gara tajaajila lakkoofsa tokkootti dhiyaadhaa'
  }
];

export function sanitizeApiUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'https://api.addisassistant.com/api/v1/audio';
  }
  let cleaned = rawUrl.trim();
  // Strip leading/trailing brackets, parenthesis, quotes, semicolons, commas, backticks
  cleaned = cleaned.replace(/^[\s\(\[\{<"';,`]+/, '').replace(/[\s\)\]\}>"';,`]+$/, '').trim();
  
  if (!cleaned) {
    return 'https://api.addisassistant.com/api/v1/audio';
  }
  
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  
  try {
    const parsed = new URL(cleaned);
    return parsed.toString();
  } catch {
    return 'https://api.addisassistant.com/api/v1/audio';
  }
}

export function sanitizeApiKey(rawKey?: string): string {
  if (!rawKey || typeof rawKey !== 'string') return '';
  return rawKey.trim().replace(/^[\s\(\[\{<"';,`]+/, '').replace(/[\s\)\]\}>"';,`]+$/, '').trim();
}

export class AddisVoiceService {
  private defaultUrl: string;

  constructor() {
    this.defaultUrl = 'https://api.addisassistant.com/api/v1/audio';
  }

  public getStatus(customUrl?: string, customKey?: string) {
    const key = sanitizeApiKey(customKey || process.env.ADDIS_VOICE_API_KEY);
    const url = sanitizeApiUrl(customUrl || process.env.ADDIS_VOICE_API_URL || this.defaultUrl);

    return {
      configured: Boolean(key && key.length > 0),
      apiUrl: url,
      activeModel: 'Addis Voices 2 (አሌፍ-Audio-AM)',
      availableVoicesCount: ADDIS_VOICES.length,
      provider: key ? 'ADDIS_VOICE_API' : 'BROWSER_TTS_FALLBACK',
      fallbackReady: true
    };
  }

  public getVoices(): AddisVoiceOption[] {
    return ADDIS_VOICES;
  }

  public async synthesize(options: {
    text: string;
    language?: 'am' | 'om' | 'en';
    voice?: string;
    speed?: number;
    customUrl?: string;
    customKey?: string;
  }): Promise<AddisVoiceSynthesizeResponse> {
    const { text, language = 'am', voice = 'aster', speed = 1.0, customUrl, customKey } = options;
    const key = sanitizeApiKey(customKey || process.env.ADDIS_VOICE_API_KEY);
    const endpoint = sanitizeApiUrl(customUrl || process.env.ADDIS_VOICE_API_URL || this.defaultUrl);

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        provider: 'BROWSER_TTS_FALLBACK',
        message: 'Text cannot be empty'
      };
    }

    // If no API key is set, immediately return fallback smoothly
    if (!key || key.length === 0) {
      return {
        success: false,
        provider: 'BROWSER_TTS_FALLBACK',
        voice,
        language,
        message: 'Addis Voice API key is not configured. Seamlessly utilizing high-accuracy client speech synthesis.'
      };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': key,
        'Authorization': `Bearer ${key}`
      };

      const requestBody = {
        text: text.trim(),
        language: language === 'en' ? 'en' : (language === 'om' ? 'om' : 'am'),
        voice: voice || 'aster',
        speed: Number(speed) || 1.0
      };

      // Set a concise 4-second timeout to avoid announcement delays
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        // Handle network unreachable/DNS errors without breaking caller flow
        const isTimeout = fetchErr.name === 'AbortError';
        const reason = isTimeout ? 'Remote API timed out (>4s)' : 'Remote API unreachable';
        return {
          success: false,
          provider: 'BROWSER_TTS_FALLBACK',
          voice,
          language,
          message: `${reason}. Seamlessly playing via client speech synthesizer.`
        };
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          provider: 'BROWSER_TTS_FALLBACK',
          voice,
          language,
          message: `Addis Voice API returned status ${response.status}. Using client speech engine.`
        };
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();

      // If API returned binary audio stream
      if (contentType.includes('audio/') || contentType.includes('application/octet-stream')) {
        const arrayBuf = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const base64 = buffer.toString('base64');
        const mimeType = contentType.includes('mpeg') || contentType.includes('mp3') 
          ? 'audio/mp3' 
          : (contentType.includes('ogg') ? 'audio/ogg' : 'audio/wav');

        return {
          success: true,
          audioBase64: base64,
          mimeType,
          voice,
          language,
          provider: 'ADDIS_VOICE_API'
        };
      }

      // If API returned JSON
      const jsonData: any = await response.json().catch(() => null);

      if (jsonData) {
        const base64Data = 
          jsonData.audio_base64 ||
          jsonData.audioBase64 ||
          jsonData.audio ||
          jsonData.data?.audio_base64 ||
          jsonData.data?.audio ||
          jsonData.result?.audio_base64 ||
          jsonData.result?.audio ||
          (typeof jsonData.data === 'string' && jsonData.data.length > 50 ? jsonData.data : null);

        if (base64Data && typeof base64Data === 'string') {
          const cleanBase64 = base64Data.replace(/^data:audio\/\w+;base64,/, '');
          return {
            success: true,
            audioBase64: cleanBase64,
            mimeType: 'audio/wav',
            voice,
            language,
            provider: 'ADDIS_VOICE_API'
          };
        }

        // If returned a remote audio URL
        const audioUrl = jsonData.audio_url || jsonData.audioUrl || jsonData.url || jsonData.data?.url || jsonData.result?.url;
        if (audioUrl && typeof audioUrl === 'string' && (audioUrl.startsWith('http://') || audioUrl.startsWith('https://'))) {
          try {
            const audioFetch = await fetch(audioUrl);
            if (audioFetch.ok) {
              const audioBuf = await audioFetch.arrayBuffer();
              const b64 = Buffer.from(audioBuf).toString('base64');
              return {
                success: true,
                audioBase64: b64,
                mimeType: 'audio/wav',
                voice,
                language,
                provider: 'ADDIS_VOICE_API'
              };
            }
          } catch {
            // Fall through to fallback
          }
        }
      }

      return {
        success: false,
        provider: 'BROWSER_TTS_FALLBACK',
        voice,
        language,
        message: 'Could not extract audio payload from response. Using client speech fallback.'
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'BROWSER_TTS_FALLBACK',
        voice,
        language,
        message: err?.message || 'Speech synthesis fallback active'
      };
    }
  }
}

export const addisVoiceService = new AddisVoiceService();
