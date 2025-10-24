const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Pool } = require('pg');

// Simple DATABASE_URL configuration - SSL disabled for Railway internal network
const getDatabaseConfig = () => {
  console.log('\n==========================================');
  console.log('🔧 DATABASE CONFIGURATION');
  console.log('==========================================');
  
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL is NOT SET in environment variables!');
    console.error('📋 Available environment variables:', Object.keys(process.env).filter(k => k.includes('PG') || k.includes('DATABASE')));
    throw new Error('❌ DATABASE_URL is not set!');
  }

  console.log('✅ DATABASE_URL found');
  console.log('🔍 DATABASE_URL:', dbUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
  console.log('📍 Contains sslmode=disable?', dbUrl.includes('sslmode=disable') ? '✅ YES' : '⚠️ NO');
  console.log('📍 Host type:', 
    dbUrl.includes('.railway.internal') ? '🔒 INTERNAL' : 
    dbUrl.includes('proxy.rlwy.net') ? '🌐 PUBLIC PROXY' : 
    '❓ UNKNOWN'
  );

  // Railway internal network - no SSL needed
  const config = {
    connectionString: dbUrl,
    ssl: false, // Disabled for Railway internal network
    statement_timeout: 10000,
    connectionTimeoutMillis: 10000,
  };

  console.log('🔗 SSL Configuration: DISABLED (Railway internal network)');
  console.log('⏱️  Connection timeout: 10 seconds');
  console.log('==========================================\n');

  return config;
};

// Create PostgreSQL connection pool with SSL fix
const pool = new Pool(getDatabaseConfig());

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
  console.error('Full error details:', JSON.stringify(err, null, 2));
});

