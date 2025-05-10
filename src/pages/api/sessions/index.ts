import type { NextApiRequest, NextApiResponse } from 'next';
import { createSession } from '@/lib/db/sessions';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Handle POST request (create session)
  if (req.method === 'POST') {
    try {
      const { sessionId, userId, readerId } = req.body;
      
      // Validate input
      if (!sessionId || !userId || !readerId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Ensure user has permission
      if (session.user.id !== userId && session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Create session
      const created = await createSession({
        sessionId,
        userId,
        readerId,
        status: 'waiting'
      });
      
      return res.status(201).json({ 
        message: 'Session created successfully',
        sessionId: created.sessionId
      });
    } catch (error) {
      console.error('Error creating session:', error);
      return res.status(500).json({ message: 'Failed to create session' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}