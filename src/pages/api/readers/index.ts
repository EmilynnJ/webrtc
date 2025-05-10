import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllReaders } from '@/lib/db/readers';
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
    const readers = await getAllReaders();
    return res.status(200).json({ readers });
  } catch (error) {
    console.error('Error fetching readers:', error);
    return res.status(500).json({ message: 'Failed to fetch readers' });
  }
}