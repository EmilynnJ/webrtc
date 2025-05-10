import pool from './index';
import { Session } from '@/types/types';

export async function createSession({
  sessionId,
  userId,
  readerId,
  status
}: {
  sessionId: string;
  userId: string;
  readerId: string;
  status: string;
}) {
  const result = await pool.query(`
    INSERT INTO sessions (
      session_id, 
      user_id, 
      reader_id, 
      status, 
      start_time
    ) VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `, [sessionId, userId, readerId, status]);
  
  return {
    sessionId: result.rows[0].session_id,
    userId: result.rows[0].user_id,
    readerId: result.rows[0].reader_id,
    status: result.rows[0].status,
    startTime: result.rows[0].start_time
  };
}

export async function getSessionById(sessionId: string) {
  const result = await pool.query(
    'SELECT * FROM sessions WHERE session_id = $1',
    [sessionId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    sessionId: result.rows[0].session_id,
    userId: result.rows[0].user_id,
    readerId: result.rows[0].reader_id,
    status: result.rows[0].status,
    startTime: result.rows[0].start_time,
    endTime: result.rows[0].end_time,
    duration: result.rows[0].duration,
    amountCharged: parseFloat(result.rows[0].amount_charged || 0)
  };
}

export async function endSession(sessionId: string, reason?: string): Promise<boolean> {
  const result = await pool.query(`
    UPDATE sessions
    SET 
      status = 'ended',
      end_time = NOW(),
      duration = EXTRACT(EPOCH FROM (NOW() - start_time)),
      end_reason = $2
    WHERE session_id = $1
  `, [sessionId, reason || 'user_ended']);
  
  return result.rowCount > 0;
}

export async function updateSessionBilling(
  sessionId: string, 
  amount: number, 
  duration: number
): Promise<void> {
  await pool.query(`
    UPDATE sessions
    SET 
      amount_charged = COALESCE(amount_charged, 0) + $2,
      duration = $3,
      status = 'active'
    WHERE session_id = $1
  `, [sessionId, amount, duration]);
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  const result = await pool.query(`
    SELECT 
      s.session_id as id,
      s.user_id,
      s.reader_id,
      u.name as user_name,
      r.name as reader_name,
      s.start_time,
      s.end_time,
      s.duration,
      s.amount_charged,
      s.status
    FROM 
      sessions s
    JOIN 
      users u ON s.user_id = u.id
    JOIN 
      users r ON s.reader_id = r.id
    WHERE 
      s.user_id = $1
    ORDER BY 
      s.start_time DESC
  `, [userId]);
  
  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    readerId: row.reader_id,
    userName: row.user_name,
    readerName: row.reader_name,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    amountCharged: parseFloat(row.amount_charged || 0),
    status: row.status
  }));
}

export async function getReaderSessions(readerId: string): Promise<Session[]> {
  const result = await pool.query(`
    SELECT 
      s.session_id as id,
      s.user_id,
      s.reader_id,
      u.name as user_name,
      r.name as reader_name,
      s.start_time,
      s.end_time,
      s.duration,
      s.amount_charged,
      s.status
    FROM 
      sessions s
    JOIN 
      users u ON s.user_id = u.id
    JOIN 
      users r ON s.reader_id = r.id
    WHERE 
      s.reader_id = $1
    ORDER BY 
      s.start_time DESC
  `, [readerId]);
  
  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    readerId: row.reader_id,
    userName: row.user_name,
    readerName: row.reader_name,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    amountCharged: parseFloat(row.amount_charged || 0),
    status: row.status
  }));
}