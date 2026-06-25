-- 1v1 challenge tables
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  subject_name TEXT NOT NULL,
  num_questions INTEGER NOT NULL DEFAULT 20,
  time_limit_secs INTEGER NOT NULL DEFAULT 1800,
  question_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  display_name TEXT NOT NULL,
  is_creator BOOLEAN NOT NULL DEFAULT false,
  score INTEGER,
  time_taken_secs INTEGER,
  answers JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenges_code ON challenges(code);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can read challenges (guests need to view them)
CREATE POLICY "challenges_public_read" ON challenges FOR SELECT USING (true);
CREATE POLICY "challenges_auth_insert" ON challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "challenges_auth_update" ON challenges FOR UPDATE TO authenticated USING (true);

-- Participants: anyone can read, insert (guests), and update (server validates)
CREATE POLICY "participants_public_read" ON challenge_participants FOR SELECT USING (true);
CREATE POLICY "participants_anyone_insert" ON challenge_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "participants_anyone_update" ON challenge_participants FOR UPDATE USING (true);
