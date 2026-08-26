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
  isCheckedIn?: boolean;
  checkedInAt?: string;
  customerReview?: CustomerReview;
}

export interface CustomerReview {
  id: string;
  ticketId: string;
  ticketNumber: string;
  serviceId: string;
  serviceName: string;
  counterNumber?: number;
  officerName?: string;
  rating: number; // 1 to 5
  tags?: string[];
  comment?: string;
  createdAt: string;
}

export interface QueueEvent {
  id: string;
  ticketId: string;
  ticketNumber: string;
  eventType: 
    | 'CREATED'
    | 'CHECKED_IN'
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
  displayVideoEnabled?: boolean;
  displayVideoUrl?: string;
  displayVideoTitle?: string;
  displayVideoTitleAmharic?: string;
  displayVideoLayout?: 'SPLIT' | 'SIDE' | 'PIP' | 'FULL' | 'OFF';
  displayVideoAutoplay?: boolean;
  displayVideoLoop?: boolean;
  displayVideoMuted?: boolean;
  displayVideoVolume?: number;
  displayFontSize?: 'COMPACT' | 'NORMAL' | 'LARGE' | 'XLARGE' | 'MASSIVE';
}

export type TTSProviderType = 'ADDIS_AI' | 'BROWSER_SYNTHESIS';

export interface AudioSetting {
  id: string;
  voiceEnabled: boolean;
  language: AnnouncementLanguage;
  ttsProvider?: TTSProviderType;
  addisVoice?: string; // 'aster', 'abebe', 'selam', 'dawit'
  addisAiSpeed?: number;
  addisAiEndpoint?: string;
  addisAiApiKey?: string;
  volume: number; // 0 to 100
  repeatCount: number; // 1 or 2
  announcementDelaySeconds: number;
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
  auditLogs: AuditLog[];
  customerReviews: CustomerReview[];
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
  phoneticText?: string;
  audioBase64?: string;
  audioMimeType?: string;
  source?: 'ADDIS_AI' | 'GEMINI_TTS' | 'CACHE' | 'SYNTHESIS_FALLBACK';
  timestamp: string;
}
