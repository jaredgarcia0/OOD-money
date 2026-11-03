const express = require('express');
const { prisma } = require('../db/prisma');
const requireAuth = require('../middleware/requireAuth');
const { parseId } = require('../utils/validate');
const { isValidDate, toDbDate, fromDbDate } = require('../utils/dates');

const router = express.Router();
router.use(requireAuth);

function toJson(p) {
  return {
    id: p.id,
    category_id: p.category_id,
    purchase_date: fromDbDate(p.purchase_date),
    amount_cents: p.amount_cents,
    description: p.description,
  };
}

function validate(body) {
  const { category_id, purchase_date, amount_cents } = body;
  if (!Number.isInteger(category_id)) {
    return 'category_id is required';
  }
  if (!isValidDate(purchase_date)) {
    return 'purchase_date is required (YYYY-MM-DD)';
  }
  if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
    return 'amount_cents must be a positive whole number';
  }
  return null;
}

// Confirm the category belongs to this household before a purchase can use it
async function categoryBelongsToHousehold(categoryId, householdId) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, household_id: householdId } });
  return Boolean(category);
}

// GET /api/purchases?from=&to= - list purchases, optionally filtered by date range
router.get('/', async (req, res) => {
  const { from, to } = req.query;

  const where: any = { household_id: req.session.householdId };
  if (from && to) {
    if (!isValidDate(from) || !isValidDate(to)) {
      return res.status(400).json({ error: 'from and to must be dates (YYYY-MM-DD)' });
    }
    where.purchase_date = { gte: toDbDate(from), lte: toDbDate(to) };
  }

  const purchases = await prisma.purchase.findMany({
    where,
    orderBy: [{ purchase_date: 'desc' }, { id: 'desc' }],
  });

  res.json(purchases.map(toJson));
});

// POST /api/purchases - log a new purchase
router.post('/', async (req, res) => {
  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const { category_id, purchase_date, amount_cents, description } = req.body;
  const householdId = req.session.householdId;

  if (!(await categoryBelongsToHousehold(category_id, householdId))) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const purchase = await prisma.purchase.create({
    data: {
      household_id: householdId,
      category_id,
      purchase_date: toDbDate(purchase_date),
      amount_cents,
      description: description || null,
    },
  });

  res.status(201).json(toJson(purchase));
});

// PUT /api/purchases/:id - edit a purchase
router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const householdId = req.session.householdId;

  const existing = id && await prisma.purchase.findFirst({ where: { id, household_id: householdId } });
  if (!existing) {
    return res.status(404).json({ error: 'Purchase not found' });
  }

  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const { category_id, purchase_date, amount_cents, description } = req.body;

  if (!(await categoryBelongsToHousehold(category_id, householdId))) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const purchase = await prisma.purchase.update({
    where: { id },
    data: {
      category_id,
      purchase_date: toDbDate(purchase_date),
      amount_cents,
      description: description || null,
    },
  });

  res.json(toJson(purchase));
});

// DELETE /api/purchases/:id
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const result = id
    ? await prisma.purchase.deleteMany({ where: { id, household_id: req.session.householdId } })
    : { count: 0 };

  if (result.count === 0) {
    return res.status(404).json({ error: 'Purchase not found' });
  }

  res.json({ success: true });
});

module.exports = router;
