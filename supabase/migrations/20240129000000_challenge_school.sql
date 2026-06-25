-- Add school tracking to challenges
-- Run in Supabase SQL Editor

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS school_name TEXT,
  ADD COLUMN IF NOT EXISTS school_source TEXT NOT NULL DEFAULT 'all'
    CHECK (school_source IN ('specific', 'random', 'all'));
