const express = require('express');
const db = require('../db/connection');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

// GET /api/settings - read the current savings goal
router.get('/', (req, res) => {
  const user = db.prepare('SELECT savings_goal_cents FROM users WHERE id = ?')
    .get(req.session.userId);

  res.json({ savings_goal_cents: user.savings_goal_cents });
});

// PUT /api/settings - update the savings goal
router.put('/', (req, res) => {
  const { savings_goal_cents } = req.body;

  if (!Number.isInteger(savings_goal_cents) || savings_goal_cents < 0) {
    return res.status(400).json({ error: 'savings_goal_cents must be a non-negative whole number' });
  }

  db.prepare('UPDATE users SET savings_goal_cents = ? WHERE id = ?')
    .run(savings_goal_cents, req.session.userId);

  res.json({ savings_goal_cents });
});

module.exports = router;