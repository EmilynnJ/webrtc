import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionById, updateSessionBilling } from '@/lib/db/sessions';
import { deductUserBalance } from '@/lib/db/users';
import { addReaderEarnings } from '@/lib/db/readers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Handle POST request (process session payment)
  if (req.method === 'POST') {
    try {
      const { sessionId, amount, duration } = req.body;
      
      // Validate input
      if (!sessionId || isNaN(amount) || amount <= 0 || isNaN(duration) || duration <= 0) {
        return res.status(400).json({ message: 'Invalid payment details' });
      }
      
      // Get current session
      const currentSession = await getSessionById(sessionId);
      
      if (!currentSession) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Validate session status
      if (currentSession.status !== 'active' && currentSession.status !== 'waiting') {
        return res.status(400).json({ message: 'Session is not active' });
      }
      
      // Deduct from user balance
      const balanceDeducted = await deductUserBalance(currentSession.userId, amount);
      
      if (!balanceDeducted) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Add to reader earnings
      await addReaderEarnings(currentSession.readerId, amount);
      
      // Update session billing info
      await updateSessionBilling(sessionId, amount, duration);
      
      return res.status(200).json({ 
        message: 'Payment processed successfully',
        remainingBalance: balanceDeducted.availableBalance
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      return res.status(500).json({ message: 'Failed to process payment' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}