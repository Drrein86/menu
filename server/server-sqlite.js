const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('./database');

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
// CORS - מאפשר גישה מ-Vercel וגם מ-localhost
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://menu-cms.vercel.app',
  'https://menu-display.vercel.app',
  process.env.CLIENT_URL, // מ-environment variable
  process.env.DISPLAY_URL // מ-environment variable
].filter(Boolean); // מסיר undefined/null

app.use(cors({
  origin: (origin, callback) => {
    // אפשר requests ללא origin (כמו mobile apps או curl)
    if (!origin) return callback(null, true);
    
    // אפשר Vercel preview deployments (*.vercel.app)
    if (origin.includes('.vercel.app')) return callback(null, true);
    
    // בדוק אם ב-allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(null, true); // Allow anyway for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// הוספת io לכל request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // מצא משתמש
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // בדוק סיסמה
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // צור JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'sqlite-jwt-secret',
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
  try {
    const menus = db.prepare('SELECT * FROM menus ORDER BY id').all();
    
    const menusWithCount = menus.map(menu => {
      const count = db.prepare('SELECT COUNT(*) as count FROM menu_items WHERE menu_id = ? AND is_visible = 1').get(menu.id);
      return {
        ...menu,
        items_count: count.count
      };
    });
    
    res.json(menusWithCount);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// קבלת תפריט לפי ID
app.get('/api/menus/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(id);
    
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    const menuItems = db.prepare('SELECT * FROM menu_items WHERE menu_id = ? ORDER BY order_index').all(id);
    
    res.json({
      ...menu,
      items: menuItems
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// יצירת תפריט חדש
app.post('/api/menus', (req, res) => {
  try {
    const { key_name, title, theme_color, bg_color, text_color } = req.body;
    
    const insert = db.prepare(`
      INSERT INTO menus (key_name, title, theme_color, bg_color, text_color)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(key_name, title, theme_color, bg_color, text_color);
    const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(result.lastInsertRowid);
    
    req.io.emit('menu_updated', menu);
    res.json(menu);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// עדכון תפריט
app.put('/api/menus/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, theme_color, bg_color, text_color, video_url, font_size_title, font_size_item } = req.body;
    
    const update = db.prepare(`
      UPDATE menus 
      SET title = COALESCE(?, title),
          theme_color = COALESCE(?, theme_color),
          bg_color = COALESCE(?, bg_color),
          text_color = COALESCE(?, text_color),
          video_url = COALESCE(?, video_url),
          font_size_title = COALESCE(?, font_size_title),
          font_size_item = COALESCE(?, font_size_item),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    update.run(title, theme_color, bg_color, text_color, video_url, font_size_title, font_size_item, id);
    const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(id);
    
    req.io.emit('menu_updated', menu);
    res.json(menu);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// מחיקת תפריט
app.delete('/api/menus/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    db.prepare('DELETE FROM menus WHERE id = ?').run(id);
    
    req.io.emit('menu_deleted', { id });
    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== MENU ITEM ROUTES ====================

// יצירת פריט חדש
app.post('/api/items', (req, res) => {
  try {
    const { menu_id, name, description, price, image_url, is_visible, order_index } = req.body;
    
    // Convert undefined to safe values
    const safeData = {
      menu_id: menu_id,
      name: name || '',
      description: description || null,
      price: price !== undefined ? price : null,
      image_url: image_url || null,
      is_visible: is_visible !== undefined ? (is_visible ? 1 : 0) : 1,
      order_index: order_index !== undefined ? order_index : 0
    };
    
    console.log('➕ Creating new item:', safeData);
    
    const insert = db.prepare(`
      INSERT INTO menu_items (menu_id, name, description, price, image_url, is_visible, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(
      safeData.menu_id,
      safeData.name,
      safeData.description,
      safeData.price,
      safeData.image_url,
      safeData.is_visible,
      safeData.order_index
    );
    
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);
    
    console.log('✅ Item created:', item.id);
    
    req.io.emit('item_updated', item);
    res.json(item);
  } catch (error) {
    console.error('❌ Error creating item:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// עדכון פריט
app.put('/api/items/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, price, image_url, is_visible, order_index } = req.body;
    
    // Convert undefined to null for SQLite
    const safeData = {
      name: name !== undefined ? name : null,
      description: description !== undefined ? description : null,
      price: price !== undefined ? price : null,
      image_url: image_url !== undefined ? image_url : null,
      is_visible: is_visible !== undefined ? is_visible : null,
      order_index: order_index !== undefined ? order_index : null
    };
    
    console.log('🔄 Updating item:', id, safeData);
    
    const update = db.prepare(`
      UPDATE menu_items 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          image_url = COALESCE(?, image_url),
          is_visible = COALESCE(?, is_visible),
          order_index = COALESCE(?, order_index)
      WHERE id = ?
    `);
    
    update.run(
      safeData.name, 
      safeData.description, 
      safeData.price, 
      safeData.image_url, 
      safeData.is_visible, 
      safeData.order_index, 
      id
    );
    
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    
    console.log('✅ Item updated successfully');
    
    req.io.emit('item_updated', item);
    res.json(item);
  } catch (error) {
    console.error('❌ Error updating item:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// מחיקת פריט
app.delete('/api/items/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
    
    req.io.emit('item_deleted', { id, menu_id: item.menu_id });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== SCREEN ROUTES ====================

// קבלת כל המסכים
app.get('/api/screens', (req, res) => {
  try {
    const screens = db.prepare(`
      SELECT s.*, m.title as menu_title 
      FROM screens s
      LEFT JOIN menus m ON s.menu_id = m.id
      ORDER BY s.id
    `).all();
    
    res.json(screens);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// קבלת תפריט לפי token (לתצוגה)
app.get('/api/screens/display/:token', (req, res) => {
  try {
    const { token } = req.params;
    
    const screen = db.prepare('SELECT * FROM screens WHERE token = ?').get(token);
    if (!screen) {
      return res.status(404).json({ error: 'Screen not found' });
    }

    const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(screen.menu_id);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    const items = db.prepare('SELECT * FROM menu_items WHERE menu_id = ? AND is_visible = 1 ORDER BY order_index').all(screen.menu_id);
    
    res.json({
      screen,
      menu: {
        ...menu,
        items
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// יצירת מסך חדש
app.post('/api/screens', (req, res) => {
  try {
    const { screen_name, token, menu_id } = req.body;
    
    const insert = db.prepare(`
      INSERT INTO screens (screen_name, token, menu_id, is_active)
      VALUES (?, ?, ?, 1)
    `);
    
    const result = insert.run(screen_name, token, menu_id);
    const screen = db.prepare('SELECT * FROM screens WHERE id = ?').get(result.lastInsertRowid);
    
    res.json(screen);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// עדכון מסך
app.put('/api/screens/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { screen_name, menu_id, is_active } = req.body;
    
    const update = db.prepare(`
      UPDATE screens 
      SET screen_name = COALESCE(?, screen_name),
          menu_id = COALESCE(?, menu_id),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `);
    
    update.run(screen_name, menu_id, is_active, id);
    const screen = db.prepare('SELECT * FROM screens WHERE id = ?').get(id);
    
    res.json(screen);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// מחיקת מסך
app.delete('/api/screens/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    db.prepare('DELETE FROM screens WHERE id = ?').run(id);
    
    res.json({ message: 'Screen deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Heartbeat
app.post('/api/screens/heartbeat/:token', (req, res) => {
  try {
    const { token } = req.params;
    
    db.prepare('UPDATE screens SET last_ping = CURRENT_TIMESTAMP WHERE token = ?').run(token);
    
    res.json({ message: 'Heartbeat received' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== UPLOAD ROUTES (MOCK) ====================

app.post('/api/upload/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('📸 Image uploaded:', req.file.filename);
    
    // Return the full URL to the uploaded file
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.status(200).json({
      message: 'Image uploaded successfully',
      url: fileUrl,
      filename: req.file.filename
    });
    
    console.log('✅ Image URL:', fileUrl);
  } catch (error) {
    console.error('❌ Error in image upload:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Upload failed' });
    }
  }
});

app.post('/api/upload/video', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('🎬 Video uploaded:', req.file.filename);
    
    // Return the full URL to the uploaded file
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.status(200).json({
      message: 'Video uploaded successfully',
      url: fileUrl,
      filename: req.file.filename
    });
    
    console.log('✅ Video URL:', fileUrl);
  } catch (error) {
    console.error('❌ Error in video upload:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Upload failed' });
    }
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: 'SQLite Database',
    database: 'menu.db'
  });
});

// ==================== WEBSOCKET ====================

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
  
  socket.on('subscribe_menu', (menuId) => {
    socket.join(`menu_${menuId}`);
    console.log(`📺 Socket ${socket.id} subscribed to menu ${menuId}`);
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\n🚀 ==============================================');
  console.log(`   Menu Display System Server (SQLite)`);
  console.log('   ==============================================');
  console.log(`   🌐 Server: http://localhost:${PORT}`);
  console.log(`   💾 Database: SQLite (menu.db)`);
  console.log(`   📊 Status: Running`);
  console.log('   ==============================================\n');
});

