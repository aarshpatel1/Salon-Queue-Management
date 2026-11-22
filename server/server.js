import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import passport from 'passport';
import os from 'os';

import { connectDB } from './configs/db.js';
import { configurePassport } from './configs/passport.js';
import { seedDatabase } from './utils/seedData.js';

import authRoutes from './routes/authRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import barberRoutes from './routes/barberRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import keepAliveRoutes from './routes/keepAliveRoutes.js';
import { startKeepAlive, getKeepAliveStats } from './utils/keepAlive.js';

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup Socket.io for Real-Time Sync across all screens (< 5s latency guarantee)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach io instance to express app so controllers can emit events
app.set('io', io);

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport initialization
configurePassport();
app.use(passport.initialize());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/keep-alive', keepAliveRoutes);

// Quick ping endpoint
app.get('/api/ping', (req, res) => res.status(200).send('pong'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    keepAlive: getKeepAliveStats()
  });
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

function getNetworkIps() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// Initialize Server & Database
let stopKeepAlive = null;

const startServer = async () => {
  await connectDB();
  await seedDatabase();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Élan Atelier Salon Queue Server running`);
    console.log(`   ➜ Local:   http://localhost:${PORT}`);
    const networkIps = getNetworkIps();
    networkIps.forEach((ip) => {
      console.log(`   ➜ Network: http://${ip}:${PORT}`);
    });
    console.log(`📡 Real-Time Socket.io sync active (0.0.0.0:${PORT})\n`);

    // Start background keep-alive runner every 30s for Render.com
    stopKeepAlive = startKeepAlive(PORT);
  });
};

const shutdown = () => {
  console.log('\n[Server] Gracefully shutting down...');
  if (stopKeepAlive) stopKeepAlive();
  server.close(() => {
    console.log('[Server] HTTP and Socket server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
