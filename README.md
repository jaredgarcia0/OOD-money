# OOD-money

OOD-money is a full-stack budget tracker built with React, Express, TypeScript, and SQLite. It helps users track paychecks, fixed expenses, purchases, savings goals, and category-based spending budgets.

## Features

- User registration and login
- Paycheck and fixed-expense tracking
- Automatic budget calculations
- Spending categories and savings goals
- Purchase tracking with remaining-budget updates
- Dashboard with current pay-period information

## Project structure

```text
client/   React + Vite frontend
server/   Express + SQLite backend/API
```

## Run locally

### Prerequisites

- Node.js 20 or newer
- npm

### 1. Install and configure the server

```bash
cd server
npm install
cp .env.example .env
```

Update `server/.env` if needed:

```env
PORT=3000
SESSION_SECRET=changeme
DB_PATH=./data/budget.db
CLIENT_ORIGIN=http://localhost:5173
```

Start the API:

```bash
npm run dev
```

The server runs at `http://localhost:3000`.

### 2. Install and configure the client

In a second terminal:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The frontend runs at the Vite URL shown in the terminal, usually `http://localhost:5173`.

The client uses `VITE_API_URL` to find the server:

```env
VITE_API_URL=http://localhost:3000
```

## Useful commands

From `client/`:

```bash
npm run build       # Create a production build
npm run typecheck   # Check TypeScript
npm run lint        # Check code style
```

From `server/`:

```bash
npm test            # Run backend tests
npm run typecheck   # Check TypeScript
npm run seed        # Load demo user and data
```

## Deployment

Deployment is not configured yet. Because this is a full-stack application, the React frontend and Express backend will need to be hosted separately. The frontend must be configured with the deployed backend URL through `VITE_API_URL`. The backend also needs a persistent database location for production use.

## Future improvements

- Deploy the frontend and backend with a hosted database
- Replace the in-memory session store with a production-ready store
- Add spending charts and monthly reports
- Add bank CSV import
- Add password reset by email

## Resources

- [React documentation](https://react.dev)
- [Vite documentation](https://vite.dev/guide/)
- [Express documentation](https://expressjs.com)
- [React Router documentation](https://reactrouter.com)
