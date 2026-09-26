CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  savings_goal_cents INTEGER NOT NULL DEFAULT 0 CHECK (savings_goal_cents >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Money is stored as amount_cents (whole numbers, no decimals) to avoid rounding bugs.
CREATE TABLE IF NOT EXISTS paychecks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  --REFERENCES users(id) ON DELETE CASCADE means if a user is ever deleted, their paychecks/expenses/etc. get deleted automatically instead of becoming orphaned data.
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
  pay_date TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0), 
  note TEXT
);

CREATE TABLE IF NOT EXISTS fixed_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  percent INTEGER NOT NULL CHECK (percent BETWEEN 0 AND 100),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  purchase_date TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_paychecks_user_date ON paychecks(user_id, pay_date);
CREATE INDEX IF NOT EXISTS idx_purchases_user_date ON purchases(user_id, purchase_date);