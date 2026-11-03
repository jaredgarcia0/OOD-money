const express = require('express');
const cors = require('cors');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { pool } = require('./db/prisma');
const authRoutes = require('./routes/auth');
const paycheckRoutes = require('./routes/paychecks');
const fixedExpenseRoutes = require('./routes/fixedExpenses');
const categoryRoutes = require('./routes/categories');
const settingsRoutes = require('./routes/settings');
const budgetRoutes = require('./routes/budget');
const purchaseRoutes = require('./routes/purchases');

const app = express();

// Allow the React app (running on a different port) to make requests here
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());

app.use(session({
  // Sessions are saved in the Postgres `session` table, so logins survive server restarts.
  // The table is created by the Prisma migration, not by connect-pg-simple.
  store: new PgSession({ pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // don't create a session until something is actually stored in it (like a logged-in user ID). Saves unnecessary empty sessions.
  cookie: {
    httpOnly: true, //this is a security setting meaning JavaScript running in the browser can't read the cookie (protects against certain attacks). Only the server can read it.
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

//Authentication user
app.use('/api/auth', authRoutes);
// Add paychecks, edit, delete them
app.use('/api/paychecks', paycheckRoutes);
// Fixed expenses 
app.use('/api/fixed-expenses', fixedExpenseRoutes);
// Categories 100% and cant go over that 
app.use('/api/categories', categoryRoutes);
// Settings is used to update the savings goal
app.use('/api/settings', settingsRoutes);
// budget 
app.use('/api/budget', budgetRoutes);
app.use('/api/purchases', purchaseRoutes);

// Health check route - confirms the server is alive and reachable
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Any unexpected error in a route ends up here. Send JSON so the client can show a message.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

module.exports = app;