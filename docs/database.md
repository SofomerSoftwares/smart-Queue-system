# Database Architecture & Schemas

The system supports MongoDB Atlas persistent storage with transparent in-memory fallback for offline/isolated development environments.

---

## 1. Collections & Entities

### `tickets`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId / string | Unique identifier |
| `ticketNumber` | string | Formatted ticket number (e.g. `A-014`, `V-002`) |
| `customerName` | string | Customer name or 'Guest' |
| `phone` | string? | Contact number for SMS / WhatsApp alerts |
| `serviceType` | string | Category / department code (e.g. `INQUIRY`, `BILLING`) |
| `priorityTier` | string | `NORMAL`, `VIP`, `ELDERLY`, `DISABILITY`, `EMERGENCY` |
| `status` | string | `WAITING`, `SERVING`, `ON_HOLD`, `COMPLETED`, `NO_SHOW`, `CANCELLED` |
| `counterId` | string? | Assigned counter reference |
| `officerId` | string? | Serving officer reference |
| `calledAt` | Date? | Timestamp when called |
| `completedAt` | Date? | Timestamp when finished |
| `createdAt` | Date | Issue timestamp |

**Indexes**:
- `{ status: 1, priorityTier: -1, createdAt: 1 }` (Optimized next-ticket FIFO queue order)
- `{ ticketNumber: 1 }` (Unique ticket lookup)
- `{ counterId: 1, status: 1 }` (Active counter ticket lookup)

---

### `counters`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId / string | Counter identifier (e.g. `c-1`, `c-2`) |
| `counterNumber` | number / string | Display number (e.g. `1`, `2`, `Window 3`) |
| `name` | string | Human readable counter label |
| `status` | string | `AVAILABLE`, `BUSY`, `ON_BREAK`, `OFFLINE` |
| `currentOfficerId` | string? | Logged-in staff member ID |
| `currentTicketId` | string? | Current serving ticket reference |
| `allowedServices` | string[] | Array of supported service codes |

---

### `notifications`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId / string | Unique notification ID |
| `type` | string | `TICKET_CALLED`, `TICKET_RECALLED`, `TICKET_COMPLETED`, `TICKET_NO_SHOW`, etc. |
| `title` | string | Short alert title |
| `message` | string | Human-readable event description |
| `category` | string | `COUNTER_EVENT`, `QUEUE_ALERT`, `VIP_ARRIVAL`, `SYSTEM` |
| `read` | boolean | Read status for reception staff |
| `counterId` | string? | Originating counter |
| `ticketId` | string? | Associated ticket |
| `createdAt` | Date | Notification generation time |

---

### `reviews`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId / string | Review ID |
| `ticketId` | string | Completed ticket reference |
| `counterId` | string | Counter reference |
| `rating` | number | Integer 1 to 5 |
| `feedbackTags` | string[] | Customer selected tags (`Quick`, `Friendly`, etc.) |
| `comment` | string? | Optional qualitative note |
| `createdAt` | Date | Submission timestamp |
