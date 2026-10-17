const express = require('express');
const db = require('../db/connection');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

// GET /api/fixed-expenses - list all fixed expenses for the logged-in user
router.get('/', (req, res) => {
  const expenses = db.prepare(`
    SELECT id, name, amount_cents, due_day, active
    FROM fixed_expenses
    WHERE user_id = ?
    ORDER BY due_day ASC
  `).all(req.session.userId);

  res.json(expenses);
});

// POST /api/fixed-expenses - add a new fixed expense
router.post('/', (req, res) => {
  const { name, amount_cents, due_day } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!Number.isInteger(amount_cents) || amount_cents < 0) {
    return res.status(400).json({ error: 'amount_cents must be a non-negative whole number' });
  }
  if (!Number.isInteger(due_day) || due_day < 1 || due_day > 31) {
    return res.status(400).json({ error: 'due_day must be between 1 and 31' });
  }

  const result = db.prepare(`
    INSERT INTO fixed_expenses (user_id, name, amount_cents, due_day, active)
    VALUES (?, ?, ?, ?, 1)
  `).run(req.session.userId, name, amount_cents, due_day);

  res.status(201).json({ id: result.lastInsertRowid, name, amount_cents, due_day, active: 1 });
});

// PUT /api/fixed-expenses/:id - edit or deactivate a fixed expense
router.put('/:id', (req, res) => {
  const { name, amount_cents, due_day, active } = req.body;

  const existing = db.prepare('SELECT id FROM fixed_expenses WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Fixed expense not found' });
  }

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!Number.isInteger(amount_cents) || amount_cents < 0) {
    return res.status(400).json({ error: 'amount_cents must be a non-negative whole number' });
  }
  if (!Number.isInteger(due_day) || due_day < 1 || due_day > 31) {
    return res.status(400).json({ error: 'due_day must be between 1 and 31' });
  }

  const activeValue = active === 0 ? 0 : 1;

  db.prepare(`
    UPDATE fixed_expenses SET name = ?, amount_cents = ?, due_day = ?, active = ?
    WHERE id = ? AND user_id = ?
  `).run(name, amount_cents, due_day, activeValue, req.params.id, req.session.userId);

  res.json({ id: Number(req.params.id), name, amount_cents, due_day, active: activeValue });
});

// DELETE /api/fixed-expenses/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM fixed_expenses WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.session.userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Fixed expense not found' });
  }

  res.json({ success: true });
});

module.exports = router;