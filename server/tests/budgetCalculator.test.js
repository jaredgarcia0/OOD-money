const test = require('node:test');
const assert = require('node:assert');
const {
  getPeriod,
  expensesDueInPeriod,
  calculateBudget,
  dueDayToDate,
  lastDayOfMonth,
} = require('../src/services/budgetCalculator');

// --- getPeriod ---

test('getPeriod: uses the next paycheck date to find the end (day before it)', () => {
  const period = getPeriod('2026-09-26', '2026-10-10');
  assert.strictEqual(period.start, '2026-09-26');
  assert.strictEqual(period.end, '2026-10-09');
});

test('getPeriod: falls back to 14 days when there is no next paycheck', () => {
  const period = getPeriod('2026-09-26', null);
  assert.strictEqual(period.start, '2026-09-26');
  assert.strictEqual(period.end, '2026-10-09'); // 14 days inclusive
});

// --- lastDayOfMonth / dueDayToDate ---

test('lastDayOfMonth: handles a 30-day month (April)', () => {
  assert.strictEqual(lastDayOfMonth(2026, 4), 30);
});

test('lastDayOfMonth: handles February in a non-leap year', () => {
  assert.strictEqual(lastDayOfMonth(2026, 2), 28);
});

test('dueDayToDate: clamps due_day 31 to April 30 when the day does not exist', () => {
  assert.strictEqual(dueDayToDate(2026, 4, 31), '2026-04-30');
});

test('dueDayToDate: keeps a normal due_day as-is', () => {
  assert.strictEqual(dueDayToDate(2026, 10, 5), '2026-10-05');
});

// --- expensesDueInPeriod (matches the plan's worked example) ---

test('expensesDueInPeriod: matches the Sprint 1 plan worked example', () => {
  const period = { start: '2026-09-26', end: '2026-10-09' };
  const fixedExpenses = [
    { id: 1, name: 'Rent', amount_cents: 45000, due_day: 1, active: 1 },
    { id: 2, name: 'Phone', amount_cents: 4000, due_day: 5, active: 1 },
    { id: 3, name: 'Subscription', amount_cents: 1100, due_day: 15, active: 1 },
  ];

  const due = expensesDueInPeriod(fixedExpenses, period);

  assert.strictEqual(due.length, 2); // Rent and Phone are in range, Subscription (day 15) is not
  assert.ok(due.some((e) => e.name === 'Rent'));
  assert.ok(due.some((e) => e.name === 'Phone'));
  assert.ok(!due.some((e) => e.name === 'Subscription'));
});

test('expensesDueInPeriod: ignores inactive expenses', () => {
  const period = { start: '2026-09-26', end: '2026-10-09' };
  const fixedExpenses = [
    { id: 1, name: 'Old gym membership', amount_cents: 3000, due_day: 1, active: 0 },
  ];

  const due = expensesDueInPeriod(fixedExpenses, period);
  assert.strictEqual(due.length, 0);
});

// --- calculateBudget (the full worked example from the plan) ---

test('calculateBudget: matches the Sprint 1 plan worked example exactly', () => {
  const result = calculateBudget({
    paycheckAmountCents: 90000, // $900.00
    fixedExpenses: [
      { amount_cents: 45000 }, // Rent
      { amount_cents: 4000 },  // Phone
    ],
    savingsGoalCents: 10000, // $100.00
    categories: [
      { id: 1, name: 'Groceries', percent: 50 },
      { id: 2, name: 'Gas', percent: 20 },
      { id: 3, name: 'Fun', percent: 20 },
      { id: 4, name: 'Buffer', percent: 10 },
    ],
    purchasesByCategory: { 1: 6840 }, // $68.40 spent on Groceries
  });

  assert.strictEqual(result.fixed_total_cents, 49000);
  assert.strictEqual(result.spendable_cents, 31000); // $310.00
  assert.strictEqual(result.is_overspent, false);
  assert.strictEqual(result.unallocated_percent, 0);

  const groceries = result.categories.find((c) => c.name === 'Groceries');
  assert.strictEqual(groceries.budget_cents, 15500); // $155.00
  assert.strictEqual(groceries.spent_cents, 6840);
  assert.strictEqual(groceries.remaining_cents, 8660); // $86.60 — matches the plan exactly
});

test('calculateBudget: negative spendable is flagged and categories get 0 budget', () => {
  const result = calculateBudget({
    paycheckAmountCents: 20000, // $200.00
    fixedExpenses: [{ amount_cents: 25000 }], // $250.00 — more than the paycheck
    savingsGoalCents: 0,
    categories: [{ id: 1, name: 'Groceries', percent: 100 }],
    purchasesByCategory: {},
  });

  assert.strictEqual(result.spendable_cents, -5000);
  assert.strictEqual(result.is_overspent, true);
  assert.strictEqual(result.categories[0].budget_cents, 0);
});

test('calculateBudget: percents totaling under 100 show the unallocated share', () => {
  const result = calculateBudget({
    paycheckAmountCents: 100000,
    fixedExpenses: [],
    savingsGoalCents: 0,
    categories: [{ id: 1, name: 'Groceries', percent: 60 }],
    purchasesByCategory: {},
  });

  assert.strictEqual(result.unallocated_percent, 40);
});

test('calculateBudget: a category with no purchases shows 0 spent, not an error', () => {
  const result = calculateBudget({
    paycheckAmountCents: 100000,
    fixedExpenses: [],
    savingsGoalCents: 0,
    categories: [{ id: 1, name: 'Fun', percent: 100 }],
    purchasesByCategory: {},
  });

  assert.strictEqual(result.categories[0].spent_cents, 0);
});