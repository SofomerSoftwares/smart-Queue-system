import { Response } from 'express';
import { WebSocket, WebSocketServer } from 'ws';

export interface RealtimeEvent<T = any> {
  type: 
    | 'queue:updated'
    | 'ticket:checkedin'
    | 'ticket:called'
    | 'ticket:started'
    | 'ticket:completed'
    | 'ticket:transferred'
    | 'ticket:no-show'
    | 'counter:updated'
    | 'announcement:play'
    | 'settings:updated';
  data: T;
  timestamp: string;
}

class EventBroadcaster {
  private sseClients = new Set<Response>();
  private wsClients = new Set<WebSocket>();

  // --- SSE Support ---
  public addSseClient(res: Response) {
    this.sseClients.add(res);
    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  // --- WebSocket Support ---
  public attachWebSocketServer(wss: WebSocketServer) {
    wss.on('connection', (ws) => {
      this.wsClients.add(ws);

      // Send initial heartbeat
      ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));

      ws.on('close', () => {
        this.wsClients.delete(ws);
      });

      ws.on('error', () => {
        this.wsClients.delete(ws);
      });
    });
  }

  // --- Broadcast to all clients ---
  public broadcast<T>(type: RealtimeEvent<T>['type'], data: T) {
    const payload: RealtimeEvent<T> = {
      type,
      data,
      timestamp: new Date().toISOString()
    };

    const strPayload = JSON.stringify(payload);

    // 1. Send via SSE
    for (const res of this.sseClients) {
      try {
        res.write(`data: ${strPayload}\n\n`);
      } catch (err) {
        this.sseClients.delete(res);
      }
    }

    // 2. Send via WebSockets
    for (const ws of this.wsClients) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(strPayload);
        }
      } catch (err) {
        this.wsClients.delete(ws);
      }
    }
  }
}

export const broadcaster = new EventBroadcaster();
