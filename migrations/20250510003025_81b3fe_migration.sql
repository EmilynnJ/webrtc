-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'reader', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user balances table
CREATE TABLE IF NOT EXISTS user_balances (
  user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  available_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reader profiles table
CREATE TABLE IF NOT EXISTS reader_profiles (
  user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  specialty VARCHAR(255),
  rate_per_minute DECIMAL(10, 2) NOT NULL DEFAULT 1.99,
  minimum_session_amount DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  profile_image TEXT,
  bio TEXT,
  status VARCHAR(10) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  rating DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  is_streaming BOOLEAN NOT NULL DEFAULT false,
  stream_title VARCHAR(255),
  stream_thumbnail TEXT,
  viewer_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reader_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0,
  amount_charged DECIMAL(10, 2) DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
  end_reason VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create session messages table
CREATE TABLE IF NOT EXISTS session_messages (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reader earnings table
CREATE TABLE IF NOT EXISTS reader_earnings (
  id SERIAL PRIMARY KEY,
  reader_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'session' CHECK (source IN ('session', 'gift')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create gifts table
CREATE TABLE IF NOT EXISTS gifts (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create gift transactions table
CREATE TABLE IF NOT EXISTS gift_transactions (
  id VARCHAR(36) PRIMARY KEY,
  gift_id VARCHAR(36) NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reader_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default gifts
INSERT INTO gifts (id, name, value, icon_url)
VALUES
  ('g1', 'Star', 1.99, '/images/gifts/star.png'),
  ('g2', 'Heart', 4.99, '/images/gifts/heart.png'),
  ('g3', 'Crystal Ball', 9.99, '/images/gifts/crystal.png'),
  ('g4', 'Cosmic Energy', 19.99, '/images/gifts/cosmic.png');

-- Create sample user for testing
INSERT INTO users (id, name, email, password, role)
VALUES (
  'u1', 
  'Test User', 
  'user@example.com', 
  '$2a$12$k8Y1N.5AIbPfEYd/F4eTB.TVlIGlChAGNJ2e6XvRI65V4JrMPFIsm', -- password: password123
  'user'
);

-- Create sample reader for testing
INSERT INTO users (id, name, email, password, role)
VALUES (
  'r1', 
  'Mystic Reader', 
  'reader@example.com', 
  '$2a$12$k8Y1N.5AIbPfEYd/F4eTB.TVlIGlChAGNJ2e6XvRI65V4JrMPFIsm', -- password: password123
  'reader'
);

-- Set up initial balance for test user
INSERT INTO user_balances (user_id, available_balance)
VALUES ('u1', 50.00);

-- Set up reader profile
INSERT INTO reader_profiles (
  user_id, 
  specialty, 
  rate_per_minute, 
  minimum_session_amount, 
  status, 
  rating,
  total_reviews
)
VALUES (
  'r1', 
  'Tarot Reading & Spiritual Guidance', 
  1.99, 
  10.00, 
  'online', 
  4.8,
  24
);