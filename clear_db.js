const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

// excessive cleanup
db.prepare('DELETE FROM issues').run();
db.prepare('DELETE FROM magazines').run();

console.log('Database cleared.');
