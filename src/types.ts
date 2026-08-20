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

export interface User {
  id: string;
  name: string;
  username: string;
  role: RoleName;
  assignedCounterId?: string;
  permissions: string[];
}

export interface Service {
  id: string;
  name: string;
  nameAmharic: string;
  prefix: string;
  description?: string;
  estimatedDurationMinutes: number;
  color: string;
  isActive: boolean;
  order: number;
}

export interface Counter {
  id: string;
  number: number;
  name: string;
  nameAmharic: string;
  status: 'AVAILABLE' | 'SERVING' | 'CLOSED';
  currentOfficerId?: string;
  currentOfficerName?: string;
  currentTicketId?: string;
  currentTicketNumber?: string;
  updatedAt: string;
}

export interface QueueTicket {
  id: string;
  ticketNumber: string;
  sequenceNumber: number;
  prefix: string;
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
  dateKey: string;
  peopleAhead?: number;
  estimatedWaitMinutes?: number;
  ticketNumberAmharic?: string;
}

export interface OfficeSetting {
  id: string;
  officeName: string;
  officeNameAmharic: string;
  officeAddress: string;
  contactNumber: string;
  displayNotice: string;
  displayNoticeAmharic: string;
  dailyResetTime: string;
  estimatedWaitPerPersonMinutes: number;
  qrCodeUrlBase?: string;
}

export interface AudioSetting {
  id: string;
  voiceEnabled: boolean;
  language: AnnouncementLanguage;
  ttsModel: string;
  ttsVoice: string;
  volume: number;
  repeatCount: number;
  announcementDelaySeconds: number;
  backgroundMusicEnabled: boolean;
  backgroundMusicVolume: number;
  currentMusicAssetId?: string;
  musicModel?: string;
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

export interface QueueStats {
  dateKey: string;
  total: number;
  waiting: number;
  serving: number;
  completed: number;
  noShow: number;
  cancelled: number;
  avgWaitSeconds: number;
  avgWaitMinutes: number;
  avgServiceSeconds: number;
  avgServiceMinutes: number;
  serviceBreakdown: Array<{
    serviceId: string;
    serviceName: string;
    serviceNameAmharic: string;
    prefix: string;
    color: string;
    total: number;
    waiting: number;
    completed: number;
    avgWaitMinutes: number;
    avgServiceMinutes: number;
  }>;
  counterBreakdown: Array<{
    counterId: string;
    counterNumber: number;
    counterName: string;
    counterNameAmharic: string;
    status: string;
    currentTicketNumber?: string;
    officerName?: string;
    totalServed: number;
    avgServiceMinutes: number;
  }>;
}

export interface PrintTicketData {
  officeName: string;
  officeNameAmharic: string;
  ticketNumber: string;
  ticketNumberAmharic: string;
  serviceName: string;
  serviceNameAmharic: string;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  issuedAt: string;
  notice?: string;
}
