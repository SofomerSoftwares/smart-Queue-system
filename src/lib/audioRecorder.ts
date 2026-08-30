/**
 * Audio Recording and Processing Engine for Queue Voice Announcements
 * Provides robust HTML5 MediaRecorder capture, volume level analysis,
 * audio playback preview, Base64 encoding, and fallback audio support.
 */

export interface RecordingResult {
  blob: Blob;
  base64: string;
  mimeType: string;
  durationSeconds: number;
  url: string;
}

export type RecorderState = 'INACTIVE' | 'REQUESTING' | 'RECORDING' | 'PAUSED' | 'RECORDED' | 'ERROR';

export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private recordedChunks: Blob[] = [];
  private startTime = 0;
  private timerInterval: any = null;
  private volumeInterval: any = null;
  private maxDurationSeconds = 45;

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const hasGetUserMedia = !!(
      (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') ||
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia
    );
    return hasGetUserMedia;
  }

  public static getSupportedMimeType(): string {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm';
    
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/aac'
    ];

    for (const mime of candidates) {
      try {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
          return mime;
        }
      } catch {}
    }
    return '';
  }

  private async getMicStream(): Promise<MediaStream> {
    // 1. Try modern navigator.mediaDevices.getUserMedia with advanced audio properties
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (err: any) {
        console.warn('Advanced audio constraints failed, retrying with basic { audio: true }', err);
        try {
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (basicErr: any) {
          throw basicErr;
        }
      }
    }

    // 2. Try legacy navigator.getUserMedia fallbacks
    const legacyGUM = (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia ||
      (navigator as any).msGetUserMedia;

    if (legacyGUM) {
      return new Promise<MediaStream>((resolve, reject) => {
        legacyGUM.call(navigator, { audio: true }, resolve, reject);
      });
    }

    throw new Error('Microphone access is not supported by your browser or is restricted in this window.');
  }

  public async startRecording(
    onTick?: (elapsedSeconds: number) => void,
    onVolume?: (volumeLevel: number) => void,
    maxSeconds: number = 45
  ): Promise<void> {
    this.maxDurationSeconds = maxSeconds;
    this.recordedChunks = [];

    try {
      // Request mic stream with graceful fallbacks
      this.audioStream = await this.getMicStream();

      // Setup audio analysis for live waveform/volume levels (non-blocking)
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume().catch(() => {});
          }
          const source = this.audioContext.createMediaStreamSource(this.audioStream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 128;
          this.analyser.smoothingTimeConstant = 0.7;
          source.connect(this.analyser);
          this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

          if (onVolume) {
            this.volumeInterval = setInterval(() => {
              if (this.analyser && this.dataArray) {
                try {
                  this.analyser.getByteFrequencyData(this.dataArray);
                  let sum = 0;
                  for (let i = 0; i < this.dataArray.length; i++) {
                    sum += this.dataArray[i];
                  }
                  const avg = sum / this.dataArray.length;
                  const normalized = Math.min(100, Math.round((avg / 128) * 100));
                  onVolume(normalized);
                } catch {}
              }
            }, 80);
          }
        }
      } catch (err) {
        console.warn('Audio visualization analyser could not be initialized:', err);
      }

      // Initialize MediaRecorder safely
      const mimeType = AudioRecorderService.getSupportedMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = mimeType ? new MediaRecorder(this.audioStream, { mimeType }) : new MediaRecorder(this.audioStream);
      } catch (mimeErr) {
        console.warn('Failed with mimeType, trying basic MediaRecorder constructor:', mimeErr);
        recorder = new MediaRecorder(this.audioStream);
      }
      this.mediaRecorder = recorder;

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      try {
        this.mediaRecorder.start(250);
      } catch (startErr) {
        console.warn('MediaRecorder.start(250) failed, retrying without timeslice:', startErr);
        this.mediaRecorder.start();
      }

      this.startTime = Date.now();

      if (onTick) {
        onTick(0);
        this.timerInterval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
          onTick(elapsed);

          if (elapsed >= this.maxDurationSeconds) {
            this.stopRecording().catch(console.error);
          }
        }, 500);
      }
    } catch (err: any) {
      this.cleanup();
      console.warn('Microphone stream acquisition notice:', err?.name, err?.message);
      
      const errName = err?.name || '';
      const errMsg = (err?.message || '').toLowerCase();

      if (
        errName === 'NotAllowedError' || 
        errName === 'PermissionDeniedError' || 
        errMsg.includes('permission denied') ||
        errMsg.includes('not allowed') ||
        errMsg.includes('permission dismissed')
      ) {
        throw new Error('Microphone permission was not granted by your browser or is restricted in this preview window.');
      } else if (errName === 'SecurityError' || errMsg.includes('security')) {
        throw new Error('Microphone access is restricted by iframe security policy. Open in a new tab or use Addis AI Voice.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError' || errMsg.includes('not found')) {
        throw new Error('No microphone hardware detected on your device. You can upload an audio file or generate Addis AI Voice.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError' || errMsg.includes('readable')) {
        throw new Error('Microphone is busy or locked by another browser tab or app.');
      }
      
      throw new Error(err?.message || 'Could not access microphone.');
    }
  }

  public async stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        reject(new Error('No active recording in progress.'));
        return;
      }

      const actualDuration = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
      const mimeType = this.mediaRecorder.mimeType || 'audio/webm';

      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(this.recordedChunks, { type: mimeType });
          const base64 = await AudioRecorderService.blobToBase64(blob);
          const url = URL.createObjectURL(blob);

          this.cleanup();

          resolve({
            blob,
            base64,
            mimeType,
            durationSeconds: actualDuration,
            url
          });
        } catch (err) {
          this.cleanup();
          reject(err);
        }
      };

      try {
        if (typeof (this.mediaRecorder as any).requestData === 'function') {
          (this.mediaRecorder as any).requestData();
        }
      } catch {}

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        this.cleanup();
        reject(err);
      }
    });
  }

  public cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }
    if (this.audioStream) {
      try {
        this.audioStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.audioStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close().catch(() => {});
      } catch {}
      this.audioContext = null;
    }
    this.analyser = null;
    this.dataArray = null;
    this.mediaRecorder = null;
  }

  public static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  public static async fileToBase64(file: File): Promise<{ base64: string; mimeType: string; duration: number }> {
    const base64 = await AudioRecorderService.blobToBase64(file);
    let duration = 0;
    try {
      duration = await AudioRecorderService.getAudioDurationFromUrl(base64);
    } catch {}
    return {
      base64,
      mimeType: file.type || 'audio/mpeg',
      duration
    };
  }

  public static async getAudioDurationFromUrl(audioSrc: string): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration) || 0);
      };
      audio.onerror = () => {
        resolve(0);
      };
      audio.src = audioSrc;
    });
  }
}

export const audioRecorder = new AudioRecorderService();
