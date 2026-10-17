const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/connection');
const { isValidEmail, isValidPassword } = require('../utils/validate');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => { //request information sent by the browser and response that your server sends back
  const { email, password } = req.body;

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' }); //400 means the request was invalid.
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' }); // Status 409 means there is a conflict. In this case, the email is already being used.
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, savings_goal_cents)
    VALUES (?, ?, 0)
  `);
  const result = insertUser.run(email, passwordHash);
  const userId = result.lastInsertRowid;

  // Give every new user a default set of categories to start with
  const insertCategory = db.prepare(`
    INSERT INTO categories (user_id, name, percent) VALUES (?, ?, ?)
  `);
  insertCategory.run(userId, 'Groceries', 50);
  insertCategory.run(userId, 'Gas', 20);
  insertCategory.run(userId, 'Fun', 20);
  insertCategory.run(userId, 'Buffer', 10);

  req.session.userId = userId;
  res.status(201).json({ id: userId, email });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  // Same generic error whether the email or password is wrong —
  // don't reveal which one was incorrect
  // bcrypt.compareSync() compares the plain password typed by the user against the stored hash.
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' }); // Status 401 means the user is not authorized.
  }

  req.session.userId = user.id;
  res.json({ id: user.id, email: user.email });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.session.userId);
  res.json(user);
});

module.exports = router;