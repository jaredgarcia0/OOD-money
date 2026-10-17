const express = require('express');
const db = require('../db/connection');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

// GET /api/paychecks - list all paychecks for the logged-in user, newest first
router.get('/', (req, res) => {
  const paychecks = db.prepare(`
    SELECT id, pay_date, amount_cents, note
    FROM paychecks
    WHERE user_id = ?
    ORDER BY pay_date DESC
  `).all(req.session.userId);

  res.json(paychecks);
});

// POST /api/paychecks - add a new paycheck
router.post('/', (req, res) => {
  const { pay_date, amount_cents, note } = req.body;

  if (!pay_date || typeof pay_date !== 'string') {
    return res.status(400).json({ error: 'pay_date is required' });
  }
  if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
    return res.status(400).json({ error: 'amount_cents must be a positive whole number' });
  }

  const result = db.prepare(`
    INSERT INTO paychecks (user_id, pay_date, amount_cents, note)
    VALUES (?, ?, ?, ?)
  `).run(req.session.userId, pay_date, amount_cents, note || null);

  res.status(201).json({ id: result.lastInsertRowid, pay_date, amount_cents, note: note || null });
});

// PUT /api/paychecks/:id - edit a paycheck
router.put('/:id', (req, res) => {
  const { pay_date, amount_cents, note } = req.body;

  const existing = db.prepare('SELECT id FROM paychecks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Paycheck not found' });
  }

  if (!pay_date || typeof pay_date !== 'string') {
    return res.status(400).json({ error: 'pay_date is required' });
  }
  if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
    return res.status(400).json({ error: 'amount_cents must be a positive whole number' });
  }

  db.prepare(`
    UPDATE paychecks SET pay_date = ?, amount_cents = ?, note = ?
    WHERE id = ? AND user_id = ?
  `).run(pay_date, amount_cents, note || null, req.params.id, req.session.userId);

  res.json({ id: Number(req.params.id), pay_date, amount_cents, note: note || null });
});

// DELETE /api/paychecks/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM paychecks WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.session.userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Paycheck not found' });
  }

  res.json({ success: true });
});

module.exports = router;