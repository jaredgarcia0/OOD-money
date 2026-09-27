const express = require('express');
const db = require('../db/connection');
const requireAuth = require('../middleware/requireAuth');
const { getPeriod, expensesDueInPeriod, calculateBudget } = require('../services/budgetCalculator');

const router = express.Router();
router.use(requireAuth);

// GET /api/budget?paycheckId= - defaults to the latest paycheck if not given
router.get('/', (req, res) => {
  const userId = req.session.userId;

  // 1. Find the paycheck this budget is for
  let paycheck;
  if (req.query.paycheckId) {
    paycheck = db.prepare('SELECT * FROM paychecks WHERE id = ? AND user_id = ?')
      .get(req.query.paycheckId, userId);
    if (!paycheck) {
      return res.status(404).json({ error: 'Paycheck not found' });
    }
  } else {
    paycheck = db.prepare(`
      SELECT * FROM paychecks WHERE user_id = ? ORDER BY pay_date DESC LIMIT 1
    `).get(userId);
  }

  if (!paycheck) {
    return res.status(200).json({ has_paycheck: false });
  }

  // 2. Find the next paycheck after this one, to know when the period ends
  const nextPaycheck = db.prepare(`
    SELECT pay_date FROM paychecks
    WHERE user_id = ? AND pay_date > ?
    ORDER BY pay_date ASC LIMIT 1
  `).get(userId, paycheck.pay_date);

  const period = getPeriod(paycheck.pay_date, nextPaycheck ? nextPaycheck.pay_date : null);

  // 3. Get active fixed expenses, then figure out which are due in this period
  const allExpenses = db.prepare(`
    SELECT * FROM fixed_expenses WHERE user_id = ? AND active = 1
  `).all(userId);
  const dueExpenses = expensesDueInPeriod(allExpenses, period);

  // 4. Get the user's savings goal
  const user = db.prepare('SELECT savings_goal_cents FROM users WHERE id = ?').get(userId);

  // 5. Get categories
  const categories = db.prepare('SELECT * FROM categories WHERE user_id = ?').all(userId);

  // 6. Get purchases within this period, grouped by category
  const purchaseRows = db.prepare(`
    SELECT category_id, SUM(amount_cents) AS total
    FROM purchases
    WHERE user_id = ? AND purchase_date BETWEEN ? AND ?
    GROUP BY category_id
  `).all(userId, period.start, period.end);

  const purchasesByCategory = {};
  for (const row of purchaseRows) {
    purchasesByCategory[row.category_id] = row.total;
  }

  // 7. Run the actual calculation
  const result = calculateBudget({
    paycheckAmountCents: paycheck.amount_cents,
    fixedExpenses: dueExpenses,
    savingsGoalCents: user.savings_goal_cents,
    categories,
    purchasesByCategory,
  });

  res.json({
    has_paycheck: true,
    paycheck: { id: paycheck.id, pay_date: paycheck.pay_date, amount_cents: paycheck.amount_cents },
    period,
    fixed_expenses_due: dueExpenses,
    ...result,
  });
});

module.exports = router;