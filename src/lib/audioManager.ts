// Audio Manager coordinating Addis AI Voice Announcements and Chimes
import { transliterateToPhonetic } from './amharic';

export { transliterateToPhonetic as transliterateAmharicToPhonetic };

class AudioManager {
  private audioCtx: AudioContext | null = null;
  private currentVoiceAudioEl: HTMLAudioElement | null = null;
  private unlocked = false;

  public initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public isUnlocked(): boolean {
    return this.unlocked || (this.audioCtx !== null && this.audioCtx.state === 'running');
  }

  // Explicit user unlock method
  public async unlock(): Promise<boolean> {
    try {
      const ctx = this.initContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Play an inaudible 1-sample buffer to satisfy mobile/desktop autoplay policy
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      this.unlocked = true;
      return true;
    } catch (err) {
      console.warn('Audio unlock notice:', err);
      return false;
    }
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

  // Play announcement (chime -> voice audio)
  public async playAnnouncement(
    text: string, 
    audioBase64?: string, 
    mimeType: string = 'audio/wav',
    volume: number = 85,
    phoneticText?: string,
    repeatCount: number = 1,
    delaySeconds: number = 0
  ): Promise<void> {
    try {
      if (delaySeconds > 0) {
        await new Promise(r => setTimeout(r, delaySeconds * 1000));
      }

      const totalPlays = Math.max(1, Math.min(3, repeatCount || 1));

      for (let i = 0; i < totalPlays; i++) {
        if (i > 0) {
          await new Promise(r => setTimeout(r, 800));
        }

        // 1. Play lobby chime
        await this.playChime();

        // 2. Play voice audio
        let playedSuccessfully = false;
        if (audioBase64 && audioBase64.trim().length > 0) {
          playedSuccessfully = await this.playBase64Audio(audioBase64, mimeType, volume);
        }
        
        if (!playedSuccessfully) {
          // Fallback to browser Web Speech API with Amharic / Phonetic handling
          await this.playBrowserSpeech(text, volume, phoneticText);
        }
      }
    } catch (err) {
      console.warn('Announcement playback notice:', err);
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
          : `data:${mimeType || 'audio/mp3'};base64,${base64Data}`;

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
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return resolve();
      }

      try {
        window.speechSynthesis.cancel();

        const getBestVoices = () => {
          try {
            return window.speechSynthesis.getVoices() || [];
          } catch {
            return [];
          }
        };

        const doSpeak = () => {
          try {
            const voices = getBestVoices();
            const amVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('am'));
            
            let textToSpeak = text;
            let voiceToUse = amVoice;

            if (!amVoice) {
              // If no native Amharic voice is installed on OS, use phonetic transliterated text with natural voice
              textToSpeak = phoneticText || transliterateToPhonetic(text);
              
              // Prefer high-quality Natural English voice
              voiceToUse = voices.find(v => 
                v.name.includes('Google') || 
                v.name.includes('Natural') || 
                v.name.includes('Neural') || 
                v.name.includes('Zira') || 
                v.name.includes('Samantha') || 
                (v.lang && v.lang.startsWith('en'))
              ) || voices[0];
            }

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.volume = Math.max(0.1, Math.min(1.0, volume / 100));
            utterance.rate = 0.86; // Crisp, clear announcement tempo
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

            // Timeout safety in case speech synthesis hangs
            setTimeout(finish, 12000);

            window.speechSynthesis.speak(utterance);
          } catch (e) {
            console.warn('Speech synthesis execution notice:', e);
            resolve();
          }
        };

        const initialVoices = getBestVoices();
        if (initialVoices.length === 0 && 'onvoiceschanged' in window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.onvoiceschanged = null;
            doSpeak();
          };
          setTimeout(doSpeak, 300);
        } else {
          doSpeak();
        }
      } catch (err) {
        console.warn('playBrowserSpeech error:', err);
        resolve();
      }
    });
  }
}

export const audioManager = new AudioManager();
