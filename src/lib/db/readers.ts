import pool from './index';
import { Reader, ReaderProfile } from '@/types/types';

export async function getAllReaders(): Promise<Reader[]> {
  const result = await pool.query(`
    SELECT 
      r.user_id as id,
      u.name,
      r.specialty,
      r.rate_per_minute,
      r.minimum_session_amount,
      r.status,
      r.profile_image,
      r.rating,
      r.total_reviews,
      r.is_streaming,
      r.stream_title,
      r.stream_thumbnail,
      r.viewer_count
    FROM 
      reader_profiles r
    JOIN 
      users u ON r.user_id = u.id
    WHERE 
      u.role = 'reader'
  `);
  
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    ratePerMinute: parseFloat(row.rate_per_minute),
    minimumSessionAmount: parseFloat(row.minimum_session_amount),
    status: row.status,
    profileImage: row.profile_image,
    rating: parseFloat(row.rating),
    totalReviews: row.total_reviews,
    isStreaming: row.is_streaming,
    streamTitle: row.stream_title,
    streamThumbnail: row.stream_thumbnail,
    viewerCount: row.viewer_count
  }));
}

export async function getReaderById(id: string): Promise<Reader | null> {
  const result = await pool.query(`
    SELECT 
      r.user_id as id,
      u.name,
      r.specialty,
      r.rate_per_minute,
      r.minimum_session_amount,
      r.status,
      r.profile_image,
      r.bio,
      r.rating,
      r.total_reviews,
      r.is_streaming,
      r.stream_title,
      r.stream_thumbnail,
      r.viewer_count
    FROM 
      reader_profiles r
    JOIN 
      users u ON r.user_id = u.id
    WHERE 
      r.user_id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Get earnings data
  const earningsResult = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN amount ELSE 0 END), 0) as today,
      COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '1 week' THEN amount ELSE 0 END), 0) as week,
      COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '1 month' THEN amount ELSE 0 END), 0) as month
    FROM 
      reader_earnings
    WHERE 
      reader_id = $1
  `, [id]);
  
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    ratePerMinute: parseFloat(row.rate_per_minute),
    minimumSessionAmount: parseFloat(row.minimum_session_amount),
    status: row.status,
    profileImage: row.profile_image,
    bio: row.bio,
    rating: parseFloat(row.rating),
    totalReviews: row.total_reviews,
    isStreaming: row.is_streaming,
    streamTitle: row.stream_title,
    streamThumbnail: row.stream_thumbnail,
    viewerCount: row.viewer_count,
    earnings: earningsResult.rows.length > 0 ? {
      today: parseFloat(earningsResult.rows[0].today),
      week: parseFloat(earningsResult.rows[0].week),
      month: parseFloat(earningsResult.rows[0].month)
    } : {
      today: 0,
      week: 0,
      month: 0
    }
  };
}

export async function updateReaderProfile(
  id: string, 
  {
    specialty,
    ratePerMinute,
    minimumSessionAmount,
    profileImage,
    bio
  }: {
    specialty?: string;
    ratePerMinute?: number;
    minimumSessionAmount?: number;
    profileImage?: string;
    bio?: string;
  }
): Promise<boolean> {
  // Build the SET part of the query dynamically based on provided fields
  let setClause = [];
  let params = [];
  let paramIndex = 1;
  
  if (specialty !== undefined) {
    setClause.push(`specialty = $${paramIndex++}`);
    params.push(specialty);
  }
  
  if (ratePerMinute !== undefined) {
    setClause.push(`rate_per_minute = $${paramIndex++}`);
    params.push(ratePerMinute);
  }
  
  if (minimumSessionAmount !== undefined) {
    setClause.push(`minimum_session_amount = $${paramIndex++}`);
    params.push(minimumSessionAmount);
  }
  
  if (profileImage !== undefined) {
    setClause.push(`profile_image = $${paramIndex++}`);
    params.push(profileImage);
  }
  
  if (bio !== undefined) {
    setClause.push(`bio = $${paramIndex++}`);
    params.push(bio);
  }
  
  // If no fields to update, return early
  if (setClause.length === 0) {
    return true;
  }
  
  // Add id as the last parameter
  params.push(id);
  
  const result = await pool.query(`
    UPDATE reader_profiles
    SET ${setClause.join(', ')}
    WHERE user_id = $${paramIndex}
  `, params);
  
  return result.rowCount > 0;
}

export async function updateReaderStatus(id: string, status: string): Promise<boolean> {
  const result = await pool.query(
    'UPDATE reader_profiles SET status = $1 WHERE user_id = $2',
    [status, id]
  );
  
  return result.rowCount > 0;
}

export async function updateReaderStreamStatus(
  id: string, 
  isStreaming: boolean, 
  streamTitle?: string
): Promise<boolean> {
  const result = await pool.query(
    'UPDATE reader_profiles SET is_streaming = $1, stream_title = $2 WHERE user_id = $3',
    [isStreaming, streamTitle || 'Live Psychic Reading', id]
  );
  
  return result.rowCount > 0;
}

export async function addReaderEarnings(readerId: string, amount: number): Promise<void> {
  await pool.query(
    'INSERT INTO reader_earnings (reader_id, amount, created_at) VALUES ($1, $2, NOW())',
    [readerId, amount]
  );
}