import { 
  User, 
  Service, 
  Counter, 
  QueueTicket, 
  OfficeSetting, 
  AudioSetting, 
  AudioAsset, 
  AuditLog, 
  QueueStats, 
  PrintTicketData 
} from '../types';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('queue_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP error ${res.status}`);
  }
  return data;
}

export const api = {
  // --- AUTH ---
  login: (credentials: { username: string; password: string }) =>
    request<{ success: boolean; accessToken: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  getMe: () =>
    request<{ success: boolean; user: User }>('/api/auth/me'),

  changePassword: (passwords: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords)
    }),

  forgotPassword: (data: { username: string }) =>
    request<{ 
      success: boolean; 
      message: string; 
      resetCode?: string; 
      username?: string; 
      name?: string; 
      expiresInMinutes?: number; 
    }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  resetPassword: (data: { username: string; resetCode: string; newPassword: string }) =>
    request<{ success: boolean; message: string; username?: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  directUpdatePassword: (data: { targetUserId?: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/api/auth/direct-update-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // --- QUEUE ---
  getQueueStatus: () =>
    request<{
      success: boolean;
      waitingTickets: QueueTicket[];
      servingTickets: QueueTicket[];
      completedTickets: QueueTicket[];
      counters: Counter[];
      services: Service[];
      officeSetting: OfficeSetting;
      audioSetting: AudioSetting;
      stats: QueueStats;
    }>('/api/queue/status'),

  getPublicTicket: (ticketNumber: string) =>
    request<{
      success: boolean;
      ticket: QueueTicket & {
        ticketNumberAmharic: string;
        peopleAhead: number;
        estimatedWaitMinutes: number;
        currentlyServingTicketNumber: string;
      };
      office: {
        name: string;
        nameAmharic: string;
        displayNotice: string;
        displayNoticeAmharic: string;
      };
    }>(`/api/queue/ticket/${ticketNumber}`),

  createTicket: (data: { serviceId: string; priority?: 'NORMAL' | 'PRIORITY' }) =>
    request<{
      success: boolean;
      ticket: QueueTicket;
      printData: PrintTicketData;
    }>('/api/queue/ticket', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  callNextTicket: (data: { counterId: string; specificTicketId?: string }) =>
    request<{
      success: boolean;
      ticket: QueueTicket | null;
      counter: Counter;
      message?: string;
    }>('/api/queue/ticket/call-next', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  recallTicket: (ticketId: string) =>
    request<{ success: boolean; ticket: QueueTicket }>(`/api/queue/ticket/${ticketId}/recall`, {
      method: 'POST'
    }),

  startTicketService: (ticketId: string) =>
    request<{ success: boolean; ticket: QueueTicket }>(`/api/queue/ticket/${ticketId}/start`, {
      method: 'POST'
    }),

  completeTicket: (ticketId: string) =>
    request<{ success: boolean; ticket: QueueTicket }>(`/api/queue/ticket/${ticketId}/complete`, {
      method: 'POST'
    }),

  noShowTicket: (ticketId: string) =>
    request<{ success: boolean; ticket: QueueTicket }>(`/api/queue/ticket/${ticketId}/no-show`, {
      method: 'POST'
    }),

  transferTicket: (ticketId: string, targetServiceId: string) =>
    request<{ success: boolean; ticket: QueueTicket }>(`/api/queue/ticket/${ticketId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ targetServiceId })
    }),

  cancelTicket: (ticketId: string) =>
    request<{ success: boolean; ticket: QueueTicket }>(`/api/queue/ticket/${ticketId}/cancel`, {
      method: 'POST'
    }),

  resetDailyQueue: () =>
    request<{ success: boolean; message: string }>('/api/queue/reset-daily', {
      method: 'POST'
    }),

  // --- AUDIO & ADDIS VOICE API ---
  getAudioSettings: () =>
    request<{ success: boolean; settings: AudioSetting }>('/api/audio/settings'),

  updateAudioSettings: (settings: Partial<AudioSetting>) =>
    request<{ success: boolean; settings: AudioSetting }>('/api/audio/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),

  getAddisVoiceStatus: () =>
    request<{
      success: boolean;
      status: {
        configured: boolean;
        apiUrl: string;
        activeModel: string;
        availableVoicesCount: number;
        provider: string;
      };
    }>('/api/audio/addis-voice/status'),

  getAddisVoices: () =>
    request<{ success: boolean; voices: any[] }>('/api/audio/addis-voice/voices'),

  synthesizeAddisVoice: (data: { text: string; language?: string; voice?: string; speed?: number }) =>
    request<{
      success: boolean;
      audioBase64?: string;
      mimeType?: string;
      voice?: string;
      language?: string;
      provider: string;
      message?: string;
    }>('/api/audio/addis-voice/synthesize', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  testAddisVoice: (data: { text?: string; voice?: string; speed?: number; language?: string }) =>
    request<{
      success: boolean;
      audioBase64?: string;
      mimeType?: string;
      voice?: string;
      language?: string;
      provider: string;
      message?: string;
    }>('/api/audio/addis-voice/test', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getAudioAssets: () =>
    request<{ success: boolean; assets: AudioAsset[] }>('/api/audio/assets'),

  restoreDefaultAudioAssets: () =>
    request<{ success: boolean; assets: AudioAsset[]; message: string }>('/api/audio/assets/reset-defaults', {
      method: 'POST'
    }),

  generateAIMusic: (prompt: string, model?: string) =>
    request<{ success: boolean; result: { audioBase64?: string; title: string; source: string } }>('/api/audio/music/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, model })
    }),

  uploadMusic: (data: { title: string; base64Data: string; mimeType?: string; durationSeconds?: number }) =>
    request<{ success: boolean; asset: AudioAsset }>('/api/audio/music/upload', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteAudioAsset: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/audio/assets/${id}`, {
      method: 'DELETE'
    }),

  // --- ADMIN & MANAGEMENT ---
  getUsers: () =>
    request<{ success: boolean; users: User[] }>('/api/users'),

  createUser: (userData: any) =>
    request<{ success: boolean; user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  updateUser: (id: string, userData: any) =>
    request<{ success: boolean; user: User }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),

  adminResetUserPassword: (id: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(`/api/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    }),

  deleteUser: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/users/${id}`, {
      method: 'DELETE'
    }),

  getServices: () =>
    request<{ success: boolean; services: Service[] }>('/api/services'),

  createService: (serviceData: any) =>
    request<{ success: boolean; service: Service }>('/api/services', {
      method: 'POST',
      body: JSON.stringify(serviceData)
    }),

  updateService: (id: string, serviceData: any) =>
    request<{ success: boolean; service: Service }>(`/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData)
    }),

  deleteService: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/services/${id}`, {
      method: 'DELETE'
    }),

  getCounters: () =>
    request<{ success: boolean; counters: Counter[] }>('/api/counters'),

  createCounter: (counterData: any) =>
    request<{ success: boolean; counter: Counter }>('/api/counters', {
      method: 'POST',
      body: JSON.stringify(counterData)
    }),

  updateCounter: (id: string, counterData: any) =>
    request<{ success: boolean; counter: Counter }>(`/api/counters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(counterData)
    }),

  deleteCounter: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/counters/${id}`, {
      method: 'DELETE'
    }),

  getReportsSummary: (date?: string) =>
    request<{ success: boolean; stats: QueueStats }>(`/api/reports/summary${date ? `?date=${date}` : ''}`),

  getAuditLogs: () =>
    request<{ success: boolean; logs: AuditLog[] }>('/api/audit-logs'),

  getOfficeSettings: () =>
    request<{ success: boolean; setting: OfficeSetting }>('/api/settings'),

  updateOfficeSettings: (data: Partial<OfficeSetting>) =>
    request<{ success: boolean; setting: OfficeSetting }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // --- DATABASE & MONGODB ATLAS ---
  getDatabaseStatus: () =>
    request<{
      success: boolean;
      connected: boolean;
      configured: boolean;
      database: string;
      clusterUri: string | null;
      error: string | null;
      errorCode?: string;
      provider: string;
      mode?: 'MONGODB_ATLAS' | 'LOCAL_RESILIENT';
      diagnosticTip?: string | null;
    }>('/api/database/status'),

  connectDatabase: (uri?: string) =>
    request<{
      success: boolean;
      connected: boolean;
      configured: boolean;
      database: string;
      clusterUri: string | null;
      error: string | null;
      errorCode?: string;
      provider: string;
      mode?: 'MONGODB_ATLAS' | 'LOCAL_RESILIENT';
      diagnosticTip?: string | null;
    }>('/api/database/connect', {
      method: 'POST',
      body: JSON.stringify({ uri })
    }),

  disconnectDatabase: () =>
    request<{
      success: boolean;
      connected: boolean;
      configured: boolean;
      database: string;
      clusterUri: string | null;
      error: string | null;
      errorCode?: string;
      provider: string;
      mode?: 'MONGODB_ATLAS' | 'LOCAL_RESILIENT';
      diagnosticTip?: string | null;
    }>('/api/database/disconnect', {
      method: 'POST'
    }),

  syncDatabase: () =>
    request<{ success: boolean; message: string }>('/api/database/sync', {
      method: 'POST'
    })
};
