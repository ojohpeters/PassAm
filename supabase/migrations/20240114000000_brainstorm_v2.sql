-- ── Brainstorm v2: real-time Q&A ────────────────────────────────────────────

-- Hosts (admin-managed, can be disabled without removing)
CREATE TABLE IF NOT EXISTS brainstorm_hosts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  granted_by  UUID REFERENCES profiles(id),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add live-session state to existing sessions table
ALTER TABLE brainstorm_sessions
  ADD COLUMN IF NOT EXISTS is_live   BOOLEAN    NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ended_at  TIMESTAMPTZ;

-- Questions pushed by the host during a live session
CREATE TABLE IF NOT EXISTS brainstorm_pushed_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id)           ON DELETE CASCADE,
  pushed_by   UUID NOT NULL REFERENCES profiles(id),
  pushed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  push_order  INT  NOT NULL DEFAULT 1,
  UNIQUE(session_id, question_id)
);

-- Student answers to pushed questions
CREATE TABLE IF NOT EXISTS brainstorm_answers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pushed_question_id  UUID NOT NULL REFERENCES brainstorm_pushed_questions(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_option_id  UUID NOT NULL REFERENCES options(id)  ON DELETE CASCADE,
  is_correct          BOOLEAN NOT NULL,
  points_awarded      INT     NOT NULL DEFAULT 0,
  answered_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pushed_question_id, user_id)
);

-- RLS
ALTER TABLE brainstorm_hosts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorm_pushed_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorm_answers            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_brainstorm_hosts"    ON brainstorm_hosts            FOR SELECT USING (true);
CREATE POLICY "public_read_pushed_questions"    ON brainstorm_pushed_questions FOR SELECT USING (true);
CREATE POLICY "public_read_brainstorm_answers"  ON brainstorm_answers          FOR SELECT USING (true);

-- Enable Realtime for live tables
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE brainstorm_pushed_questions;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE brainstorm_answers;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE brainstorm_sessions;
EXCEPTION WHEN others THEN NULL;
END $$;
