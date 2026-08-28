import bcrypt from 'bcryptjs';
import { 
  User, 
  Role, 
  Permission, 
  Service, 
  Counter, 
  QueueTicket, 
  QueueEvent, 
  OfficeSetting, 
  AudioSetting, 
  AuditLog,
  CustomerReview,
  RoleName,
  PriorityLevel,
  DatabaseSchema
} from './types.js';
import { mongoService } from './mongodb.js';

export const PERMISSIONS: Permission[] = [
  { id: 'dashboard.view', name: 'View Dashboard', description: 'Access dashboard screens' },
  { id: 'queue.view', name: 'View Queue', description: 'View current queue list and status' },
  { id: 'queue.manage', name: 'Manage Queue', description: 'Reset or manage entire queue' },
  { id: 'ticket.create', name: 'Create Ticket', description: 'Issue new anonymous queue ticket' },
  { id: 'ticket.call', name: 'Call Ticket', description: 'Call next ticket to counter' },
  { id: 'ticket.recall', name: 'Recall Ticket', description: 'Recall previously called ticket' },
  { id: 'ticket.start', name: 'Start Service', description: 'Start serving the customer' },
  { id: 'ticket.complete', name: 'Complete Ticket', description: 'Mark ticket as finished' },
  { id: 'ticket.transfer', name: 'Transfer Ticket', description: 'Transfer ticket to another service or counter' },
  { id: 'ticket.priority', name: 'Manage Ticket Priority', description: 'Flag urgent tickets for prioritized service in the officer dashboard' },
  { id: 'ticket.cancel', name: 'Cancel Ticket', description: 'Cancel an active ticket' },
  { id: 'ticket.no_show', name: 'Mark No-Show', description: 'Mark customer as absent' },
  { id: 'services.view', name: 'View Services', description: 'View service configurations' },
  { id: 'services.create', name: 'Create Service', description: 'Add new service' },
  { id: 'services.update', name: 'Update Service', description: 'Modify existing service' },
  { id: 'services.delete', name: 'Delete Service', description: 'Remove service' },
  { id: 'counters.view', name: 'View Counters', description: 'View counter stations' },
  { id: 'counters.create', name: 'Create Counter', description: 'Add new counter' },
  { id: 'counters.update', name: 'Update Counter', description: 'Modify counter status or details' },
  { id: 'counters.delete', name: 'Delete Counter', description: 'Remove counter' },
  { id: 'staff.view', name: 'View Staff', description: 'View staff members' },
  { id: 'staff.create', name: 'Create Staff', description: 'Register new staff member' },
  { id: 'staff.update', name: 'Update Staff', description: 'Edit staff member' },
  { id: 'staff.delete', name: 'Delete Staff', description: 'Remove staff member' },
  { id: 'reports.view', name: 'View Reports', description: 'Access daily and analytical reports' },
  { id: 'settings.view', name: 'View Settings', description: 'View system configuration' },
  { id: 'settings.update', name: 'Update Settings', description: 'Change system configuration' },
  { id: 'audio.manage', name: 'Manage Audio', description: 'Configure Addis AI voice announcement settings' }
];

export const ROLES: Record<RoleName, Role> = {
  ADMIN: {
    id: 'role-admin',
    name: 'ADMIN',
    description: 'Full administrative access',
    permissions: PERMISSIONS.map(p => p.id)
  },
  RECEPTIONIST: {
    id: 'role-receptionist',
    name: 'RECEPTIONIST',
    description: 'Front desk ticket creation and queue triage',
    permissions: [
      'dashboard.view',
      'queue.view',
      'ticket.create',
      'ticket.priority',
      'ticket.cancel',
      'ticket.transfer',
      'services.view'
    ]
  },
  SERVICE_OFFICER: {
    id: 'role-service-officer',
    name: 'SERVICE_OFFICER',
    description: 'Counter service officer handling customer tickets',
    permissions: [
      'dashboard.view',
      'queue.view',
      'ticket.call',
      'ticket.recall',
      'ticket.start',
      'ticket.complete',
      'ticket.no_show',
      'ticket.priority',
      'ticket.transfer'
    ]
  }
};

