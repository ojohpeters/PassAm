-- ── Community: WhatsApp visibility on profiles ──────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_whatsapp BOOLEAN DEFAULT false;

-- ── Log attendants (admin-appointed) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS log_attendants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  granted_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Brainstorming sessions (one per day) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS brainstorm_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  title        TEXT,
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Session attendance + first-answer counter ─────────────────────────────────
CREATE TABLE IF NOT EXISTS brainstorm_attendance (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_answers  INT  NOT NULL DEFAULT 0,
  logged_by      UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_id)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE log_attendants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorm_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorm_attendance ENABLE ROW LEVEL SECURITY;

-- Everyone can read (public leaderboard)
CREATE POLICY "public_read_log_attendants"   ON log_attendants       FOR SELECT USING (true);
CREATE POLICY "public_read_sessions"         ON brainstorm_sessions  FOR SELECT USING (true);
CREATE POLICY "public_read_attendance"       ON brainstorm_attendance FOR SELECT USING (true);

-- Only service_role can write (all writes go via admin client)
