import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllGifts } from '@/lib/db/gifts';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const gifts = await getAllGifts();
    return res.status(200).json({ gifts });
  } catch (error) {
    console.error('Error fetching gifts:', error);
    return res.status(500).json({ message: 'Failed to fetch gifts' });
  }
}