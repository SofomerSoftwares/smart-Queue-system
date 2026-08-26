// Audio Manager coordinating Background Music and Addis AI Voice Announcements
import { transliterateToPhonetic } from './amharic';

export { transliterateToPhonetic as transliterateAmharicToPhonetic };

class AudioManager {
  private audioCtx: AudioContext | null = null;
  private backgroundAudioEl: HTMLAudioElement | null = null;
  private currentVoiceAudioEl: HTMLAudioElement | null = null;
  private isMusicPlaying = false;
  private ambientOscillatorNodes: OscillatorNode[] = [];
  private ambientGainNode: GainNode | null = null;
  private isAmbientSynthRunning = false;
  private previewAudioEl: HTMLAudioElement | null = null;
  private currentMusicUrl: string | null = null;

  public initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play airport / lobby chime before announcement
  public async playChime(): Promise<void> {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      // 3-note harmonic chime (F4, A4, C5)
      const frequencies = [349.23, 440.00, 523.25];
      
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.85);
      });

      await new Promise(r => setTimeout(r, 650));
    } catch (err) {
      console.warn('Chime audio error:', err);
    }
  }

  // Play announcement with music ducking (pause music -> play chime -> play voice -> resume music)
  public async playAnnouncement(
    text: string, 
    audioBase64?: string, 
    mimeType: string = 'audio/wav',
    volume: number = 85,
    phoneticText?: string
  ): Promise<void> {
    // 1. Pause background music if active
    const wasMusicPlaying = this.isMusicPlaying;
    if (wasMusicPlaying) {
      this.pauseBackgroundMusic();
    }

    try {
      // 2. Play lobby chime
      await this.playChime();

      // 3. Play voice
      let playedSuccessfully = false;
      if (audioBase64 && audioBase64.trim().length > 0) {
        playedSuccessfully = await this.playBase64Audio(audioBase64, mimeType, volume);
      }
      
      if (!playedSuccessfully) {
        // Fallback to browser Web Speech API with Amharic / Phonetic handling
        await this.playBrowserSpeech(text, volume, phoneticText);
      }
    } catch (err) {
      console.warn('Announcement playback notice:', err);
    } finally {
      // 4. Smoothly resume background music after short pause
      if (wasMusicPlaying) {
        setTimeout(() => {
          this.resumeBackgroundMusic();
        }, 1200);
      }
    }
  }

  private playBase64Audio(base64Data: string, mimeType: string, volume: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (!base64Data || base64Data.trim() === '') {
        return resolve(false);
      }

      try {
        const audioSrc = base64Data.startsWith('data:') 
          ? base64Data 
          : `data:${mimeType || 'audio/wav'};base64,${base64Data}`;

        if (this.currentVoiceAudioEl) {
          try {
            this.currentVoiceAudioEl.pause();
            this.currentVoiceAudioEl.removeAttribute('src');
            this.currentVoiceAudioEl.load();
          } catch {}
          this.currentVoiceAudioEl = null;
        }

        const audio = new Audio();
        this.currentVoiceAudioEl = audio;
        audio.volume = Math.max(0.1, Math.min(1.0, volume / 100));

        let isSettled = false;
        const cleanup = (success: boolean) => {
          if (!isSettled) {
            isSettled = true;
            this.currentVoiceAudioEl = null;
            resolve(success);
          }
        };

        // Timeout safety
        const timeout = setTimeout(() => {
          cleanup(true);
        }, 15000);

        audio.onended = () => {
          clearTimeout(timeout);
          cleanup(true);
        };
        audio.onerror = () => {
          clearTimeout(timeout);
          cleanup(false);
        };

        audio.src = audioSrc;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            clearTimeout(timeout);
            console.warn('Audio element play catch:', err);
            cleanup(false);
          });
        }
      } catch (err) {
        console.warn('playBase64Audio exception:', err);
        resolve(false);
      }
    });
  }

  public playBrowserSpeech(text: string, volume: number, phoneticText?: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        return resolve();
      }

      try {
        window.speechSynthesis.cancel();

        const getBestVoices = () => {
          return window.speechSynthesis.getVoices();
        };

        let voices = getBestVoices();

        const doSpeak = () => {
          voices = getBestVoices();
          const amVoice = voices.find(v => v.lang.toLowerCase().startsWith('am'));
          
          let textToSpeak = text;
          let voiceToUse = amVoice;

          if (!amVoice) {
            // If no Amharic voice is installed on OS, use phonetic transliterated text with natural English voice
            textToSpeak = phoneticText || transliterateToPhonetic(text);
            
            // Prefer high-quality English voice
            voiceToUse = voices.find(v => 
              v.name.includes('Google') || 
              v.name.includes('Natural') || 
              v.name.includes('Zira') || 
              v.name.includes('Samantha') || 
              v.lang.startsWith('en')
            ) || voices[0];
          }

          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.volume = Math.max(0.1, Math.min(1.0, volume / 100));
          utterance.rate = 0.88; // Professional announcement pace
          utterance.pitch = 1.0;

          if (voiceToUse) {
            utterance.voice = voiceToUse;
          }

          let done = false;
          const finish = () => {
            if (!done) {
              done = true;
              resolve();
            }
          };

          utterance.onend = finish;
          utterance.onerror = finish;

          // Timeout safety in case synthesis hangs
          setTimeout(finish, 12000);

          window.speechSynthesis.speak(utterance);
        };

        if (voices.length === 0 && 'onvoiceschanged' in window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.onvoiceschanged = null;
            doSpeak();
          };
          // Fallback timer if onvoiceschanged doesn't fire
          setTimeout(doSpeak, 250);
        } else {
          doSpeak();
        }
      } catch (err) {
        console.warn('playBrowserSpeech error:', err);
        resolve();
      }
    });
  }

  // --- Background Music Handling ---
  public startBackgroundMusic(urlOrPreset?: string, volume: number = 14): void {
    this.isMusicPlaying = true;
    this.currentMusicUrl = urlOrPreset || null;

    const isPlayableUrl = typeof urlOrPreset === 'string' && (
      urlOrPreset.startsWith('data:audio/') || 
      urlOrPreset.startsWith('http://') || 
      urlOrPreset.startsWith('https://') || 
      urlOrPreset.startsWith('/api/') ||
      urlOrPreset.startsWith('blob:')
    );

    if (!isPlayableUrl) {
      if (this.backgroundAudioEl) {
        try {
          this.backgroundAudioEl.pause();
          this.backgroundAudioEl.removeAttribute('src');
          this.backgroundAudioEl.load();
        } catch {}
        this.backgroundAudioEl = null;
      }
      // Start relaxing ambient synth
      this.startAmbientSynth(volume);
    } else {
      this.stopAmbientSynth();
      try {
        if (!this.backgroundAudioEl) {
          this.backgroundAudioEl = new Audio();
          this.backgroundAudioEl.loop = true;
          this.backgroundAudioEl.onerror = () => {
            this.backgroundAudioEl = null;
            this.startAmbientSynth(volume);
          };
        }
        
        if (this.backgroundAudioEl.src !== urlOrPreset) {
          this.backgroundAudioEl.src = urlOrPreset;
        }
        this.backgroundAudioEl.volume = Math.max(0.02, Math.min(1.0, volume / 100));
        const playPromise = this.backgroundAudioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.startAmbientSynth(volume);
          });
        }
      } catch {
        this.startAmbientSynth(volume);
      }
    }
  }

  public previewTrack(url: string, volume: number = 30): void {
    this.stopPreview();
    if (!url) return;

    try {
      this.previewAudioEl = new Audio(url);
      this.previewAudioEl.volume = Math.max(0.05, Math.min(1.0, volume / 100));
      this.previewAudioEl.onended = () => {
        this.previewAudioEl = null;
      };
      this.previewAudioEl.play().catch(() => {});
    } catch (err) {
      console.warn('Preview audio error:', err);
    }
  }

  public stopPreview(): void {
    if (this.previewAudioEl) {
      try {
        this.previewAudioEl.pause();
        this.previewAudioEl.removeAttribute('src');
        this.previewAudioEl.load();
      } catch {}
      this.previewAudioEl = null;
    }
  }

  public setBackgroundMusicVolume(volume: number): void {
    if (this.backgroundAudioEl) {
      this.backgroundAudioEl.volume = Math.max(0.02, Math.min(1.0, volume / 100));
    }
    if (this.ambientGainNode && this.audioCtx) {
      this.ambientGainNode.gain.setValueAtTime(
        Math.max(0.005, (volume / 100) * 0.08), 
        this.audioCtx.currentTime
      );
    }
  }

  public pauseBackgroundMusic(): void {
    if (this.backgroundAudioEl) {
      this.backgroundAudioEl.pause();
    }
    if (this.isAmbientSynthRunning) {
      this.stopAmbientSynth();
    }
  }

  public resumeBackgroundMusic(): void {
    if (!this.isMusicPlaying) return;

    if (this.backgroundAudioEl && this.backgroundAudioEl.src && this.backgroundAudioEl.src.startsWith('data:')) {
      this.backgroundAudioEl.play().catch(() => {
        this.startAmbientSynth();
      });
    } else {
      this.startAmbientSynth();
    }
  }

  public stopBackgroundMusic(): void {
    this.isMusicPlaying = false;
    if (this.backgroundAudioEl) {
      try {
        this.backgroundAudioEl.pause();
        this.backgroundAudioEl.removeAttribute('src');
        this.backgroundAudioEl.load();
      } catch {}
      this.backgroundAudioEl = null;
    }
    this.stopAmbientSynth();
  }

  // Gentle synthesized calming office ambient drone (Pentatonic chords)
  private startAmbientSynth(volume: number = 12): void {
    if (this.isAmbientSynthRunning) return;
    try {
      const ctx = this.initContext();
      this.ambientGainNode = ctx.createGain();
      const targetGain = Math.max(0.005, (volume / 100) * 0.06);
      this.ambientGainNode.gain.setValueAtTime(targetGain, ctx.currentTime);
      this.ambientGainNode.connect(ctx.destination);

      // Warm relaxing frequencies (D3, A3, D4, F#4)
      const chord = [146.83, 220.00, 293.66, 369.99];
      this.ambientOscillatorNodes = chord.map(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.connect(this.ambientGainNode!);
        osc.start();
        return osc;
      });

      this.isAmbientSynthRunning = true;
    } catch (err) {
      console.warn('Ambient synth initialization:', err);
    }
  }

  private stopAmbientSynth(): void {
    if (!this.isAmbientSynthRunning) return;
    try {
      this.ambientOscillatorNodes.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      });
      this.ambientOscillatorNodes = [];
      if (this.ambientGainNode) {
        this.ambientGainNode.disconnect();
        this.ambientGainNode = null;
      }
      this.isAmbientSynthRunning = false;
    } catch (err) {
      console.warn('Error stopping ambient synth:', err);
    }
  }
}

export const audioManager = new AudioManager();
