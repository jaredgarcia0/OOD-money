const express = require('express');
const { prisma } = require('../db/prisma');
const requireAuth = require('../middleware/requireAuth');
const { parseId } = require('../utils/validate');

const router = express.Router();
router.use(requireAuth);

// The client expects `active` as 1 or 0
function toJson(e) {
  return { id: e.id, name: e.name, amount_cents: e.amount_cents, due_day: e.due_day, active: e.active ? 1 : 0 };
}

function validate(body) {
  const { name, amount_cents, due_day } = body;
  if (!name || typeof name !== 'string') {
    return 'name is required';
  }
  if (!Number.isInteger(amount_cents) || amount_cents < 0) {
    return 'amount_cents must be a non-negative whole number';
  }
  if (!Number.isInteger(due_day) || due_day < 1 || due_day > 31) {
    return 'due_day must be between 1 and 31';
  }
  return null;
}

// GET /api/fixed-expenses - list all fixed expenses for the household
router.get('/', async (req, res) => {
  const expenses = await prisma.fixedExpense.findMany({
    where: { household_id: req.session.householdId },
    orderBy: [{ due_day: 'asc' }, { id: 'asc' }],
  });

  res.json(expenses.map(toJson));
});

// POST /api/fixed-expenses - add a new fixed expense
router.post('/', async (req, res) => {
  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const { name, amount_cents, due_day } = req.body;

  const expense = await prisma.fixedExpense.create({
    data: { household_id: req.session.householdId, name, amount_cents, due_day, active: true },
  });

  res.status(201).json(toJson(expense));
});

// PUT /api/fixed-expenses/:id - edit or deactivate a fixed expense
router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const existing = id && await prisma.fixedExpense.findFirst({
    where: { id, household_id: req.session.householdId },
  });
  if (!existing) {
    return res.status(404).json({ error: 'Fixed expense not found' });
  }

  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const { name, amount_cents, due_day, active } = req.body;

  const expense = await prisma.fixedExpense.update({
    where: { id },
    data: { name, amount_cents, due_day, active: active !== 0 },
  });

  res.json(toJson(expense));
});

// DELETE /api/fixed-expenses/:id
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const result = id
    ? await prisma.fixedExpense.deleteMany({ where: { id, household_id: req.session.householdId } })
    : { count: 0 };

  if (result.count === 0) {
    return res.status(404).json({ error: 'Fixed expense not found' });
  }

  res.json({ success: true });
});

module.exports = router;
