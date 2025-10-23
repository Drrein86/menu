const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// הוספת io לכל request למטרות WebSocket
app.use((req, res, next) => {
  req.io = io;
  next();
});

// סטטי - תיקיית uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menus');
const itemRoutes = require('./routes/items');
const screenRoutes = require('./routes/screens');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/screens', screenRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // הצטרפות לחדר של מסך ספציפי
  socket.on('join_screen', (token) => {
    socket.join(`screen_${token}`);
    console.log(`Screen ${token} joined`);
  });

  // הצטרפות לחדר של תפריט ספציפי
  socket.on('join_menu', (menuId) => {
    socket.join(`menu_${menuId}`);
    console.log(`Menu ${menuId} room joined`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🎬 Menu Display System Server       ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
╚════════════════════════════════════════╝
  `);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = { app, server, io };

