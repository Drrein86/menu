-- מסד נתונים למערכת תצוגת תפריט
-- יצירת מסד נתונים
CREATE DATABASE IF NOT EXISTS menu_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE menu_system;

-- טבלת משתמשים
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor', 'viewer') DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- טבלת תפריטים
CREATE TABLE IF NOT EXISTS menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  theme_color VARCHAR(7) DEFAULT '#FF6B35',
  bg_color VARCHAR(7) DEFAULT '#FFFFFF',
  text_color VARCHAR(7) DEFAULT '#000000',
  video_url VARCHAR(1024),
  video_settings JSON,
  layout JSON,
  font_family VARCHAR(100) DEFAULT 'Heebo',
  font_size_title INT DEFAULT 48,
  font_size_item INT DEFAULT 24,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key_name (key_name)
);

-- טבלת פריטי תפריט
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(8,2),
  image_url VARCHAR(1024),
  is_visible BOOLEAN DEFAULT TRUE,
  order_index INT DEFAULT 0,
  modifiers JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  INDEX idx_menu_id (menu_id),
  INDEX idx_order (menu_id, order_index)
);

-- טבלת מסכים (טלוויזיות)
CREATE TABLE IF NOT EXISTS screens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  menu_id INT,
  kiosk_mode BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMP NULL,
  status ENUM('online', 'offline') DEFAULT 'offline',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL,
  INDEX idx_token (token)
);

-- טבלת לוג שינויים
CREATE TABLE IF NOT EXISTS change_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  entity_type ENUM('menu', 'item', 'screen', 'user') NOT NULL,
  entity_id INT NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_created (created_at),
  INDEX idx_entity (entity_type, entity_id)
);

-- הכנסת נתונים התחלתיים
-- משתמש admin ברירת מחדל (סיסמה: admin123)
INSERT INTO users (username, password, role) VALUES 
('admin', '$2a$10$YourHashedPasswordHere', 'admin');

-- תפריטים ראשוניים
INSERT INTO menus (key_name, title, theme_color, bg_color, text_color) VALUES 
('sabich', 'סביח', '#FF6B35', '#FFF8F0', '#2C3E50'),
('toast', 'טוסט נקניק', '#E74C3C', '#FFFAEB', '#2C3E50');

-- פריטי דוגמה לסביח
INSERT INTO menu_items (menu_id, name, description, price, order_index) VALUES 
(1, 'סביח קלאסי', 'חציל מטוגן, ביצה קשה, טחינה, סלט ירקות', 34.90, 1),
(1, 'סביח מיוחד', 'חציל מטוגן, ביצה קשה, טחינה, חריף, חומוס', 38.90, 2),
(1, 'סביח XL', 'פיתה גדולה, חציל כפול, 2 ביצים, כל התוספות', 44.90, 3);

-- פריטי דוגמה לטוסט
INSERT INTO menu_items (menu_id, name, description, price, order_index) VALUES 
(2, 'טוסט נקניק בסיסי', 'נקניקיות, גבינה צהובה, קטשופ', 28.90, 1),
(2, 'טוסט נקניק מיוחד', 'נקניקיות, גבינה, עגבניה, מלפפון חמוץ', 32.90, 2),
(2, 'טוסט נקניק משפחתי', 'טוסט גדול, נקניקיות כפול, 2 סוגי גבינה', 42.90, 3);

