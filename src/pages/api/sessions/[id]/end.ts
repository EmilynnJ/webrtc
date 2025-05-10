import type { NextApiRequest, NextApiResponse } from 'next';
import { endSession, getSessionById } from '@/lib/db/sessions';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Handle PUT request (end session)
  if (req.method === 'PUT') {
    try {
      // Get current session to check permissions
      const currentSession = await getSessionById(id as string);
      
      if (!currentSession) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Ensure user has permission
      if (session.user.id !== currentSession.userId && 
          session.user.id !== currentSession.readerId && 
          session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const { reason } = req.body;
      
      // End session
      const updated = await endSession(id as string, reason);
      
      if (!updated) {
        return res.status(404).json({ message: 'Failed to end session' });
      }
      
      return res.status(200).json({ message: 'Session ended successfully' });
    } catch (error) {
      console.error('Error ending session:', error);
      return res.status(500).json({ message: 'Failed to end session' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}