import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;

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

// SSE clients registry
const sseClients = new Set();

// Broadcast helper for SSE
function broadcastEvent(event) {
  const data = typeof event === 'string' ? event : JSON.stringify(event);
  for (const res of sseClients) {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (_) {
      // drop broken connection
      sseClients.delete(res);
    }
  }
}

// Real-time via Postgres LISTEN/NOTIFY
const listener = new pg.Client({
  connectionString: process.env.NEON_DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initNotifications() {
  try {
    await listener.connect();
    listener.on('notification', (msg) => {
      // msg.channel, msg.payload
      let payload = null;
      try {
        payload = msg.payload ? JSON.parse(msg.payload) : null;
      } catch (_) {
        payload = { raw: msg.payload };
      }
      broadcastEvent({ type: 'db_event', channel: msg.channel, payload });
    });

    const channels = [
      'users_changed',
      'students_changed',
      'invoices_changed',
      'assessments_changed',
      'attendance_changed',
      'attendance_entries_changed',
      'canteen_collections_changed',
      'promotion_requests_changed',
      'promotion_decisions_changed',
      'academic_transitions_changed',
      'classes_changed',
      'subjects_changed',
      'teachers_changed',
      'terms_changed',
      'academic_years_changed',
      'school_fees_changed',
      'student_balances_changed'
    ];

    await Promise.all(channels.map((c) => listener.query(`LISTEN ${c}`)));
    console.log('Realtime notifications initialized:', channels.join(', '));
  } catch (err) {
    console.error('Failed to initialize realtime notifications:', err);
  }
}

initNotifications();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Neon API server is running' });
});

// Root route - helpful landing response
app.get('/', (req, res) => {
  res.type('html').send(
    '<!doctype html>\n' +
    '<html><head><meta charset="utf-8"><title>Neon API</title></head>' +
    '<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji; padding:24px">' +
    '<h1>Neon API Server</h1>' +
    '<p>Server is running. Try <a href="/health">/health</a> or API endpoints like <code>/api/auth/users</code>.</p>' +
    '</body></html>'
  );
});

// SSE endpoint to push realtime DB changes to clients
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Register client
  sseClients.add(res);

  // Initial hello
  res.write(`data: ${JSON.stringify({ type: 'hello', ts: Date.now() })}\n\n`);

  // Heartbeat
  const interval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (_) {
      clearInterval(interval);
      sseClients.delete(res);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(interval);
    sseClients.delete(res);
  });
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

// Admin endpoint: create generic trigger to emit NOTIFY on changes for key tables
app.post('/admin/setup-triggers', async (req, res) => {
  const tables = [
    'users',
    'students',
    'invoices',
    'assessments',
    'attendance',
    'attendance_entries',
    'canteen_collections',
    'promotion_requests',
    'promotion_decisions',
    'academic_transitions',
    'classes',
    'subjects',
    'teachers',
    'terms',
    'academic_years',
    'school_fees',
    'student_balances'
  ];

  const functionSQL = `
    CREATE OR REPLACE FUNCTION notify_table_change() RETURNS trigger AS $$
    BEGIN
      PERFORM pg_notify(
        TG_TABLE_NAME || '_changed',
        json_build_object(
          'op', TG_OP,
          'table', TG_TABLE_NAME,
          'id', COALESCE(NEW.id::text, OLD.id::text, '')
        )::text
      );
      IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
      ELSE
        RETURN NEW;
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `;

  try {
    await pool.query(functionSQL);
    for (const table of tables) {
      const trgName = `trg_${table}_changed`;
      // Drop and recreate trigger
      await pool.query(`DROP TRIGGER IF EXISTS ${trgName} ON ${table};`);
      await pool.query(`
        CREATE TRIGGER ${trgName}
        AFTER INSERT OR UPDATE OR DELETE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION notify_table_change();
      `);
    }
    res.json({ message: 'Triggers created', tables });
  } catch (error) {
    console.error('Setup triggers error:', error);
    res.status(500).json({ error: 'Failed to create triggers' });
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
