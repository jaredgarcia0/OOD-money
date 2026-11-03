const express = require('express');
const { prisma } = require('../db/prisma');
const requireAuth = require('../middleware/requireAuth');
const { parseId } = require('../utils/validate');
const { toDbDate, fromDbDate } = require('../utils/dates');
const { getPeriod, expensesDueInPeriod, calculateBudget } = require('../services/budgetCalculator');

const router = express.Router();
router.use(requireAuth);

// GET /api/budget?paycheckId= - defaults to the latest paycheck if not given
router.get('/', async (req, res) => {
  const householdId = req.session.householdId;

  // 1. Find the paycheck this budget is for
  let paycheck;
  if (req.query.paycheckId) {
    const paycheckId = parseId(req.query.paycheckId);
    paycheck = paycheckId && await prisma.paycheck.findFirst({
      where: { id: paycheckId, household_id: householdId },
    });
    if (!paycheck) {
      return res.status(404).json({ error: 'Paycheck not found' });
    }
  } else {
    paycheck = await prisma.paycheck.findFirst({
      where: { household_id: householdId },
      orderBy: [{ pay_date: 'desc' }, { id: 'desc' }],
    });
  }

  if (!paycheck) {
    return res.status(200).json({ has_paycheck: false });
  }

  const payDate = fromDbDate(paycheck.pay_date);

  // 2. Find the next paycheck after this one, to know when the period ends
  const nextPaycheck = await prisma.paycheck.findFirst({
    where: { household_id: householdId, pay_date: { gt: paycheck.pay_date } },
    orderBy: { pay_date: 'asc' },
    select: { pay_date: true },
  });

  const period = getPeriod(payDate, nextPaycheck ? fromDbDate(nextPaycheck.pay_date) : null);

  // 3-6. Load everything else the calculation needs, in parallel
  const [allExpenses, household, categories, purchaseRows] = await Promise.all([
    // Active fixed expenses (the calculator picks the ones due in this period)
    prisma.fixedExpense.findMany({ where: { household_id: householdId, active: true } }),
    // The household's savings goal
    prisma.household.findUnique({ where: { id: householdId }, select: { savings_goal_cents: true } }),
    prisma.category.findMany({ where: { household_id: householdId } }),
    // Purchases within this period, totaled by category
    prisma.purchase.groupBy({
      by: ['category_id'],
      where: {
        household_id: householdId,
        purchase_date: { gte: toDbDate(period.start), lte: toDbDate(period.end) },
      },
      _sum: { amount_cents: true },
    }),
  ]);

  const dueExpenses = expensesDueInPeriod(
    allExpenses.map((e) => ({ ...e, active: e.active ? 1 : 0 })),
    period,
  );

  const purchasesByCategory = {};
  for (const row of purchaseRows) {
    purchasesByCategory[row.category_id] = row._sum.amount_cents || 0;
  }

  // 7. Run the actual calculation
  const result = calculateBudget({
    paycheckAmountCents: paycheck.amount_cents,
    fixedExpenses: dueExpenses,
    savingsGoalCents: household.savings_goal_cents,
    categories,
    purchasesByCategory,
  });

  res.json({
    has_paycheck: true,
    paycheck: { id: paycheck.id, pay_date: payDate, amount_cents: paycheck.amount_cents },
    period,
    fixed_expenses_due: dueExpenses,
    ...result,
  });
});

module.exports = router;
