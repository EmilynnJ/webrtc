import type { NextApiRequest, NextApiResponse } from 'next';
import { deductUserBalance } from '@/lib/db/users';
import { addReaderEarnings } from '@/lib/db/readers';
import { recordGift } from '@/lib/db/gifts';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Handle POST request (process gift payment)
  if (req.method === 'POST') {
    try {
      const { giftId, readerId, amount } = req.body;
      
      // Validate input
      if (!giftId || !readerId || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid gift details' });
      }
      
      // Deduct from user balance
      const balanceDeducted = await deductUserBalance(session.user.id, amount);
      
      if (!balanceDeducted) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Add to reader earnings
      await addReaderEarnings(readerId, amount);
      
      // Record gift
      await recordGift({
        giftId,
        userId: session.user.id,
        readerId,
        amount
      });
      
      return res.status(200).json({ 
        message: 'Gift sent successfully',
        remainingBalance: balanceDeducted.availableBalance
      });
    } catch (error) {
      console.error('Error processing gift:', error);
      return res.status(500).json({ message: 'Failed to send gift' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}