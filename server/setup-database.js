const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    // חיבור ראשוני ללא DB ספציפי
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connected to MySQL server');

    // יצירת מסד נתונים
    const dbName = process.env.DB_NAME || 'menu_system';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' created or already exists`);

    await connection.query(`USE ${dbName}`);

    // קריאת קובץ SQL
    const sqlFile = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
    
    // פיצול לשאילתות נפרדות
    const queries = sqlFile
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    // הרצת כל שאילתה
    for (const query of queries) {
      if (query.toLowerCase().includes('create table')) {
        await connection.query(query);
        const tableName = query.match(/create table if not exists (\w+)/i)?.[1];
        console.log(`✅ Table '${tableName}' created`);
      } else if (query.toLowerCase().includes('insert into users')) {
        // הצפנת סיסמת admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.query(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password=password',
          ['admin', hashedPassword, 'admin']
        );
        console.log('✅ Admin user created (username: admin, password: admin123)');
      } else if (query.toLowerCase().includes('insert into')) {
        try {
          await connection.query(query);
        } catch (err) {
          if (err.code !== 'ER_DUP_ENTRY') {
            console.log('⚠️  Insert query skipped or failed:', err.message);
          }
        }
      }
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Login with username: admin, password: admin123');
    console.log('3. Change the admin password immediately!\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();

