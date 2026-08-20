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

function generateProceduralAmbientWav(prompt: string, durationSec: number = 12, sampleRate: number = 22050): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new Int16Array(numSamples);

  const isEthiopian = /ethiopia|krar|masenqo|tizita|bati|anchihoye/i.test(prompt);

  const basePadFreqs = isEthiopian 
    ? [146.83, 220.00, 293.66, 369.99] // D major / Bati pentatonic
    : [130.81, 196.00, 261.63, 329.63]; // C major 7th ambient

  const melodyNotes = isEthiopian
    ? [293.66, 369.99, 440.00, 587.33, 659.25, 739.99]
    : [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

  const bpm = 60;
  const samplesPerBeat = Math.floor((sampleRate * 60) / bpm);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // 1. Warm harmonic drone pad
    for (let f = 0; f < basePadFreqs.length; f++) {
      const freq = basePadFreqs[f];
      const lfo = 1 + 0.03 * Math.sin(2 * Math.PI * 0.2 * t + f);
      const wave = Math.sin(2 * Math.PI * freq * lfo * t) + 0.2 * Math.sin(4 * Math.PI * freq * lfo * t);
      sample += wave * 0.16;
    }

    // 2. Plucked harmonic chime/krar notes
    const beatIndex = Math.floor(i / samplesPerBeat);
    const beatProgress = (i % samplesPerBeat) / sampleRate;
    const noteFreq = melodyNotes[(beatIndex * 2 + (beatIndex % 3)) % melodyNotes.length];

    if (beatProgress < 1.5) {
      const env = Math.exp(-beatProgress * 3.8);
      const pluck = (
        Math.sin(2 * Math.PI * noteFreq * beatProgress) +
        0.35 * Math.sin(4 * Math.PI * noteFreq * beatProgress) +
        0.12 * Math.sin(6 * Math.PI * noteFreq * beatProgress)
      ) * env;
      sample += pluck * 0.22;
    }

    // 3. Smooth loop crossfade
    const fadeIn = Math.min(1, t / 1.2);
    const fadeOut = Math.min(1, (durationSec - t) / 1.2);
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

