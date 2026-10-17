export type RealtimeEventType =
  | 'queue:updated'
  | 'ticket:checkedin'
  | 'ticket:called'
  | 'ticket:started'
  | 'ticket:completed'
  | 'ticket:transferred'
  | 'ticket:no-show'
  | 'ticket:priority_changed'
  | 'counter:updated'
  | 'announcement:play'
  | 'settings:updated'
  | 'role:updated'
  | 'user:updated'
  | 'reception:notification'
  | 'notification:created'
  | 'notification:read'
  | 'notification:settings_updated';

export interface RealtimeEvent<T = any> {
  type: RealtimeEventType;
  data: T;
  timestamp: string;
}
