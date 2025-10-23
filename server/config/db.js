const mysql = require('mysql2/promise');
require('dotenv').config();

// יצירת connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'menu_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// בדיקת חיבור
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error connecting to MySQL database:', err.message);
    console.error('Please make sure MySQL is running and credentials are correct');
  });

module.exports = pool;

