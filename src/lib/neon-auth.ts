import bcrypt from 'bcryptjs';
import { query } from './neon-client';

export interface User {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const loginUser = async (username: string, password: string): Promise<User> => {
  try {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const createUser = async (
  username: string,
  password: string,
  displayName: string,
  role: string
): Promise<User> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();

  const result = await query(
    `INSERT INTO users (id, username, display_name, password, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [id, username, displayName, hashedPassword, role]
  );

  const user = result.rows[0];
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
};

export const initializeUsers = async (): Promise<void> => {
  const defaultUsers = [
    { username: 'admin', password: 'admin123', displayName: 'Administrator', role: 'admin' },
    { username: 'teacher', password: 'teacher123', displayName: 'Teacher', role: 'teacher' },
    { username: 'accountant', password: 'accountant123', displayName: 'Accountant', role: 'accountant' }
  ];

  for (const user of defaultUsers) {
    try {
      const existing = await query('SELECT id FROM users WHERE username = $1', [user.username]);
      if (existing.rows.length === 0) {
        await createUser(user.username, user.password, user.displayName, user.role);
        console.log(`Created user: ${user.username}`);
      }
    } catch (error) {
      console.error(`Error creating user ${user.username}:`, error);
    }
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  const result = await query('SELECT * FROM users ORDER BY created_at DESC');
  return result.rows.map(row => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};
