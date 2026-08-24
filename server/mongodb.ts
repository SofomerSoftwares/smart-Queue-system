import { MongoClient, Db } from 'mongodb';
import { DatabaseSchema, User, Service, Counter, QueueTicket, QueueEvent, AuditLog, AudioAsset } from './types.js';

export function isValidMongoUri(uri?: string | null): boolean {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  if (!trimmed) return false;
  // Guard against template placeholders
  if (
    trimmed.includes('<username>') ||
    trimmed.includes('<password>') ||
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

export type MongoErrorCode = 'AUTH_FAILED' | 'TIMEOUT' | 'INVALID_URI' | 'SSL_ERROR' | 'UNKNOWN' | 'NONE';

export interface MongoStatusResponse {
  connected: boolean;
  configured: boolean;
  database: string;
  clusterUri: string | null;
  error: string | null;
  errorCode: MongoErrorCode;
  provider: string;
  mode: 'MONGODB_ATLAS' | 'LOCAL_RESILIENT';
  diagnosticTip: string | null;
}

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private isConnecting = false;
  private lastError: string | null = null;
  private lastErrorCode: MongoErrorCode = 'NONE';
  private diagnosticTip: string | null = null;
  private dbName = process.env.MONGODB_DB_NAME || 'SmartQ';
  private activeUri: string | null = null;

  constructor() {
    const defaultUri = process.env.MONGODB_URI;
    if (isValidMongoUri(defaultUri)) {
      this.activeUri = defaultUri!;
    }
  }

  public async connect(uri?: string): Promise<boolean> {
    const connectionUri = uri || this.activeUri || process.env.MONGODB_URI;
    
    if (!isValidMongoUri(connectionUri)) {
      this.isConnected = false;
      this.lastErrorCode = 'INVALID_URI';
      this.lastError = connectionUri && connectionUri.trim()
        ? 'Provided MongoDB connection URI is incomplete or contains placeholder values (<username>, <password>).'
        : 'No MongoDB URI configured. Operating in local resilient storage mode.';
      this.diagnosticTip = 'Enter your standard MongoDB Atlas connection string from Atlas > Database > Connect > Drivers.';
      return false;
    }

    if (this.isConnecting) return false;
    this.isConnecting = true;
    this.lastError = null;
    this.lastErrorCode = 'NONE';
    this.diagnosticTip = null;

    try {
      if (this.client) {
        try {
          await this.client.close();
        } catch {
          // ignore cleanup errors
        }
      }

      this.client = new MongoClient(connectionUri!, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000,
        retryWrites: true
      });

      await this.client.connect();
      this.db = this.client.db(this.dbName);
      
      // Ping database
      await this.db.command({ ping: 1 });
      this.isConnected = true;
      this.activeUri = connectionUri!;
      this.lastError = null;
      this.lastErrorCode = 'NONE';
      this.diagnosticTip = null;

      // Ensure MongoDB collection indexes
      try {
        await this.db.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true });
        await this.db.collection('tickets').createIndex({ dateKey: 1, ticketNumber: 1 });
        await this.db.collection('tickets').createIndex({ status: 1 });
        await this.db.collection('services').createIndex({ id: 1 }, { unique: true });
        await this.db.collection('counters').createIndex({ id: 1 }, { unique: true });
      } catch (indexErr) {
        // Indexes might already exist
      }

      console.log(`✅ [MongoDB Atlas] Connected successfully to cluster database: "${this.dbName}"`);
      return true;
    } catch (err: any) {
      this.isConnected = false;
      const rawMsg = err?.message || 'Failed to connect to MongoDB Atlas cluster';
      
      if (rawMsg.includes('SSL') || rawMsg.includes('tlsv1 alert') || rawMsg.includes('alert number 80')) {
        this.lastErrorCode = 'SSL_ERROR';
        this.lastError = 'Atlas SSL handshake notice: Invalid cluster credentials or hostname in URI.';
        this.diagnosticTip = 'Verify that your cluster host address is correct and active in MongoDB Atlas.';
      } else if (rawMsg.includes('bad auth') || rawMsg.includes('Authentication failed')) {
        this.lastErrorCode = 'AUTH_FAILED';
        this.lastError = 'Authentication failed: Incorrect MongoDB username or password.';
        this.diagnosticTip = 'In MongoDB Atlas > Security > Database Access, verify the database username and reset the password. Ensure user has Read/Write permissions.';
      } else if (rawMsg.includes('ETIMEDOUT') || rawMsg.includes('Server selection timed out')) {
        this.lastErrorCode = 'TIMEOUT';
        this.lastError = 'Connection timed out: Check MongoDB Atlas IP whitelist.';
        this.diagnosticTip = 'In MongoDB Atlas > Security > Network Access, add IP address 0.0.0.0/0 (Allow access from anywhere).';
      } else {
        this.lastErrorCode = 'UNKNOWN';
        this.lastError = rawMsg;
        this.diagnosticTip = 'Check the connection string format and cluster status.';
      }

      console.log(`ℹ️ [Storage Engine] Operating in Resilient Local Storage Mode. (MongoDB Atlas: ${this.lastError})`);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
      }
    } catch {
      // ignore close errors
    } finally {
      this.client = null;
      this.db = null;
      this.isConnected = false;
      this.activeUri = '';
      this.lastError = null;
      this.lastErrorCode = 'NONE';
      this.diagnosticTip = null;
      console.log('🔄 [Storage Engine] Disconnected from MongoDB Atlas. Resilient Local Storage is actively serving all operations.');
    }
  }

  public getStatus(): MongoStatusResponse {
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
      errorCode: this.lastErrorCode,
      provider: 'MongoDB Atlas',
      mode: this.isConnected ? 'MONGODB_ATLAS' : 'LOCAL_RESILIENT',
      diagnosticTip: this.diagnosticTip
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
      const services = await this.db.collection<Service>('services').find({}).toArray();
      const counters = await this.db.collection<Counter>('counters').find({}).toArray();
      const tickets = await this.db.collection<QueueTicket>('tickets').find({}).toArray();
      const events = await this.db.collection<QueueEvent>('events').find({}).sort({ timestamp: -1 }).limit(500).toArray();
      const audioAssets = await this.db.collection<AudioAsset>('audio_assets').find({}).toArray();
      const auditLogs = await this.db.collection<AuditLog>('audit_logs').find({}).sort({ timestamp: -1 }).limit(1000).toArray();

      const officeSettingDoc = await this.db.collection('settings').findOne({ _id: 'officeSetting' as any });
      const audioSettingDoc = await this.db.collection('settings').findOne({ _id: 'audioSetting' as any });

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
        services: cleanDocs<Service>(services),
        counters: cleanDocs<Counter>(counters),
        tickets: cleanDocs<QueueTicket>(tickets),
        events: cleanDocs<QueueEvent>(events),
        audioAssets: cleanDocs<AudioAsset>(audioAssets),
        auditLogs: cleanDocs<AuditLog>(auditLogs),
        officeSetting: (officeSettingDoc?.data as any) || undefined,
        audioSetting: (audioSettingDoc?.data as any) || undefined
      } as DatabaseSchema;
    } catch (err: any) {
      console.warn('Notice loading data from MongoDB Atlas:', err.message);
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
        syncCollection('services', data.services),
        syncCollection('counters', data.counters),
        syncCollection('tickets', data.tickets),
        syncCollection('events', data.events),
        syncCollection('audio_assets', data.audioAssets),
        syncCollection('audit_logs', data.auditLogs),
        this.db.collection('settings').updateOne(
          { _id: 'officeSetting' as any },
          { $set: { data: data.officeSetting, updatedAt: new Date().toISOString() } },
          { upsert: true }
        ),
        this.db.collection('settings').updateOne(
          { _id: 'audioSetting' as any },
          { $set: { data: data.audioSetting, updatedAt: new Date().toISOString() } },
          { upsert: true }
        )
      ]);
    } catch (err: any) {
      console.warn('Asynchronous MongoDB Atlas sync notice:', err.message);
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
