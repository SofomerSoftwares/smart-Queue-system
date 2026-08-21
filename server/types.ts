export type RoleName = 'ADMIN' | 'RECEPTIONIST' | 'SERVICE_OFFICER';

export type TicketStatus = 
  | 'WAITING' 
  | 'CALLED' 
  | 'SERVING' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW' 
  | 'TRANSFERRED';

export type PriorityLevel = 'NORMAL' | 'PRIORITY';

export type AnnouncementLanguage = 'AMHARIC' | 'ENGLISH' | 'BOTH';

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: RoleName;
  description: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  roleId: string;
  role: RoleName;
  status: 'ACTIVE' | 'INACTIVE';
  assignedCounterId?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  nameAmharic: string;
  prefix: string; // e.g. "A", "R", "P", "D", "S", "C"
  description?: string;
  estimatedDurationMinutes: number;
  color: string;
  isActive: boolean;
  order: number;
}

export interface Counter {
  id: string;
  number: number; // 1, 2, 3, 4, 5
  name: string;
  nameAmharic: string;
  status: 'AVAILABLE' | 'SERVING' | 'CLOSED';
  currentOfficerId?: string;
  currentOfficerName?: string;
  currentTicketId?: string;
  currentTicketNumber?: string;
  serviceIds?: string[]; // Allowed services or all
  updatedAt: string;
}

export interface QueueTicket {
  id: string;
  ticketNumber: string; // e.g. "A-024"
  sequenceNumber: number; // e.g. 24
  prefix: string; // e.g. "A"
  serviceId: string;
  serviceName: string;
  serviceNameAmharic: string;
  counterId?: string;
  counterNumber?: number;
  officerId?: string;
  officerName?: string;
  status: TicketStatus;
  priority: PriorityLevel;
  issuedAt: string;
  calledAt?: string;
  serviceStartedAt?: string;
  completedAt?: string;
  waitingDurationSeconds?: number;
  serviceDurationSeconds?: number;
  notes?: string;
  dateKey: string; // "YYYY-MM-DD" for daily sequence reset
}

export interface QueueEvent {
  id: string;
  ticketId: string;
  ticketNumber: string;
  eventType: 
    | 'CREATED'
    | 'CALLED'
    | 'RECALLED'
    | 'STARTED'
    | 'COMPLETED'
    | 'NO_SHOW'
    | 'TRANSFERRED'
    | 'CANCELLED';
  counterId?: string;
  counterNumber?: number;
  userId?: string;
  userName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface OfficeSetting {
  id: string;
  officeName: string;
  officeNameAmharic: string;
  officeAddress: string;
  contactNumber: string;
  displayNotice: string;
  displayNoticeAmharic: string;
  dailyResetTime: string; // "00:00"
  estimatedWaitPerPersonMinutes: number;
  qrCodeUrlBase?: string;
}

export type TTSProviderType = 'ADDIS_AI' | 'GEMINI_TTS' | 'BROWSER_SYNTHESIS';

export interface AudioSetting {
  id: string;
  voiceEnabled: boolean;
  language: AnnouncementLanguage;
  ttsProvider?: TTSProviderType;
  addisVoice?: string; // 'aster', 'abebe', 'selam', 'dawit'
  addisAiSpeed?: number;
  addisAiEndpoint?: string;
  addisAiApiKey?: string;
  ttsModel: string; // e.g. "gemini-3.1-flash-tts-preview"
  ttsVoice: string; // e.g. "Kore", "Zephyr", "Puck", "Fenrir"
  volume: number; // 0 to 100
  repeatCount: number; // 1 or 2
  announcementDelaySeconds: number;
  backgroundMusicEnabled: boolean;
  backgroundMusicVolume: number; // 0 to 100
  currentMusicAssetId?: string;
  musicModel?: string; // e.g. "lyria-3-clip-preview"
}

export interface AudioAsset {
  id: string;
  title: string;
  type: 'MUSIC' | 'VOICE_PRESET' | 'CHIME';
  url: string;
  source: 'UPLOAD' | 'AI_GENERATED' | 'PRESET';
  durationSeconds?: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  services: Service[];
  counters: Counter[];
  tickets: QueueTicket[];
  events: QueueEvent[];
  officeSetting: OfficeSetting;
  audioSetting: AudioSetting;
  audioAssets: AudioAsset[];
  auditLogs: AuditLog[];
}

export interface AnnouncementPayload {
  ticketNumber: string;
  ticketNumberAmharic: string;
  counterNumber: number;
  serviceName: string;
  serviceNameAmharic: string;
  language: AnnouncementLanguage;
  textAmharic: string;
  textEnglish: string;
  audioBase64?: string;
  audioMimeType?: string;
  timestamp: string;
}
