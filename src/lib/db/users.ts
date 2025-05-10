import pool from './index';
import { v4 as uuidv4 } from 'uuid';
import { UserBalance } from '@/types/types';

export async function getUserByEmail(email: string) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  
  return result.rows[0];
}

export async function getUserById(id: string) {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  
  return result.rows[0];
}

export async function createUser({
  name,
  email,
  password,
  role
}: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const userId = uuidv4();
  
  // Start a transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert user
    await client.query(
      'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
      [userId, name, email, password, role]
    );
    
    // Initialize user balance
    await client.query(
      'INSERT INTO user_balances (user_id, available_balance) VALUES ($1, $2)',
      [userId, 0]
    );
    
    // If creating a reader, initialize reader profile
    if (role === 'reader') {
      await client.query(
        `INSERT INTO reader_profiles (
          user_id, 
          specialty, 
          rate_per_minute, 
          minimum_session_amount,
          status,
          rating,
          total_reviews
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, 'General Readings', 1.99, 10, 'offline', 5.0, 0]
      );
    }
    
    await client.query('COMMIT');
    return userId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserBalance(userId: string): Promise<UserBalance | null> {
  const result = await pool.query(
    'SELECT * FROM user_balances WHERE user_id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    userId: result.rows[0].user_id,
    availableBalance: parseFloat(result.rows[0].available_balance),
    lastUpdated: result.rows[0].last_updated
  };
}

export async function deductUserBalance(userId: string, amount: number) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check current balance
    const balanceResult = await client.query(
      'SELECT available_balance FROM user_balances WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    
    if (balanceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    
    const currentBalance = parseFloat(balanceResult.rows[0].available_balance);
    
    if (currentBalance < amount) {
      await client.query('ROLLBACK');
      return null;
    }
    
    // Update balance
    const newBalance = currentBalance - amount;
    const updateResult = await client.query(
      'UPDATE user_balances SET available_balance = $1, last_updated = NOW() WHERE user_id = $2 RETURNING *',
      [newBalance, userId]
    );
    
    await client.query('COMMIT');
    
    return {
      userId: updateResult.rows[0].user_id,
      availableBalance: parseFloat(updateResult.rows[0].available_balance),
      lastUpdated: updateResult.rows[0].last_updated
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}