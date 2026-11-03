const express = require('express');
const { prisma } = require('../db/prisma');
const requireAuth = require('../middleware/requireAuth');
const { parseId } = require('../utils/validate');
const { isValidDate, toDbDate, fromDbDate } = require('../utils/dates');

const router = express.Router();
router.use(requireAuth);

// The shape the client expects for a paycheck
function toJson(p) {
  return { id: p.id, pay_date: fromDbDate(p.pay_date), amount_cents: p.amount_cents, note: p.note };
}

function validate(body) {
  const { pay_date, amount_cents } = body;
  if (!isValidDate(pay_date)) {
    return 'pay_date is required (YYYY-MM-DD)';
  }
  if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
    return 'amount_cents must be a positive whole number';
  }
  return null;
}

// GET /api/paychecks - list all paychecks for the household, newest first
router.get('/', async (req, res) => {
  const paychecks = await prisma.paycheck.findMany({
    where: { household_id: req.session.householdId },
    orderBy: { pay_date: 'desc' },
  });

  res.json(paychecks.map(toJson));
});

// POST /api/paychecks - add a new paycheck
router.post('/', async (req, res) => {
  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const { pay_date, amount_cents, note } = req.body;

  const paycheck = await prisma.paycheck.create({
    data: {
      household_id: req.session.householdId,
      pay_date: toDbDate(pay_date),
      amount_cents,
      note: note || null,
    },
  });

  res.status(201).json(toJson(paycheck));
});

// PUT /api/paychecks/:id - edit a paycheck
router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const existing = id && await prisma.paycheck.findFirst({
    where: { id, household_id: req.session.householdId },
  });
  if (!existing) {
    return res.status(404).json({ error: 'Paycheck not found' });
  }

  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const { pay_date, amount_cents, note } = req.body;

  const paycheck = await prisma.paycheck.update({
    where: { id },
    data: { pay_date: toDbDate(pay_date), amount_cents, note: note || null },
  });

  res.json(toJson(paycheck));
});

// DELETE /api/paychecks/:id
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const result = id
    ? await prisma.paycheck.deleteMany({ where: { id, household_id: req.session.householdId } })
    : { count: 0 };

  if (result.count === 0) {
    return res.status(404).json({ error: 'Paycheck not found' });
  }

  res.json({ success: true });
});

module.exports = router;