function getTodayKey(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function seedDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const now = new Date().toISOString();

  const users: User[] = [
    {
      id: 'usr-admin-1',
      name: 'Alemayehu Tadesse (Admin)',
      username: 'admin',
      passwordHash: bcrypt.hashSync('Admin@123', salt),
      roleId: 'role-admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'usr-reception-1',
      name: 'Bethlehem Haile (Front Desk)',
      username: 'reception',
      passwordHash: bcrypt.hashSync('Reception@123', salt),
      roleId: 'role-receptionist',
      role: 'RECEPTIONIST',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'usr-officer-1',
      name: 'Dawit Mengistu (Counter 1)',
      username: 'officer1',
      passwordHash: bcrypt.hashSync('Officer@123', salt),
      roleId: 'role-service-officer',
      role: 'SERVICE_OFFICER',
      status: 'ACTIVE',
      assignedCounterId: 'cnt-1',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'usr-officer-2',
      name: 'Samrawit Bekele (Counter 2)',
      username: 'officer2',
      passwordHash: bcrypt.hashSync('Officer@123', salt),
      roleId: 'role-service-officer',
      role: 'SERVICE_OFFICER',
      status: 'ACTIVE',
      assignedCounterId: 'cnt-2',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'usr-officer-3',
      name: 'Kassahun Worku (Counter 3)',
      username: 'officer3',
      passwordHash: bcrypt.hashSync('Officer@123', salt),
      roleId: 'role-service-officer',
      role: 'SERVICE_OFFICER',
      status: 'ACTIVE',
      assignedCounterId: 'cnt-3',
      createdAt: now,
      updatedAt: now
    }
  ];

  const services: Service[] = [
    {
      id: 'srv-1',
      name: 'New Application',
      nameAmharic: 'አዲስ ማመልከቻ',
      prefix: 'A',
      description: 'First time registration and new service applications',
      estimatedDurationMinutes: 8,
      color: '#059669', // Emerald
      isActive: true,
      order: 1
    },
    {
      id: 'srv-2',
      name: 'Renewal & Extension',
      nameAmharic: 'እድሳት እና ማራዘሚያ',
      prefix: 'R',
      description: 'Renew permits, licenses or documentation',
      estimatedDurationMinutes: 5,
      color: '#2563eb', // Blue
      isActive: true,
      order: 2
    },
    {
      id: 'srv-3',
      name: 'Payment & Cashier',
      nameAmharic: 'ክፍያ እና ገንዘብ መቀበያ',
      prefix: 'P',
      description: 'Fee settlements, receipts and bank approvals',
      estimatedDurationMinutes: 4,
      color: '#7c3aed', // Purple
      isActive: true,
      order: 3
    },
    {
      id: 'srv-4',
      name: 'Document Collection',
      nameAmharic: 'ሰነድ እና ካርድ መቀበያ',
      prefix: 'D',
      description: 'Collect processed documents, ID cards and certificates',
      estimatedDurationMinutes: 3,
      color: '#ea580c', // Orange
      isActive: true,
      order: 4
    },
    {
      id: 'srv-5',
      name: 'Customer Support',
      nameAmharic: 'የደንበኞች አገልግሎት እና መረጃ',
      prefix: 'S',
      description: 'Inquiries, status checks and consultation',
      estimatedDurationMinutes: 6,
      color: '#0891b2', // Cyan
      isActive: true,
      order: 5
    },
    {
      id: 'srv-6',
      name: 'Complaint & Review',
      nameAmharic: 'አቤቱታ እና ቅሬታ ማስተናገጃ',
      prefix: 'C',
      description: 'Official complaints and dispute escalation',
      estimatedDurationMinutes: 10,
      color: '#e11d48', // Rose
      isActive: true,
      order: 6
    }
  ];

  const counters: Counter[] = [
    {
      id: 'cnt-1',
      number: 1,
      name: 'Counter 1 (Main Registration)',
      nameAmharic: 'መስኮት 1 (ዋና ምዝገባ)',
      status: 'SERVING',
      currentOfficerId: 'usr-officer-1',
      currentOfficerName: 'Dawit Mengistu',
      updatedAt: now
    },
    {
      id: 'cnt-2',
      number: 2,
      name: 'Counter 2 (Applications & Renewals)',
      nameAmharic: 'መስኮት 2 (ማመልከቻ እና እድሳት)',
      status: 'AVAILABLE',
      currentOfficerId: 'usr-officer-2',
      currentOfficerName: 'Samrawit Bekele',
      updatedAt: now
    },
    {
      id: 'cnt-3',
      number: 3,
      name: 'Counter 3 (Cashier & Payments)',
      nameAmharic: 'መስኮት 3 (ክፍያ እና ሂሳብ)',
      status: 'AVAILABLE',
      currentOfficerId: 'usr-officer-3',
      currentOfficerName: 'Kassahun Worku',
      updatedAt: now
    },
    {
      id: 'cnt-4',
      number: 4,
      name: 'Counter 4 (Express Collection)',
      nameAmharic: 'መስኮት 4 (ፈጣን ሰነድ መሰብሰቢያ)',
      status: 'CLOSED',
      updatedAt: now
    }
  ];

  const officeSetting: OfficeSetting = {
    id: 'setting-1',
    officeName: 'Ministry of Innovation & Service Center',
    officeNameAmharic: 'የፈጠራ እና ቴክኖሎጂ አገልግሎት መስጫ ማዕከል',
    officeAddress: 'Bole Road, Building 4B, Addis Ababa, Ethiopia',
    contactNumber: '+251 11 551 7000',
    displayNotice: 'Welcome to our Office. Please wait for your ticket number to be called.',
    displayNoticeAmharic: 'እንኳን ወደ ቢሮአችን በደህና መጡ። ቁጥርዎ በድምፅ እና በስክሪን እስኪጠራ ድረስ በትዕግስት ይጠብቁ።',
    dailyResetTime: '00:00',
    estimatedWaitPerPersonMinutes: 4,
    qrCodeUrlBase: '',
    displayVideoEnabled: true,
    displayVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    displayVideoTitle: 'Office Information & Welcome Video',
    displayVideoTitleAmharic: 'የቢሮ መረጃ እና የእንኳን ደህና መጡ ቪዲዮ',
    displayVideoLayout: 'SPLIT',
    displayVideoAutoplay: true,
    displayVideoLoop: true,
    displayVideoMuted: true,
    displayVideoVolume: 25,
    displayFontSize: 'NORMAL'
  };

  const audioSetting: AudioSetting = {
    id: 'audio-setting-1',
    voiceEnabled: true,
    language: 'AMHARIC',
    ttsProvider: 'ADDIS_AI',
    addisVoice: process.env.ADDIS_AI_DEFAULT_VOICE || 'aster',
    addisAiSpeed: 1.0,
    addisAiEndpoint: process.env.ADDIS_AI_ENDPOINT || 'https://api.addisassistant.com/api/v1/voice/generations',
    volume: 85,
    repeatCount: 1,
    announcementDelaySeconds: 1
  };

  // Seed sample initial tickets for today
  const todayKey = getTodayKey();
  const sampleTickets: QueueTicket[] = [
    {
      id: 'tkt-001',
      ticketNumber: 'A-001',
      sequenceNumber: 1,
      prefix: 'A',
      serviceId: 'srv-1',
      serviceName: 'New Application',
      serviceNameAmharic: 'አዲስ ማመልከቻ',
      counterId: 'cnt-1',
      counterNumber: 1,
      officerId: 'usr-officer-1',
      officerName: 'Dawit Mengistu',
      status: 'SERVING',
      priority: 'NORMAL',
      issuedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      calledAt: new Date(Date.now() - 10 * 60000).toISOString(),
      serviceStartedAt: new Date(Date.now() - 8 * 60000).toISOString(),
      waitingDurationSeconds: 420,
      dateKey: todayKey,
      isCheckedIn: true,
      checkedInAt: new Date(Date.now() - 14 * 60000).toISOString()
    },
    {
      id: 'tkt-002',
      ticketNumber: 'R-001',
      sequenceNumber: 1,
      prefix: 'R',
      serviceId: 'srv-2',
      serviceName: 'Renewal & Extension',
      serviceNameAmharic: 'እድሳት እና ማራዘሚያ',
      counterId: 'cnt-2',
      counterNumber: 2,
      officerId: 'usr-officer-2',
      officerName: 'Samrawit Bekele',
      status: 'COMPLETED',
      priority: 'NORMAL',
      issuedAt: new Date(Date.now() - 25 * 60000).toISOString(),
      calledAt: new Date(Date.now() - 18 * 60000).toISOString(),
      serviceStartedAt: new Date(Date.now() - 17 * 60000).toISOString(),
      completedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      waitingDurationSeconds: 480,
      serviceDurationSeconds: 720,
      dateKey: todayKey,
      isCheckedIn: true,
      checkedInAt: new Date(Date.now() - 24 * 60000).toISOString()
    },
    {
      id: 'tkt-003',
      ticketNumber: 'A-002',
      sequenceNumber: 2,
      prefix: 'A',
      serviceId: 'srv-1',
      serviceName: 'New Application',
      serviceNameAmharic: 'አዲስ ማመልከቻ',
      status: 'WAITING',
      priority: 'NORMAL',
      issuedAt: new Date(Date.now() - 12 * 60000).toISOString(),
      dateKey: todayKey,
      isCheckedIn: false
    },
    {
      id: 'tkt-004',
      ticketNumber: 'P-001',
      sequenceNumber: 1,
      prefix: 'P',
      serviceId: 'srv-3',
      serviceName: 'Payment & Cashier',
      serviceNameAmharic: 'ክፍያ እና ገንዘብ መቀበያ',
      status: 'WAITING',
      priority: 'PRIORITY',
      issuedAt: new Date(Date.now() - 8 * 60000).toISOString(),
      dateKey: todayKey,
      isCheckedIn: true,
      checkedInAt: new Date(Date.now() - 7 * 60000).toISOString()
    },
    {
      id: 'tkt-005',
      ticketNumber: 'D-001',
      sequenceNumber: 1,
      prefix: 'D',
      serviceId: 'srv-4',
      serviceName: 'Document Collection',
      serviceNameAmharic: 'ሰነድ እና ካርድ መቀበያ',
      status: 'WAITING',
      priority: 'NORMAL',
      issuedAt: new Date(Date.now() - 4 * 60000).toISOString(),
      dateKey: todayKey,
      isCheckedIn: false
    }
  ];

  // Link counter 1 to tkt-001
  counters[0].currentTicketId = 'tkt-001';
  counters[0].currentTicketNumber = 'A-001';

  return {
    users,
    services,
    counters,
    tickets: sampleTickets,
    events: [],
    officeSetting,
    audioSetting,
    auditLogs: [],
    customerReviews: []
  };
}

