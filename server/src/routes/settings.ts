const express = require('express');
const { prisma } = require('../db/prisma');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

// The savings goal is shared by everyone in the household.

// GET /api/settings - read the current savings goal
router.get('/', async (req, res) => {
  const household = await prisma.household.findUnique({
    where: { id: req.session.householdId },
    select: { savings_goal_cents: true },
  });

  res.json({ savings_goal_cents: household.savings_goal_cents });
});

// PUT /api/settings - update the savings goal
router.put('/', async (req, res) => {
  const { savings_goal_cents } = req.body;

  if (!Number.isInteger(savings_goal_cents) || savings_goal_cents < 0) {
    return res.status(400).json({ error: 'savings_goal_cents must be a non-negative whole number' });
  }

  await prisma.household.update({
    where: { id: req.session.householdId },
    data: { savings_goal_cents },
  });

  res.json({ savings_goal_cents });
});

module.exports = router;
