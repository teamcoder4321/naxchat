require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');

// Import routes
const apiRoutes = require('./routes/api');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// ========== MIDDLEWARE ==========

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// ========== MONGODB CONNECTION ==========
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✓ MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// ========== ROUTES ==========
app.use('/api/auth', apiRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'NexChat Backend is running' });
});

// ========== SOCKET.IO SETUP ==========

// Store active users in memory (use Redis in production)
const matchingQueue = [];
const activeConnections = new Map();
const activeSessions = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // When user joins (after login)
  socket.on('user:join', (userData) => {
    activeConnections.set(socket.id, {
      userId: userData.userId,
      username: userData.username,
      socketId: socket.id,
    });
    console.log(`User ${userData.username} joined`);
  });

  // When user clicks "Find Match"
  socket.on('matching:start', (userData) => {
    matchingQueue.push({
      socketId: socket.id,
      userId: userData.userId,
      username: userData.username,
      joinedAt: Date.now(),
    });

    console.log(`${userData.username} joined matching queue. Queue size: ${matchingQueue.length}`);

    // Check if we have 2 users
    if (matchingQueue.length >= 2) {
      const user1 = matchingQueue.shift();
      const user2 = matchingQueue.shift();

      // Create a unique room for this session
      const sessionId = `session_${user1.userId}_${user2.userId}_${Date.now()}`;

      // Add both users to the session room
      io.to(user1.socketId).emit('matching:matched', {
        sessionId,
        pairedUser: {
          userId: user2.userId,
          username: user2.username,
        },
      });

      io.to(user2.socketId).emit('matching:matched', {
        sessionId,
        pairedUser: {
          userId: user1.userId,
          username: user1.username,
        },
      });

      // Store session
      activeSessions.set(sessionId, {
        user1Id: user1.socketId,
        user2Id: user2.socketId,
        startTime: Date.now(),
      });

      console.log(`✓ Matched: ${user1.username} <-> ${user2.username}`);
    }
  });

  // WebRTC Signaling
  socket.on('webrtc:offer', (data) => {
    console.log('Received WebRTC offer');
    // In a real app, relay the offer through Socket.io to the other user
    io.to(data.to).emit('webrtc:offer', {
      from: socket.id,
      offer: data.offer,
    });
  });

  socket.on('webrtc:answer', (data) => {
    console.log('Received WebRTC answer');
    io.to(data.to).emit('webrtc:answer', {
      from: socket.id,
      answer: data.answer,
    });
  });

  socket.on('webrtc:ice-candidate', (data) => {
    io.to(data.to).emit('webrtc:ice-candidate', {
      from: socket.id,
      candidate: data.candidate,
    });
  });

  // Text Chat
  socket.on('chat:message', (data) => {
    console.log(`Message from ${data.username}: ${data.text}`);

    // In a real app, save to database here
    // Check for toxicity using Perspective API

    // Relay to other user in the session
    io.to(data.to).emit('chat:message', {
      from: socket.id,
      username: data.username,
      text: data.text,
      timestamp: new Date(),
    });
  });

  // Skip user
  socket.on('matching:skip', (data) => {
    console.log(`${data.username} skipped user`);
    
    // Remove from active session
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.user1Id === socket.id || session.user2Id === socket.id) {
        activeSessions.delete(sessionId);
        break;
      }
    }

    // Notify other user
    if (data.otherUserSocketId) {
      io.to(data.otherUserSocketId).emit('matching:user-skipped', {
        message: 'User skipped the chat',
      });
    }
  });

  // End chat session
  socket.on('chat:end', (data) => {
    console.log(`Chat session ended for ${data.username}`);

    // Remove session
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.user1Id === socket.id || session.user2Id === socket.id) {
        activeSessions.delete(sessionId);

        // Notify other user
        const otherSocketId =
          session.user1Id === socket.id ? session.user2Id : session.user1Id;
        io.to(otherSocketId).emit('chat:ended', {
          message: 'Other user ended the chat',
        });
        break;
      }
    }
  });

  // Report user
  socket.on('user:report', (data) => {
    console.log(`Report submitted: ${data.reportedUsername} - Reason: ${data.reason}`);
    // In a real app, save report to database
    socket.emit('user:report-submitted', {
      success: true,
      message: 'Report has been submitted to our moderation team',
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove from queue
    const queueIndex = matchingQueue.findIndex((u) => u.socketId === socket.id);
    if (queueIndex !== -1) {
      matchingQueue.splice(queueIndex, 1);
    }

    // Remove from active connections
    activeConnections.delete(socket.id);

    // Remove from sessions
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.user1Id === socket.id || session.user2Id === socket.id) {
        activeSessions.delete(sessionId);
        break;
      }
    }
  });
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message,
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 NexChat Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log('\n');
});

module.exports = { app, io };
