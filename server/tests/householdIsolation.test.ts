// Every resource route scopes its queries by req.session.householdId. These tests register
// two separate users (each gets their own household) and check that one household can never
// read, edit, or delete another household's data by guessing an id.
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { app, uniqueEmail } = require('./helpers');

async function registerAgent(label) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ email: uniqueEmail(label), password: 'password123' });
  return agent;
}

test('household isolation: paychecks', async () => {
  const owner = await registerAgent('iso-paycheck-owner');
  const stranger = await registerAgent('iso-paycheck-stranger');

  const created = await owner.post('/api/paychecks').send({ pay_date: '2026-01-01', amount_cents: 200000 });
  assert.strictEqual(created.status, 201);
  const paycheckId = created.body.id;

  const list = await stranger.get('/api/paychecks');
  assert.ok(!list.body.some((p) => p.id === paycheckId), "stranger's list must not include the owner's paycheck");

  const update = await stranger
    .put(`/api/paychecks/${paycheckId}`)
    .send({ pay_date: '2026-02-01', amount_cents: 1 });
  assert.strictEqual(update.status, 404);

  const del = await stranger.delete(`/api/paychecks/${paycheckId}`);
  assert.strictEqual(del.status, 404);

  // The owner's paycheck is untouched by the stranger's attempts
  const ownerList = await owner.get('/api/paychecks');
  const stillThere = ownerList.body.find((p) => p.id === paycheckId);
  assert.ok(stillThere);
  assert.strictEqual(stillThere.amount_cents, 200000);
});

test('household isolation: fixed expenses', async () => {
  const owner = await registerAgent('iso-fixed-owner');
  const stranger = await registerAgent('iso-fixed-stranger');

  const created = await owner.post('/api/fixed-expenses').send({ name: 'Rent', amount_cents: 150000, due_day: 1 });
  assert.strictEqual(created.status, 201);
  const expenseId = created.body.id;

  const list = await stranger.get('/api/fixed-expenses');
  assert.ok(!list.body.some((e) => e.id === expenseId));

  const update = await stranger
    .put(`/api/fixed-expenses/${expenseId}`)
    .send({ name: 'Hijacked', amount_cents: 1, due_day: 1 });
  assert.strictEqual(update.status, 404);

  const del = await stranger.delete(`/api/fixed-expenses/${expenseId}`);
  assert.strictEqual(del.status, 404);
});

test('household isolation: categories', async () => {
  const owner = await registerAgent('iso-category-owner');
  const stranger = await registerAgent('iso-category-stranger');

  // Registering already seeds default categories (Groceries/Gas/Fun/Buffer, totaling 100%),
  // so edit one of those instead of adding a new one that would push the household over 100%.
  const ownerCategories = await owner.get('/api/categories');
  const category = ownerCategories.body[0];

  const update = await stranger
    .put(`/api/categories/${category.id}`)
    .send({ name: 'Hijacked', percent: category.percent });
  assert.strictEqual(update.status, 404);

  const del = await stranger.delete(`/api/categories/${category.id}`);
  assert.strictEqual(del.status, 404);

  // Unaffected by the stranger's attempts
  const stillThere = await owner.get('/api/categories');
  assert.ok(stillThere.body.some((c) => c.id === category.id && c.name === category.name));
});

test('household isolation: purchases, including creating one against another household\'s category', async () => {
  const owner = await registerAgent('iso-purchase-owner');
  const stranger = await registerAgent('iso-purchase-stranger');

  const ownerCategories = await owner.get('/api/categories');
  const ownerCategoryId = ownerCategories.body[0].id;

  const created = await owner
    .post('/api/purchases')
    .send({ category_id: ownerCategoryId, purchase_date: '2026-01-05', amount_cents: 2500 });
  assert.strictEqual(created.status, 201);
  const purchaseId = created.body.id;

  // A purchase can't be logged against a category from someone else's household
  const crossHouseholdCreate = await stranger
    .post('/api/purchases')
    .send({ category_id: ownerCategoryId, purchase_date: '2026-01-06', amount_cents: 500 });
  assert.strictEqual(crossHouseholdCreate.status, 404);

  const list = await stranger.get('/api/purchases');
  assert.ok(!list.body.some((p) => p.id === purchaseId));

  const update = await stranger
    .put(`/api/purchases/${purchaseId}`)
    .send({ category_id: ownerCategoryId, purchase_date: '2026-01-06', amount_cents: 1 });
  assert.strictEqual(update.status, 404);

  const del = await stranger.delete(`/api/purchases/${purchaseId}`);
  assert.strictEqual(del.status, 404);
});

test('household isolation: the budget for one household never reflects another household\'s paycheck', async () => {
  const owner = await registerAgent('iso-budget-owner');
  const stranger = await registerAgent('iso-budget-stranger');

  await owner.post('/api/paychecks').send({ pay_date: '2026-03-01', amount_cents: 300000 });

  const strangerBudget = await stranger.get('/api/budget');
  assert.strictEqual(strangerBudget.status, 200);
  assert.strictEqual(strangerBudget.body.has_paycheck, false);
});
