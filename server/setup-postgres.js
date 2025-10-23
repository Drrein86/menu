const pool = require('./database-postgres');
const bcrypt = require('bcryptjs');
const { mockMenus, mockMenuItems, mockScreens } = require('./mockData');

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up PostgreSQL database...');

    // Drop existing tables
    console.log('📦 Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS menu_items CASCADE;
      DROP TABLE IF EXISTS screens CASCADE;
      DROP TABLE IF EXISTS menus CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create tables
    console.log('👤 Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'editor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('📋 Creating menus table...');
    await client.query(`
      CREATE TABLE menus (
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
      CREATE TABLE menu_items (
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
        [screen.name, screen.token, screen.menu_id, screen.kiosk_mode ? true : false]
      );
    }

    console.log('\n✅ Database setup completed!');
    console.log('\n📊 Summary:');
    console.log('   👤 Admin user: admin / admin123');
    console.log('   📋 Menus: 2 (Sabich, Toast)');
    console.log('   🍽️  Menu items: 8 total');
    console.log('   🖥️  Screens: 2 demo screens');
    console.log('\n🚀 Ready to start server!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase().catch(console.error);

