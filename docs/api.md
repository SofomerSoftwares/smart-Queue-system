# REST API Specifications

All endpoints are mounted on `/api`. Authentication is handled via Bearer JWT in the `Authorization` header or HTTP-only cookies.

---

## 1. Authentication Endpoints (`/api/auth`)
- `POST /api/auth/login`
  - Body: `{ username, password }`
  - Returns: `{ user, token }`
- `POST /api/auth/logout`
  - Invalidates active user session and clears cookie.
- `GET /api/auth/me`
  - Returns: `{ user }` with assignedCounterId, role, and branch permissions.

---

## 2. Queue & Ticket Lifecycle (`/api/queue`)
- `GET /api/queue`
  - Query: `branchId`, `status`, `serviceId`
  - Returns: Active tickets list with priority order and metadata.
- `POST /api/queue/ticket`
  - Body: `{ customerName, phone, serviceType, priorityTier, notes, isVip }`
  - Returns: Created ticket with unique alphanumeric ticket number (e.g., `A-102`).
- `POST /api/queue/call-next`
  - Body: `{ counterId }`
  - Finds highest-priority waiting ticket, assigns it to the counter, sets status to `SERVING`, and broadcasts `TICKET_CALLED`.
- `POST /api/queue/recall`
  - Body: `{ ticketId, counterId }`
  - Re-triggers audio announcement and broadcasts `TICKET_RECALLED`.
- `POST /api/queue/complete`
  - Body: `{ ticketId, counterId, resolutionNotes }`
  - Marks ticket as `COMPLETED`, opens review trigger, broadcasts `TICKET_COMPLETED`.
- `POST /api/queue/no-show`
  - Body: `{ ticketId, counterId }`
  - Marks ticket as `NO_SHOW`, notifies reception desk.
- `POST /api/queue/transfer`
  - Body: `{ ticketId, targetCounterId, targetServiceType, reason }`
  - Re-queues ticket with high priority for the target counter.
- `POST /api/queue/hold`
  - Body: `{ ticketId, counterId, holdReason }`
  - Sets status to `ON_HOLD`.
- `POST /api/queue/resume`
  - Body: `{ ticketId, counterId }`
  - Resumes serving the held ticket.

---

## 3. Counter Management (`/api/counters`)
- `GET /api/counters`
  - Returns list of all counters with current status (`AVAILABLE`, `BUSY`, `ON_BREAK`, `OFFLINE`) and serving ticket details.
- `POST /api/counters/:id/status`
  - Body: `{ status: 'AVAILABLE' | 'ON_BREAK' | 'OFFLINE', breakReason? }`
- `POST /api/counters/:id/assign`
  - Body: `{ officerId }`
  - Assigns an authenticated officer to the workstation.

---

## 4. Reception Notifications (`/api/notifications`)
- `GET /api/notifications`
  - Query: `category`, `unreadOnly`, `limit`
  - Returns: Notification items with status, event types, timestamp, and read flag.
- `GET /api/notifications/unread-count`
  - Returns: `{ unreadCount: number }`
- `POST /api/notifications/:id/mark-read`
  - Marks single notification as read.
- `POST /api/notifications/mark-all-read`
  - Marks all pending notifications as read.
- `DELETE /api/notifications/:id`
  - Deletes notification from history.
- `GET /api/notifications/stream`
  - Server-Sent Events (SSE) persistent stream for instant desktop push alerts.

---

## 5. Reviews & Ratings (`/api/reviews`)
- `POST /api/reviews`
  - Body: `{ ticketId, rating (1-5), feedbackTags: string[], comment?: string }`
  - Returns: Recorded customer satisfaction metric.
- `GET /api/reviews/summary`
  - Returns: Net Promoter Score (NPS), average rating by counter and service.
