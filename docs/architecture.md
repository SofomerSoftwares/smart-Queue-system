# Small Office Queue Management System — Architecture Overview

## 1. System Overview & Principles
The **Small Office Queue Management System** is a modular full-stack application built with Express, React (Vite), TypeScript, MongoDB, and real-time Server-Sent Events (SSE) and WebSockets.

The application serves small to medium branch offices, citizen service centers, and clinics, providing:
- **Reception Desk Operations**: Ticket issuing with priority tiers, triage policies, VIP flags, customer phone/email, and real-time queue overview.
- **Service Officer Counters**: Counter assignment, next-ticket calling, recall, hold, resume, transfers, completion, and no-show marking.
- **Public Displays**: High-definition overhead display screen with multi-layout support (Side-by-Side, Video Focus, Queue Focus, Minimalist, Grid), audio announcements in Amharic and English, and marquee ticker messages.
- **Role-Based Counter Screen**: Counter Display view specifically tailored to the logged-in officer's station with strict role isolation and visual indicators.
- **Reception Officer Desktop & Web Notifications**: Real-time push alerts, sound chimes, notification management, category filtering, unread badges, and SSE stream resynchronization.
- **Customer Self-Service & Feedback**: Arrival check-in QR codes, dynamic status tracking, and 5-star customer satisfaction reviews with feedback tags.

---

## 2. Directory & Modular Organization

```text
/
├── server.ts                   # Unified Express application entry & dev server middleware
├── server/
│   ├── config/                 # Environment & app configuration
│   ├── db.ts                   # In-memory mock/active DB state & seed data
│   ├── mongodb.ts              # MongoDB Atlas client connection & collection handles
│   ├── middleware/             # Auth JWT verification, RBAC guards, branch policies
│   ├── modules/                # Feature-based business logic & services
│   ├── routes/                 # Express routing endpoints (auth, queue, counter, notifications, etc.)
│   ├── services/               # Specialized services (queueEngine, ttsService, auditService)
│   ├── websocket.ts            # SSE event emitter & real-time connection registry
│   └── tests/                  # Integration and unit tests
│
├── shared/
│   ├── types/                  # Shared data models (Ticket, Counter, User, Role, Status)
│   └── constants/              # Shared queue transitions, priority tiers, and SSE event names
│
├── src/
│   ├── components/             # React views & modular UI
│   │   ├── ReceptionView.tsx   # Front desk ticket issuing & live queue monitoring
│   │   ├── CounterView.tsx     # Officer workstation & calling operations
│   │   ├── DisplayView.tsx     # Public lobby display screen with role-filtered views
│   │   ├── CounterDisplayView.tsx # Dedicated single/multi-counter overhead station display
│   │   ├── notifications/      # NotificationBell, NotificationPanel, Toast alerts
│   │   └── CustomerRatingModal.tsx # Customer feedback & review collection
│   ├── context/                # React Contexts (AuthContext, Socket/SSE context)
│   ├── hooks/                  # Custom hooks (useReceptionNotifications, useAudioAnnouncement)
│   ├── lib/                    # Client libraries (notificationManager, ttsClient, api)
│   └── types.ts                # Frontend type definitions
│
├── docs/                       # Technical architecture & API documentation
└── package.json
```

---

## 3. Role-Based Access Control (RBAC)
The system supports the following discrete user roles:
1. **SUPER_ADMIN**: Full system control, branch management, global settings, audit logs.
2. **BRANCH_ADMIN**: Branch configuration, counter assignments, user administration, reports.
3. **RECEPTION_OFFICER**: Front desk ticketing, priority management, triage routing, notification center.
4. **SERVICE_OFFICER**: Counter operations (Call Next, Recall, Complete, Transfer, Hold). In both the Display and Counter Display views, officers are strictly bound to their assigned counter station.
5. **AUDITOR / VIEWER**: Read-only access to metrics, logs, and queue analytics.
