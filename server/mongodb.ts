import { MongoClient, Db } from 'mongodb';
import { DatabaseSchema, User, Role, PriorityPolicy, Service, Counter, QueueTicket, QueueEvent, AuditLog, CustomerReview } from './types.js';

export function sanitizeMongoUri(rawUri?: string | null): string {
  if (!rawUri || typeof rawUri !== 'string') return '';
  let uri = rawUri.trim();
  
  // Strip outer quotes if pasted with quotes
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  const protoMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/);
  if (!protoMatch) return uri;

  const protocol = protoMatch[1];
  const body = protoMatch[2];

  // Look for the auth separator '@' that precedes the host
  const slashOrQueryIdx = body.search(/[/?]/);
  const authAndHost = slashOrQueryIdx !== -1 ? body.substring(0, slashOrQueryIdx) : body;
  const pathAndQuery = slashOrQueryIdx !== -1 ? body.substring(slashOrQueryIdx) : '';

  const lastAtIdx = authAndHost.lastIndexOf('@');
  if (lastAtIdx === -1) {
    // No credentials provided in URI (e.g. mongodb://localhost:27017)
    return uri;
  }

  const creds = authAndHost.substring(0, lastAtIdx);
  const host = authAndHost.substring(lastAtIdx + 1);

  const colonIdx = creds.indexOf(':');
  if (colonIdx === -1) {
    // Only username, no password
    const safeUser = encodeURIComponent(decodeURIComponent(creds.trim()));
    return `${protocol}${safeUser}@${host}${pathAndQuery}`;
  }

  let rawUser = creds.substring(0, colonIdx).trim();
  let rawPass = creds.substring(colonIdx + 1).trim();

  // Strip literal surrounding angle brackets if user typed <myPassword>
  if (rawUser.startsWith('<') && rawUser.endsWith('>') && rawUser.length > 2) {
    rawUser = rawUser.slice(1, -1).trim();
  }
  if (rawPass.startsWith('<') && rawPass.endsWith('>') && rawPass.length > 2) {
    rawPass = rawPass.slice(1, -1).trim();
  }

  try {
    const decodedUser = decodeURIComponent(rawUser);
    const decodedPass = decodeURIComponent(rawPass);
    const safeUser = encodeURIComponent(decodedUser);
    const safePass = encodeURIComponent(decodedPass);
    return `${protocol}${safeUser}:${safePass}@${host}${pathAndQuery}`;
  } catch {
    return uri;
  }
}

