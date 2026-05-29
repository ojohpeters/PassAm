-- Community question sharing: users can submit personal questions for community review
ALTER TABLE public.user_questions
  ADD COLUMN IF NOT EXISTS is_public         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderation_status TEXT    NOT NULL DEFAULT 'private'
    CHECK (moderation_status IN ('private','pending','approved','rejected','flagged')),
  ADD COLUMN IF NOT EXISTS moderation_note   TEXT;

-- Allow any authenticated user to read approved public questions
-- (the existing owner_select policy still covers private ones)
CREATE POLICY "community_read" ON public.user_questions
  FOR SELECT
  USING (is_public = true AND moderation_status = 'approved');

-- Fast index for the community browse page
CREATE INDEX IF NOT EXISTS idx_uq_community
  ON public.user_questions (moderation_status, created_at DESC)
  WHERE is_public = true AND moderation_status = 'approved';

-- Reports: each user can flag a public question once
CREATE TABLE IF NOT EXISTS public.question_reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID        NOT NULL REFERENCES public.user_questions(id) ON DELETE CASCADE,
  reporter_id UUID        NOT NULL REFERENCES public.profiles(id)       ON DELETE CASCADE,
  reason      TEXT        NOT NULL CHECK (char_length(reason) BETWEEN 5 AND 500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_id, reporter_id)
);

ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_insert" ON public.question_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "report_own_select" ON public.question_reports
  FOR SELECT USING (auth.uid() = reporter_id);
