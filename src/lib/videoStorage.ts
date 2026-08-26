/**
 * Local Video Storage Engine
 * 
 * Provides robust storage and retrieval of videos using browser IndexedDB
 * (for high-capacity binary video files/Blobs) and LocalStorage (for fast metadata indexing,
 * presets, and active video state).
 */

export interface StoredVideo {
  id: string;
  title: string;
  titleAmharic?: string;
  description?: string;
  type: 'LOCAL_FILE' | 'URL' | 'YOUTUBE';
  url?: string;             // For external URLs / YouTube
  mimeType?: string;        // e.g. 'video/mp4', 'video/webm', 'video/ogg'
  sizeBytes?: number;       // File size in bytes
  durationSeconds?: number; // Video duration if known
  createdAt: string;        // ISO timestamp
  lastPlayedAt?: string;    // ISO timestamp
  isDefault?: boolean;
}

const DB_NAME = 'addis_smart_queue_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'videos';
const LOCAL_STORAGE_REGISTRY_KEY = 'addis_local_video_registry_v1';
const LOCAL_STORAGE_ACTIVE_KEY = 'addis_active_video_id_v1';
const BROADCAST_CHANNEL_NAME = 'addis_queue_video_sync_channel';

// In-memory cache for generated object URLs so they can be reused across components
const objectUrlCache = new Map<string, string>();

// Broadcast Channel for synchronizing across multiple tabs / windows
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  // Graceful fallback if BroadcastChannel is restricted
}

function notifyStorageChange(detail: { action: string; id?: string }) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('video-storage-changed', { detail }));
      if (broadcastChannel) {
        broadcastChannel.postMessage(detail);
      }
    }
  } catch (err) {
    console.warn('Failed to dispatch video storage event:', err);
  }
}

