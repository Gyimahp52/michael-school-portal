const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.NEON_DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Neon API server is running' });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user endpoint
app.post('/api/auth/create-user', async (req, res) => {
  try {
    const { username, password, displayName, role } = req.body;

    if (!username || !password || !displayName || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    const result = await pool.query(
      `INSERT INTO users (id, username, display_name, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, username, displayName, hashedPassword, role]
    );

    const user = result.rows[0];
    res.status(201).json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users endpoint
app.get('/api/auth/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, display_name, role, created_at, updated_at FROM users ORDER BY created_at DESC');
    
    res.json(result.rows.map(row => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize default users endpoint
app.post('/api/auth/initialize-users', async (req, res) => {
  try {
    const defaultUsers = [
      { username: 'admin', password: 'admin123', displayName: 'Administrator', role: 'admin' },
      { username: 'teacher', password: 'teacher123', displayName: 'Teacher', role: 'teacher' },
      { username: 'accountant', password: 'accountant123', displayName: 'Accountant', role: 'accountant' }
    ];

    const created = [];
    const skipped = [];

    for (const user of defaultUsers) {
      const existing = await pool.query('SELECT id FROM users WHERE username = $1', [user.username]);
      
      if (existing.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const id = crypto.randomUUID();

        await pool.query(
          `INSERT INTO users (id, username, display_name, password, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [id, user.username, user.displayName, hashedPassword, user.role]
        );
        
        created.push(user.username);
      } else {
        skipped.push(user.username);
      }
    }

    res.json({ 
      message: 'Initialization complete',
      created,
      skipped
    });
  } catch (error) {
    console.error('Initialize users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.NEON_API_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Neon API server running on port ${PORT}`);
});
