-- DeHart Quote System Database Schema
-- Run this in your Neon SQL Editor to create the submissions table

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  project_type VARCHAR(100),
  unit_type VARCHAR(100),
  quality VARCHAR(100),
  access VARCHAR(100),
  sqft VARCHAR(50),
  estimate_range VARCHAR(100),
  message TEXT,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed'))
);

-- For existing databases, add the address column if it doesn't exist
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS address TEXT;

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- Create an index on timestamp for faster sorting
CREATE INDEX IF NOT EXISTS idx_submissions_timestamp ON submissions(timestamp DESC);
