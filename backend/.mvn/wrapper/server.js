const express = require('express');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());

// Test route to verify PostgreSQL database connection
app.get('/api/test', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      message: 'MedFind Backend connected to PostgreSQL!',
      timestamp: result.rows[0].now,
    });
  } catch (err) {
    console.error('Database connection error:', err.message);
    res.status(500).json({ error: 'Database query failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
