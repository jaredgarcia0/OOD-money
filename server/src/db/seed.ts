// Wipes ALL data and loads a demo household. Run with `npm run seed`.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { prisma, pool } = require('./prisma');

async function main() {
  // Wipe existing data first, so you can re-run this script safely.
  // Deleting users and households cascades to everything that belongs to them.
  await prisma.$transaction([
    prisma.purchase.deleteMany(),
    prisma.household.deleteMany(),
    prisma.user.deleteMany(),
    prisma.session.deleteMany(),
  ]);

  // --- Demo user, owner of the demo household ---
  const user = await prisma.user.create({
    data: { email: 'demo@example.com', password_hash: await bcrypt.hash('password123', 10) },
  });

  await prisma.household.create({
    data: {
      name: 'Demo household',
      savings_goal_cents: 10000, // $100.00 savings goal
      members: { create: { user_id: user.id, role: 'owner' } },
      paychecks: {
        create: [
          { pay_date: new Date('2026-09-12'), amount_cents: 90000, note: 'Biweekly paycheck' }, // $900.00
          { pay_date: new Date('2026-09-26'), amount_cents: 90000, note: 'Biweekly paycheck' }, // $900.00
        ],
      },
      fixed_expenses: {
        create: [
          { name: 'Rent', amount_cents: 45000, due_day: 1 },          // $450.00, due the 1st
          { name: 'Phone', amount_cents: 4000, due_day: 5 },          // $40.00, due the 5th
          { name: 'Subscription', amount_cents: 1100, due_day: 15 },  // $11.00, due the 15th
        ],
      },
      // Percentages should total 100 or less
      categories: {
        create: [
          { name: 'Groceries', percent: 50 },
          { name: 'Gas', percent: 20 },
          { name: 'Fun', percent: 20 },
          { name: 'Buffer', percent: 10 },
        ],
      },
    },
  });

  console.log('Seed data inserted successfully.');
  console.log('Demo login -> email: demo@example.com | password: password123');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
