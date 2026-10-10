# Project Title OOD-money

Full stack budget tracker built with React, Express, and SQLite. Log paychecks and fixed expenses, then automatically split what's left into spending categories.

## Instructions for Build and Use

Steps to build and/or run the software:

1. Create the GitHub repo `budget-tracker` and clone it, then open the folder in VS Code.
2. Set up the server. In a terminal:
```bash
   cd server
   npm install
   cp .env.example .env
```
   Open `.env` and set `PORT`, `SESSION_SECRET`, `DB_PATH`, and `CLIENT_ORIGIN` (the URL where the React app runs, e.g. `http://localhost:5173`).
3. (Optional) Load the fake demo user and data: `node src/db/seed.js`
4. Start the API: `npm run dev` (it restarts automatically with nodemon, and the SQLite database is created on first run).
5. Set up the client. In a second terminal:
```bash
   cd client
   npm install
   cp .env.example .env
   npm run dev
```
   Make sure `VITE_API_URL` in `client/.env` points at the server (e.g. `http://localhost:3000`).
6. Open the address Vite prints (usually `http://localhost:5173`).
7. (Optional) Run the budget calculator unit tests from `server/`: `npm test`

Instructions for using the software:

1. Create an account on the Register page, then log in.
2. Go to Settings and enter your savings goal per pay period, then set your category percentages (groceries, gas, fun, etc.). They must total 100% or less.
3. Add your fixed expenses (rent, phone, subscriptions) with their amounts and due days.
4. Add your biweekly paycheck with its date and amount.
5. Open the Dashboard to see your pay period, spendable money, and the budget left in each category.
6. Log purchases as you spend and watch each category's remaining amount update. It turns red if you overspend.
7. When you're finished, click Logout.

## Development Environment


* Node.js v20.17.0, and npm 10.8.2
* Server: 
├── bcryptjs@3.0.3
├── better-sqlite3@12.11.1
├── cors@2.8.6
├── dotenv@18.0.3
├── express-session@1.19.0
├── express@5.2.1
└── nodemon@3.1.14
* Client: @eslint/js@10.0.1
├── react-dom@19.3.0
├── react-router-dom@7.18.4
├── react@19.3.0
└── vite@8.3.1
* GitHub version
git version 2.54.0 (Apple Git-157)

## Useful Websites to Learn More

I found these websites useful in developing this software:

* [React Documentation](https://react.dev)
* [Vite Guide](https://vitejs.dev/guide/)
* [React Router Documentation](https://reactrouter.com)
* [Express Documentation](https://expressjs.com)
* [better-sqlite3 on GitHub](https://github.com/WiseLibs/better-sqlite3)
* [MDN: Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

## Future Work

The following items I plan to fix, improve, and/or add to this project in the future:

* [ ] Rewrite the backend in TypeScript with typed models, input validation, and tests (Sprint 2)
* [ ] Move the data to a hosted database and deploy with a live URL (Sprint 3)
* [ ] Replace the in-memory session store with a production-ready one
* [ ] Add spending charts to the dashboard
* [ ] Add bank CSV import
* [ ] Add password reset by email
* [ ] Add a monthly spending report (Sprint 5, Java)