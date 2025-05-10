import type { NextApiRequest, NextApiResponse } from 'next';
import { getReaderById, updateReaderProfile } from '@/lib/db/readers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  // Check authentication for all methods except GET
  if (req.method !== 'GET') {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // For non-GET requests, ensure user has permission
    if (session.user.id !== id && session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  // Handle GET request
  if (req.method === 'GET') {
    try {
      const reader = await getReaderById(id as string);
      
      if (!reader) {
        return res.status(404).json({ message: 'Reader not found' });
      }
      
      return res.status(200).json(reader);
    } catch (error) {
      console.error('Error fetching reader:', error);
      return res.status(500).json({ message: 'Failed to fetch reader' });
    }
  }
  
  // Handle PUT request (update profile)
  if (req.method === 'PUT') {
    try {
      const { specialty, ratePerMinute, minimumSessionAmount, profileImage, bio } = req.body;
      
      // Validate input
      if (ratePerMinute && (isNaN(ratePerMinute) || ratePerMinute <= 0)) {
        return res.status(400).json({ message: 'Rate per minute must be a positive number' });
      }
      
      if (minimumSessionAmount && (isNaN(minimumSessionAmount) || minimumSessionAmount <= 0)) {
        return res.status(400).json({ message: 'Minimum session amount must be a positive number' });
      }
      
      // Update profile
      const updated = await updateReaderProfile(id as string, {
        specialty,
        ratePerMinute,
        minimumSessionAmount,
        profileImage,
        bio
      });
      
      if (!updated) {
        return res.status(404).json({ message: 'Reader not found' });
      }
      
      return res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating reader profile:', error);
      return res.status(500).json({ message: 'Failed to update profile' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}