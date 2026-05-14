-- ── Timed Drill feature ──────────────────────────────────────────────────────

-- Shared daily question pool (one record per school per type per day)
-- Ensures every student from the same school sees identical questions each day
CREATE TABLE IF NOT EXISTS public.daily_question_seeds (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_key   TEXT NOT NULL,  -- school abbreviation (e.g. "UNILAG") or 'GENERAL'
  seed_date    DATE NOT NULL,
  seed_type    TEXT NOT NULL CHECK (seed_type IN ('drill', 'quiz')),
  question_ids TEXT[] NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_key, seed_date, seed_type)
);

-- One drill session per user per day
CREATE TABLE IF NOT EXISTS public.drill_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_key     TEXT NOT NULL,
  session_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at   TIMESTAMPTZ,
  score          INT NOT NULL DEFAULT 0,
  total_answered INT NOT NULL DEFAULT 0,
  time_used_ms   BIGINT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_date)
);

-- Per-question answers within a drill session
CREATE TABLE IF NOT EXISTS public.drill_answers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES public.drill_sessions(id) ON DELETE CASCADE,
  question_id         UUID NOT NULL REFERENCES public.questions(id),
  selected_option_id  UUID REFERENCES public.options(id),
  is_correct          BOOLEAN NOT NULL DEFAULT false,
  time_taken_ms       INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);

ALTER TABLE public.daily_question_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drill_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drill_answers         ENABLE ROW LEVEL SECURITY;

-- service_role (admin client) bypasses RLS — these are belt-and-suspenders
CREATE POLICY "service_all_seeds"          ON public.daily_question_seeds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_drill_sessions" ON public.drill_sessions        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_drill_answers"  ON public.drill_answers          FOR ALL USING (true) WITH CHECK (true);

-- Authenticated users can read (for leaderboard)
CREATE POLICY "auth_read_seeds"          ON public.daily_question_seeds FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_drill_sessions" ON public.drill_sessions        FOR SELECT TO authenticated USING (true);
