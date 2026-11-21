# BRANJA Barber Studio — Real-Time Salon Queue Management System

A production-grade, full-stack salon queue management platform built with React, Vite, Tailwind CSS, Node.js, Express, MongoDB, Socket.io, Passport.js JWT, and Cloudinary.

## Architectural Choice for Real-Time Synchronization
1. MongoDB provides flexible document modeling for dynamic queue tokens, salon schedules, services, and barber assignments with high-write performance.
2. Real-time synchronization is driven by Socket.io bidirectional events integrated directly into the centralized Queue Engine lifecycle, guaranteeing sub-second updates across all customer phones, TV displays, tablets, and barber views.
3. Coupled with Passport JWT authentication and Cloudinary CDN storage, this stack ensures a secure, resilient, and enterprise-grade reactive queue management system.

---

## Required Environment Keys

### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/salon_queue
JWT_SECRET=super_secret_jwt_key_branja_salon_2026_x7k9
STAFF_PIN=1234
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000
```

---

## Starting the Application

### 1. Start Backend Server
```bash
cd server
npm start
# Runs on http://localhost:5000
```

### 2. Start Frontend App
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

---

## Default Staff Credentials
- **Staff PIN:** `1234` (Stored in `sessionStorage` after verification)
- **Protected Screens:** `/reception`, `/barber/:name`, `/admin`
- **Public Screens:** `/`, `/join`, `/status/:id`, `/display`
