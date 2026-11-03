const express = require('express');
const { prisma } = require('../db/prisma');
const requireAuth = require('../middleware/requireAuth');
const { parseId, isUniqueViolation } = require('../utils/validate');

const router = express.Router();
router.use(requireAuth);

const categoryFields = { id: true, name: true, percent: true };

function validate(body) {
  const { name, percent } = body;
  if (!name || typeof name !== 'string') {
    return 'name is required';
  }
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    return 'percent must be between 0 and 100';
  }
  return null;
}

// Sum of percents for the household's categories, optionally leaving one out (the one being edited)
async function totalPercent(householdId, excludeId = null) {
  const result = await prisma.category.aggregate({
    where: { household_id: householdId, ...(excludeId ? { id: { not: excludeId } } : {}) },
    _sum: { percent: true },
  });
  return result._sum.percent || 0;
}

// GET /api/categories - list all categories for the household
router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { household_id: req.session.householdId },
    select: categoryFields,
    orderBy: { name: 'asc' },
  });

  res.json(categories);
});

// POST /api/categories - add a new category
router.post('/', async (req, res) => {
  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const { name, percent } = req.body;
  const householdId = req.session.householdId;

  const total = await totalPercent(householdId);
  if (total + percent > 100) {
    return res.status(400).json({
      error: `Adding ${percent}% would put your categories over 100% (currently at ${total}%)`,
    });
  }

  try {
    const category = await prisma.category.create({
      data: { household_id: householdId, name, percent },
      select: categoryFields,
    });
    res.status(201).json(category);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: 'You already have a category with that name' });
    }
    throw err;
  }
});

// PUT /api/categories/:id - edit a category's name or percent
router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const householdId = req.session.householdId;

  const existing = id && await prisma.category.findFirst({ where: { id, household_id: householdId } });
  if (!existing) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const { name, percent } = req.body;

  const otherTotal = await totalPercent(householdId, id);
  if (otherTotal + percent > 100) {
    return res.status(400).json({
      error: `That change would put your categories over 100% (other categories total ${otherTotal}%)`,
    });
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name, percent },
      select: categoryFields,
    });
    res.json(category);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: 'You already have a category with that name' });
    }
    throw err;
  }
});

// DELETE /api/categories/:id - block delete if purchases exist
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const householdId = req.session.householdId;

  const existing = id && await prisma.category.findFirst({ where: { id, household_id: householdId } });
  if (!existing) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const purchaseCount = await prisma.purchase.count({ where: { category_id: id } });
  if (purchaseCount > 0) {
    return res.status(409).json({
      error: `Cannot delete: ${purchaseCount} purchase(s) are logged under this category`,
    });
  }

  await prisma.category.delete({ where: { id } });

  res.json({ success: true });
});

module.exports = router;
