import type { NextApiRequest, NextApiResponse } from 'next';
import { hashPassword } from '@/lib/auth';
import { createUser, getUserByEmail } from '@/lib/db/users';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, password, role } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  if (role !== 'user' && role !== 'reader') {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = await createUser({
      name,
      email,
      password: hashedPassword,
      role
    });

    // If user is a reader, initialize reader profile
    if (role === 'reader') {
      // Initialize default reader profile
      // This would be handled by the createUser function or a separate service
    }

    // Success
    return res.status(201).json({ 
      message: 'User created successfully',
      userId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Failed to create user' });
  }
}