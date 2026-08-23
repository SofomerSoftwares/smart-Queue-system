// Audio Manager coordinating Background Music and Gemini Voice Announcements

class AudioManager {
  private audioCtx: AudioContext | null = null;
  private backgroundAudioEl: HTMLAudioElement | null = null;
  private currentVoiceAudioEl: HTMLAudioElement | null = null;
  private isMusicPlaying = false;
  private ambientOscillatorNodes: OscillatorNode[] = [];
  private ambientGainNode: GainNode | null = null;
  private isAmbientSynthRunning = false;

  private initContext(): AudioContext {
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

      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.warn('Chime audio error:', err);
    }
  }

  // Play announcement with music ducking (pause music -> play voice -> wait -> resume music)
  public async playAnnouncement(
    text: string, 
    audioBase64?: string, 
    mimeType: string = 'audio/wav',
    volume: number = 85
  ): Promise<void> {
    // 1. Pause background music if active
    const wasMusicPlaying = this.isMusicPlaying;
    if (wasMusicPlaying) {
      this.pauseBackgroundMusic();
    }

    try {
      // 2. Play chime
      await this.playChime();

      // 3. Play voice
      if (audioBase64 && audioBase64.trim().length > 0) {
        await this.playBase64Audio(audioBase64, mimeType, volume);
      } else {
        // Fallback to browser Web Speech API
        await this.playBrowserSpeech(text, volume);
      }
    } catch (err) {
      console.warn('Announcement playback error:', err);
    } finally {
      // 4. Smoothly resume background music after short pause
      if (wasMusicPlaying) {
        setTimeout(() => {
          this.resumeBackgroundMusic();
        }, 1200);
      }
    }
  }

  private playBase64Audio(base64Data: string, mimeType: string, volume: number): Promise<void> {
    return new Promise((resolve) => {
      if (!base64Data || base64Data.trim() === '') {
        return resolve();
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

        let isFinished = false;
        const finish = () => {
          if (!isFinished) {
            isFinished = true;
            this.currentVoiceAudioEl = null;
            resolve();
          }
        };

        audio.onended = finish;
        audio.onerror = () => {
          finish();
        };

        audio.src = audioSrc;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            finish();
          });
        }
      } catch (err) {
        resolve();
      }
    });
  }

  private playBrowserSpeech(text: string, volume: number): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        return resolve();
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = Math.max(0.1, Math.min(1.0, volume / 100));
      utterance.rate = 0.92; // Slightly calm pace for announcements
      utterance.pitch = 1.0;

      // Try to find an Amharic voice or English fallback
      const voices = window.speechSynthesis.getVoices();
      const amVoice = voices.find(v => v.lang.startsWith('am'));
      if (amVoice) {
        utterance.voice = amVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  private previewAudioEl: HTMLAudioElement | null = null;
  private currentMusicUrl: string | null = null;

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
