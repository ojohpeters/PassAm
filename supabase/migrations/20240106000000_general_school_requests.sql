-- ── General Practice school ──────────────────────────────────────────────────
-- A virtual school used for cross-school general practice exams
INSERT INTO schools (name, abbreviation)
VALUES ('General Practice', 'GENERAL')
ON CONFLICT DO NOTHING;

-- ── School requests ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  user_name   TEXT,
  user_email  TEXT,
  school_name TEXT        NOT NULL,
  message     TEXT,
  status      TEXT        NOT NULL DEFAULT 'PENDING',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE school_requests ENABLE ROW LEVEL SECURITY;

-- Service role (admin client) bypasses RLS; authenticated users can insert
CREATE POLICY "authenticated_insert_school_requests"
  ON school_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "service_role_all_school_requests"
  ON school_requests FOR ALL
  USING (auth.role() = 'service_role');
