const express = require('express');
const cors = require('cors');
const session = require('express-session');
const authRoutes = require('./routes/auth');


const app = express();

// Allow the React app (running on a different port) to make requests here
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // don't create a session until something is actually stored in it (like a logged-in user ID). Saves unnecessary empty sessions.
  cookie: {
    httpOnly: true, //this is a security setting meaning JavaScript running in the browser can't read the cookie (protects against certain attacks). Only the server can read it.
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

app.use('/api/auth', authRoutes);


// Health check route - confirms the server is alive and reachable
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;