export function isValidMongoUri(uri?: string | null): boolean {
  if (!uri || typeof uri !== 'string') return false;
  let trimmed = uri.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  if (!trimmed) return false;

  // Guard against unpopulated template placeholders
  if (
    trimmed.includes('<username>') ||
    trimmed.includes('<password>') ||
    trimmed.includes('<db_password>') ||
    trimmed.includes('<db_username>') ||
    trimmed.includes('xxxxx') ||
    trimmed.includes('MY_MONGODB_URI') ||
    trimmed.includes('your_username') ||
    trimmed.includes('cluster0.xxxxx')
  ) {
    return false;
  }
  // Must match valid mongodb protocol
  return trimmed.startsWith('mongodb://') || trimmed.startsWith('mongodb+srv://');
}

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private isConnecting = false;
  private lastError: string | null = null;
  private dbName = process.env.MONGODB_DB_NAME || 'office_queue_db';
  private activeUri: string | null = null;

  constructor() {
    const defaultUri = process.env.MONGODB_URI;
    if (isValidMongoUri(defaultUri)) {
      this.activeUri = sanitizeMongoUri(defaultUri);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch {
        // ignore cleanup errors
      }
      this.client = null;
    }
    this.db = null;
    this.isConnected = false;
    this.activeUri = null;
    this.lastError = null;
    console.log('ℹ️ [MongoDB Atlas] Switched to local resilient storage mode.');
  }

  public async connect(uri?: string): Promise<boolean> {
    if (uri === '' || uri === 'local' || uri === 'disconnect') {
      await this.disconnect();
      return false;
    }

    const rawUri = uri || this.activeUri || process.env.MONGODB_URI;
    
    if (!isValidMongoUri(rawUri)) {
      this.isConnected = false;
      this.lastError = rawUri && rawUri.trim()
        ? 'Provided MongoDB connection URI is incomplete or contains placeholder values (<username>, <password>).'
        : null;
      return false;
    }

    const connectionUri = sanitizeMongoUri(rawUri);

    if (this.isConnecting) return false;
    this.isConnecting = true;
    this.lastError = null;

    try {
      if (this.client) {
        try {
          await this.client.close();
        } catch {
          // ignore cleanup errors
        }
      }

      this.client = new MongoClient(connectionUri, {
        serverSelectionTimeoutMS: 6000,
        connectTimeoutMS: 6000,
        retryWrites: true
      });

      await this.client.connect();
      this.db = this.client.db(this.dbName);
      
      // Ping database
      await this.db.command({ ping: 1 });
      this.isConnected = true;
      this.activeUri = connectionUri;
      this.lastError = null;

      // Ensure MongoDB collection indexes
      try {
        await this.db.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true });
        await this.db.collection('tickets').createIndex({ dateKey: 1, ticketNumber: 1 });
        await this.db.collection('tickets').createIndex({ status: 1 });
        await this.db.collection('services').createIndex({ id: 1 }, { unique: true });
        await this.db.collection('counters').createIndex({ id: 1 }, { unique: true });
      } catch {
        // Indexes might already exist
      }

      console.log(`✅ [MongoDB Atlas] Connected successfully to cluster database: "${this.dbName}"`);
      return true;
    } catch (err: any) {
      // If sanitization failed with double-encoding or special chars, try with raw URI once as fallback
      if (connectionUri !== rawUri.trim()) {
        try {
          const fallbackClient = new MongoClient(rawUri.trim(), {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            retryWrites: true
          });
          await fallbackClient.connect();
          this.client = fallbackClient;
          this.db = fallbackClient.db(this.dbName);
          await this.db.command({ ping: 1 });
          this.isConnected = true;
          this.activeUri = rawUri.trim();
          this.lastError = null;
          console.log(`✅ [MongoDB Atlas] Connected successfully with direct URI`);
          return true;
        } catch {
          // continue with error classification
        }
      }

      this.isConnected = false;
      const rawMsg = err?.message || 'Failed to connect to MongoDB Atlas cluster';
      
      if (rawMsg.includes('SSL') || rawMsg.includes('tlsv1 alert') || rawMsg.includes('alert number 80')) {
        this.lastError = 'Atlas SSL handshake notice: Invalid cluster credentials or hostname in URI.';
      } else if (rawMsg.includes('bad auth') || rawMsg.includes('Authentication failed')) {
        this.lastError = 'Authentication failed: Incorrect MongoDB Database username or password. Please verify the credentials created in Atlas under Security > Database Access.';
      } else if (rawMsg.includes('ETIMEDOUT') || rawMsg.includes('Server selection timed out')) {
        this.lastError = 'Connection timed out: Check MongoDB Atlas Network Access whitelist (allow 0.0.0.0/0).';
      } else {
        this.lastError = rawMsg;
      }

      console.log(`ℹ️ [MongoDB Atlas] Connection status: ${this.lastError}`);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  public getStatus() {
    const currentUri = this.activeUri || process.env.MONGODB_URI;
    const isValid = isValidMongoUri(currentUri);
    const maskedUri = isValid && currentUri 
      ? currentUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@')
      : null;

    return {
      connected: this.isConnected,
      configured: isValid,
      database: this.dbName,
      clusterUri: maskedUri,
      error: this.lastError,
      provider: 'MongoDB Atlas'
    };
  }

  public isReady(): boolean {
    return this.isConnected && this.db !== null;
  }

  public getDb(): Db | null {
    return this.db;
  }

  /**
   * Load entire database schema from MongoDB Atlas
   */
  public async loadAll(): Promise<DatabaseSchema | null> {
    if (!this.isReady() || !this.db) return null;

    try {
      const users = await this.db.collection<User>('users').find({}).toArray();
      const roles = await this.db.collection<Role>('roles').find({}).toArray();
      const services = await this.db.collection<Service>('services').find({}).toArray();
      const counters = await this.db.collection<Counter>('counters').find({}).toArray();
      const tickets = await this.db.collection<QueueTicket>('tickets').find({}).toArray();
      const events = await this.db.collection<QueueEvent>('events').find({}).sort({ timestamp: -1 }).limit(500).toArray();
      const auditLogs = await this.db.collection<AuditLog>('audit_logs').find({}).sort({ timestamp: -1 }).limit(1000).toArray();
      const customerReviews = await this.db.collection<CustomerReview>('customer_reviews').find({}).sort({ createdAt: -1 }).toArray();

      const officeSettingDoc = await this.db.collection('settings').findOne({ _id: 'officeSetting' as any });
      const priorityPolicyDoc = await this.db.collection('settings').findOne({ _id: 'priorityPolicy' as any });
      let audioSettingDoc = await this.db.collection('settings').findOne({ _id: 'audioSetting' as any });
      if (!audioSettingDoc) {
        const audioFromCol = await this.db.collection('audio_settings').findOne({});
        if (audioFromCol) {
          audioSettingDoc = { data: audioFromCol } as any;
        }
      }

      // If database is completely empty, return null to allow initial seed
      if (users.length === 0 && services.length === 0) {
        return null;
      }

      // Clean MongoDB _id to prevent typing issues
      const cleanDocs = <T extends { id?: string }>(docs: any[]): T[] => {
        return docs.map(doc => {
          const { _id, ...rest } = doc;
          return { id: doc.id || _id?.toString(), ...rest } as T;
        });
      };

      return {
        users: cleanDocs<User>(users),
        roles: cleanDocs<Role>(roles),
        services: cleanDocs<Service>(services),
        counters: cleanDocs<Counter>(counters),
        tickets: cleanDocs<QueueTicket>(tickets),
        events: cleanDocs<QueueEvent>(events),
        auditLogs: cleanDocs<AuditLog>(auditLogs),
        customerReviews: cleanDocs<CustomerReview>(customerReviews),
        officeSetting: (officeSettingDoc?.data as any) || undefined,
        audioSetting: (audioSettingDoc?.data as any) || undefined,
        priorityPolicy: (priorityPolicyDoc?.data as any) || undefined
      } as DatabaseSchema;
    } catch (err: any) {
      console.error('Error loading data from MongoDB Atlas:', err);
      return null;
    }
  }

  /**
   * Save / overwrite full state to MongoDB Atlas
   */
  public async saveAll(data: DatabaseSchema): Promise<void> {
    if (!this.isReady() || !this.db) return;

    try {
      // Sync collections in parallel
      const syncCollection = async (collectionName: string, items: any[], idField = 'id') => {
        if (!this.db) return;
        const col = this.db.collection(collectionName);
        if (items.length === 0) return;

        const bulkOps = items.map(item => ({
          replaceOne: {
            filter: { [idField]: item[idField] },
            replacement: { ...item },
            upsert: true
          }
        }));

        await col.bulkWrite(bulkOps, { ordered: false });
      };

      await Promise.allSettled([
        syncCollection('users', data.users),
        syncCollection('roles', data.roles || []),
        syncCollection('services', data.services),
        syncCollection('counters', data.counters),
        syncCollection('tickets', data.tickets),
        syncCollection('events', data.events),
        syncCollection('audit_logs', data.auditLogs),
        syncCollection('customer_reviews', data.customerReviews || []),
        this.db.collection('settings').updateOne(
          { _id: 'officeSetting' as any },
          { $set: { data: data.officeSetting, updatedAt: new Date().toISOString() } },
          { upsert: true }
        ),
        this.db.collection('settings').updateOne(
          { _id: 'audioSetting' as any },
          { $set: { data: data.audioSetting, updatedAt: new Date().toISOString() } },
          { upsert: true }
        ),
        this.db.collection('settings').updateOne(
          { _id: 'priorityPolicy' as any },
          { $set: { data: data.priorityPolicy, updatedAt: new Date().toISOString() } },
          { upsert: true }
        ),
        this.db.collection('audio_settings').updateOne(
          { id: data.audioSetting.id || 'audio-setting-1' },
          { $set: { ...data.audioSetting, updatedAt: new Date().toISOString() } },
          { upsert: true }
        )
      ]);
    } catch (err: any) {
      console.warn('Asynchronous MongoDB Atlas sync notice:', err.message);
    }
  }

  /**
   * Directly save Addis AI Voice Announcement Configuration to MongoDB
   */
  public async saveAudioSetting(setting: any): Promise<boolean> {
    if (!this.isReady() || !this.db) return false;
    try {
      const now = new Date().toISOString();
      await Promise.allSettled([
        this.db.collection('settings').updateOne(
          { _id: 'audioSetting' as any },
          { $set: { data: setting, updatedAt: now } },
          { upsert: true }
        ),
        this.db.collection('audio_settings').updateOne(
          { id: setting.id || 'audio-setting-1' },
          { $set: { ...setting, updatedAt: now } },
          { upsert: true }
        )
      ]);
      console.log('✅ [MongoDB Atlas] Addis AI Voice Announcement Configuration saved directly to MongoDB.');
      return true;
    } catch (err: any) {
      console.warn('⚠️ [MongoDB Atlas] Error saving Addis AI voice configuration:', err.message);
      return false;
    }
  }

  /**
   * Upsert single document
   */
  public async upsertDoc(collectionName: string, doc: any, idField = 'id'): Promise<void> {
    if (!this.isReady() || !this.db) return;
    try {
      const col = this.db.collection(collectionName);
      await col.replaceOne(
        { [idField]: doc[idField] },
        { ...doc },
        { upsert: true }
      );
    } catch (err: any) {
      console.warn(`Error upserting doc into MongoDB Atlas ${collectionName}:`, err.message);
    }
  }

  /**
   * Delete single document
   */
  public async deleteDoc(collectionName: string, id: string, idField = 'id'): Promise<void> {
    if (!this.isReady() || !this.db) return;
    try {
      const col = this.db.collection(collectionName);
      await col.deleteOne({ [idField]: id });
    } catch (err: any) {
      console.warn(`Error deleting doc from MongoDB Atlas ${collectionName}:`, err.message);
    }
  }
}

export const mongoService = new MongoDBService();
