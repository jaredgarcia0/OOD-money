-- Fixed expenses due within a date range (using due_day, matched against a given month)
-- Example: expenses due between day 1 and day 15 of any month
SELECT name, amount_cents, due_day
FROM fixed_expenses
WHERE user_id = 1
  AND active = 1
  AND due_day BETWEEN 1 AND 15;

-- Purchase totals grouped by category, for a specific user
SELECT
  categories.name AS category_name,
  categories.percent,
  COALESCE(SUM(purchases.amount_cents), 0) AS total_spent_cents,
  COUNT(purchases.id) AS purchase_count
FROM categories
LEFT JOIN purchases ON purchases.category_id = categories.id
WHERE categories.user_id = 1
GROUP BY categories.id, categories.name, categories.percent
ORDER BY categories.name;