class Database {
  private data: DatabaseSchema;
  private isWriting = false;
  private queueLock = false;

  constructor() {
    this.data = this.load();
    this.initMongoSync().catch(err => {
      console.warn('Initial MongoDB Atlas sync background notice:', err);
    });
  }

  private async initMongoSync(): Promise<void> {
    try {
      const connected = await mongoService.connect();
      if (connected) {
        const mongoData = await mongoService.loadAll();
        if (mongoData && mongoData.users && mongoData.users.length > 0) {
          // MongoDB Atlas has existing data; hydrate our state directly from MongoDB
          this.data = mongoData;
          console.log(`🚀 [MongoDB Atlas] Successfully loaded ${mongoData.tickets?.length || 0} tickets, ${mongoData.services?.length || 0} services from Atlas collections`);
        } else {
          // MongoDB Atlas is freshly connected and empty; push initial seed to Atlas collections
          await mongoService.saveAll(this.data);
          console.log(`📦 [MongoDB Atlas] Successfully seeded initial schema and collections to MongoDB Atlas`);
        }
      }
    } catch (err: any) {
      console.log(`ℹ️ [MongoDB Atlas] Startup note: ${err?.message || 'Connecting to MongoDB Atlas...'}`);
    }
  }

  private load(): DatabaseSchema {
    return seedDatabase();
  }

