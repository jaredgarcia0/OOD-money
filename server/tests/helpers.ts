// Shared setup for the route-level tests below. Loading dotenv here, before `../src/app`
// is required, matters: `src/db/prisma.ts` reads process.env.DATABASE_URL as soon as it's
// imported, so the env file has to be in place first.
require('dotenv').config();

const app = require('../src/app');

// Each test registers its own user/household instead of relying on a clean database,
// so tests can run in any order (or in parallel) without stepping on each other's data.
// A fresh, random email per call keeps registrations from colliding.
function uniqueEmail(label) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.example`;
}

module.exports = { app, uniqueEmail };
