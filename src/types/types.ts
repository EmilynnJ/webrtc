// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'reader' | 'admin';
  createdAt: Date;
}

export interface UserBalance {
  userId: string;
  availableBalance: number;
  lastUpdated: Date;
}

// Reader types
export interface Reader {
  id: string;
  name: string;
  specialty: string;
  ratePerMinute: number;
  minimumSessionAmount: number;
  status: 'online' | 'offline' | 'busy';
  profileImage?: string;
  bio?: string;
  rating: number;
  totalReviews: number;
  isStreaming?: boolean;
  streamTitle?: string;
  streamThumbnail?: string;
  viewerCount?: number;
  earnings?: {
    today: number;
    week: number;
    month: number;
  };
}

export interface ReaderProfile extends Reader {
  earnings: {
    today: number;
    week: number;
    month: number;
  };
}

// Session types
export interface Session {
  id: string;
  userId: string;
  readerId: string;
  userName?: string;
  readerName?: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  amountCharged: number;
  status: 'waiting' | 'active' | 'ended';
}

// Gift types
export interface Gift {
  id: string;
  name: string;
  value: number;
  iconUrl?: string;
}

// Extend next-auth session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    }
  }
}