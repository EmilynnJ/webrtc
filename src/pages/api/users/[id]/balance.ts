import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserBalance } from '@/lib/db/users';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Ensure user has permission
  if (session.user.id !== id && session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const balance = await getUserBalance(id as string);
    
    if (!balance) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json(balance);
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return res.status(500).json({ message: 'Failed to fetch balance' });
  }
}