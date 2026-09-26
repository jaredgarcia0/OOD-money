const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || './data/budget.db';

// Make sure the data/ folder exists before SQLite tries to create the file
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// SQLite leaves foreign key enforcement OFF by default — turn it on
db.pragma('foreign_keys = ON');

// Load and run schema.sql so all tables exist on startup
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

module.exports = db;