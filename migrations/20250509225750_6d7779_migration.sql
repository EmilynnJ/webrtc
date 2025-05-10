-- Create WebRTC sessions table
CREATE TABLE IF NOT EXISTS webrtc_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL UNIQUE,
  user_id VARCHAR(50) NOT NULL,
  reader_id VARCHAR(50) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  amount_charged DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create session messages table for chat
CREATE TABLE IF NOT EXISTS session_messages (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  sender_id VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES webrtc_sessions(session_id) ON DELETE CASCADE
);

-- Create payment records table
CREATE TABLE IF NOT EXISTS session_payments (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  payment_intent_id VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES webrtc_sessions(session_id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON webrtc_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_reader_id ON webrtc_sessions(reader_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON session_messages(session_id);