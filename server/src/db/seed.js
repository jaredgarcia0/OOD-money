require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./connection');

// Wipe existing data first, so you can re-run this script safely
db.exec(`
  DELETE FROM purchases;
  DELETE FROM categories;
  DELETE FROM fixed_expenses;
  DELETE FROM paychecks;
  DELETE FROM users;
`);

// --- Demo user ---
const passwordHash = bcrypt.hashSync('password123', 10);

const insertUser = db.prepare(`
  INSERT INTO users (email, password_hash, savings_goal_cents)
  VALUES (?, ?, ?)
`);
const userResult = insertUser.run('demo@example.com', passwordHash, 10000); // $100.00 savings goal
const userId = userResult.lastInsertRowid;

// --- Paychecks ---
const insertPaycheck = db.prepare(`
  INSERT INTO paychecks (user_id, pay_date, amount_cents, note)
  VALUES (?, ?, ?, ?)
`);
insertPaycheck.run(userId, '2026-09-12', 90000, 'Biweekly paycheck'); // $900.00
insertPaycheck.run(userId, '2026-09-26', 90000, 'Biweekly paycheck'); // $900.00

// --- Fixed expenses ---
const insertExpense = db.prepare(`
  INSERT INTO fixed_expenses (user_id, name, amount_cents, due_day, active)
  VALUES (?, ?, ?, ?, 1)
`);
insertExpense.run(userId, 'Rent', 45000, 1);       // $450.00, due the 1st
insertExpense.run(userId, 'Phone', 4000, 5);       // $40.00, due the 5th
insertExpense.run(userId, 'Subscription', 1100, 15); // $11.00, due the 15th

// --- Categories (percentages should total 100 or less) ---
const insertCategory = db.prepare(`
  INSERT INTO categories (user_id, name, percent)
  VALUES (?, ?, ?)
`);
insertCategory.run(userId, 'Groceries', 50);
insertCategory.run(userId, 'Gas', 20);
insertCategory.run(userId, 'Fun', 20);
insertCategory.run(userId, 'Buffer', 10);

console.log('Seed data inserted successfully.');
console.log(`Demo login -> email: demo@example.com | password: password123`);

