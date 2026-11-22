# Élan Atelier — Real-Time Salon Queue Management System

A production-grade, full-stack reactive salon queue management platform designed for luxury grooming studios. Built with **React 19**, **Vite**, **Tailwind CSS v4**, **Node.js (ES Modules)**, **Express**, **MongoDB (Mongoose)**, **Socket.io**, **Passport.js JWT**, and **Cloudinary CDN**.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Architecture & Technology Stack](#architecture--technology-stack)
4. [End-to-End Application Flows](#end-to-end-application-flows)
   - [Flow 1: Customer Self-Check-in & Live Queue Tracking](#flow-1-customer-self-check-in--live-queue-tracking)
   - [Flow 2: Reception Desk Console (Tablet)](#flow-2-reception-desk-console-tablet)
   - [Flow 3: Stylist Chair Station (Mirror Tablet)](#flow-3-stylist-chair-station-mirror-tablet)
   - [Flow 4: Ambient Lounge TV Display](#flow-4-ambient-lounge-tv-display)
   - [Flow 5: Studio Owner / Admin Settings](#flow-5-studio-owner--admin-settings)
5. [Queue Engine & Algorithmic Design](#queue-engine--algorithmic-design)
   - [State Transition Model](#state-transition-model)
   - [Wait Time Estimation Formula](#wait-time-estimation-formula)
   - [First-Come-First-Served (FCFS) Stylist Matching](#first-come-first-served-fcfs-stylist-matching)
6. [UI & UX Design System](#ui--ux-design-system)
   - [Theme Color Palette](#theme-color-palette)
   - [Custom Scrollbars](#custom-scrollbars)
   - [Dynamic Bottom Status Bar & Positioning](#dynamic-bottom-status-bar--positioning)
   - [Timer Display Formatting (`HH:MM:SS` / `MM:SS`)](#timer-display-formatting-hhmmss--mmss)
7. [Security & Authentication](#security--authentication)
8. [Directory Structure](#directory-structure)
9. [Getting Started & Configuration](#getting-started--configuration)

---

## Project Overview

Élan Atelier solves the chaotic physical wait line problem common to premium salons and barber studios. Instead of customers crowding into a waiting lounge or missing appointments, Élan Atelier provides:
- **Instant mobile self check-in** with real-time wait estimation.
- **A persistent floating status bar** that follows the customer on their device with live countdown timers.
- **Auditory and visual alerts** (chimes, vibrations, confetti) when a station opens.
- **Dedicated staff consoles** for receptionists and stylists to call, seat, and conclude sessions.
- **An ambient lounge TV screen** displaying real-time chair allocations and waiting line numbers.
- **Centralized admin controls** with Cloudinary image upload, operating hours, and live KPIs.

---

## Key Features

- **Sub-Second Real-Time Sync**: Every state transition (joining, calling, seating, completing) broadcasts across all connected screens via Socket.io in $< 100\text{ms}$.
- **Smart FCFS Queue Engine**: Fair, automated assignment that respects individual stylist preferences while optimizing throughput.
- **Desktop Side-by-Side Responsive Layouts**: Ergonomic split-screen views for both customer registration (`/join`) and stylist stations (`/barber/:name`).
- **Resilient Cloudinary Asset Storage**: Automatic upload of studio banners to Cloudinary CDN with graceful offline base64 fallback.
- **Non-Intrusive PIN Module**: Staff protected areas require a 4-digit PIN. Pressing `Escape` or clicking cancel immediately closes the modal and redirects back to the previous page.
- **Adaptive Timers**: Live session and wait timers automatically display in `HH:MM:SS` if 1 hour or more, and `MM:SS` otherwise.
- **Custom Theme Scrollbars**: Seamless obsidian and camel-gold scrollbar styling across Chrome, Safari, Edge, and Firefox.

---

## Architecture & Technology Stack

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      Client (React 19)                      │
 │  Dashboard • Join Queue • Status • Reception • Stylist • TV │
 └──────────────┬───────────────────────────────▲──────────────┘
                │ HTTP API Requests             │ Socket.io Live Events
                ▼                               │ (< 100ms sync)
 ┌──────────────────────────────────────────────┴──────────────┐
 │                  Server (Node.js & Express)                 │
 │   Auth & Staff PIN • Queue Engine • Barbers • Services      │
 └──────┬───────────────────────┬───────────────────────┬──────┘
        ▼                       ▼                       ▼
 ┌─────────────┐        ┌───────────────┐        ┌─────────────┐
 │   MongoDB   │        │ Socket.io Bus │        │ Cloudinary  │
 │ Collections │        │ Broadcast Hub │        │ Image CDN   │
 └─────────────┘        └───────────────┘        └─────────────┘
```

- **Frontend**: React 19, Vite, Tailwind CSS v4, `@iconify/react` (Solar icon pack), `canvas-confetti`.
- **Backend**: Node.js (ES Modules), Express.js, Socket.io, Multer memory storage, Passport.js with JWT.
- **Database**: MongoDB (Mongoose schemas for `QueueToken`, `Barber`, `Service`, `SalonConfig`).
- **Cloud Assets**: Cloudinary SDK v2.

---

## End-to-End Application Flows

### Flow 1: Customer Self-Check-in & Live Queue Tracking
```
Customer opens /join ──► Fills Name & Phone ──► Chooses 1-3 Services ──► Chooses Stylist Preference
                                                                                  │
                                                                                  ▼
Live Status Bar Activated ◄── Redirected to /status/:id ◄── Server creates token (e.g. S-1)
         │
         ├── Live Wait Countdown (MM:SS or HH:MM:SS)
         ├── # in line position indicator
         └── Automatically updates on WebSocket sync
                    │
                    ▼
Stylist calls token ──► Audio chime + Vibrate + Confetti ──► Customer proceeds to chair
```
1. **Entry**: Customer visits `/join` or scans the QR code at the reception desk.
2. **Form Input**: Enters full name and a valid 10-digit mobile number.
3. **Service Selection**: Selects 1 to 3 services (e.g., Signature Haircut, Beard Sculpting). Duration and pricing calculate dynamically in the sticky summary card.
4. **Stylist Preference**: Customer can select a specific stylist or choose *"Any Stylist (Fastest Available)"*.
5. **Token Generation**: Submitting assigns the next daily token number (e.g., `S-1`, `S-2`) and stores the ID in `localStorage`.
6. **Live Telemetry Tracking**: Customer is navigated to `/status/:id`. The bottom status bar appears across all public screens showing:
   - Token number & customer name.
   - Position in line (e.g., `#2 in line`).
   - Real-time countdown timer formatted as `MM:SS` (or `HH:MM:SS` if $> 60$ minutes).
7. **Calling & Notification**: When the stylist calls the client:
   - A chime sound rings via Web Audio API.
   - Device triggers a haptic vibration pattern `[400ms, 200ms, 400ms]`.
   - Confetti bursts on screen.
   - Banner instructs guest to proceed to the designated stylist station.

---

### Flow 2: Reception Desk Console (Tablet)
```
Receptionist opens /reception ──► Authenticates with PIN (1234)
                                          │
    ┌─────────────────────────────────────┴─────────────────────────────────────┐
    ▼                                                                           ▼
Stylist Stations Grid                                                   Live Waiting Queue
├── "Chair is empty" ──► Click [Call Next Client]                       ├── View FCFS order
├── "Client Called"  ──► Click [Seat Guest] or [No-Show]                ├── Inspect profiles
└── "In Chair"       ──► Live Timer ──► Click [Complete (Done)]         └── Cancel tickets
```
- **Access**: Navigate to `/reception`. Protected by 4-digit staff PIN (`1234`).
- **Station Overview**: View all stylist stations in real-time.
- **Calling Next Client**: Tapping **[Call Next Client]** triggers the FCFS engine to pair the earliest waiting client with that stylist.
- **Station Lifecycle Management**:
  1. **Called State**: The station highlights with a pulsing gold indicator (`Client Called • Walking to Chair`). Receptionist can click **[Seat Guest]** or **[No-Show]**.
  2. **In-Chair State**: Shows the seated client's live service timeline and a button **[Complete (Done)]**.
  3. **Empty Chair**: Station reverts to available, enabling the **[Call Next Client]** button for the next guest.
- **Walk-in Modal**: Receptionists can add walk-in guests at any time (active 24/7, ignoring the public online cutoff time).

---

### Flow 3: Stylist Chair Station (Mirror Tablet)
```
Stylist selects profile at /barber/:name ──► Split-screen Desktop View
                                                     │
        ┌────────────────────────────────────────────┴────────────────────────────────────────────┐
        ▼                                                                                         ▼
Left Column: Active Station                                                              Right Column: Queue Telemetry
├── Stylist Header & Status Toggle (Available / Rest)                                    ├── Priority request for this stylist
├── Current Client Card (Token, Name, Services, Price)                                   └── Full salon waiting list
├── [Seat Guest] ──► Starts live service timer (HH:MM:SS)
└── [Complete Service] ──► Concludes session & opens chair
```
- **Ergonomic Side-by-Side View**: Optimized for tablets mounted at mirror stations.
- **Break Management**: Stylists can tap **[Take Break]** to pause automated queue assignment.
- **Direct Chair Calling**: If the chair is free, the stylist taps **[Call Next to My Chair]**.
- **Live In-Chair Timer**: Once seated, a precise stopwatch timer tracks the session against estimated duration.
- **Conclude Session**: Tapping **[Complete Service (Conclude Session)]** marks the token as `Done` and opens the chair.

---

### Flow 4: Ambient Lounge TV Display
```
Mounted TV opens /display ──► Full-Screen Dark Canvas (100dvh)
                                     │
      ┌──────────────────────────────┴──────────────────────────────┐
      ▼                                                             ▼
Stylist Chairs Live Status                                    Live Queue Ticker
├── Real-time Station Cards (Busy / In Chair / Free)          ├── FCFS Waiting Tokens list
└── Audio Chime on Calling Events                             └── Estimated time ahead
```
- Full-screen high-contrast dark palette (`#1C1A18`) designed for 1080p and 4K displays.
- Sub-second reactive updates whenever tokens are called, seated, or completed.
- Audio announcement chime triggers when any stylist calls a guest.

---

### Flow 5: Studio Owner / Admin Settings
```
Owner opens /admin ──► PIN Authentication (1234)
                               │
   ┌───────────────────────────┼───────────────────────────┐
   ▼                           ▼                           ▼
Live Studio KPIs        Service Menu Manager        Branding & Cloudinary
├── Customers Served    ├── Add new services        ├── Salon Name & Closing Time
├── Average Wait Time   ├── Edit duration & price   ├── Online Cutoff Window
├── Dropout / No-Shows  └── Enable / Disable toggle └── Upload Banner to Cloudinary
```
- **Business KPIs**: Track today's revenue, completed customers, average wait, and no-show rate.
- **Service Menu**: Add, edit, or toggle salon services (duration, price, category).
- **Roster Controls**: Toggle on-duty/off-duty status for salon stylists.
- **Cloudinary Image Upload**: Seamless banner image upload stored on Cloudinary CDN.

---

## Queue Engine & Algorithmic Design

### State Transition Model

The system enforces a strict one-way finite state machine:

```
          ┌───────────────┐
          │    Waiting    │
          └───┬───────┬───┘
   Called by  │       │ Cancelled by
     stylist  ▼       ▼ customer/staff
      ┌──────────┐  ┌───────────┐
      │  Called  │  │ Cancelled │
      └───┬───┬──┘  └───────────┘
 Seated in│   │ Marked
     chair▼   ▼ no-show
 ┌──────────┐ ┌─────────┐
 │ In chair │ │ No-show │
 └────┬─────┘ └─────────┘
      │ Service
      ▼ concluded
  ┌────────┐
  │  Done  │
  └────────┘
```

- Disallowed transitions (e.g. from `Done` back to `Waiting`) are rejected with an HTTP 400 error.

### Wait Time Estimation Formula

The estimated wait time for any token in line is calculated as:

$$\text{Estimated Wait (minutes)} = \left\lceil \frac{\sum_{i=1}^{k} \text{Duration}(T_i)}{\text{Active Stylists}} \right\rceil$$

Where:
- $k$ is the number of waiting tokens ahead of the customer.
- $\text{Active Stylists}$ is the count of stylists who are **On Duty** and **Not on Break**.
- If all stylists are on break, the engine reports: `Paused — all barbers on break`.

### First-Come-First-Served (FCFS) Stylist Matching

When Stylist $X$ taps **[Call Next]**:
1. The engine queries for the earliest `Waiting` token (sorted by `tokenSequence ASC`).
2. Matches tokens where `preferredBarber === barberId` OR `preferredBarber === null` ("Any Stylist").
3. **Integrity Rule**: A customer who selected a specific stylist is **never** assigned to a different stylist.

---

## UI & UX Design System

### Theme Color Palette
The application follows a warm, high-end luxury palette adhering to the 60-30-10 color rule:
- **`#F7F3EE` (Canvas 60%)**: Light sand background for natural, high-comfort reading.
- **`#FFFFFF` (Surface)**: Pure white cards with `#E4DBD0` borders and soft shadows.
- **`#1C1A18` (Obsidian 30%)**: Deep charcoal/black used for primary text, buttons, and navigation surfaces.
- **`#C2B4A3` (Camel Gold 10%)**: Accent tone for icons, borders, active pills, and focus indicators.
- **`#4A4540` (Warm Charcoal)**: Secondary labels, metadata, and muted states.

### Custom Scrollbars
Configured globally in `client/src/index.css`:
- **Webkit browsers**: 6px rounded pill thumb (`#C2B4A3`) with hover state (`#4A4540`).
- **Dark surfaces**: Automatically switches to `#4A4540` thumb with `#C2B4A3` hover.
- **Firefox**: Standardized via `scrollbar-width: thin` and `scrollbar-color: #C2B4A3 transparent`.

### Dynamic Bottom Status Bar & Positioning
- Centered relative to the **main content area without the sidebar**:
  - Embedded inside the main flex workspace with `absolute bottom-6 left-1/2 -translate-x-1/2`.
  - On desktop, it is centered relative to the content section (ignoring the 256px sidebar).
  - On mobile, it automatically spans the center of the mobile screen.
- Clicking the bar expands a high-detail modal with services breakdown and security notes.

### Timer Display Formatting (`HH:MM:SS` / `MM:SS`)
Managed via `client/src/utils/timeFormat.js`:
- If the duration is 1 hour or more ($\ge 3600\text{s}$), it renders as **`HH:MM:SS`** (e.g. `01:15:30`).
- If under 1 hour, it renders cleanly as **`MM:SS`** (e.g. `24:45` or `05:12`).

---

## Security & Authentication

- **Staff PIN Protection**:
  - Protected endpoints require verification of a 4-digit PIN (`1234` default, configurable in Admin).
  - On successful entry, the server issues a signed JWT stored in `sessionStorage`.
  - Subsequent requests pass `Authorization: Bearer <token>` and `x-staff-pin: <pin>`.
- **Keyboard & Escape Key Dismissal**:
  - Pressing `Escape` or clicking cancel on the PIN modal immediately closes the dialog and redirects to the last visited public page, preventing users from getting stuck on locked screens.

---

## Directory Structure

```
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   └── apiClient.js          # Centralized fetch wrapper (auto-resolves host IP)
│   │   ├── components/
│   │   │   ├── CustomDropdown.jsx    # Accessible theme dropdown
│   │   │   ├── CustomModal.jsx       # Reusable accessible modal wrapper
│   │   │   ├── CustomerProfileModal.jsx # Ticket inspect modal
│   │   │   ├── DynamicIsland.jsx     # Floating bottom status bar with live timer
│   │   │   ├── Navbar.jsx            # Top capsule header with live sync indicator
│   │   │   ├── PinModal.jsx          # Staff PIN keypad with Escape key redirection
│   │   │   ├── ProtectedRoute.jsx    # Route guard with fallback redirection
│   │   │   ├── RealTimeTimeline.jsx  # In-chair live stopwatch & progress bar
│   │   │   ├── Sidebar.jsx           # Desktop navigation sidebar
│   │   │   ├── ServiceModal.jsx      # Add/edit service dialog
│   │   │   └── WalkInModal.jsx       # Quick front-desk check-in
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # PIN authentication & session state
│   │   │   ├── SocketContext.jsx     # WebSocket subscription & live sync
│   │   │   └── ToastContext.jsx      # Capsule notification toasts
│   │   ├── pages/
│   │   │   ├── AdminSettings.jsx     # Studio configuration & Cloudinary upload
│   │   │   ├── BarberView.jsx        # Desktop side-by-side stylist chair view
│   │   │   ├── Home.jsx              # Customer landing & lounge overview
│   │   │   ├── JoinQueue.jsx         # 2-column self check-in registration
│   │   │   ├── MyStatus.jsx          # Dedicated ticket tracking screen
│   │   │   ├── Reception.jsx         # Front desk tablet console
│   │   │   └── WaitingTV.jsx         # 100dvh full-screen lounge TV display
│   │   ├── utils/
│   │   │   ├── audioChime.js         # Web Audio API chime & haptic trigger
│   │   │   └── timeFormat.js         # Adaptive timer formatting (HH:MM:SS / MM:SS)
│   │   ├── App.jsx                   # Application router & layout structure
│   │   └── index.css                 # Theme CSS variables & custom scrollbars
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── configs/
│   │   ├── cloudinary.js             # Cloudinary SDK & Multer memory storage
│   │   ├── db.js                     # MongoDB connection handler
│   │   └── passport.js               # Passport JWT verification strategy
│   ├── controllers/
│   │   ├── adminController.js        # Analytics, settings, Cloudinary upload
│   │   ├── authController.js         # PIN verification & JWT generation
│   │   ├── barberController.js       # Stylist roster & break toggling
│   │   ├── queueController.js        # Queue lifecycle (join, call, seat, done)
│   │   └── serviceController.js      # Service catalog CRUD
│   ├── models/
│   │   ├── Barber.js                 # Stylist document schema
│   │   ├── QueueToken.js             # Customer queue token schema
│   │   ├── SalonConfig.js            # Studio operating settings schema
│   │   └── Service.js                # Grooming services schema
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── barberRoutes.js
│   │   ├── queueRoutes.js
│   │   └── serviceRoutes.js
│   ├── utils/
│   │   ├── queueEngine.js            # FCFS algorithm, wait estimation, validation
│   │   └── seedData.js               # Initial database seed data
│   ├── server.js                     # Express entry point & Socket.io setup
│   └── package.json
│
└── README.md                         # Project documentation
```

---

## Getting Started & Configuration

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI.

### Environment Configuration

#### 1. Server Environment (`server/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/SalonQueueManagement
JWT_SECRET=super_secret_jwt_key_branja_salon_2026_x7k9
STAFF_PIN=1234
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

#### 2. Client Environment (`client/.env`)
```env
VITE_API_URL=http://localhost:5000
```

### Installation & Launch

#### Step 1: Start Backend Server
```bash
cd server
npm install
npm start
# Server runs on http://localhost:5000
```

#### Step 2: Start Frontend Application
```bash
cd client
npm install
npm run dev
# Application runs on http://localhost:5173
```

### Default Credentials
- **Default Staff PIN**: `1234`
- **Protected URLs**: `/reception`, `/barber/Aarav%20Patel`, `/admin`
- **Public URLs**: `/`, `/join`, `/status/:id`, `/display`
