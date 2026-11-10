export type RoleName = 'ADMIN' | 'RECEPTIONIST' | 'SERVICE_OFFICER';

export type TicketStatus = 
  | 'WAITING' 
  | 'CALLED' 
  | 'SERVING' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW' 
  | 'TRANSFERRED'
  | 'HOLD';

export type PriorityLevel = 'NORMAL' | 'PRIORITY' | 'URGENT';

export type AnnouncementLanguage = 'AMHARIC' | 'ENGLISH' | 'BOTH';

export interface PermissionDefinition {
  id: string;
  name: string;
  description: string;
}

export type Permission = PermissionDefinition;

export interface AddisVoiceOption {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | string;
  accent?: string;
  description?: string;
}

export interface QueueStats {
  total?: number;
  totalTicketsToday?: number;
  waiting?: number;
  currentlyWaiting?: number;
  serving?: number;
  currentlyServing?: number;
  completed?: number;
  completedToday?: number;
  cancelled?: number;
  cancelledToday?: number;
  noShow?: number;
  activeCounters?: number;
  avgWaitTimeMinutes?: number;
  avgServiceTimeMinutes?: number;
  serviceBreakdown?: any[];
  counterBreakdown?: any[];
  hourlyActivity?: any[];
  reviewStats?: any;
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
  passwordHash?: string;
  roleId: string;
  role: RoleName;
  status: 'ACTIVE' | 'INACTIVE';
  assignedCounterId?: string;
  canManagePriority?: boolean;
  customPermissions?: string[];
  permissions?: string[];
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
  number: number;
  name: string;
  nameAmharic: string;
  status: 'AVAILABLE' | 'SERVING' | 'CLOSED';
  currentOfficerId?: string;
  currentOfficerName?: string;
  currentTicketId?: string;
  currentTicketNumber?: string;
  serviceIds?: string[];
  updatedAt: string;
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
  updatedAt?: string;
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
    | 'CANCELLED'
    | 'PRIORITY_CHANGED';
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

export type TTSProviderType = 'ADDIS_AI' | 'CUSTOM_RECORDED' | 'BROWSER_SPEECH';

export interface AudioSetting {
  id: string;
  voiceEnabled: boolean;
  language: AnnouncementLanguage;
  ttsProvider?: TTSProviderType;
  voiceMode?: 'ADDIS_AI' | 'CUSTOM_RECORDED' | 'BROWSER_SPEECH';
  addisVoice?: string;
  addisAiSpeed?: number;
  addisAiEndpoint?: string;
  addisAiApiKey?: string;
  volume: number;
  repeatCount: number;
  announcementDelaySeconds: number;
  customRecordingBase64?: string;
  customRecordingMimeType?: string;
  customRecordingDuration?: number;
  customRecordingName?: string;
  customRecordingCreatedAt?: string;
  customRecordingRecordedBy?: string;
  allowOfficerPersonalRecord?: boolean;
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

export type NotificationEventType =
  | 'TICKET_CALLED'
  | 'TICKET_RECALLED'
  | 'TICKET_COMPLETED'
  | 'TICKET_SKIPPED'
  | 'TICKET_HOLD'
  | 'TICKET_RESUMED'
  | 'TICKET_TRANSFERRED'
  | 'COUNTER_OFFLINE'
  | 'COUNTER_ONLINE'
  | 'COUNTER_BREAK'
  | 'COUNTER_AVAILABLE';

export interface ReceptionNotification {
  id: string;
  recipientRole: string;
  recipientUserId?: string | null;
  branchId: string;
  type: NotificationEventType;
  title: string;
  message: string;
  ticketId?: string;
  ticketNumber?: string;
  counterId?: string;
  counterNumber?: number;
  counterName?: string;
  serviceId?: string;
  serviceName?: string;
  officerId?: string;
  officerName?: string;
  action?: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationSettings {
  inAppEnabled: boolean;
  desktopEnabled: boolean;
  soundEnabled: boolean;
  eventTypes: Record<NotificationEventType, boolean>;
}

export interface DatabaseSchema {
  users: User[];
  roles: Role[];
  services: Service[];
  counters: Counter[];
  tickets: QueueTicket[];
  events: QueueEvent[];
  officeSetting: OfficeSetting;
  audioSetting: AudioSetting;
  auditLogs: AuditLog[];
  customerReviews: CustomerReview[];
  priorityPolicy: PriorityPolicy;
  notifications: ReceptionNotification[];
  notificationSettings: NotificationSettings;
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
  source?: 'ADDIS_AI' | 'CACHE' | 'SYNTHESIS_FALLBACK' | 'CUSTOM_RECORDED' | 'OFFICER_LIVE_RECORDING';
  isLiveVoiceRecord?: boolean;
  officerName?: string;
  customText?: string;
  timestamp: string;
}

export interface PrintTicketData {
  ticketNumber: string;
  ticketNumberAmharic?: string;
  serviceName: string;
  serviceNameAmharic: string;
  issuedAt: string;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  officeName: string;
  officeNameAmharic: string;
  contactNumber: string;
  qrCodeUrl?: string;
  priority?: PriorityLevel;
  urgencyReason?: string;
  isUrgent?: boolean;
}

export interface QueueStateResponse {
  success: boolean;
  waitingTickets: QueueTicket[];
  servingTickets: QueueTicket[];
  recentCompleted: QueueTicket[];
  counters: Counter[];
  services: Service[];
  officeSetting: OfficeSetting;
  audioSetting: AudioSetting;
  stats: QueueStats;
}
