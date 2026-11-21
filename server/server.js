import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';

import { connectDB } from './configs/db.js';
import { configurePassport } from './configs/passport.js';
import { seedDatabase } from './utils/seedData.js';

import authRoutes from './routes/authRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import barberRoutes from './routes/barberRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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

// Initialize Server & Database
const startServer = async () => {
  await connectDB();
  await seedDatabase();

  server.listen(PORT, () => {
    console.log(`🚀 BRANJA Salon Queue Server running on http://localhost:${PORT}`);
    console.log(`📡 Real-Time Socket.io sync active`);
  });
};

startServer();
