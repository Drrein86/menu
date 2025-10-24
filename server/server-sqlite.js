const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Pool } = require('pg');

// ==================== DATABASE CONFIG ====================

// Dynamic DB config with Railway Public/Internal handling
const getDatabaseConfig = () => {
  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
  if (!dbUrl) throw new Error('❌ DATABASE_URL or DATABASE_PUBLIC_URL not set!');

  console.log('✅ Using DB:', process.env.DATABASE_URL ? 'DATABASE_URL' : 'DATABASE_PUBLIC_URL');
  console.log('🔗 Connection string:', dbUrl.replace(/:[^:@]+@/, ':****@'));

  return {
    connectionString: dbUrl,
    ssl: false, // Railway internal/public proxy doesn't need SSL for Node.js client
    statement_timeout: 30000,      // 30s
    connectionTimeoutMillis: 30000 // 30s
  };
};

// Create pool
const pool = new Pool(getDatabaseConfig());

pool.on('connect', () => console.log('✅ Connected to PostgreSQL'));
pool.on('error', (err) => console.error('❌ PostgreSQL error:', err));

// ==================== WAIT FOR DB ====================
const waitForDB = async (pool, retries = 20, delay = 3000) => {
  console.log('⏳ Waiting for DB to be ready...');
  while (retries > 0) {
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
      console.log(`✅ DB ready (${Date.now() - start}ms)`);
      return;
    } catch (err) {
      retries--;
      console.log(`⚠️ DB not ready yet: ${err.message} (${retries} retries left)`);
      if (retries === 0) throw new Error('❌ DB failed to start in time');
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

// ==================== INITIALIZE DATABASE ====================
const initializeDatabase = async () => {
  await waitForDB(pool);
  const client = await pool.connect();
  try {
    // Check if tables exist
    const res = await client.query("SELECT to_regclass('public.users') as users_table");
    if (!res.rows[0].users_table) {
      console.log('📦 Creating tables...');
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'editor',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE menus (
          id SERIAL PRIMARY KEY,
          key_name VARCHAR(255) UNIQUE NOT NULL,
          title VARCHAR(255) NOT NULL,
          theme_color VARCHAR(50) DEFAULT '#FF6B35',
          bg_color VARCHAR(50) DEFAULT '#FFFFFF',
          text_color VARCHAR(50) DEFAULT '#2C3E50',
          video_url TEXT,
          font_family VARCHAR(100) DEFAULT 'Rubik',
          font_size_title INTEGER DEFAULT 52,
          font_size_item INTEGER DEFAULT 24,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE menu_items (
          id SERIAL PRIMARY KEY,
          menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2),
          image_url TEXT,
          is_visible BOOLEAN DEFAULT true,
          order_index INTEGER DEFAULT 0
        )
      `);

      await client.query(`
        CREATE TABLE screens (
          id SERIAL PRIMARY KEY,
          screen_name VARCHAR(255) NOT NULL,
          token VARCHAR(255) UNIQUE NOT NULL,
          menu_id INTEGER NOT NULL REFERENCES menus(id),
          is_active BOOLEAN DEFAULT true,
          last_ping TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create admin user
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await client.query('INSERT INTO users (username, password, role) VALUES ($1,$2,$3)', ['admin', hashedPassword, 'admin']);
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Tables already exist');
    }
  } finally {
    client.release();
  }
};

// ==================== MULTER CONFIG ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

// ==================== EXPRESS & SOCKET.IO ====================
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET','POST','PUT','DELETE'] } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => { req.io = io; next(); });

// ==================== CORS ====================
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
    if (!origin || origin.includes('.vercel.app') || allowedOrigins.includes(origin)) return callback(null, true);
    console.warn('CORS blocked:', origin);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

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

// ==================== START SERVER ====================
(async () => {
  try {
    await initializeDatabase();
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
  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
})();
