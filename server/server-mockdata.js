const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ייבוא Mock Data
const { mockUsers, mockMenus, mockMenuItems, mockScreens } = require('./mockData');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// הוספת io לכל request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Mock data in memory
let users = [...mockUsers];
let menus = [...mockMenus];
let items = [...mockMenuItems];
let screens = [...mockScreens];

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // מצא משתמש
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // בדוק סיסמה (פשוט - admin123)
    if (password !== 'admin123') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // צור JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      'mock-jwt-secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== MENU ROUTES ====================

// קבלת כל התפריטים
app.get('/api/menus', (req, res) => {
  const menusWithCount = menus.map(menu => ({
    ...menu,
    items_count: items.filter(item => item.menu_id === menu.id && item.is_visible).length
  }));
  res.json(menusWithCount);
});

// קבלת תפריט לפי ID
app.get('/api/menus/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const menu = menus.find(m => m.id === id);
  
  if (!menu) {
    return res.status(404).json({ error: 'Menu not found' });
  }

  const menuItems = items.filter(item => item.menu_id === id);
  
  res.json({
    ...menu,
    items: menuItems
  });
});

// עדכון תפריט
app.put('/api/menus/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const menuIndex = menus.findIndex(m => m.id === id);
  
  if (menuIndex === -1) {
    return res.status(404).json({ error: 'Menu not found' });
  }

  menus[menuIndex] = {
    ...menus[menuIndex],
    ...req.body,
    updated_at: new Date()
  };

  // שלח עדכון WebSocket
  io.emit('menu_updated', { menuId: id });

  res.json({ message: 'Menu updated successfully' });
});

// ==================== ITEMS ROUTES ====================

// הוספת פריט
app.post('/api/items', (req, res) => {
  const newItem = {
    id: items.length + 1,
    ...req.body,
    created_at: new Date(),
    updated_at: new Date()
  };

  items.push(newItem);

  // שלח עדכון
  io.emit('menu_updated', { menuId: req.body.menu_id });

  res.status(201).json({
    message: 'Item created successfully',
    id: newItem.id
  });
});

// עדכון פריט
app.put('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = items.findIndex(i => i.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  items[itemIndex] = {
    ...items[itemIndex],
    ...req.body,
    updated_at: new Date()
  };

  // שלח עדכון
  io.emit('menu_updated', { menuId: items[itemIndex].menu_id });

  res.json({ message: 'Item updated successfully' });
});

// מחיקת פריט
app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = items.findIndex(i => i.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const menuId = items[itemIndex].menu_id;
  items = items.filter(i => i.id !== id);

  // שלח עדכון
  io.emit('menu_updated', { menuId });

  res.json({ message: 'Item deleted successfully' });
});

// ==================== SCREENS ROUTES ====================

// קבלת כל המסכים
app.get('/api/screens', (req, res) => {
  const screensWithMenu = screens.map(screen => {
    const menu = menus.find(m => m.id === screen.menu_id);
    return {
      ...screen,
      menu_title: menu ? menu.title : null,
      menu_key: menu ? menu.key_name : null
    };
  });
  res.json(screensWithMenu);
});

// קבלת תוכן מסך לפי טוקן
app.get('/api/screens/display/:token', (req, res) => {
  const { token } = req.params;
  const screen = screens.find(s => s.token === token);

  if (!screen) {
    return res.status(404).json({ error: 'Screen not found' });
  }

  const menu = menus.find(m => m.id === screen.menu_id);
  if (!menu) {
    return res.json({
      screen: { id: screen.id, name: screen.name, kiosk_mode: screen.kiosk_mode },
      menu: null,
      items: []
    });
  }

  const menuItems = items.filter(item => item.menu_id === menu.id && item.is_visible);

  res.json({
    screen: {
      id: screen.id,
      name: screen.name,
      kiosk_mode: screen.kiosk_mode
    },
    menu: {
      id: menu.id,
      key_name: menu.key_name,
      title: menu.title,
      theme_color: menu.theme_color,
      bg_color: menu.bg_color,
      text_color: menu.text_color,
      video_url: menu.video_url,
      video_settings: menu.video_settings,
      font_family: menu.font_family,
      font_size_title: menu.font_size_title,
      font_size_item: menu.font_size_item
    },
    items: menuItems
  });
});

// יצירת מסך חדש
app.post('/api/screens', (req, res) => {
  const newScreen = {
    id: screens.length + 1,
    token: `screen-${Date.now()}`,
    status: 'offline',
    last_seen: null,
    ...req.body,
    created_at: new Date(),
    updated_at: new Date()
  };

  screens.push(newScreen);

  res.status(201).json({
    message: 'Screen created successfully',
    id: newScreen.id,
    token: newScreen.token,
    url: `/screen/${newScreen.token}`
  });
});

// עדכון מסך
app.put('/api/screens/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const screenIndex = screens.findIndex(s => s.id === id);
  
  if (screenIndex === -1) {
    return res.status(404).json({ error: 'Screen not found' });
  }

  screens[screenIndex] = {
    ...screens[screenIndex],
    ...req.body,
    updated_at: new Date()
  };

  // שלח עדכון
  io.emit('screen_updated', { token: screens[screenIndex].token });

  res.json({ message: 'Screen updated successfully' });
});

// מחיקת מסך
app.delete('/api/screens/:id', (req, res) => {
  const id = parseInt(req.params.id);
  screens = screens.filter(s => s.id !== id);
  res.json({ message: 'Screen deleted successfully' });
});

// Heartbeat
app.post('/api/screens/heartbeat/:token', (req, res) => {
  const { token } = req.params;
  const screenIndex = screens.findIndex(s => s.token === token);
  
  if (screenIndex !== -1) {
    screens[screenIndex].last_seen = new Date();
    screens[screenIndex].status = 'online';
  }

  res.json({ message: 'Heartbeat received' });
});

// ==================== UPLOAD ROUTES (MOCK) ====================

app.post('/api/upload/image', (req, res) => {
  // Mock - החזר URL דמה עם מספר רנדומלי כך שהתמונה תשתנה
  const randomNum = Math.floor(Math.random() * 1000);
  const timestamp = Date.now();
  res.json({
    message: 'Image uploaded successfully (mock)',
    url: `https://picsum.photos/400/300?random=${timestamp}`,
    filename: `mock-image-${timestamp}.jpg`
  });
});

app.post('/api/upload/video', (req, res) => {
  // Mock - החזר URL דמה
  res.json({
    message: 'Video uploaded successfully (mock)',
    url: `https://www.w3schools.com/html/mov_bbb.mp4`,
    filename: `mock-video-${Date.now()}.mp4`
  });
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: 'MOCK DATA - No Database Required'
  });
});

// ==================== WEBSOCKET ====================

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join_screen', (token) => {
    socket.join(`screen_${token}`);
    console.log(`Screen ${token} joined`);
  });

  socket.on('join_menu', (menuId) => {
    socket.join(`menu_${menuId}`);
    console.log(`Menu ${menuId} room joined`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🎬 Menu Display System Server       ║
║   Port: ${PORT}                           ║
║   Mode: 🎭 MOCK DATA (No MySQL!)      ║
╚════════════════════════════════════════╝
  `);
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ API available at http://localhost:${PORT}/api`);
  console.log(`🎭 Using Mock Data - No database required!`);
  console.log(`\n👤 Login: admin / admin123`);
  console.log(`📺 Demo Screen 1: http://localhost:3001/display/demo-screen-001`);
  console.log(`📺 Demo Screen 2: http://localhost:3001/display/demo-screen-002\n`);
});

module.exports = { app, server, io };

