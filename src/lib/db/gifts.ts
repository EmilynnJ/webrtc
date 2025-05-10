import pool from './index';
import { v4 as uuidv4 } from 'uuid';
import { Gift } from '@/types/types';

export async function getAllGifts(): Promise<Gift[]> {
  const result = await pool.query(
    'SELECT * FROM gifts ORDER BY value'
  );
  
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    value: parseFloat(row.value),
    iconUrl: row.icon_url
  }));
}

export async function getGiftById(id: string): Promise<Gift | null> {
  const result = await pool.query(
    'SELECT * FROM gifts WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    id: result.rows[0].id,
    name: result.rows[0].name,
    value: parseFloat(result.rows[0].value),
    iconUrl: result.rows[0].icon_url
  };
}

export async function recordGift({
  giftId,
  userId,
  readerId,
  amount
}: {
  giftId: string;
  userId: string;
  readerId: string;
  amount: number;
}): Promise<void> {
  const id = uuidv4();
  
  await pool.query(`
    INSERT INTO gift_transactions (
      id,
      gift_id,
      user_id,
      reader_id,
      amount,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
  `, [id, giftId, userId, readerId, amount]);
}