const express = require('express');
const db = require('../db/connection');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

// GET /api/categories - list all categories for the logged-in user
router.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT id, name, percent
    FROM categories
    WHERE user_id = ?
    ORDER BY name ASC
  `).all(req.session.userId);

  res.json(categories);
});

// POST /api/categories - add a new category
router.post('/', (req, res) => {
  const { name, percent } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    return res.status(400).json({ error: 'percent must be between 0 and 100' });
  }

  const totalRow = db.prepare(`
    SELECT COALESCE(SUM(percent), 0) AS total FROM categories WHERE user_id = ?
  `).get(req.session.userId);

  if (totalRow.total + percent > 100) {
    return res.status(400).json({
      error: `Adding ${percent}% would put your categories over 100% (currently at ${totalRow.total}%)`,
    });
  }

  try {
    const result = db.prepare(`
      INSERT INTO categories (user_id, name, percent) VALUES (?, ?, ?)
    `).run(req.session.userId, name, percent);

    res.status(201).json({ id: result.lastInsertRowid, name, percent });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'You already have a category with that name' });
    }
    throw err;
  }
});

// PUT /api/categories/:id - edit a category's name or percent
router.put('/:id', (req, res) => {
  const { name, percent } = req.body;

  const existing = db.prepare('SELECT id, percent FROM categories WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Category not found' });
  }

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    return res.status(400).json({ error: 'percent must be between 0 and 100' });
  }

  const totalRow = db.prepare(`
    SELECT COALESCE(SUM(percent), 0) AS total FROM categories
    WHERE user_id = ? AND id != ?
  `).get(req.session.userId, req.params.id);

  if (totalRow.total + percent > 100) {
    return res.status(400).json({
      error: `That change would put your categories over 100% (other categories total ${totalRow.total}%)`,
    });
  }

  db.prepare(`
    UPDATE categories SET name = ?, percent = ? WHERE id = ? AND user_id = ?
  `).run(name, percent, req.params.id, req.session.userId);

  res.json({ id: Number(req.params.id), name, percent });
});

// DELETE /api/categories/:id - block delete if purchases exist
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const purchaseCount = db.prepare('SELECT COUNT(*) AS count FROM purchases WHERE category_id = ?')
    .get(req.params.id);

  if (purchaseCount.count > 0) {
    return res.status(409).json({
      error: `Cannot delete: ${purchaseCount.count} purchase(s) are logged under this category`,
    });
  }

  db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.session.userId);

  res.json({ success: true });
});

module.exports = router;