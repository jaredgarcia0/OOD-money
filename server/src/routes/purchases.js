const express = require('express');
const db = require('../db/connection');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

// GET /api/purchases?from=&to= - list purchases, optionally filtered by date range
router.get('/', (req, res) => {
  const { from, to } = req.query;
  const userId = req.session.userId;

  let purchases;
  if (from && to) {
    purchases = db.prepare(`
      SELECT id, category_id, purchase_date, amount_cents, description
      FROM purchases
      WHERE user_id = ? AND purchase_date BETWEEN ? AND ?
      ORDER BY purchase_date DESC
    `).all(userId, from, to);
  } else {
    purchases = db.prepare(`
      SELECT id, category_id, purchase_date, amount_cents, description
      FROM purchases
      WHERE user_id = ?
      ORDER BY purchase_date DESC
    `).all(userId);
  }

  res.json(purchases);
});

// POST /api/purchases - log a new purchase
router.post('/', (req, res) => {
  const { category_id, purchase_date, amount_cents, description } = req.body;
  const userId = req.session.userId;

  if (!Number.isInteger(category_id)) {
    return res.status(400).json({ error: 'category_id is required' });
  }
  if (!purchase_date || typeof purchase_date !== 'string') {
    return res.status(400).json({ error: 'purchase_date is required' });
  }
  if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
    return res.status(400).json({ error: 'amount_cents must be a positive whole number' });
  }

  // Confirm the category actually belongs to this user before allowing the purchase
  const category = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
    .get(category_id, userId);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const result = db.prepare(`
    INSERT INTO purchases (user_id, category_id, purchase_date, amount_cents, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, category_id, purchase_date, amount_cents, description || null);

  res.status(201).json({
    id: result.lastInsertRowid,
    category_id,
    purchase_date,
    amount_cents,
    description: description || null,
  });
});

// PUT /api/purchases/:id - edit a purchase
router.put('/:id', (req, res) => {
  const { category_id, purchase_date, amount_cents, description } = req.body;
  const userId = req.session.userId;

  const existing = db.prepare('SELECT id FROM purchases WHERE id = ? AND user_id = ?')
    .get(req.params.id, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Purchase not found' });
  }

  if (!Number.isInteger(category_id)) {
    return res.status(400).json({ error: 'category_id is required' });
  }
  if (!purchase_date || typeof purchase_date !== 'string') {
    return res.status(400).json({ error: 'purchase_date is required' });
  }
  if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
    return res.status(400).json({ error: 'amount_cents must be a positive whole number' });
  }

  const category = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
    .get(category_id, userId);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  db.prepare(`
    UPDATE purchases SET category_id = ?, purchase_date = ?, amount_cents = ?, description = ?
    WHERE id = ? AND user_id = ?
  `).run(category_id, purchase_date, amount_cents, description || null, req.params.id, userId);

  res.json({ id: Number(req.params.id), category_id, purchase_date, amount_cents, description: description || null });
});

// DELETE /api/purchases/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM purchases WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.session.userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Purchase not found' });
  }

  res.json({ success: true });
});

module.exports = router;