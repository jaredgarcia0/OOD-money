# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OOD-money is a full-stack budget tracker: `client/` is React 19 + Vite + React Router 7, `server/` is Express 5 + Prisma 7 on PostgreSQL (Neon in the cloud). Both are TypeScript with `strict: false`. The two packages are independent npm projects with no root `package.json`, so run commands from inside `client/` or `server/`.

## Commands

Server (`cd server`, needs `.env` copied from `.env.example` with `DATABASE_URL` set; `npm install` runs `prisma generate`):
- `npm run dev`: API on http://localhost:3000 (nodemon + tsx)
- `npm test`: runs `tsx --test tests/*.test.ts` (Node's built-in `node:test` runner)
- Single test file: `npx tsx --test tests/budgetCalculator.test.ts`
- Single test by name: `npx tsx --test --test-name-pattern="getPeriod" tests/budgetCalculator.test.ts`
- `npm run typecheck`: `tsc --noEmit`
- `npm run seed`: **wipes all tables** and loads a demo household (`demo@example.com` / `password123`)
- `npm run db:migrate -- --name <change>`: after editing `prisma/schema.prisma`, creates and applies a migration (dev only)
- `npm run db:deploy`: applies pending migrations (production / Neon prod branch)
- `npm run db:generate`: regenerates the Prisma client into `src/generated/prisma` (gitignored)
- `npm run db:studio`: browse data in Prisma Studio

Client (`cd client`, needs `.env` copied from `.env.example`, which sets `VITE_API_URL`):
- `npm run dev` (Vite, usually http://localhost:5173), `npm run build`, `npm run typecheck`, `npm run lint`

Run the API and client at the same time, in separate terminals.

## Architecture

**Server entry:** `server.ts` loads dotenv and calls `listen`. `src/app.ts` builds and exports the Express app (CORS, JSON, session, routers mounted under `/api/*`, plus `GET /api/health`), so it can be imported without starting a server.

**Request flow:** pages in `client/src/pages/` call thin per-resource modules in `client/src/api/`. All requests go through `client/src/api/client.ts` (`get/post/put/del`). It sends `credentials: "include"` so the session cookie travels cross-origin, and it throws `Error(body.error)` on non-2xx responses. Pages show `err.message` directly, so server error strings are user-facing.

**Auth and households:** cookie sessions via `express-session`, stored in the Postgres `session` table by `connect-pg-simple` (the table is defined in the Prisma schema, not auto-created). Budget data belongs to a **household**, not a user: `users` join `households` through `household_members` (role `owner`/`member`). Register creates the user, a household they own, and default categories in one transaction. Login and register set `req.session.userId` and `req.session.householdId` (typed in `server/src/types/express-session.d.ts`); a user currently uses their first household. Every resource router calls `router.use(requireAuth)`, and every query must be scoped with `household_id: req.session.householdId`. When one record references another (for example, a purchase's `category_id`), verify that the referenced row also belongs to the household. Updates and deletes check ownership first (`findFirst` with `household_id`, or `deleteMany` and check `count`), and route ids go through `parseId`. On the client, `AuthContext` calls `/api/auth/me` on load, and `ProtectedRoute` + `AppShell` wrap all authenticated routes in `App.tsx`. CORS origin comes from `CLIENT_ORIGIN`.

**Server module style:** although the files are `.ts`, the server uses CommonJS (`require` / `module.exports`, `"module": "CommonJS"`) and is run by `tsx`. Keep new server files consistent with this. The client uses ES modules.

**Database:** the schema lives in `server/prisma/schema.prisma`; `server/prisma.config.ts` configures the CLI (migrations use `DIRECT_URL` if set, else `DATABASE_URL`). Schema changes go through Prisma migrations in `server/prisma/migrations/`; CHECK constraints (positive amounts, `due_day` 1–31, `percent` 0–100) are hand-added SQL in the init migration because Prisma can't express them. `server/src/db/prisma.ts` exports `{ prisma, pool }`: one `pg` pool shared by Prisma (via `@prisma/adapter-pg`) and the session store. Routes query with `prisma.<model>` directly and are `async`; Express 5 forwards rejected promises to the JSON error handler at the end of `app.ts`. Model fields are snake_case so responses keep the shape the client expects. `queries.sql` holds example queries only and is never executed.

**Money:** every amount is an integer number of cents (`*_cents` columns, `amount_cents` in request bodies), validated with `Number.isInteger`. Dates are `YYYY-MM-DD` strings in the API and Postgres `DATE` columns in the DB; convert with `isValidDate` / `toDbDate` / `fromDbDate` from `server/src/utils/dates.ts`. `fixed_expenses.active` is a boolean in the DB but sent to the client as `1`/`0`. The client converts to and from dollars only for display and input.

**Budget logic** (`server/src/services/budgetCalculator.ts`, the only unit-tested code). It's pure functions, wired together in `routes/budget.ts`:
- A pay period runs from a paycheck's date to the day before the next paycheck. If there's no next paycheck, it's 14 days (inclusive).
- Fixed expenses have a `due_day` (1–31), clamped to the month's last day. They count toward a period if their date falls in any month the period touches.
- `spendable = paycheck − fixed expenses due − savings goal`. Spendable (floored at 0) is split across categories by `percent`.
- Category percents per household must total ≤ 100, which `routes/categories.ts` enforces. The savings goal is stored on the household. Registering a user seeds default categories (Groceries 50, Gas 20, Fun 20, Buffer 10).

Put new budget math in `budgetCalculator.ts` and test it in `server/tests/`. Keep DB access in the routes.
