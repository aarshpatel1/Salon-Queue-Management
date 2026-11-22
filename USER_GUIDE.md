# Élan Atelier — Comprehensive User & Operation Guide

Welcome to the **Élan Atelier Salon Queue Management System**. This guide provides an end-to-end operational walkthrough of the web application for both **Customers (Guests)** and **Salon Administrators / Staff**.

---

## Table of Contents
1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Customer Journey & Flow](#2-customer-journey--flow)
   - [2.1 Exploring the Salon & Live Queue](#21-exploring-the-salon--live-queue)
   - [2.2 Joining the Live Queue](#22-joining-the-live-queue)
   - [2.3 One Active Turn Rule](#23-one-active-turn-rule)
   - [2.4 Live Status Tracking & Bottom Dynamic Island](#24-live-status-tracking--bottom-dynamic-island)
   - [2.5 Customer Opt-Out / Turn Cancellation](#25-customer-opt-out--turn-cancellation)
3. [Admin & Staff Management Flow](#3-admin--staff-management-flow)
   - [3.1 Staff Authentication (PIN Access)](#31-staff-authentication-pin-access)
   - [3.2 Reception Command Console](#32-reception-command-console)
   - [3.3 Drag-and-Drop Queue Rearranging](#33-drag-and-drop-queue-rearranging)
   - [3.4 Full Customer Queue CRUD](#34-full-customer-queue-crud)
   - [3.5 Managing Barbers & Stylists](#35-managing-barbers--stylists)
   - [3.6 Services Catalog & Studio Settings](#36-services-catalog--studio-settings)
   - [3.7 Barber Station Console](#37-barber-station-console)
   - [3.8 Lounge TV Screen (Wall Display)](#38-lounge-tv-screen-wall-display)
4. [UI/UX & Design Philosophy](#4-uiux--design-philosophy)
   - [Dynamic Island Upward Modal Morphing](#dynamic-island-upward-modal-morphing)
   - [Button-to-Modal Transformation Animation](#button-to-modal-transformation-animation)
   - [Border-Free Spacing & Typography](#border-free-spacing--typography)
   - [Smart Avatar & Initials System](#smart-avatar--initials-system)
   - [Desktop Loading & On-Scroll Reveal](#desktop-loading--on-scroll-reveal)
5. [Quick Reference & Hotkeys](#5-quick-reference--hotkeys)

---

## 1. System Overview & Architecture

Élan Atelier is a modern, luxury salon queue management platform designed to replace paper tickets and chaotic waiting areas with a real-time, synchronized digital experience.

- **Frontend**: Vite + React + Tailwind CSS with custom keyframe animations and smooth scrolling.
- **Backend**: Node.js + Express + MongoDB (Mongoose) + Socket.io.
- **Real-Time Sync**: Every action (joining queue, reordering tickets, calling guests, completing cuts) triggers instantaneous WebSocket broadcasts across all open screens without manual page refreshes.

---

## 2. Customer Journey & Flow

### 2.1 Exploring the Salon & Live Queue
- **URL**: `/` (Home)
- When guests open the salon website, they immediately see:
  - Salon operating status (Open / Closed) and live estimated wait time.
  - Active Stylist Stations indicating which barbers are serving, available, or on break.
  - Live Waiting Queue with interactive capsules showing who is in line.
  - Real-time timelines tracking chair sessions down to the minute.

### 2.2 Joining the Live Queue
- **URL**: `/join`
- Guests click **"+ Join Live Queue"** or navigate to `/join`.
- **Form Steps**:
  1. **Full Name**: Enter first and last name (e.g., `Aryan Shah`).
  2. **10-Digit Mobile Number**: Strictly validated for exactly 10 digits (e.g., `9876543210`). The interface prevents input exceeding 10 digits and provides instant error feedback if fewer digits are entered.
  3. **Select Grooming Services**: Pick one or multiple luxury services (Haircut, Beard Styling, Facial Treatment, etc.). The total price and estimated duration update dynamically.
  4. **Select Preferred Stylist**: Choose a specific barber (e.g., *Aarav Patel*, *Vikram Singh*) or select **"Any Available Stylist"** to be called by the next free chair.
  5. **Optional Photo Upload**:
     - Guests can optionally upload a photo.
     - **If no image is uploaded**, the system automatically generates a luxury avatar badge displaying their **First & Last Name Initials** (e.g., `AS` on a warm stone background).
  6. Click **"Confirm & Join Queue"**.

### 2.3 One Active Turn Rule
- **Duplicate Prevention Policy**: A person with an active queue token cannot rejoin the queue with the same phone number until their existing turn is either completed or cancelled.
- If a guest attempts to join while already having an active ticket in line:
  - An alert banner appears displaying their current ticket number and position.
  - A quick-action button **"View Your Existing Ticket"** redirects them directly to their status dashboard.

### 2.4 Live Status Tracking & Bottom Dynamic Island
- **URL**: `/status/:id`
- Once joined, the guest is redirected to their personalized status page.
- **Features**:
  - **Live Position**: Displays exact queue ranking (e.g., `#2 in line`).
  - **Estimated Wait**: Real-time minute countdown with an active progress bar.
  - **Stylist Station**: Shows assigned barber and mirror station.
  - **Notification Chime**: Plays an audio chime when the ticket is called by the barber.
- **Persistent Bottom Dynamic Island**:
  - A pill-shaped floating island stays anchored at the bottom of the screen across all pages while a ticket is active.
  - It displays the ticket number, wait time, and a pulsating status indicator.
  - **Clicking the Dynamic Island** triggers a fast, upward expansion animation, morphing smoothly into a modal showing detailed ticket information.

### 2.5 Customer Opt-Out / Turn Cancellation
- Guests who can no longer wait can cancel their turn at any time:
  1. Open the **Dynamic Island Modal** or navigate to `/status/:id`.
  2. Click the **"Opt Out / Cancel My Turn"** button.
  3. Confirm the cancellation prompt.
- The ticket is immediately cancelled, the assigned stylist is notified, wait times for remaining guests adjust instantly, and the customer is free to rejoin whenever ready.

---

## 3. Admin & Staff Management Flow

### 3.1 Staff Authentication (PIN Access)
- Protected management routes:
  - `/reception` (Front-Desk Command Center)
  - `/admin` (Studio Settings & Stylist Roster)
  - `/barber/:name` (Individual Stylist Mirror Station)
- **Default Staff PIN**: `1234`
- Entering the correct 4-digit PIN authenticates the session across all administrative views. Clicking Cancel or pressing Escape returns safely to the public view.

### 3.2 Reception Command Console
- **URL**: `/reception`
- The front-desk command center gives receptionists complete oversight of salon activity:
  - **Stylist Mirror Stations**: Shows each chair's live status, the customer seated, elapsed time, and chair controls (Call Next, Start Cut, Complete).
  - **Live Queue Table**: Real-time list of all waiting customers with full CRUD and reordering capabilities.
  - **Walk-In Registration**: Button to register in-person walk-ins quickly.

### 3.3 Drag-and-Drop Queue Rearranging
- Staff can easily reorder customer priorities:
  1. Locate the **Live Waiting Queue** on `/reception`.
  2. Hover over any customer card; a grip handle (`:::`) appears.
  3. **Click and drag** the card upwards or downwards to the desired position.
  4. Release to drop.
- The sequence numbers update instantly in MongoDB and are broadcasted to all customer devices and TV displays via WebSockets in real time.

### 3.4 Full Customer Queue CRUD
Staff have complete control over waiting queue records:
- **Create (Walk-In)**:
  - Click **"+ Add Walk-in"**.
  - Enter guest name, 10-digit mobile number, services, and optional photo.
  - The walk-in ticket is immediately inserted into the active line.
- **Read / Inspect Profile**:
  - Click any customer card to open the **Customer Profile Modal**.
  - View full service breakdown, check-in timestamp, wait time, and contact information.
- **Update / Edit Guest**:
  - In the Customer Profile or via the **Edit (Pencil)** icon, open **Edit Customer Modal**.
  - Modify customer name, 10-digit phone, services, preferred stylist, status, or avatar photo.
  - Click **"Save Changes"** to update across the system.
- **Delete / Cancel**:
  - Click the **Trash** icon on any customer card.
  - Confirm the prompt to remove the ticket from the queue and free up any assigned resources.

### 3.5 Managing Barbers & Stylists
- **URL**: `/admin` (Stylist Roster Tab)
- Staff can manage the complete barber team:
  - **Add New Stylist**:
    - Click **"+ Add Stylist"**.
    - Enter stylist name (e.g., `Rohit Sharma`) and specialty (e.g., `Beard Sculpting & Classic Cuts`).
    - Toggle initial duty status (On Duty / Off Duty).
    - **Optional Photo Upload**: Upload a headshot or leave blank to automatically display a luxury initials placeholder.
    - Click **"Create Stylist"**.
  - **Edit Stylist**:
    - Click the **Pencil icon** on any stylist card.
    - Update name, specialty, duty status, or photo.
  - **Toggle Duty Status**:
    - Click the **"On Duty" / "Off Duty"** pill to toggle active roster participation.
  - **Delete Stylist**:
    - Click the **Trash icon** on a stylist card to permanently remove them from the roster.

### 3.6 Services Catalog & Studio Settings
- **URL**: `/admin` (Services & Studio Settings Tabs)
- **Services Manager**:
  - Add new salon services with custom pricing and duration in minutes.
  - Edit or deactivate services without deleting historical records.
- **Studio Settings**:
  - Configure salon name, operating hours, and queue parameters.
  - Note: Banner image upload has been removed to preserve a sleek, distraction-free aesthetic.

### 3.7 Barber Station Console
- **URL**: `/barber/:name` (e.g., `/barber/Aarav%20Patel`)
- Mounted on an iPad or tablet at each barber's mirror station:
  - **Active Chair**: Displays current customer, services selected, price, and elapsed time with a visual timeline.
  - **One-Touch Actions**:
    - **"Call Next to My Chair"**: Calls the next client requesting this stylist or the next general walk-in.
    - **"Start Service"**: Transitions status to `In chair` and starts the countdown.
    - **"Complete Service"**: Concludes the session, records history, and readies chair for next guest.
    - **"Take Break" / "Resume Work"**: Toggles stylist status between available and break mode.
  - **Priority Column**: Displays the next guest who specifically requested this stylist.

### 3.8 Lounge TV Screen (Wall Display)
- **URL**: `/display`
- Designed for large, wall-mounted 4K lounge televisions:
  - Operates strictly in fullscreen `100dvh` without page scrollbars.
  - High-contrast dark theme (`#1C1A18`) for optimal readability from across the room.
  - **Left Section**: All stylist chairs with live timers showing haircuts in progress.
  - **Right Section**: Next 5 ticket numbers up in line with customer names and initials avatars.
  - **Audio Chime**: Audible notification and visual flash banner when a ticket is called.

---

## 4. UI/UX & Design Philosophy

### Dynamic Island Bottom Bar Height Expansion to Modal
- Instead of opening a separate popup in the center of the screen, the floating bar at the bottom is a single morphing container.
- When clicked, it stays anchored at the bottom (`bottom: 18px;`) while its height smoothly expands upward from `56px` to `min(84vh, 580px)` and its width gently expands to `470px` using a fluid spring transition (`cubic-bezier(0.32, 0.72, 0, 1)`).
- The compact bar header smoothly cross-fades into the full ticket modal content with live timer, queue ranking, stylist details, and opt-out options.
- Clicking the close button, the "Minimize" action, the background overlay, or pressing Escape collapses the modal height back down into the compact bottom bar.

### Button-to-Modal Transformation Animation
- Every interactive button that triggers a modal (e.g., "+ Join Queue", "+ Add Walk-in", "Edit Stylist") utilizes `@keyframes modalPopFromButton` (`animate-modal-pop`), scaling outward smoothly from the interaction point.

### Border-Free Spacing & Typography
- Traditional `border-b` / dividing lines have been completely eliminated.
- Sections and cards are separated using intentional luxury spacing, soft background shifts (`#F7F3EE` to `#FFFFFF`), and pill capsules with subtle tonal borders (`#E4DBD0`).

### Smart Avatar & Initials System
- Both customer check-ins and stylist rosters feature **optional** photo uploads.
- When an image is not provided, the unified `<Avatar />` component computes the first letter of the first and last name (e.g., `Devendra Jani` -> `DJ`) and displays an elegant typography badge.

### Desktop Loading & On-Scroll Reveal
- **Initial Desktop Loader**: A sleek 850ms intro splash featuring the brand scissors mark and an animated progress bar greets desktop visitors on first load.
- **On-Scroll Animations**: Sections utilize an `IntersectionObserver` coupled with `.scroll-reveal` and staggered animation delays (`stagger-1` through `stagger-8`) for smooth entrance transitions.

---

## 5. Quick Reference & Hotkeys

| View / Function | Route | Access | Key Features |
| :--- | :--- | :--- | :--- |
| **Studio Landing** | `/` | Public | Live queue status, chair tracking, station directory |
| **Guest Check-in** | `/join` | Public | 10-digit phone, services, optional photo, duplicate block |
| **Ticket Status** | `/status/:id` | Public | Live wait countdown, dynamic island, opt-out option |
| **Reception Console** | `/reception` | PIN (`1234`) | Drag-and-drop reorder, full customer CRUD, walk-ins |
| **Barber Mirror Station** | `/barber/:name` | PIN (`1234`) | Chair timer, call next, complete cut, take break |
| **Stylist & Studio Admin** | `/admin` | PIN (`1234`) | Add/edit/delete barbers, manage services, settings |
| **Lounge TV Display** | `/display` | Public | Fullscreen 100dvh wall screen with chime audio |

---

*Élan Atelier Queue System — Engineered for effortless luxury and flawless salon operations.*
