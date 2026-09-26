const express = require('express');
const cors = require('cors');

const app = express();

// Allow the React app (running on a different port) to make requests here
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Health check route - confirms the server is alive and reachable
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;