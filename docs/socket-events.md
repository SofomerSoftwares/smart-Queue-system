# Real-time Events & SSE Architecture

The application implements real-time synchronization using dual transport layers: Server-Sent Events (SSE) for reliable unidirectional state broadcasts and WebSocket connections for bidirectional counter interactions.

---

## 1. Event Contracts

### `QUEUE_UPDATED`
- **Trigger**: New ticket issued, ticket cancelled, or priority updated.
- **Payload**:
```json
{
  "type": "QUEUE_UPDATED",
  "data": {
    "tickets": [ ... ],
    "totalWaiting": 5,
    "timestamp": 1729153800000
  }
}
```

### `TICKET_CALLED`
- **Trigger**: Service officer invokes `call-next`.
- **Payload**:
```json
{
  "type": "TICKET_CALLED",
  "data": {
    "ticket": { "ticketNumber": "A-102", "customerName": "Abebe Bikila", "serviceType": "INQUIRY" },
    "counter": { "id": "counter-1", "counterNumber": 1, "name": "Window 1" },
    "announcementTextAmharic": "ትኬት ቁጥር ኤ 102 ወደ መስኮት 1 ይምጡ",
    "announcementTextEnglish": "Ticket number A 102 please proceed to Window 1"
  }
}
```

### `TICKET_RECALLED`
- **Trigger**: Service officer recalls customer who has not yet arrived at the desk.
- **Payload**: Contains counter ID, ticket info, and re-announcement speech payload.

### `TICKET_COMPLETED`
- **Trigger**: Service officer finishes serving customer.
- **Payload**: Triggers customer rating prompt and marks counter as AVAILABLE.

### `NOTIFICATION_CREATED`
- **Trigger**: Emitted whenever any operational event occurs (ticket called, transferred, no-show, hold).
- **Subscribers**: Reception officers (triggers audio chime, desktop browser notification, and updates unread badge).

---

## 2. Reconnection & Resynchronization Architecture
1. **Heartbeat Keep-Alive**: Server sends ping frames every 30 seconds to prevent proxy timeouts.
2. **Auto-Reconnect with Backoff**: Client EventSource automatically reconnects upon network interruption.
3. **Catch-up Resync**: On every successful reconnect (`onopen`), the client calls `GET /api/notifications` and `GET /api/queue` to fetch missed state transitions during disconnect windows.