// Auto-initialize database on startup
async function initializeDatabase() {
  console.log('\n==========================================');
  console.log('🚀 DATABASE INITIALIZATION');
  console.log('==========================================');
  console.log('🔄 Attempting to connect to PostgreSQL...');
  console.log('📅 Time:', new Date().toISOString());
  
  // Add retry logic for database connection
  let retries = 5;
  let client;
  
  while (retries > 0) {
    try {
      console.log(`\n🔌 Connection attempt ${6 - retries}/5...`);
      const startTime = Date.now();
      
      client = await pool.connect();
      
      const duration = Date.now() - startTime;
      console.log(`✅ Successfully connected to PostgreSQL! (${duration}ms)`);
      console.log('==========================================\n');
      break;
    } catch (err) {
      retries--;
      const duration = Date.now() - startTime;
      
      console.log(`\n❌ Connection attempt FAILED (${duration}ms)`);
      console.log(`⚠️ Retries left: ${retries}`);
      console.log(`⚠️ Error name: ${err.name}`);
      console.log(`⚠️ Error message: ${err.message}`);
      console.log(`⚠️ Error code: ${err.code || 'undefined'}`);
      
      if (err.stack) {
        console.log(`⚠️ Stack trace (first 3 lines):`);
        console.log(err.stack.split('\n').slice(0, 3).join('\n'));
      }
      
      if (retries === 0) {
        console.error('\n==========================================');
        console.error('❌ FINAL FAILURE - ALL RETRIES EXHAUSTED');
        console.error('==========================================');
        console.error('💡 Troubleshooting checklist:');
        console.error('   1. Is DATABASE_URL set in Railway Variables?');
        console.error('   2. Does it end with ?sslmode=disable?');
        console.error('   3. Is the Postgres service running?');
        console.error('   4. Are both services in the same Railway project?');
        console.error('==========================================\n');
        throw err;
      }
      
      // Wait 3 seconds before retrying
      console.log('⏳ Waiting 3 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  try {
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const tablesExist = tableCheck.rows[0].exists;
    
    if (!tablesExist) {
      console.log('📦 Database tables not found, initializing...');
      
      const { mockMenus, mockMenuItems, mockScreens } = require('./mockData');
      
      // Create tables
      console.log('👤 Creating users table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'editor',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('📋 Creating menus table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS menus (
          id SERIAL PRIMARY KEY,
          key_name VARCHAR(255) UNIQUE NOT NULL,
          title VARCHAR(255) NOT NULL,
          theme_color VARCHAR(50) DEFAULT '#FF6B35',
          bg_color VARCHAR(50) DEFAULT '#FFFFFF',
          text_color VARCHAR(50) DEFAULT '#2C3E50',
          video_url TEXT,
          video_settings TEXT,
          layout TEXT,
          font_family VARCHAR(100) DEFAULT 'Rubik',
          font_size_title INTEGER DEFAULT 52,
          font_size_item INTEGER DEFAULT 24,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('🍽️  Creating menu_items table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS menu_items (
          id SERIAL PRIMARY KEY,
          menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2),
          image_url TEXT,
          is_visible BOOLEAN DEFAULT true,
          order_index INTEGER DEFAULT 0,
          modifiers TEXT
        )
      `);

      console.log('🖥️  Creating screens table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS screens (
          id SERIAL PRIMARY KEY,
          screen_name VARCHAR(255) NOT NULL,
          token VARCHAR(255) UNIQUE NOT NULL,
          menu_id INTEGER NOT NULL REFERENCES menus(id),
          is_active BOOLEAN DEFAULT true,
          last_ping TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert admin user
      console.log('👨‍💼 Creating admin user...');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await client.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, 'admin']
      );

      // Insert menus
      console.log('📋 Creating sample menus...');
      for (const menu of mockMenus) {
        await client.query(
          `INSERT INTO menus (key_name, title, theme_color, bg_color, text_color, video_url, font_family, font_size_title, font_size_item)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [menu.key_name, menu.title, menu.theme_color, menu.bg_color, menu.text_color, menu.video_url, menu.font_family, menu.font_size_title, menu.font_size_item]
        );
      }

      // Insert menu items
      console.log('🥙 Creating menu items...');
      for (const item of mockMenuItems) {
        await client.query(
          `INSERT INTO menu_items (menu_id, name, description, price, image_url, is_visible, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [item.menu_id, item.name, item.description, item.price, item.image_url, item.is_visible ? true : false, item.order_index]
        );
      }

      // Insert screens
      console.log('🖥️  Creating demo screens...');
      for (const screen of mockScreens) {
        await client.query(
          `INSERT INTO screens (screen_name, token, menu_id, is_active)
           VALUES ($1, $2, $3, $4)`,
          [screen.screen_name, screen.token, screen.menu_id, screen.is_active ? true : false]
        );
      }

      console.log('✅ Database initialized successfully!');
    } else {
      console.log('✅ Database tables already exist');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  } finally {
    client.release();
  }
}

// Initialize database immediately
initializeDatabase().catch(console.error);

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
    fileSize: 50 * 1024 * 1024 // 50MB max
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

// Middleware - CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://menu-cms.vercel.app',
  'https://menu-display.vercel.app',
  process.env.CLIENT_URL,
  process.env.DISPLAY_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.includes('.vercel.app')) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add io to all requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔍 Login attempt:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('❌ Missing username or password');
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    console.log('🔍 Looking for user:', username);
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    console.log('🔍 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🔍 Comparing passwords...');
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('🔍 Password valid:', validPassword);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Creating token...');
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'postgres-jwt-secret',
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful!');
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// ==================== MENU ROUTES ====================

// Get all menus
app.get('/api/menus', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menus ORDER BY id');
    const menus = result.rows;
    
    const menusWithCount = await Promise.all(menus.map(async (menu) => {
      const countResult = await pool.query(
        'SELECT COUNT(*) as count FROM menu_items WHERE menu_id = $1 AND is_visible = true',
        [menu.id]
      );
      return { ...menu, items_count: parseInt(countResult.rows[0].count) };
    }));
    
    res.json(menusWithCount);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get menu by ID
app.get('/api/menus/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const menuResult = await pool.query('SELECT * FROM menus WHERE id = $1', [id]);
    const menu = menuResult.rows[0];
    
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    const itemsResult = await pool.query(
      'SELECT * FROM menu_items WHERE menu_id = $1 ORDER BY order_index',
      [id]
    );
    
    res.json({
      ...menu,
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update menu
app.put('/api/menus/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, theme_color, bg_color, text_color, video_url, font_family, font_size_title, font_size_item } = req.body;
    
    const result = await pool.query(
      `UPDATE menus 
       SET title = COALESCE($1, title),
           theme_color = COALESCE($2, theme_color),
           bg_color = COALESCE($3, bg_color),
           text_color = COALESCE($4, text_color),
           video_url = COALESCE($5, video_url),
           font_family = COALESCE($6, font_family),
           font_size_title = COALESCE($7, font_size_title),
           font_size_item = COALESCE($8, font_size_item),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [title, theme_color, bg_color, text_color, video_url, font_family, font_size_title, font_size_item, id]
    );
    
    const menu = result.rows[0];
    req.io.emit('menu_updated', menu);
    res.json(menu);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== MENU ITEM ROUTES ====================

// Create new item
app.post('/api/items', async (req, res) => {
  try {
    const { menu_id, name, description, price, image_url, is_visible, order_index } = req.body;
    
    const safeData = {
      menu_id: menu_id,
      name: name || '',
      description: description || null,
      price: price !== undefined ? price : null,
      image_url: image_url || null,
      is_visible: is_visible !== undefined ? is_visible : true,
      order_index: order_index !== undefined ? order_index : 0
    };

    console.log('➕ Creating new item:', safeData);
    
    const result = await pool.query(
      `INSERT INTO menu_items (menu_id, name, description, price, image_url, is_visible, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [safeData.menu_id, safeData.name, safeData.description, safeData.price, safeData.image_url, safeData.is_visible, safeData.order_index]
    );
    
    const item = result.rows[0];
    console.log('✅ Item created:', item.id);
    
    req.io.emit('item_updated', item);
    res.json(item);
  } catch (error) {
    console.error('❌ Error creating item:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update item
app.put('/api/items/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, price, image_url, is_visible, order_index } = req.body;
    
    console.log('🔄 Updating item:', id, req.body);
    
    const result = await pool.query(
      `UPDATE menu_items
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           image_url = COALESCE($4, image_url),
           is_visible = COALESCE($5, is_visible),
           order_index = COALESCE($6, order_index)
       WHERE id = $7
       RETURNING *`,
      [name, description, price, image_url, is_visible, order_index, id]
    );
    
    const item = result.rows[0];
    console.log('✅ Item updated successfully');
    
    req.io.emit('item_updated', item);
    res.json(item);
  } catch (error) {
    console.error('❌ Error updating item:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const itemResult = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    const item = itemResult.rows[0];
    
    await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
    
    req.io.emit('item_deleted', { id, menu_id: item.menu_id });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reorder items
app.post('/api/items/reorder', async (req, res) => {
  try {
    const { items: reorderedItems } = req.body;
    
    for (const item of reorderedItems) {
      await pool.query(
        'UPDATE menu_items SET order_index = $1 WHERE id = $2',
        [item.order_index, item.id]
      );
    }
    
    req.io.emit('items_reordered', reorderedItems);
    res.json({ message: 'Items reordered successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== SCREENS ROUTES ====================

// Get all screens
app.get('/api/screens', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM screens');
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get screen by token for display
app.get('/api/screens/display/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const screenResult = await pool.query('SELECT * FROM screens WHERE token = $1', [token]);
    const screen = screenResult.rows[0];
    
    if (!screen) {
      return res.status(404).json({ error: 'Screen not found' });
    }

    const menuResult = await pool.query('SELECT * FROM menus WHERE id = $1', [screen.menu_id]);
    const menu = menuResult.rows[0];
    
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found for this screen' });
    }

    const itemsResult = await pool.query(
      'SELECT * FROM menu_items WHERE menu_id = $1 AND is_visible = true ORDER BY order_index',
      [menu.id]
    );
    
    res.json({ screen, menu: { ...menu, items: itemsResult.rows } });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create screen
app.post('/api/screens', async (req, res) => {
  try {
    const { screen_name, menu_id } = req.body;
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const result = await pool.query(
      'INSERT INTO screens (screen_name, token, menu_id) VALUES ($1, $2, $3) RETURNING *',
      [screen_name, token, menu_id]
    );
    
    const screen = result.rows[0];
    req.io.emit('screen_updated', screen);
    res.json(screen);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update screen
app.put('/api/screens/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { screen_name, menu_id, is_active } = req.body;
    
    const result = await pool.query(
      `UPDATE screens
       SET screen_name = COALESCE($1, screen_name),
           menu_id = COALESCE($2, menu_id),
           is_active = COALESCE($3, is_active),
           last_ping = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [screen_name, menu_id, is_active, id]
    );
    
    const screen = result.rows[0];
    req.io.emit('screen_updated', screen);
    res.json(screen);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete screen
app.delete('/api/screens/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query('DELETE FROM screens WHERE id = $1', [id]);
    
    req.io.emit('screen_deleted', { id });
    res.json({ message: 'Screen deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Heartbeat
app.post('/api/screens/heartbeat/:token', async (req, res) => {
  try {
    const { token } = req.params;
    await pool.query('UPDATE screens SET last_ping = CURRENT_TIMESTAMP WHERE token = $1', [token]);
    res.json({ message: 'Heartbeat received' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== UPLOAD ROUTES ====================

app.post('/api/upload/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📸 Image uploaded:', req.file.filename);
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
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
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
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
    mode: 'PostgreSQL Database',
    database: 'Railway PostgreSQL'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 ==============================================`);
  console.log(`   Menu Display System Server (PostgreSQL)`);
  console.log(`   ==============================================`);
  console.log(`   🌐 Server: http://localhost:${PORT}`);
  console.log(`   💾 Database: PostgreSQL`);
  console.log(`   📊 Status: Running`);
  console.log(`   ==============================================\n`);
});
