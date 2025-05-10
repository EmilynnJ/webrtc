export interface ReaderInfo {
  id: string;
  name: string;
  profileImage?: string;
  specialty: string;
  ratePerMinute: number;
  minimumSessionAmount: number;
  status: 'online' | 'offline' | 'busy';
  rating: number;
  totalReviews: number;
}

export interface UserBalance {
  userId: string;
  availableBalance: number;
  lastUpdated: string;
}

export interface ChatMessage {
  id?: string;
  sessionId: string;
  sender: string;
  message: string;
  timestamp: number;
}

export interface SessionDetails {
  sessionId: string;
  userId: string;
  readerId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  amountCharged: number;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
}