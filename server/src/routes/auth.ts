const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../db/prisma');
const { isValidEmail, isValidPassword, isUniqueViolation } = require('../utils/validate');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Every new household starts with these categories
const DEFAULT_CATEGORIES = [
  { name: 'Groceries', percent: 50 },
  { name: 'Gas', percent: 20 },
  { name: 'Fun', percent: 20 },
  { name: 'Buffer', percent: 10 },
];

// POST /api/auth/register
router.post('/register', async (req, res) => { //request information sent by the browser and response that your server sends back
  const { email, password } = req.body;

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' }); //400 means the request was invalid.
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' }); // Status 409 means there is a conflict. In this case, the email is already being used.
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Create the user, their own household (with them as owner), and default categories.
  // $transaction means either all of it is saved or none of it is.
  let user;
  let household;
  try {
    ({ user, household } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, password_hash: passwordHash } });
      const household = await tx.household.create({
        data: {
          name: 'My household',
          members: { create: { user_id: user.id, role: 'owner' } },
          categories: { create: DEFAULT_CATEGORIES },
        },
      });
      return { user, household };
    }));
  } catch (err) {
    // Two sign-ups with the same email at the same moment
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    throw err;
  }

  req.session.userId = user.id;
  req.session.householdId = household.id;
  res.status(201).json({ id: user.id, email });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = typeof email === 'string'
    ? await prisma.user.findUnique({
      where: { email },
      include: { memberships: { orderBy: { created_at: 'asc' }, take: 1 } },
    })
    : null;

  // Same generic error whether the email or password is wrong —
  // don't reveal which one was incorrect
  // bcrypt.compare() compares the plain password typed by the user against the stored hash.
  if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' }); // Status 401 means the user is not authorized.
  }

  // Users belong to one household for now; use the first one they joined
  const membership = user.memberships[0];
  if (!membership) {
    return res.status(403).json({ error: 'This account is not part of a household' });
  }

  req.session.userId = user.id;
  req.session.householdId = membership.household_id;
  res.json({ id: user.id, email: user.email });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { id: true, email: true },
  });
  if (!user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(user);
});

module.exports = router;
