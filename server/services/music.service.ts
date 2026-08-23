import { GoogleGenAI } from '@google/genai';
import { db } from '../db.js';
import { AudioAsset } from '../types.js';

export interface MusicResult {
  audioBase64?: string;
  mimeType: string;
  assetId?: string;
  title: string;
  source: 'AI_GENERATED' | 'PRESET' | 'UPLOAD';
}

export interface MusicProvider {
  generateMusic(prompt: string, model?: string): Promise<MusicResult>;
}

function createWavHeader(numSamples: number, sampleRate: number, channels: number = 1, bitsPerSample: number = 16): Uint8Array {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = numSamples * channels * (bitsPerSample / 8);
  const chunkSize = 36 + dataSize;

  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  // "RIFF"
  view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46);
  view.setUint32(4, chunkSize, true);
  // "WAVE"
  view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45);
  // "fmt "
  view.setUint8(12, 0x66); view.setUint8(13, 0x6D); view.setUint8(14, 0x74); view.setUint8(15, 0x20);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  // "data"
  view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61);
  view.setUint32(40, dataSize, true);

  return header;
}

function generateProceduralAmbientWav(styleOrPrompt: string, durationSec: number = 16, sampleRate: number = 22050): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new Int16Array(numSamples);

  const styleLower = styleOrPrompt.toLowerCase();
  
  // Choose tuning and notes based on style
  let basePadFreqs = [130.81, 196.00, 261.63, 329.63]; // Default C Major 7th
  let melodyNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
  let bpm = 64;
  let harmonicRichness = 0.22;
  let pluckDecay = 3.5;

  if (styleLower.includes('krar') || styleLower.includes('acoustic-peace')) {
    // Traditional Ethiopian Krar (Tizita Minor / Bati)
    basePadFreqs = [146.83, 220.00, 293.66, 369.99, 440.00];
    melodyNotes = [293.66, 329.63, 369.99, 440.00, 587.33, 659.25, 739.99];
    bpm = 56;
    pluckDecay = 4.2;
  } else if (styleLower.includes('tizita') || styleLower.includes('addis') || styleLower.includes('lo-fi') || styleLower.includes('ambient-calm')) {
    // Warm Addis Coffeehouse Lo-Fi Tizita
    basePadFreqs = [130.81, 164.81, 196.00, 246.94, 261.63];
    melodyNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 659.25];
    bpm = 52;
    pluckDecay = 2.8;
  } else if (styleLower.includes('bati')) {
    // Bati Major Pentatonic - Bright yet calming
    basePadFreqs = [146.83, 185.00, 220.00, 293.66];
    melodyNotes = [293.66, 369.99, 440.00, 554.37, 587.33, 739.99];
    bpm = 60;
    pluckDecay = 3.8;
  } else if (styleLower.includes('masenqo')) {
    // Masenqo Bowed texture
    basePadFreqs = [110.00, 164.81, 220.00, 329.63];
    melodyNotes = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00];
    bpm = 48;
    harmonicRichness = 0.35;
    pluckDecay = 2.0;
  } else if (styleLower.includes('corporate') || styleLower.includes('zen')) {
    // Crystal Corporate Zen Lounge
    basePadFreqs = [130.81, 196.00, 261.63, 329.63, 392.00];
    melodyNotes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    bpm = 50;
    pluckDecay = 5.0;
  }

  const samplesPerBeat = Math.floor((sampleRate * 60) / bpm);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // 1. Warm harmonic drone pad with gentle LFO chorus
    for (let f = 0; f < basePadFreqs.length; f++) {
      const freq = basePadFreqs[f];
      const lfo = 1 + 0.02 * Math.sin(2 * Math.PI * 0.15 * t + f);
      const wave = Math.sin(2 * Math.PI * freq * lfo * t) + 
                   0.25 * Math.sin(4 * Math.PI * freq * lfo * t) +
                   0.08 * Math.sin(6 * Math.PI * freq * lfo * t);
      sample += wave * (0.14 / basePadFreqs.length) * 4;
    }

    // 2. Plucked harmonic acoustic melody (Krar / Piano / Chime)
    const beatIndex = Math.floor(i / samplesPerBeat);
    const beatProgress = (i % samplesPerBeat) / sampleRate;
    const noteFreq = melodyNotes[(beatIndex * 2 + (beatIndex % 5)) % melodyNotes.length];

    if (beatProgress < 2.0) {
      const env = Math.exp(-beatProgress * pluckDecay);
      const pluck = (
        Math.sin(2 * Math.PI * noteFreq * beatProgress) +
        harmonicRichness * Math.sin(4 * Math.PI * noteFreq * beatProgress) +
        0.1 * Math.sin(6 * Math.PI * noteFreq * beatProgress)
      ) * env;
      sample += pluck * 0.22;
    }

    // 3. Smooth loop crossfade (1.5s seamless fade in/out for loop continuity)
    const fadeIn = Math.min(1, t / 1.5);
    const fadeOut = Math.min(1, (durationSec - t) / 1.5);
    sample *= fadeIn * fadeOut;

    const clamped = Math.max(-1, Math.min(1, sample));
    buffer[i] = Math.floor(clamped * 32767);
  }

  const wavHeader = createWavHeader(numSamples, sampleRate, 1, 16);
  const wavBytes = new Uint8Array(wavHeader.length + buffer.byteLength);
  wavBytes.set(wavHeader, 0);
  wavBytes.set(new Uint8Array(buffer.buffer), wavHeader.length);

  return Buffer.from(wavBytes).toString('base64');
}

