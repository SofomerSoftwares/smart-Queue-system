export type RoleName = 'ADMIN' | 'RECEPTIONIST' | 'SERVICE_OFFICER';

export type TicketStatus = 
  | 'WAITING' 
  | 'CALLED' 
  | 'SERVING' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW' 
  | 'TRANSFERRED';

export type PriorityLevel = 'NORMAL' | 'PRIORITY' | 'URGENT';

export type AnnouncementLanguage = 'AMHARIC' | 'ENGLISH' | 'BOTH';

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: RoleName;
  displayName?: string;
  displayNameAmharic?: string;
  description: string;
  descriptionAmharic?: string;
  permissions: string[];
  isSystem?: boolean;
  memberCount?: number;
}

export interface PriorityPolicy {
  requireReasonForUrgent: boolean;
  allowOfficerTriage: boolean;
  allowReceptionTriage: boolean;
  autoAuditPriorityChanges: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: RoleName;
  assignedCounterId?: string;
  permissions: string[];
  canManagePriority?: boolean;
  password?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  lastLoginAt?: string;
  createdAt?: string;
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
  urgencyReason?: string;
  isUrgent?: boolean;
  priorityFlaggedAt?: string;
  priorityFlaggedBy?: string;
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

export type TTSProviderType = 'ADDIS_AI';

export interface AddisVoiceOption {
  id: string;
  name: string;
  nameAmharic: string;
  gender: 'FEMALE';
  description: string;
  descriptionAmharic: string;
}

export interface AudioSetting {
  id: string;
  voiceEnabled: boolean;
  language: AnnouncementLanguage;
  ttsProvider?: TTSProviderType;
  addisVoice?: string;
  addisAiSpeed?: number;
  addisAiEndpoint?: string;
  addisAiApiKey?: string;
  volume: number;
  repeatCount: number;
  announcementDelaySeconds: number;
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
  source?: 'ADDIS_AI';
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
  checkInUrl?: string;
  isCheckedIn?: boolean;
  priority?: PriorityLevel;
  urgencyReason?: string;
  isUrgent?: boolean;
}

export interface PermissionDefinition {
  id: string;
  name: string;
  description: string;
}