  private saveImmediate(snapshot: DatabaseSchema) {
    // Mirror and persist snapshot directly to MongoDB Atlas collections
    if (mongoService.isReady()) {
      mongoService.saveAll(snapshot).catch(err => {
        console.warn('MongoDB Atlas persistence warning:', err.message);
      });
    }
  }

  public save() {
    if (this.isWriting) return;
    this.isWriting = true;
    setTimeout(() => {
      this.saveImmediate(this.data);
      this.isWriting = false;
    }, 50);
  }

  public getMongoStatus() {
    return mongoService.getStatus();
  }

  public async connectMongo(uri?: string) {
    const success = await mongoService.connect(uri);
    if (success) {
      const mongoData = await mongoService.loadAll();
      if (mongoData && mongoData.users && mongoData.users.length > 0) {
        this.data = mongoData;
      } else {
        await mongoService.saveAll(this.data);
      }
    }
    return mongoService.getStatus();
  }

  public async syncMongoNow(): Promise<{ success: boolean; message: string }> {
    if (!mongoService.isReady()) {
      return { success: false, message: 'MongoDB Atlas is not connected.' };
    }
    await mongoService.saveAll(this.data);
    return { success: true, message: 'Successfully synced all data to MongoDB Atlas collections.' };
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    if (user.assignedCounterId) {
      const counter = this.data.counters.find(c => c.id === user.assignedCounterId);
      if (counter) {
        counter.currentOfficerId = user.id;
        counter.currentOfficerName = user.name;
        counter.updatedAt = new Date().toISOString();
      }
    }
    this.save();
    return user;
  }

