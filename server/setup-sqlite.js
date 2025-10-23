const db = require('./database');
const bcrypt = require('bcryptjs');

console.log('🔧 Setting up SQLite database...');

// Drop existing tables
console.log('📦 Dropping existing tables...');
db.exec(`
  DROP TABLE IF EXISTS menu_items;
  DROP TABLE IF EXISTS screens;
  DROP TABLE IF EXISTS menus;
  DROP TABLE IF EXISTS users;
`);

// Create users table
console.log('👤 Creating users table...');
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'editor',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create menus table
console.log('📋 Creating menus table...');
db.exec(`
  CREATE TABLE menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_name TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    theme_color TEXT DEFAULT '#FF6B35',
    bg_color TEXT DEFAULT '#FFFFFF',
    text_color TEXT DEFAULT '#2C3E50',
    video_url TEXT,
    video_settings TEXT,
    layout TEXT,
    font_family TEXT DEFAULT 'Rubik',
    font_size_title INTEGER DEFAULT 52,
    font_size_item INTEGER DEFAULT 24,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create menu_items table
console.log('🍽️  Creating menu_items table...');
db.exec(`
  CREATE TABLE menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    image_url TEXT,
    is_visible INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    modifiers TEXT,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
  )
`);

// Create screens table
console.log('🖥️  Creating screens table...');
db.exec(`
  CREATE TABLE screens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    screen_name TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    menu_id INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    last_ping DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_id) REFERENCES menus(id)
  )
`);

// Insert default admin user
console.log('👨‍💼 Creating admin user...');
const hashedPassword = bcrypt.hashSync('admin123', 10);
const insertUser = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
insertUser.run('admin', hashedPassword, 'admin');

// Insert sample menus
console.log('📋 Creating sample menus...');
const insertMenu = db.prepare(`
  INSERT INTO menus (key_name, title, theme_color, bg_color, text_color, video_url, font_family, font_size_title, font_size_item)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const menu1 = insertMenu.run(
  'sabich',
  'תפריט סביח 🥙',
  '#FF6B35',
  '#FFF8F0',
  '#2C3E50',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'Rubik',
  52,
  24
);

const menu2 = insertMenu.run(
  'toast',
  'תפריט טוסט 🌭',
  '#E74C3C',
  '#FFFAEB',
  '#2C3E50',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'Rubik',
  52,
  24
);

// Insert menu items for Sabich
console.log('🥙 Creating Sabich menu items...');
const insertItem = db.prepare(`
  INSERT INTO menu_items (menu_id, name, description, price, image_url, is_visible, order_index)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertItem.run(menu1.lastInsertRowid, '🥙 סביח קלאסי', 'חציל מטוגן, ביצה קשה, טחינה, סלט ירקות טריים', 34.90, 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400', 1, 1);
insertItem.run(menu1.lastInsertRowid, '⭐ סביח מיוחד', 'חציל מטוגן, ביצה קשה, טחינה, חריף, חומוס', 38.90, 'https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?w=400', 1, 2);
insertItem.run(menu1.lastInsertRowid, '🔥 סביח XL', 'פיתה גדולה, חציל כפול, 2 ביצים, כל התוספות', 44.90, 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400', 1, 3);
insertItem.run(menu1.lastInsertRowid, '🌱 סביח טבעוני', 'חציל מטוגן, טחינה, סלט ירקות, חומוס', 32.90, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', 1, 4);

// Insert menu items for Toast
console.log('🌭 Creating Toast menu items...');
insertItem.run(menu2.lastInsertRowid, '🌭 טוסט נקניק קלאסי', 'נקניקיות פריכות, גבינה צהובה, קטשופ', 28.90, 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=400', 1, 1);
insertItem.run(menu2.lastInsertRowid, '⭐ טוסט נקניק מיוחד', 'נקניקיות, גבינה, עגבניה טרייה, מלפפון חמוץ', 32.90, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 1, 2);
insertItem.run(menu2.lastInsertRowid, '👨‍👩‍👧‍👦 טוסט משפחתי', 'טוסט גדול, נקניקיות כפול, 2 סוגי גבינה', 42.90, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', 1, 3);
insertItem.run(menu2.lastInsertRowid, '🔥 טוסט חריף', 'נקניקיות, גבינה, ג\'לפניו, רטב חריף מעולה', 34.90, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400', 1, 4);

// Insert demo screens
console.log('🖥️  Creating demo screens...');
const insertScreen = db.prepare(`
  INSERT INTO screens (screen_name, token, menu_id, is_active)
  VALUES (?, ?, ?, ?)
`);

insertScreen.run('Demo Screen Sabich', 'demo-screen-001', menu1.lastInsertRowid, 1);
insertScreen.run('Demo Screen Toast', 'demo-screen-002', menu2.lastInsertRowid, 1);

console.log('\n✅ Database setup completed!');
console.log('\n📊 Summary:');
console.log('   👤 Admin user: admin / admin123');
console.log('   📋 Menus: 2 (Sabich, Toast)');
console.log('   🍽️  Menu items: 8 total');
console.log('   🖥️  Screens: 2 demo screens');
console.log('\n💾 Database file: menu.db');
console.log('\n🚀 Ready to start server with: npm run dev-sqlite\n');

db.close();