/**
 * Open or initialize IndexedDB instance
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB.'));
    };
  });
}

/**
 * Format bytes into human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const videoStorage = {
  /**
   * Save a local video file (Blob / File) into IndexedDB and register its metadata in LocalStorage.
   */
  async storeLocalVideoFile(
    file: File | Blob,
    metadata: {
      title?: string;
      titleAmharic?: string;
      description?: string;
    } = {}
  ): Promise<StoredVideo> {
    const db = await openDatabase();
    const id = `local-vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fileName = (file as File).name || 'local-video.mp4';
    const cleanTitle = metadata.title || fileName.replace(/\.[^/.]+$/, '');
    const cleanTitleAmharic = metadata.titleAmharic || cleanTitle;
    const mimeType = file.type || 'video/mp4';
    const sizeBytes = file.size || 0;

    const storedMeta: StoredVideo = {
      id,
      title: cleanTitle,
      titleAmharic: cleanTitleAmharic,
      description: metadata.description || `Uploaded local video (${formatBytes(sizeBytes)})`,
      type: 'LOCAL_FILE',
      mimeType,
      sizeBytes,
      createdAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString()
    };

    // 1. Store the binary Blob in IndexedDB
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const record = {
        id,
        blob: file,
        metadata: storedMeta
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to store video in IndexedDB'));
    });

    // 2. Add to LocalStorage metadata registry
    this.addMetadataToRegistry(storedMeta);

    // 3. Mark as active video
    this.setActiveVideoId(id);

    // 4. Create an object URL immediately in cache
    const objectUrl = URL.createObjectURL(file);
    objectUrlCache.set(id, objectUrl);

    notifyStorageChange({ action: 'upload', id });

    return storedMeta;
  },

  /**
   * Save an external video URL or YouTube stream link into local storage registry.
   */
  async storeVideoUrl(
    url: string,
    metadata: {
      title?: string;
      titleAmharic?: string;
      description?: string;
    } = {}
  ): Promise<StoredVideo> {
    const cleanUrl = url.trim();
    const isYoutube = /(?:youtube\.com|youtu\.be)/i.test(cleanUrl);
    const id = `url-vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const storedMeta: StoredVideo = {
      id,
      title: metadata.title || (isYoutube ? 'YouTube Channel Stream' : 'Custom Web Video Stream'),
      titleAmharic: metadata.titleAmharic || (isYoutube ? 'የዩቲዩብ የቀጥታ ስርጭት' : 'የድረገጽ ቪዲዮ ስርጭት'),
      description: metadata.description || cleanUrl,
      type: isYoutube ? 'YOUTUBE' : 'URL',
      url: cleanUrl,
      createdAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString()
    };

    // Save to LocalStorage registry
    this.addMetadataToRegistry(storedMeta);
    this.setActiveVideoId(id);

    notifyStorageChange({ action: 'store_url', id });

    return storedMeta;
  },

  /**
   * Retrieve all stored videos metadata from local storage registry.
   */
  getStoredVideos(): StoredVideo[] {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem(LOCAL_STORAGE_REGISTRY_KEY);
      if (!raw) return [];
      const parsed: StoredVideo[] = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Retrieve a specific stored video by ID and generate an executable playback URL.
   * If it's a binary file stored in IndexedDB, creates or retrieves a valid DOM Object URL.
   * If it's an external URL, returns that URL directly.
   */
  async getStoredVideoById(id: string, forceFreshUrl: boolean = false): Promise<{ video: StoredVideo | null; playbackUrl: string | null; mimeType?: string }> {
    const list = this.getStoredVideos();
    const meta = list.find(v => v.id === id) || null;

    if (!meta) {
      // Fallback: check if we can query IndexedDB directly in case metadata wasn't yet populated
      try {
        const db = await openDatabase();
        const record = await new Promise<any>((resolve, reject) => {
          const transaction = db.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const req = store.get(id);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });

        if (record && record.blob) {
          let blob = record.blob;
          if (!(blob instanceof Blob)) {
            blob = new Blob([blob], { type: record.metadata?.mimeType || 'video/mp4' });
          }
          const objectUrl = URL.createObjectURL(blob);
          objectUrlCache.set(id, objectUrl);
          return { video: record.metadata || null, playbackUrl: objectUrl, mimeType: record.metadata?.mimeType || 'video/mp4' };
        }
      } catch (err) {
        console.warn('Could not retrieve record directly from IndexedDB:', err);
      }
      return { video: null, playbackUrl: null };
    }

    if (meta.type === 'URL' || meta.type === 'YOUTUBE') {
      return { video: meta, playbackUrl: meta.url || null, mimeType: meta.mimeType };
    }

    // Binary file: retrieve Blob from IndexedDB
    try {
      if (!forceFreshUrl) {
        const existingUrl = objectUrlCache.get(id);
        if (existingUrl) {
          return { video: meta, playbackUrl: existingUrl, mimeType: meta.mimeType || 'video/mp4' };
        }
      }

      const db = await openDatabase();
      const rawBlob = await new Promise<any>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(req.result.blob);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });

      if (!rawBlob) {
        return { video: meta, playbackUrl: null };
      }

      // Ensure it's a valid Blob instance
      let validBlob: Blob;
      if (rawBlob instanceof Blob) {
        validBlob = rawBlob;
      } else {
        validBlob = new Blob([rawBlob], { type: meta.mimeType || 'video/mp4' });
      }

      // Revoke older object URL if forcing fresh
      if (forceFreshUrl && objectUrlCache.has(id)) {
        try {
          URL.revokeObjectURL(objectUrlCache.get(id)!);
        } catch {}
      }

      const objectUrl = URL.createObjectURL(validBlob);
      objectUrlCache.set(id, objectUrl);

      return { video: meta, playbackUrl: objectUrl, mimeType: meta.mimeType || validBlob.type || 'video/mp4' };
    } catch (err) {
      console.error('Failed to retrieve video blob from local storage:', err);
      return { video: meta, playbackUrl: null };
    }
  },

  /**
   * Get the currently active stored video from LocalStorage.
   */
  async getActiveStoredVideo(forceFresh: boolean = false): Promise<{ video: StoredVideo | null; playbackUrl: string | null; mimeType?: string }> {
    const activeId = this.getActiveVideoId();
    if (!activeId) {
      // If there is any stored video in the list, use the first one
      const list = this.getStoredVideos();
      if (list.length > 0) {
        return this.getStoredVideoById(list[0].id, forceFresh);
      }
      return { video: null, playbackUrl: null };
    }
    return this.getStoredVideoById(activeId, forceFresh);
  },

  /**
   * Universal resolver: Takes any URL, ID or stored video key, and returns
   * a working, playable live URL.
   */
  async resolvePlaybackUrl(urlOrId?: string | null): Promise<{ playbackUrl: string | null; videoTitle?: string; isLocal: boolean; mimeType?: string }> {
    if (!urlOrId || typeof urlOrId !== 'string' || !urlOrId.trim()) {
      // Try active stored video
      const active = await this.getActiveStoredVideo();
      if (active.playbackUrl) {
        return {
          playbackUrl: active.playbackUrl,
          videoTitle: active.video?.title,
          isLocal: true,
          mimeType: active.mimeType
        };
      }
      return { playbackUrl: null, isLocal: false };
    }

    const clean = urlOrId.trim();

    // 1. Direct ID match
    const storedList = this.getStoredVideos();
    const matchedById = storedList.find(v => v.id === clean || `local-media:${v.id}` === clean || `idb:${v.id}` === clean);
    if (matchedById) {
      const res = await this.getStoredVideoById(matchedById.id);
      if (res.playbackUrl) {
        return {
          playbackUrl: res.playbackUrl,
          videoTitle: matchedById.title,
          isLocal: true,
          mimeType: res.mimeType
        };
      }
    }

    // 2. If it's a blob: URL (which may be stale across page refreshes)
    if (clean.startsWith('blob:')) {
      // Check if we have an active video or a stored video whose cache matches
      const active = await this.getActiveStoredVideo(true); // force fresh blob URL
      if (active.playbackUrl) {
        return {
          playbackUrl: active.playbackUrl,
          videoTitle: active.video?.title,
          isLocal: true,
          mimeType: active.mimeType
        };
      }
    }

    // 3. Regular HTTP/HTTPS/YouTube or Data URI
    return {
      playbackUrl: clean,
      isLocal: false
    };
  },

  /**
   * Set the active stored video ID in LocalStorage.
   */
  setActiveVideoId(id: string | null): void {
    try {
      if (typeof window === 'undefined') return;
      if (id) {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_KEY, id);
        // update lastPlayedAt
        this.updateMetadata(id, { lastPlayedAt: new Date().toISOString() });
      } else {
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_KEY);
      }
      notifyStorageChange({ action: 'set_active', id: id || undefined });
    } catch (err) {
      console.warn('Failed to set active video ID in localStorage:', err);
    }
  },

  /**
   * Get the active stored video ID from LocalStorage.
   */
  getActiveVideoId(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(LOCAL_STORAGE_ACTIVE_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Delete a stored video from IndexedDB and LocalStorage registry.
   */
  async deleteStoredVideo(id: string): Promise<void> {
    // 1. Revoke cached object URL if exists
    const cachedUrl = objectUrlCache.get(id);
    if (cachedUrl) {
      try {
        URL.revokeObjectURL(cachedUrl);
      } catch {}
      objectUrlCache.delete(id);
    }

    // 2. Remove from IndexedDB if file
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Error deleting video from IndexedDB:', err);
    }

    // 3. Remove from LocalStorage registry
    const list = this.getStoredVideos().filter(v => v.id !== id);
    this.saveRegistry(list);

    // 4. Clear active ID if this was active
    if (this.getActiveVideoId() === id) {
      const nextActive = list.length > 0 ? list[0].id : null;
      this.setActiveVideoId(nextActive);
    }

    notifyStorageChange({ action: 'delete', id });
  },

  /**
   * Update metadata of a stored video (e.g. title, amharic title, description).
   */
  updateMetadata(id: string, updates: Partial<StoredVideo>): void {
    const list = this.getStoredVideos();
    const index = list.findIndex(v => v.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      this.saveRegistry(list);
      notifyStorageChange({ action: 'update_metadata', id });
    }
  },

  /**
   * Calculate total storage footprint across local videos.
   */
  async getStorageUsage(): Promise<{ count: number; totalBytes: number; formattedSize: string }> {
    const list = this.getStoredVideos();
    const totalBytes = list.reduce((acc, item) => acc + (item.sizeBytes || 0), 0);
    return {
      count: list.length,
      totalBytes,
      formattedSize: formatBytes(totalBytes)
    };
  },

  /**
   * Export / download a stored video file locally to the user's computer.
   */
  async downloadStoredVideo(id: string): Promise<void> {
    const { video, playbackUrl } = await this.getStoredVideoById(id);
    if (!video || !playbackUrl) {
      throw new Error('Video not found in local storage.');
    }

    const link = document.createElement('a');
    link.href = playbackUrl;
    link.download = `${video.title || 'video'}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Clear all stored videos from IndexedDB and LocalStorage.
   */
  async clearAllStoredVideos(): Promise<void> {
    // Revoke all cached object URLs
    objectUrlCache.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    objectUrlCache.clear();

    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Error clearing IndexedDB videos:', err);
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_REGISTRY_KEY);
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_KEY);
    }

    notifyStorageChange({ action: 'clear_all' });
  },

  // Internal Helper: Append metadata
  addMetadataToRegistry(meta: StoredVideo): void {
    const list = this.getStoredVideos();
    const existingIndex = list.findIndex(v => v.id === meta.id);
    if (existingIndex >= 0) {
      list[existingIndex] = meta;
    } else {
      list.unshift(meta);
    }
    this.saveRegistry(list);
  },

  // Internal Helper: Save registry to localStorage
  saveRegistry(list: StoredVideo[]): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(LOCAL_STORAGE_REGISTRY_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('Failed to save video registry in localStorage:', err);
    }
  }
};
