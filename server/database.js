const Database = require('better-sqlite3');
const path = require('path');

// יצירת חיבור ל-SQLite
const db = new Database(path.join(__dirname, 'menu.db'), { 
  verbose: console.log 
});

// הפעלת Foreign Keys
db.pragma('foreign_keys = ON');

module.exports = db;

