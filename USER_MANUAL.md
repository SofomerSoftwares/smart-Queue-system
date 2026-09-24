# SmartQ Queue Management System - Implementation & User Manual
**Version:** 2.4.0  
**Language Support:** English & Amharic (አማርኛ)  
**Target Environment:** Local Office Network / Cloud Deployment (Node.js 20+, Express, Vite, React 19, MongoDB Atlas)

---

## Table of Contents
1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Hardware & Network Implementation Checklist](#2-hardware--network-implementation-checklist)
3. [Server Installation & Environment Setup](#3-server-installation--environment-setup)
4. [Default System Credentials](#4-default-system-credentials)
5. [Initial Administrative Setup & Configuration](#5-initial-administrative-setup--configuration)
6. [Operational User Guide by Station](#6-operational-user-guide-by-station)
   - [6.1 Reception & Kiosk Station](#61-reception--kiosk-station)
   - [6.2 Main TV Waiting Area Display](#62-main-tv-waiting-area-display)
   - [6.3 Per-Counter Overhead Mini-Displays](#63-per-counter-overhead-mini-displays)
   - [6.4 Service Officer Counter Workstation](#64-service-officer-counter-workstation)
   - [6.5 Customer Mobile Ticket Tracker](#65-customer-mobile-ticket-tracker)
   - [6.6 Analytics & Officer Performance Reports (PDF Export)](#66-analytics--officer-performance-reports-pdf-export)
7. [Priority Policy & Triage Escalation](#7-priority-policy--triage-escalation)
8. [Voice Announcement & Audio System Setup](#8-voice-announcement--audio-system-setup)
9. [Database Persistence & MongoDB Atlas Setup](#9-database-persistence--mongodb-atlas-setup)
10. [Maintenance, Troubleshooting & FAQ](#10-maintenance-troubleshooting--faq)

---

## 1. System Overview & Architecture

SmartQ is an enterprise queue management system designed for public and private service centers, bank branches, healthcare clinics, and administrative offices.

```
                      +-----------------------------+
                      |   SmartQ Central Server     |
                      |   (Node.js + Express + WS)  |
                      +--------------+--------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
+--------v--------+         +--------v--------+         +--------v--------+
| Reception /     |         | Officer Desktop |         | Main TV Screen  |
| Ticket Kiosk    |         | Terminals       |         | & Audio Chime   |
| (Touchscreen +  |         | (Call, Serve,   |         | (Live Board +   |
| Thermal Print)  |         |  Transfer)      |         |  Video Ticker)  |
+-----------------+         +-----------------+         +-----------------+
         |                           |                           |
         +---------------------------+---------------------------+
                                     |
                       +-------------v-------------+
                       | Customer Smartphone       |
                       | Live Ticket Tracking (QR) |
                       +---------------------------+
```

### Key Technical Capabilities:
- **Zero-Latency Real-Time Sync:** Dual-engine WebSocket (`/ws`) and Server-Sent Events (`/api/events`) ensure every station updates instantly when tickets are called, served, or completed.
- **Bilingual Interface:** Full English and Amharic (አማርኛ) support across all stations, printed tickets, displays, and audio announcements.
- **High-Performance Audio Chime & Multi-Engine TTS:** Supports standard browser speech synthesis, Addis AI voice generator, and Google Gemini TTS (`gemini-3.1-flash-tts-preview`) with custom counter audio cues.
- **Resilient Dual Storage:** Runs continuously in-memory with automatic atomic backups to disk (`db.json`) and cloud synchronization with MongoDB Atlas.
- **Administrative PDF Reporting:** Vector PDF generation for official record-keeping, officer performance tracking, and supervisory reviews.

---

## 2. Hardware & Network Implementation Checklist

To deploy SmartQ in an office branch, prepare the following hardware:

| Station | Recommended Hardware | Network Requirement | Role / Purpose |
| :--- | :--- | :--- | :--- |
| **Server Host** | Any PC, Mini-PC, Raspberry Pi 4/5, or Cloud VM (Linux/Windows, 4GB+ RAM, Node.js 20+) | Static LAN IP (e.g. `192.168.1.100`) or Cloud Domain | Hosts backend server, WebSocket hub, database, and client assets |
| **Reception / Kiosk** | Tablet / Touchscreen All-in-One PC + 58mm or 80mm ESC/POS USB or Network Thermal Printer | Wi-Fi or LAN connection to Server | Allows receptionists or customers to select a service, take a numbered ticket, and scan QR |
| **Main Waiting Display** | Smart TV (43"–65"+) or Standard TV connected to an HDMI TV Stick (Chromecast, Raspberry Pi, Mini PC) | LAN / Wi-Fi | Displays current called tickets, waiting queue, split-screen informative video, and plays audio chimes |
| **Sound System** | TV built-in speakers or 3.5mm/Bluetooth external amplifier & speakers | Connected to Main Display device | Broadcasts the calling sound chime and voice announcements clearly |
| **Officer Workstations** | Officer Desktop/Laptop with Chrome, Edge, Firefox, or Safari | Local LAN connection | Web interface to call the next customer, recall, start service, transfer, or mark no-show |
| **Overhead Counter Displays (Optional)** | 10"–15" Tablets or Small Monitors mounted directly above each counter window | Local LAN / Wi-Fi | Displays `Window 1 - Serving A-004` (accessible via `/?view=counter-display&counter=1`) |
| **Customer Phones** | Customer's personal smartphones (iOS / Android) | Mobile Data or Office Guest Wi-Fi | Customers scan the ticket QR code to track wait time anywhere outside the waiting room |

---

## 3. Server Installation & Environment Setup

### 3.1 Prerequisites
- **Node.js** version 20.0.0 or higher
- **npm** (comes bundled with Node.js)
- Access to Port `3000` (default) on the host machine firewall

### 3.2 Installation Steps

1. **Extract or Clone Codebase:**
   ```bash
   cd /path/to/smartq-queue-management
   ```

2. **Install Project Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   # Server Port
   PORT=3000

   # Security Secrets
   JWT_ACCESS_SECRET=your_strong_jwt_access_secret_key
   JWT_REFRESH_SECRET=your_strong_jwt_refresh_secret_key

   # Voice & AI Engine (Optional for AI voice enhancements)
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_TTS_MODEL=gemini-3.1-flash-tts-preview
   GEMINI_TTS_VOICE=Kore

   # Addis AI Engine (Optional for native Amharic TTS)
   ADDIS_AI_API_KEY=
   ADDIS_AI_ENDPOINT=https://api.addisassistant.com/api/v1/voice/generations
   ADDIS_AI_DEFAULT_VOICE=aster

   # MongoDB Atlas Connection (Optional: runs local in-memory if left blank)
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/SmartQ?retryWrites=true&w=majority
   MONGODB_DB_NAME=SmartQ

   # Public / Domain URL
   APP_URL=http://192.168.1.100:3000
   ```

4. **Build and Run:**
   - **Development Mode:**
     ```bash
     npm run dev
     ```
   - **Production Mode:**
     ```bash
     npm run build
     npm start
     ```
   The system starts at `http://localhost:3000` (or `http://192.168.1.100:3000`).

---

## 4. Default System Credentials

The initial database seeds standard staff accounts out of the box. **It is strongly recommended to change passwords upon initial deployment.**

| Role | Username | Default Password | Initial Assigned Counter | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `Admin@123` | All Counters | Full administrative control, settings, user management, audit logs, and reports |
| **Receptionist** | `reception` | `Reception@123` | Front Desk | Ticket generation, priority triage, urgency classification, and customer check-in |
| **Officer 1** | `officer1` | `Officer@123` | Counter 1 | Call tickets, recall, serve, complete, transfer, and flag priority |
| **Officer 2** | `officer2` | `Officer@123` | Counter 2 | Call tickets, recall, serve, complete, transfer, and flag priority |
| **Officer 3** | `officer3` | `Officer@123` | Counter 3 | Call tickets, recall, serve, complete, transfer, and flag priority |

---

## 5. Initial Administrative Setup & Configuration

Before opening service to the public, an administrator should log in (`admin` / `Admin@123`) and complete the following 5 configuration steps:

### Step 1: Branding & General Office Settings
1. Navigate to **Admin Panel** (`/?view=admin`) -> **Office Settings**.
2. Set **Office Name (English)** (e.g., `Ministry of Innovation & Technology`) and **Office Name (Amharic)** (e.g., `የኢኖቬሽን እና ቴክኖሎጂ ሚኒስቴር`).
3. Set the **Public Announcement Notice** displayed on the bottom ticker of the main waiting display.
4. Set **Estimated Wait Time Per Person** (default: 5 minutes) used for customer waiting time calculations.
5. Set daily sequence reset time (default: `00:00`).

### Step 2: Define Services & Ticket Letter Prefixes
1. Go to **Admin Panel** -> **Services Tab**.
2. Review default services (`New Application [A]`, `Document Verification [V]`, `Payment & Cashier [P]`, `Collection & Pickup [C]`).
3. Modify or add services:
   - Provide an English name and Amharic name.
   - Assign a **Single-letter Ticket Prefix** (e.g., `A`, `B`, `C`).
   - Set estimated service duration in minutes.
   - Choose a distinctive badge color for display differentiation.

### Step 3: Configure Counters (Windows/Booths)
1. Go to **Admin Panel** -> **Counters Tab**.
2. Add or edit counters to reflect physical desk layout (e.g., `Counter 1 - General Inquiries`, `Counter 2 - Document Verification`).
3. Note counter numbers (1, 2, 3...) to match workstation terminals.

### Step 4: Add / Manage Staff Accounts
1. Go to **Admin Panel** -> **Staff Management Tab**.
2. Create officer accounts, assign usernames, initial passwords, and default counters.
3. Configure whether officers have permission to triage priority cases.

### Step 5: Configure Audio & Voice Callout
1. Go to **Admin Panel** -> **Audio & Voice Tab**.
2. Select your preferred announcement language:
   - **English Only**: "Ticket A-024, please proceed to Counter 1"
   - **Amharic Only**: "ቲኬት ቁጥር ኤ-024 ወደ መስኮት 1 ይምጡ"
   - **Both (Bilingual)**: Plays Amharic first, followed by English.
3. Test sound using the **Play Test Announcement** button. Ensure browser permissions allow sound.

---

## 6. Operational User Guide by Station

### 6.1 Reception & Kiosk Station
**URL:** `/?view=reception`

- **Purpose:** Where arriving customers are greeted or self-serve their ticket.
- **Workflow:**
  1. The customer chooses their required service (e.g., *New Application*).
  2. Optional: Enter customer name or phone number (or leave blank for an anonymous ticket).
  3. **Priority Triage (If Authorized):**
     - Select **Normal**, **Priority** (Elderly, Pregnant, Persons with Disabilities), or **Urgent**.
     - If *Urgent* is selected, provide an optional justification for audit purposes.
  4. Click **Print Ticket**.
  5. The thermal printer modal generates the physical ticket with:
     - Ticket Number (e.g., `A-015`)
     - Service Name (Bilingual)
     - Issue Date and Time
     - QR Code for mobile tracking
     - Direct URL for online check-in.

---

### 6.2 Main TV Waiting Area Display
**URL:** `/?view=display`

- **Purpose:** Fullscreen display mounted in the lobby for waiting customers.
- **Key Display Elements:**
  - **Header:** Office branding, live clock, and active counter summary.
  - **Currently Serving Section:** Large high-visibility cards showing which ticket is at which counter, with blinking animation on newly called tickets.
  - **Next in Line (Waiting Queue):** Live list of upcoming ticket numbers with priority indicators.
  - **Informational Split-Screen Media:** Plays embedded YouTube or direct MP4 video announcements, instructional guides, or public service videos with custom volume/loop settings.
  - **Scrolling News Ticker:** Displays real-time updates and public notices set in administrative settings.
  - **Audio Announcements:** Automatically rings a chime and reads out ticket calls whenever an officer presses "Call Next".

> **Tip for Displays:** On smart TVs or browser kiosks, press `F11` (or your device's Fullscreen shortcut) to enter distraction-free fullscreen kiosk mode.

---

### 6.3 Per-Counter Overhead Mini-Displays
**URL:** `/?view=counter-display&counter=1` *(replace `1` with counter number)*

- **Purpose:** A dedicated, lightweight screen mounted above individual counter windows (e.g., an Android tablet or monitor).
- **Features:**
  - Highlights counter number and officer name.
  - Displays the active ticket in bold, high-contrast numbers.
  - Switches to *Counter Available* or *Counter Closed* based on the officer's real-time state.

---

### 6.4 Service Officer Counter Workstation
**URL:** `/?view=officer`

- **Purpose:** Daily workstation interface for counter clerks.
- **Workflow:**
  1. **Log in** with officer credentials (e.g., `officer1` / `Officer@123`).
  2. **Select Counter:** Claim assigned counter (e.g., *Counter 1*).
  3. **Call Next Customer:** Click **"Call Next Ticket"**. The system prioritizes Urgent tickets, then Priority tickets, followed by Normal FIFO tickets.
  4. **Recall Customer:** If the customer does not appear immediately, click **"Recall"** to repeat the voice announcement and flash the screen.
  5. **Start Service:** When the customer arrives at the desk, click **"Start Serving"**. This tracks actual handling time.
  6. **Transfer Ticket (If needed):** If the customer requires another department, click **"Transfer"**, select the destination service, and the ticket enters the target queue with priority.
  7. **Complete Service:** Once service finishes, click **"Complete"**. The counter resets to *Available*.
  8. **No-Show:** If the customer never arrives, click **"Mark No-Show"** to record the event and proceed to the next person.

---

### 6.5 Customer Mobile Ticket Tracker
**URL:** `/?view=customer&ticket=A-015` *(or scanned from Ticket QR code)*

- **Purpose:** Allows customers to step outside, visit the cafeteria, or wait elsewhere without missing their turn.
- **Features:**
  - Real-time live status updates without refreshing.
  - Displays count of people ahead and estimated wait minutes.
  - Changes color to Green with audio chime when their ticket is called.
  - After service completion, presents a **Customer Satisfaction Survey** (1–5 Stars + Feedback tags) to submit direct feedback.

---

### 6.6 Analytics & Officer Performance Reports (PDF Export)
**URLs:**
- Queue Analytics: `/?view=reports`
- Officer Productivity: `/?view=officer-performance`

- **Purpose:** For supervisors, branch managers, and directors to evaluate throughput and staff productivity.
- **Features:**
  - **KPIs:** Active Officers, Average Service Duration, Tickets Resolved, Customer Rating.
  - **Charts:** Tickets served comparison by officer and 7-day volume trends.
  - **Searchable Roster:** Detailed table breaking down ID, role, tickets completed, average handling velocity, and satisfaction score.
  - **One-Click Official PDF Export:** Click **"Export Report (PDF)"** to generate a clean, vector PDF document formatted for physical filing, audits, and leadership reviews.

---

## 7. Priority Policy & Triage Escalation

SmartQ features a triage policy to handle vulnerable or urgent cases:

1. **Queue Priority Ranking:**
   - Rank 1: `URGENT` (Medical emergencies, expedited government requirements, critical deadlines)
   - Rank 2: `PRIORITY` (Senior citizens 65+, pregnant women, persons with disabilities, parents with infants)
   - Rank 3: `NORMAL` (Standard FIFO order)

2. **Access Control:**
   - Administrators configure whether Receptionists and/or Service Officers can escalate tickets.
   - When configured, staff can escalate or de-escalate tickets directly from their queue lists.
   - All priority modifications are logged in the **Audit Trail** (`/?view=admin` -> Audit Logs) recording the staff member's username and timestamp.

---

## 8. Voice Announcement & Audio System Setup

Browser security policies prevent automated audio playback until the user interacts with the page (clicks anywhere).

### How to ensure audio plays reliably on the Waiting Display TV:
1. Open `/?view=display` on the TV/Mini-PC browser.
2. Click anywhere on the screen once, or click the **Unmute / Audio Test** button on the interface.
3. Once clicked, the browser grants persistent audio playback permission for all incoming WebSockets announcements.
4. Ensure the host PC audio output is mapped to HDMI or the connected amplifier.

---

## 9. Database Persistence & MongoDB Atlas Setup

By default, SmartQ stores all data in memory and persists state to a local `db.json` file. For enterprise multi-server clusters or disaster recovery, connect to MongoDB Atlas:

1. Create a free or dedicated cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Obtain your connection URI:
   ```
   mongodb+srv://<dbuser>:<password>@cluster0.xxxx.mongodb.net/SmartQ?retryWrites=true&w=majority
   ```
3. Add this URI to your `.env` file under `MONGODB_URI` **or** navigate to **Admin Panel** -> **Database Tab** and paste the connection string directly into the connection wizard.
4. Click **Connect & Sync**. The system migrates all active users, tickets, reviews, and logs to the cloud.

---

## 10. Maintenance, Troubleshooting & FAQ

### Q1: The TV screen is not updating in real time when tickets are called.
- Check network connectivity between the display device and server.
- Verify the top bar displays **"System Online (Connected)"**.
- If the WebSocket disconnects, the system automatically falls back to Server-Sent Events (`/api/events`) and auto-reconnects every 5 seconds.

### Q2: How do I change the default admin password?
1. Log in as `admin`.
2. Click your username / profile icon in the sidebar or top navigation.
3. Select **"Change Password"**.
4. Enter current password (`Admin@123`) and your new password (minimum 6 characters).

### Q3: How do I reset ticket numbering at the start of a new business day?
- Ticket sequences automatically reset daily at `00:00` based on the `dateKey` (`YYYY-MM-DD`).
- To manually reset the queue during operational testing, log in as `admin`, navigate to **Reports**, and click **"Reset Today's Queue"**.

### Q4: The thermal printer prints extra blank margins.
- In the browser print dialog (`Ctrl+P`), set **Margins** to `None` or `Minimum`.
- Ensure paper width is set to `58mm` or `80mm` roll paper matching your thermal printer hardware.

---
*SmartQ Queue Management System - User & Implementation Manual. For technical support or feature requests, contact your internal system administrator.*
