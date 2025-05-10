import type { NextApiRequest, NextApiResponse } from 'next';
import { updateReaderStatus } from '@/lib/db/readers';
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

  // Handle PUT request
  if (req.method === 'PUT') {
    try {
      const { status } = req.body;
      
      if (status !== 'online' && status !== 'offline' && status !== 'busy') {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      // Update status
      const updated = await updateReaderStatus(id as string, status);
      
      if (!updated) {
        return res.status(404).json({ message: 'Reader not found' });
      }
      
      return res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating reader status:', error);
      return res.status(500).json({ message: 'Failed to update status' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}