  public updateUser(id: string, update: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    const oldUser = this.data.users[idx];
    const updatedUser = { ...oldUser, ...update, updatedAt: new Date().toISOString() };
    this.data.users[idx] = updatedUser;

    // Synchronize counter assignment
    if ('assignedCounterId' in update) {
      const oldCounterId = oldUser.assignedCounterId;
      const newCounterId = update.assignedCounterId;

      if (oldCounterId && oldCounterId !== newCounterId) {
        const oldCounter = this.data.counters.find(c => c.id === oldCounterId);
        if (oldCounter && oldCounter.currentOfficerId === id) {
          oldCounter.currentOfficerId = undefined;
          oldCounter.currentOfficerName = undefined;
          oldCounter.updatedAt = new Date().toISOString();
        }
      }

      if (newCounterId) {
        const newCounter = this.data.counters.find(c => c.id === newCounterId);
        if (newCounter) {
          newCounter.currentOfficerId = updatedUser.id;
          newCounter.currentOfficerName = updatedUser.name;
          newCounter.updatedAt = new Date().toISOString();
        }
      }
    } else if (update.name) {
      // Update officer name if name was changed
      if (updatedUser.assignedCounterId) {
        const counter = this.data.counters.find(c => c.id === updatedUser.assignedCounterId);
        if (counter && counter.currentOfficerId === id) {
          counter.currentOfficerName = update.name;
        }
      }
    }

    this.save();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const len = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== len) {
      // Clear counter references
      this.data.counters.forEach(c => {
        if (c.currentOfficerId === id) {
          c.currentOfficerId = undefined;
          c.currentOfficerName = undefined;
          c.updatedAt = new Date().toISOString();
        }
      });
      this.save();
      return true;
    }
    return false;
  }

  // --- SERVICES ---
  public getServices(): Service[] {
    return this.data.services.sort((a, b) => a.order - b.order);
  }

  public getServiceById(id: string): Service | undefined {
    return this.data.services.find(s => s.id === id);
  }

  public createService(service: Service): Service {
    this.data.services.push(service);
    this.save();
    return service;
  }

  public updateService(id: string, update: Partial<Service>): Service | undefined {
    const idx = this.data.services.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.data.services[idx] = { ...this.data.services[idx], ...update };
    this.save();
    return this.data.services[idx];
  }

  public deleteService(id: string): boolean {
    const len = this.data.services.length;
    this.data.services = this.data.services.filter(s => s.id !== id);
    if (this.data.services.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  // --- COUNTERS ---
  public getCounters(): Counter[] {
    return this.data.counters.sort((a, b) => a.number - b.number);
  }

  public getCounterById(id: string): Counter | undefined {
    return this.data.counters.find(c => c.id === id);
  }

  public getCounterByNumber(num: number): Counter | undefined {
    return this.data.counters.find(c => c.number === num);
  }

  public createCounter(counter: Counter): Counter {
    this.data.counters.push(counter);
    this.save();
    return counter;
  }

  public updateCounter(id: string, update: Partial<Counter>): Counter | undefined {
    const idx = this.data.counters.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.data.counters[idx] = { ...this.data.counters[idx], ...update, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.counters[idx];
  }

  public deleteCounter(id: string): boolean {
    const len = this.data.counters.length;
    this.data.counters = this.data.counters.filter(c => c.id !== id);
    if (this.data.counters.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  // --- TRANSACTIONAL QUEUE TICKETS ---
  public getTickets(filters?: { dateKey?: string; status?: string }): QueueTicket[] {
    let list = this.data.tickets;
    if (filters?.dateKey) {
      list = list.filter(t => t.dateKey === filters.dateKey);
    }
    if (filters?.status) {
      list = list.filter(t => t.status === filters.status);
    }
    return list;
  }

  public getTicketById(id: string): QueueTicket | undefined {
    return this.data.tickets.find(t => t.id === id);
  }

  public getTicketByNumber(ticketNumber: string, dateKey?: string): QueueTicket | undefined {
    const targetDate = dateKey || getTodayKey();
    return this.data.tickets.find(
      t => t.ticketNumber.toUpperCase() === ticketNumber.toUpperCase() && t.dateKey === targetDate
    ) || this.data.tickets.find(
      t => t.ticketNumber.toUpperCase() === ticketNumber.toUpperCase()
    );
  }

  /**
   * Transactional sequential ticket generator with atomic daily increment
   */
  public generateTicket(
    serviceId: string, 
    priority: PriorityLevel = 'NORMAL',
    urgencyReason?: string,
    notes?: string,
    flaggedBy?: string
  ): QueueTicket {
    const service = this.getServiceById(serviceId);
    if (!service) {
      throw new Error(`Service with ID ${serviceId} not found`);
    }

    const today = getTodayKey();
    const prefix = service.prefix.toUpperCase();

    // Find highest sequence number for this prefix today
    const ticketsForPrefixToday = this.data.tickets.filter(
      t => t.dateKey === today && t.prefix === prefix
    );

    const nextSeq = ticketsForPrefixToday.reduce((max, t) => Math.max(max, t.sequenceNumber), 0) + 1;
    const formattedNum = `${prefix}-${String(nextSeq).padStart(3, '0')}`;
    const isUrgent = priority === 'URGENT' || priority === 'PRIORITY';
    const now = new Date().toISOString();

    const newTicket: QueueTicket = {
      id: `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketNumber: formattedNum,
      sequenceNumber: nextSeq,
      prefix,
      serviceId: service.id,
      serviceName: service.name,
      serviceNameAmharic: service.nameAmharic,
      status: 'WAITING',
      priority,
      urgencyReason: urgencyReason || (priority === 'URGENT' ? 'Urgent Priority / አስቸኳይ' : (priority === 'PRIORITY' ? 'Priority / ቅድሚያ' : undefined)),
      isUrgent,
      priorityFlaggedAt: isUrgent ? now : undefined,
      priorityFlaggedBy: isUrgent ? (flaggedBy || 'Reception') : undefined,
      notes,
      issuedAt: now,
      dateKey: today
    };

    this.data.tickets.push(newTicket);
    this.addEvent({
      ticketId: newTicket.id,
      ticketNumber: newTicket.ticketNumber,
      eventType: 'CREATED',
      metadata: { priority, urgencyReason: newTicket.urgencyReason, isUrgent, serviceId, serviceName: service.name }
    });

    this.save();
    return newTicket;
  }

  /**
   * Update priority on an existing waiting ticket (e.g. reception triage or escalation)
   */
  public setTicketPriority(
    ticketId: string, 
    priority: PriorityLevel, 
    urgencyReason?: string, 
    flaggedBy?: string, 
    notes?: string
  ): QueueTicket {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    const previousPriority = ticket.priority;
    const isUrgent = priority === 'URGENT' || priority === 'PRIORITY';
    const now = new Date().toISOString();

    ticket.priority = priority;
    ticket.urgencyReason = urgencyReason !== undefined ? urgencyReason : ticket.urgencyReason;
    if (!ticket.urgencyReason && priority === 'URGENT') {
      ticket.urgencyReason = 'Urgent Priority / አስቸኳይ';
    } else if (!ticket.urgencyReason && priority === 'PRIORITY') {
      ticket.urgencyReason = 'Priority / ቅድሚያ';
    } else if (priority === 'NORMAL' && !urgencyReason) {
      ticket.urgencyReason = undefined;
    }
    ticket.isUrgent = isUrgent;
    ticket.priorityFlaggedAt = isUrgent ? now : undefined;
    ticket.priorityFlaggedBy = isUrgent ? (flaggedBy || 'Reception') : undefined;

    if (notes) {
      ticket.notes = ticket.notes ? `${ticket.notes}\n${notes}` : notes;
    }

    this.addEvent({
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      eventType: 'PRIORITY_CHANGED',
      counterId: ticket.counterId,
      counterNumber: ticket.counterNumber,
      userName: flaggedBy,
      metadata: {
        previousPriority,
        newPriority: priority,
        urgencyReason: ticket.urgencyReason,
        isUrgent,
        notes
      }
    });

    this.save();
    return ticket;
  }

  /**
   * Transactional atomic call next ticket
   */
  public async callNextTicket(counterId: string, officerId: string, specificTicketId?: string): Promise<QueueTicket | null> {
    // Acquire mutex lock
    while (this.queueLock) {
      await new Promise(r => setTimeout(r, 20));
    }
    this.queueLock = true;

    try {
      const counter = this.getCounterById(counterId);
      if (!counter) {
        throw new Error('Counter not found');
      }

      const officer = this.getUserById(officerId);
      const officerName = officer ? officer.name : 'Officer';
      const today = getTodayKey();

      let targetTicket: QueueTicket | undefined;

      if (specificTicketId) {
        targetTicket = this.data.tickets.find(
          t => t.id === specificTicketId && t.status === 'WAITING'
        );
      } else {
        // Find waiting tickets for today, filtered by counter services if assigned
        const eligibleTickets = this.data.tickets.filter(t => {
          if (t.dateKey !== today || t.status !== 'WAITING') return false;
          if (counter.serviceIds && counter.serviceIds.length > 0) {
            return counter.serviceIds.includes(t.serviceId);
          }
          return true;
        });

        // Priority Score: URGENT (3) -> PRIORITY (2) -> NORMAL (1)
        const getPriorityScore = (t: QueueTicket): number => {
          if (t.priority === 'URGENT') return 3;
          if (t.priority === 'PRIORITY' || t.isUrgent) return 2;
          return 1;
        };

        // Sort higher priority first, then FIFO by issuedAt
        eligibleTickets.sort((a, b) => {
          const scoreA = getPriorityScore(a);
          const scoreB = getPriorityScore(b);
          if (scoreB !== scoreA) {
            return scoreB - scoreA; // Urgent first, then Priority, then Normal
          }
          return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
        });

        if (eligibleTickets.length > 0) {
          targetTicket = eligibleTickets[0];
        }
      }

      if (!targetTicket) {
        return null; // No waiting tickets
      }

      const now = new Date().toISOString();
      const waitingDuration = Math.round((new Date(now).getTime() - new Date(targetTicket.issuedAt).getTime()) / 1000);

      targetTicket.status = 'CALLED';
      targetTicket.calledAt = now;
      targetTicket.counterId = counter.id;
      targetTicket.counterNumber = counter.number;
      targetTicket.officerId = officerId;
      targetTicket.officerName = officerName;
      targetTicket.waitingDurationSeconds = waitingDuration;

      // Update counter state
      counter.status = 'SERVING';
      counter.currentTicketId = targetTicket.id;
      counter.currentTicketNumber = targetTicket.ticketNumber;
      counter.currentOfficerId = officerId;
      counter.currentOfficerName = officerName;
      counter.updatedAt = now;

      this.addEvent({
        ticketId: targetTicket.id,
        ticketNumber: targetTicket.ticketNumber,
        eventType: 'CALLED',
        counterId: counter.id,
        counterNumber: counter.number,
        userId: officerId,
        userName: officerName,
        metadata: { waitingDuration }
      });

      this.save();
      return targetTicket;
    } finally {
      this.queueLock = false;
    }
  }

  public updateTicketStatus(
    ticketId: string, 
    newStatus: QueueTicket['status'], 
    officerId?: string,
    metadata?: Record<string, any>
  ): QueueTicket {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    const now = new Date().toISOString();
    ticket.status = newStatus;

    if (newStatus === 'SERVING') {
      ticket.serviceStartedAt = now;
    } else if (newStatus === 'COMPLETED') {
      ticket.completedAt = now;
      if (ticket.serviceStartedAt) {
        ticket.serviceDurationSeconds = Math.round((new Date(now).getTime() - new Date(ticket.serviceStartedAt).getTime()) / 1000);
      } else if (ticket.calledAt) {
        ticket.serviceDurationSeconds = Math.round((new Date(now).getTime() - new Date(ticket.calledAt).getTime()) / 1000);
      }
    }

    // If completed/no_show/cancelled, free the counter
    if (['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(newStatus) && ticket.counterId) {
      const counter = this.getCounterById(ticket.counterId);
      if (counter && counter.currentTicketId === ticket.id) {
        counter.currentTicketId = undefined;
        counter.currentTicketNumber = undefined;
        counter.status = 'AVAILABLE';
        counter.updatedAt = now;
      }
    }

    let eventType: QueueEvent['eventType'] = 'COMPLETED';
    if (newStatus === 'SERVING') eventType = 'STARTED';
    else if (newStatus === 'CALLED') eventType = 'RECALLED';
    else if (newStatus === 'NO_SHOW') eventType = 'NO_SHOW';
    else if (newStatus === 'CANCELLED') eventType = 'CANCELLED';
    else if (newStatus === 'TRANSFERRED') eventType = 'TRANSFERRED';

    const officer = officerId ? this.getUserById(officerId) : undefined;
    this.addEvent({
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      eventType,
      counterId: ticket.counterId,
      counterNumber: ticket.counterNumber,
      userId: officerId,
      userName: officer?.name,
      metadata
    });

    this.save();
    return ticket;
  }

  public checkInTicket(ticketIdOrNumber: string): QueueTicket | undefined {
    let ticket = this.getTicketById(ticketIdOrNumber);
    if (!ticket) {
      ticket = this.getTicketByNumber(ticketIdOrNumber);
    }
    if (!ticket) return undefined;

    const now = new Date().toISOString();
    ticket.isCheckedIn = true;
    ticket.checkedInAt = now;

    this.addEvent({
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      eventType: 'CHECKED_IN',
      metadata: { checkedInAt: now }
    });

    this.save();
    return ticket;
  }

  public transferTicket(ticketId: string, targetServiceId: string, officerId?: string): QueueTicket {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    const targetService = this.getServiceById(targetServiceId);
    if (!targetService) throw new Error('Target service not found');

    const previousServiceName = ticket.serviceName;
    ticket.serviceId = targetService.id;
    ticket.serviceName = targetService.name;
    ticket.serviceNameAmharic = targetService.nameAmharic;
    ticket.status = 'WAITING';
    ticket.priority = 'PRIORITY'; // Give transferred customer priority

    // Free previous counter
    if (ticket.counterId) {
      const counter = this.getCounterById(ticket.counterId);
      if (counter && counter.currentTicketId === ticket.id) {
        counter.currentTicketId = undefined;
        counter.currentTicketNumber = undefined;
        counter.status = 'AVAILABLE';
      }
    }
    ticket.counterId = undefined;
    ticket.counterNumber = undefined;

    const officer = officerId ? this.getUserById(officerId) : undefined;
    this.addEvent({
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      eventType: 'TRANSFERRED',
      userId: officerId,
      userName: officer?.name,
      metadata: { fromService: previousServiceName, toService: targetService.name }
    });

    this.save();
    return ticket;
  }

  // --- EVENTS & AUDIT ---
  public addEvent(event: Omit<QueueEvent, 'id' | 'timestamp'>): QueueEvent {
    const fullEvent: QueueEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.data.events.push(fullEvent);
    return fullEvent;
  }

  public getEvents(limit = 100): QueueEvent[] {
    return this.data.events.slice(-limit).reverse();
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const fullLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.data.auditLogs.push(fullLog);
    this.save();
    return fullLog;
  }

  public getAuditLogs(limit = 200): AuditLog[] {
    return this.data.auditLogs.slice(-limit).reverse();
  }

  // --- SETTINGS ---
  public getOfficeSetting(): OfficeSetting {
    return this.data.officeSetting;
  }

  public updateOfficeSetting(update: Partial<OfficeSetting>): OfficeSetting {
    this.data.officeSetting = { ...this.data.officeSetting, ...update };
    this.save();
    return this.data.officeSetting;
  }

  public getAudioSetting(): AudioSetting {
    return this.data.audioSetting;
  }

  public updateAudioSetting(update: Partial<AudioSetting>): AudioSetting {
    this.data.audioSetting = { ...this.data.audioSetting, ...update };
    if (mongoService.isReady()) {
      mongoService.saveAudioSetting(this.data.audioSetting).catch(err => {
        console.warn('MongoDB direct saveAudioSetting warning:', err.message);
      });
    }
    this.save();
    return this.data.audioSetting;
  }

  // --- CUSTOMER REVIEWS & SATISFACTION ---
  public addCustomerReview(
    ticketIdOrNumber: string,
    reviewInput: { rating: number; tags?: string[]; comment?: string }
  ): { review: CustomerReview; ticket: QueueTicket } {
    let ticket = this.getTicketById(ticketIdOrNumber);
    if (!ticket) {
      ticket = this.getTicketByNumber(ticketIdOrNumber);
    }
    if (!ticket) throw new Error('Ticket not found');

    const cleanRating = Math.max(1, Math.min(5, Number(reviewInput.rating) || 5));
    const now = new Date().toISOString();

    const review: CustomerReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      serviceId: ticket.serviceId,
      serviceName: ticket.serviceName,
      counterNumber: ticket.counterNumber,
      officerName: ticket.officerName,
      rating: cleanRating,
      tags: Array.isArray(reviewInput.tags) ? reviewInput.tags : [],
      comment: reviewInput.comment ? reviewInput.comment.trim() : undefined,
      createdAt: now
    };

    // Attach to ticket
    ticket.customerReview = review;

    // Add or update in reviews list
    if (!this.data.customerReviews) {
      this.data.customerReviews = [];
    }

    const existingIdx = this.data.customerReviews.findIndex(r => r.ticketId === ticket.id || r.ticketNumber === ticket.ticketNumber);
    if (existingIdx >= 0) {
      this.data.customerReviews[existingIdx] = review;
    } else {
      this.data.customerReviews.unshift(review);
    }

    this.addAuditLog({
      action: 'SUBMIT_CUSTOMER_REVIEW',
      entity: 'CustomerReview',
      entityId: review.id,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        rating: review.rating,
        tags: review.tags,
        serviceName: ticket.serviceName
      }
    });

    this.save();
    return { review, ticket };
  }

  public getCustomerReviews(limit = 100): CustomerReview[] {
    if (!this.data.customerReviews) return [];
    return this.data.customerReviews.slice(0, limit);
  }

  public getTicketReview(ticketIdOrNumber: string): CustomerReview | undefined {
    const ticket = this.getTicketById(ticketIdOrNumber) || this.getTicketByNumber(ticketIdOrNumber);
    if (ticket && ticket.customerReview) return ticket.customerReview;
    if (!this.data.customerReviews) return undefined;
    return this.data.customerReviews.find(r => r.ticketId === ticketIdOrNumber || r.ticketNumber === ticketIdOrNumber);
  }

  // --- STATS & REPORTS ---
  public getQueueStats(dateKey?: string) {
    const targetDate = dateKey || getTodayKey();
    const todayTickets = this.data.tickets.filter(t => t.dateKey === targetDate);

    const waiting = todayTickets.filter(t => t.status === 'WAITING').length;
    const serving = todayTickets.filter(t => t.status === 'SERVING' || t.status === 'CALLED').length;
    const completed = todayTickets.filter(t => t.status === 'COMPLETED').length;
    const noShow = todayTickets.filter(t => t.status === 'NO_SHOW').length;
    const cancelled = todayTickets.filter(t => t.status === 'CANCELLED').length;
    const total = todayTickets.length;

    // Calculate averages
    const completedWithWait = todayTickets.filter(t => t.waitingDurationSeconds !== undefined && t.waitingDurationSeconds > 0);
    const avgWaitSeconds = completedWithWait.length > 0 
      ? Math.round(completedWithWait.reduce((acc, t) => acc + (t.waitingDurationSeconds || 0), 0) / completedWithWait.length)
      : 0;

    const completedWithService = todayTickets.filter(t => t.serviceDurationSeconds !== undefined && t.serviceDurationSeconds > 0);
    const avgServiceSeconds = completedWithService.length > 0
      ? Math.round(completedWithService.reduce((acc, t) => acc + (t.serviceDurationSeconds || 0), 0) / completedWithService.length)
      : 0;

    // By Service
    const serviceBreakdown = this.data.services.map(srv => {
      const srvTickets = todayTickets.filter(t => t.serviceId === srv.id);
      const srvCompleted = srvTickets.filter(t => t.status === 'COMPLETED');
      const srvWaitAvg = srvCompleted.length > 0
        ? Math.round(srvCompleted.reduce((acc, t) => acc + (t.waitingDurationSeconds || 0), 0) / srvCompleted.length)
        : 0;
      const srvServiceAvg = srvCompleted.length > 0
        ? Math.round(srvCompleted.reduce((acc, t) => acc + (t.serviceDurationSeconds || 0), 0) / srvCompleted.length)
        : 0;

      return {
        serviceId: srv.id,
        serviceName: srv.name,
        serviceNameAmharic: srv.nameAmharic,
        prefix: srv.prefix,
        color: srv.color,
        total: srvTickets.length,
        waiting: srvTickets.filter(t => t.status === 'WAITING').length,
        completed: srvCompleted.length,
        avgWaitMinutes: Math.round(srvWaitAvg / 60),
        avgServiceMinutes: Math.round(srvServiceAvg / 60)
      };
    });

    // By Counter
    const counterBreakdown = this.data.counters.map(cnt => {
      const cntTickets = todayTickets.filter(t => t.counterId === cnt.id);
      const cntCompleted = cntTickets.filter(t => t.status === 'COMPLETED');
      const cntServiceAvg = cntCompleted.length > 0
        ? Math.round(cntCompleted.reduce((acc, t) => acc + (t.serviceDurationSeconds || 0), 0) / cntCompleted.length)
        : 0;

      return {
        counterId: cnt.id,
        counterNumber: cnt.number,
        counterName: cnt.name,
        counterNameAmharic: cnt.nameAmharic,
        status: cnt.status,
        currentTicketNumber: cnt.currentTicketNumber,
        officerName: cnt.currentOfficerName,
        totalServed: cntCompleted.length,
        avgServiceMinutes: Math.round(cntServiceAvg / 60)
      };
    });

    return {
      dateKey: targetDate,
      total,
      waiting,
      serving,
      completed,
      noShow,
      cancelled,
      avgWaitSeconds,
      avgWaitMinutes: Math.round(avgWaitSeconds / 60),
      avgServiceSeconds,
      avgServiceMinutes: Math.round(avgServiceSeconds / 60),
      serviceBreakdown,
      counterBreakdown
    };
  }

  public resetTodayQueue(): void {
    const today = getTodayKey();
    this.data.tickets = this.data.tickets.filter(t => t.dateKey !== today);
    this.data.counters.forEach(c => {
      c.currentTicketId = undefined;
      c.currentTicketNumber = undefined;
      if (c.status === 'SERVING') c.status = 'AVAILABLE';
    });
    this.save();
  }
}

export const db = new Database();
