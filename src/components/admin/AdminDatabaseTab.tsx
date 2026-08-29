import React from 'react';
import { Database, AlertCircle, Server, X, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AdminDatabaseTabProps {
  dbStatus: any;
  dbActionMsg: string;
  mongoUriInput: string;
  setMongoUriInput: (val: string) => void;
  isConnectingDb: boolean;
  isSyncingDb: boolean;
  onConnectDb: (e: React.FormEvent) => void;
  onDisconnectDb: () => void;
  onSyncDb: () => void;
  isAmharic: boolean;
}

export const AdminDatabaseTab: React.FC<AdminDatabaseTabProps> = ({
  dbStatus,
  dbActionMsg,
  mongoUriInput,
  setMongoUriInput,
  isConnectingDb,
  isSyncingDb,
  onConnectDb,
  onDisconnectDb,
  onSyncDb,
  isAmharic
}) => {
  return (
    <div className="max-w-4xl bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isAmharic ? 'MongoDB Atlas ዳታቤዝ ማዕከል' : 'MongoDB Atlas Cloud Database'}
            </h2>
            <p className="text-xs text-slate-500">
              {isAmharic ? 'የወረፋ፣ የአገልግሎቶች፣ የመስኮቶች እና የተጠቃሚዎች መረጃ በክላውድ ዳታቤዝ ማመሳሰል' : 'Cloud persistence, real-time ticket replication, and resilient synchronization'}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
            dbStatus?.connected
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : dbStatus?.error?.includes('Authentication failed')
              ? 'bg-rose-100 text-rose-800 border border-rose-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full mr-1.5 ${
              dbStatus?.connected 
                ? 'bg-emerald-500 animate-pulse' 
                : dbStatus?.error?.includes('Authentication failed')
                ? 'bg-rose-500'
                : 'bg-amber-500'
            }`} />
            {dbStatus?.connected 
              ? 'MongoDB Atlas Active' 
              : dbStatus?.error?.includes('Authentication failed')
              ? (isAmharic ? 'የይለፍ ቃል / መለያ ልክ አይደለም (Auth Failed)' : 'Atlas Auth Failed')
              : (isAmharic ? 'የዳታቤዝ ግንኙነት አልተደረገም' : 'Atlas Disconnected')}
          </span>
        </div>
      </div>

      {dbStatus?.error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center space-x-2 font-bold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{isAmharic ? 'የ MongoDB Atlas ግንኙነት ማስታወቂያ' : 'MongoDB Atlas Connection Notice'}</span>
          </div>
          <p className="text-rose-700 font-medium pl-6 leading-relaxed">
            {dbStatus.error}
          </p>
          <div className="pl-6 pt-1 text-[11px] text-rose-600 space-y-1">
            <p className="font-bold">{isAmharic ? 'መፍትሄዎች (Troubleshooting Checklist):' : 'Troubleshooting Checklist:'}</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>{isAmharic ? 'በ MongoDB Atlas ውስጥ Security > Database Access ስር የተፈጠረውን Database User መለያ እና የይለፍ ቃል ያስገቡ (የድረ-ገፁን መለያ አይደለም)።' : 'Use your MongoDB Database User credentials (from Security > Database Access in Atlas), not your Atlas website login.'}</li>
              <li>{isAmharic ? 'በ Security > Network Access ስር IP Whitelist 0.0.0.0/0 (Allow access from anywhere) መፈቀዱን ያረጋግጡ።' : 'Ensure Atlas Network Access has IP Access List set to 0.0.0.0/0 (Allow access from anywhere).'}</li>
              <li>{isAmharic ? 'የይለፍ ቃልዎ ልዩ ምልክቶችን (@, #, %) የያዘ ቢሆንም ስርዓቱ ራሱ አስተካክሎ ያገናኘዋል።' : 'Special characters in passwords are automatically URL-encoded safely.'}</li>
            </ul>
          </div>
        </div>
      )}

      {dbActionMsg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{dbActionMsg}</span>
        </div>
      )}

      {/* Database Specs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-semibold block">Target Database</span>
          <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">{dbStatus?.database || 'office_queue_db'}</span>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-semibold block">Cluster Host</span>
          <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block truncate">
            {dbStatus?.clusterUri ? dbStatus.clusterUri.replace(/mongodb\+srv:\/\/[^@]+@/, 'mongodb+srv://***@') : 'MongoDB Atlas Cluster'}
          </span>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-semibold block">Architecture Mode</span>
          <span className="text-sm font-bold text-emerald-700 font-mono mt-0.5 block">Pure MongoDB Atlas</span>
        </div>
      </div>

      {/* MongoDB Connection Form */}
      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-xs font-bold text-slate-800">
          {isAmharic ? 'የ MongoDB Atlas Connection URI ማስተካከያ' : 'MongoDB Atlas Connection String'}
        </h3>
        
        <form onSubmit={onConnectDb} className="space-y-3">
          <input
            type="text"
            value={mongoUriInput}
            onChange={(e) => setMongoUriInput(e.target.value)}
            placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/ethio_queue_master?retryWrites=true&w=majority"
            className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-slate-900"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isConnectingDb}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isConnectingDb ? (isAmharic ? 'በመገናኘት ላይ...' : 'Connecting...') : (isAmharic ? 'ከ Atlas ጋር አገናኝ' : 'Connect / Re-test Atlas')}</span>
            </button>

            <button
              type="button"
              onClick={onDisconnectDb}
              disabled={isConnectingDb}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-slate-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAmharic ? 'ወደ አካባቢያዊ ዳታቤዝ ቀይር (Local Mode)' : 'Use Local Resilient Mode'}</span>
            </button>

            <button
              type="button"
              onClick={onSyncDb}
              disabled={isSyncingDb || !dbStatus?.connected}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingDb ? 'animate-spin' : ''}`} />
              <span>{isSyncingDb ? (isAmharic ? 'በማመሳሰል ላይ...' : 'Syncing...') : (isAmharic ? 'ሁሉንም መረጃዎች ወደ Atlas ላክ (Sync Now)' : 'Sync All Collections Now')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sync Information */}
      <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start space-x-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-900 font-medium leading-relaxed">
          {isAmharic
            ? 'በዚህ ስርዓት ውስጥ የሚከናወኑ ማናቸውም ቲኬቶች፣ የአገልግሎት ለውጦች እና የመስኮት ጥሪዎች በቀጥታ ወደ MongoDB Atlas ዳታቤዝ ይገባሉ።'
            : 'All queue tickets, service definitions, counters, staff accounts, audit logs, and audio settings are automatically synced to MongoDB Atlas.'}
        </p>
      </div>

      {/* Atlas Configuration Helper Guide */}
      <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-amber-950 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
          <Database className="w-4 h-4 text-amber-700" />
          <span>{isAmharic ? 'የ MongoDB Atlas አገናኝ መመሪያ (Atlas Setup Guide)' : 'MongoDB Atlas Setup Guide'}</span>
        </div>
        <ul className="text-[11px] text-amber-900/90 space-y-1.5 list-disc list-inside">
          <li>
            <strong>Database User:</strong> In MongoDB Atlas, go to <strong>Security &gt; Database Access</strong> and ensure your user has Read/Write permissions to any database.
          </li>
          <li>
            <strong>Network Access:</strong> In MongoDB Atlas, go to <strong>Security &gt; Network Access</strong> and add <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">0.0.0.0/0</code> (Allow Access from Anywhere).
          </li>
          <li>
            <strong>URI Format:</strong> <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">mongodb+srv://&lt;db_user&gt;:&lt;db_password&gt;@&lt;cluster-name&gt;.mongodb.net/office_queue_db?retryWrites=true&w=majority</code>
          </li>
          <li>
            <strong>Local Mode:</strong> You can always click <span className="font-bold">"Use Local Resilient Mode"</span> anytime to run with zero cloud dependencies.
          </li>
        </ul>
      </div>
    </div>
  );
};
