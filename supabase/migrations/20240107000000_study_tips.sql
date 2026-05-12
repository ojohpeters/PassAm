CREATE TABLE IF NOT EXISTS study_tips (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  image_url    TEXT,
  category     TEXT        NOT NULL DEFAULT 'General',
  type         TEXT        NOT NULL DEFAULT 'TIP',  -- TIP | TRICK | EXAM
  is_published BOOLEAN     NOT NULL DEFAULT false,
  pinned       BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE study_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_tips"
  ON study_tips FOR SELECT
  USING (is_published = true);

CREATE POLICY "service_role_all_tips"
  ON study_tips FOR ALL
  USING (auth.role() = 'service_role');
