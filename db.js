const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbFile = path.join(__dirname, 'db', 'events.db');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Unable to open database:', err.message);
    process.exit(1);
  }
});

module.exports = db;
