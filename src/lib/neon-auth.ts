const API_BASE_URL = import.meta.env.VITE_NEON_API_URL || 'http://localhost:3002';

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
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const user = await response.json();
    return user;
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
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, displayName, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'User creation failed');
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

export const initializeUsers = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/initialize-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'User initialization failed');
    }

    const result = await response.json();
    console.log('Users initialized:', result);
  } catch (error) {
    console.error('Initialize users error:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }

    const users = await response.json();
    return users;
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
};
