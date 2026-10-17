import dotenv from 'dotenv';
dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  mongodb: {
    uri?: string;
    dbName: string;
  };
  gemini: {
    apiKey?: string;
    ttsModel: string;
    ttsVoice: string;
    musicModel: string;
  };
  addisAi: {
    apiKey?: string;
    endpoint: string;
    defaultVoice: string;
  };
  appUrl: string;
}

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: (process.env.NODE_ENV as any) || 'development',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'small_office_queue_jwt_access_secret_key_2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'small_office_queue_jwt_refresh_secret_key_2026',
    accessExpiresIn: '12h',
    refreshExpiresIn: '7d'
  },
  mongodb: {
    uri: process.env.MONGODB_URI || undefined,
    dbName: process.env.MONGODB_DB_NAME || 'SmartQ'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || undefined,
    ttsModel: process.env.GEMINI_TTS_MODEL || 'gemini-3.1-flash-tts-preview',
    ttsVoice: process.env.GEMINI_TTS_VOICE || 'Kore',
    musicModel: process.env.GEMINI_MUSIC_MODEL || 'lyria-3-clip-preview'
  },
  addisAi: {
    apiKey: process.env.ADDIS_AI_API_KEY || undefined,
    endpoint: process.env.ADDIS_AI_ENDPOINT || 'https://api.addisassistant.com/api/v1/voice/generations',
    defaultVoice: process.env.ADDIS_AI_DEFAULT_VOICE || 'aster'
  },
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || '3000'}`
};
