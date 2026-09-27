// Returns the last valid day of a given year/month (handles Feb, 30 vs 31 day months)

// lastDayOfMonth — a trick using new Date(year, month, 0), which JavaScript treats as "day 0 of next month," which is actually the last day of this month. Handles February and 30 vs 31-day months automatically.
function lastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate(); // month is 1-indexed here on purpose
}

// Converts a due_day (1-31) into an actual date string for a given year/month,
// clamping to the month's real last day if due_day doesn't exist (e.g. 31 in April)
function dueDayToDate(year, month, dueDay) {
  const day = Math.min(dueDay, lastDayOfMonth(year, month));
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Given a paycheck's date and the next paycheck's date (if any),
// returns the pay period as { start, end } date strings (both inclusive)
function getPeriod(payDate, nextPayDate) {
  const start = payDate;
  let end;

  if (nextPayDate) {
    const nextDate = new Date(nextPayDate + 'T00:00:00');
    nextDate.setDate(nextDate.getDate() - 1);
    end = nextDate.toISOString().slice(0, 10);
  } else {
    const startDate = new Date(payDate + 'T00:00:00');
    startDate.setDate(startDate.getDate() + 13); // 14-day period, inclusive
    end = startDate.toISOString().slice(0, 10);
  }

  return { start, end };
}

// Given a list of active fixed expenses and a period, returns the ones due within it
// (checks each due_day against every month the period touches)
function expensesDueInPeriod(fixedExpenses, period) {
  const start = new Date(period.start + 'T00:00:00');
  const end = new Date(period.end + 'T00:00:00');
  const due = [];

  // Walk month by month from the period's start to its end
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endCursor = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endCursor) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1; // back to 1-indexed

    for (const expense of fixedExpenses) {
      if (!expense.active) continue;
      const dueDateStr = dueDayToDate(year, month, expense.due_day);
      const dueDate = new Date(dueDateStr + 'T00:00:00');
      if (dueDate >= start && dueDate <= end) {
        due.push({ ...expense, due_date: dueDateStr });
      }
    }

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return due;
}

// The main calculation: given everything about a user's finances for one period,
// returns the full budget breakdown
function calculateBudget({ paycheckAmountCents, fixedExpenses, savingsGoalCents, categories, purchasesByCategory }) {
  const fixedTotalCents = fixedExpenses.reduce((sum, e) => sum + e.amount_cents, 0);
  const spendableCents = paycheckAmountCents - fixedTotalCents - savingsGoalCents;

  const totalPercent = categories.reduce((sum, c) => sum + c.percent, 0);
  const safeSpendable = Math.max(spendableCents, 0);

  const categoryBudgets = categories.map((category) => {
    const budgetCents = Math.floor((safeSpendable * category.percent) / 100);
    const spentCents = (purchasesByCategory[category.id] || 0);
    return {
      id: category.id,
      name: category.name,
      percent: category.percent,
      budget_cents: budgetCents,
      spent_cents: spentCents,
      remaining_cents: budgetCents - spentCents,
    };
  });

  return {
    fixed_total_cents: fixedTotalCents,
    spendable_cents: spendableCents,
    is_overspent: spendableCents < 0,
    unallocated_percent: Math.max(100 - totalPercent, 0),
    categories: categoryBudgets,
  };
}

module.exports = { getPeriod, expensesDueInPeriod, calculateBudget, dueDayToDate, lastDayOfMonth };

/* 
What each function does
+ lastDayOfMonth — a trick using new Date(year, month, 0), which JavaScript treats as "day 0 of next month," which is actually the last day of this month. Handles February and 30 vs 31-day months automatically.
+ dueDayToDate — turns a stored due_day (like 31) into a real date for a specific month, clamping it down if that day doesn't exist (April 31 becomes April 30).
+ getPeriod — implements the plan's rule: starts on the paycheck date, ends the day before the next paycheck, or 14 days later if there's no next paycheck yet.
+ expensesDueInPeriod — walks through every month the period touches (usually just one, sometimes two if a period spans a month boundary) and checks each fixed expense's due date against it.
+ calculateBudget — the actual formula: spendable = paycheck − fixed expenses − savings goal, then splits spendable by percentage into each category, and subtracts what's already been spent.
*/