export function getLocalPresetTracks(): AudioAsset[] {
  const now = new Date().toISOString();
  
  const presets: { id: string; title: string; style: string; duration: number }[] = [
    {
      id: 'asset-music-1',
      title: 'Gentle Addis Ambient Lo-Fi (Calm Office)',
      style: 'addis-lofi',
      duration: 16
    },
    {
      id: 'asset-music-2',
      title: 'Serene Acoustic Krar Waves (Peaceful Lounge)',
      style: 'krar-traditional',
      duration: 16
    },
    {
      id: 'asset-music-3',
      title: 'Bati Morning Horizon (Ethiopian Pentatonic)',
      style: 'bati-horizon',
      duration: 16
    },
    {
      id: 'asset-music-4',
      title: 'Masenqo & Guitar Cafe Ambient',
      style: 'masenqo-cafe',
      duration: 16
    },
    {
      id: 'asset-music-5',
      title: 'Modern Corporate Zen Ambient',
      style: 'corporate-zen',
      duration: 16
    }
  ];

  return presets.map(p => {
    const base64 = generateProceduralAmbientWav(p.style, p.duration, 22050);
    return {
      id: p.id,
      title: p.title,
      type: 'MUSIC',
      url: `data:audio/wav;base64,${base64}`,
      source: 'PRESET',
      durationSeconds: p.duration,
      createdAt: now
    };
  });
}

class GeminiMusicProvider implements MusicProvider {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  public async generateMusic(
    prompt: string = 'Calm Ethiopian traditional lounge acoustic instrumental music, peaceful office ambient background, gentle krar and masenqo tones',
    model: string = 'gemini-2.5-flash'
  ): Promise<MusicResult> {
    const ai = this.getClient();
    let dynamicTitle = `AI Ambient: ${prompt.slice(0, 35)}`;

    if (ai) {
      try {
        const titleResp = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Create a brief, elegant 3-5 word track title for a calming office ambient music track based on this description: "${prompt}". Return ONLY the title text, nothing else.`
        });
        const generatedTitle = titleResp.text?.trim()?.replace(/^["']|["']$/g, '');
        if (generatedTitle && generatedTitle.length > 2 && generatedTitle.length < 50) {
          dynamicTitle = `AI: ${generatedTitle}`;
        }
      } catch (err) {
        // Continue with default title
      }
    }

    try {
      const audioBase64 = generateProceduralAmbientWav(prompt, 14, 22050);
      const mimeType = 'audio/wav';

      const newAsset: AudioAsset = {
        id: `music-ai-${Date.now()}`,
        title: dynamicTitle,
        type: 'MUSIC',
        url: `data:${mimeType};base64,${audioBase64}`,
        source: 'AI_GENERATED',
        durationSeconds: 14,
        createdAt: new Date().toISOString()
      };

      db.addAudioAsset(newAsset);

      return {
        audioBase64,
        mimeType,
        assetId: newAsset.id,
        title: newAsset.title,
        source: 'AI_GENERATED'
      };
    } catch (err: any) {
      return {
        title: `Preset Acoustic Ambient`,
        mimeType: 'audio/wav',
        source: 'PRESET'
      };
    }
  }
}

export const geminiMusicProvider = new GeminiMusicProvider();

