# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OOD-money is a full-stack budget tracker: `client/` is React 19 + Vite + React Router 7, `server/` is Express 5 + better-sqlite3. Both are TypeScript with `strict: false`. The two packages are independent npm projects with no root `package.json`, so run commands from inside `client/` or `server/`.

## Commands

Server (`cd server`, needs `.env` copied from `.env.example`):
- `npm run dev`: API on http://localhost:3000 (nodemon + tsx)
- `npm test`: runs `tsx --test tests/*.test.ts` (Node's built-in `node:test` runner)
- Single test file: `npx tsx --test tests/budgetCalculator.test.ts`
- Single test by name: `npx tsx --test --test-name-pattern="getPeriod" tests/budgetCalculator.test.ts`
- `npm run typecheck`: `tsc --noEmit`
- `npm run seed`: **wipes all tables** and loads a demo user (`demo@example.com` / `password123`)

Client (`cd client`, needs `.env` copied from `.env.example`, which sets `VITE_API_URL`):
- `npm run dev` (Vite, usually http://localhost:5173), `npm run build`, `npm run typecheck`, `npm run lint`

Run the API and client at the same time, in separate terminals.

## Architecture

**Server entry:** `server.ts` loads dotenv and calls `listen`. `src/app.ts` builds and exports the Express app (CORS, JSON, session, routers mounted under `/api/*`, plus `GET /api/health`), so it can be imported without starting a server.

**Request flow:** pages in `client/src/pages/` call thin per-resource modules in `client/src/api/`. All requests go through `client/src/api/client.ts` (`get/post/put/del`). It sends `credentials: "include"` so the session cookie travels cross-origin, and it throws `Error(body.error)` on non-2xx responses. Pages show `err.message` directly, so server error strings are user-facing.

**Auth:** cookie sessions via `express-session` with the default in-memory store, so sessions are lost whenever the server restarts. Login and register set `req.session.userId`, which is typed in `server/src/types/express-session.d.ts`. Every resource router calls `router.use(requireAuth)`, and every query must be scoped with `AND user_id = ?`. When one record references another (for example, a purchase's `category_id`), verify that the referenced row also belongs to the user. On the client, `AuthContext` calls `/api/auth/me` on load, and `ProtectedRoute` + `AppShell` wrap all authenticated routes in `App.tsx`. CORS origin comes from `CLIENT_ORIGIN`.

**Server module style:** although the files are `.ts`, the server uses CommonJS (`require` / `module.exports`, `"module": "CommonJS"`) and is run by `tsx`. Keep new server files consistent with this. The client uses ES modules.

**Database:** `server/src/db/connection.ts` exports one shared synchronous better-sqlite3 handle. It creates the `DB_PATH` directory, enables `foreign_keys`, and runs `schema.sql` on every startup. All statements use `CREATE ... IF NOT EXISTS` and there are no migrations, so changing an existing table needs manual handling (or deleting the dev DB). Routes write SQL inline with `db.prepare(...)`. `queries.sql` holds example queries only and is never executed.

**Money:** every amount is an integer number of cents (`*_cents` columns, `amount_cents` in request bodies), validated with `Number.isInteger`. Dates are `YYYY-MM-DD` strings. The client converts to and from dollars only for display and input.

**Budget logic** (`server/src/services/budgetCalculator.ts`, the only unit-tested code). It's pure functions, wired together in `routes/budget.ts`:
- A pay period runs from a paycheck's date to the day before the next paycheck. If there's no next paycheck, it's 14 days (inclusive).
- Fixed expenses have a `due_day` (1–31), clamped to the month's last day. They count toward a period if their date falls in any month the period touches.
- `spendable = paycheck − fixed expenses due − savings goal`. Spendable (floored at 0) is split across categories by `percent`.
- Category percents per user must total ≤ 100, which `routes/categories.ts` enforces. Registering a user seeds default categories (Groceries 50, Gas 20, Fun 20, Buffer 10).

Put new budget math in `budgetCalculator.ts` and test it in `server/tests/`. Keep DB access in the routes.
