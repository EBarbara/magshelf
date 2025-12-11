const Database = require('better-sqlite3');
const db = new Database('sqlite.db');
const mags = db.prepare('SELECT * FROM magazines').all();
const issues = db.prepare('SELECT * FROM issues').all();
console.log('Magazines:', JSON.stringify(mags, null, 2));
console.log('Issues:', JSON.stringify(issues, null, 2));
