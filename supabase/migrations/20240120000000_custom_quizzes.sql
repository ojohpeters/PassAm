-- ── Quizbot — admin-created shareable quizzes ─────────────────────────────

CREATE TABLE public.custom_quizzes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  code        TEXT UNIQUE NOT NULL,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- All question content denormalized so edits to bank don't break live quizzes
CREATE TABLE public.custom_quiz_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id          UUID NOT NULL REFERENCES public.custom_quizzes(id) ON DELETE CASCADE,
  order_index      INT NOT NULL DEFAULT 0,
  source           TEXT NOT NULL CHECK (source IN ('bank', 'custom')),
  bank_question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  q_text           TEXT NOT NULL,
  opt_a            TEXT NOT NULL,
  opt_b            TEXT NOT NULL,
  opt_c            TEXT NOT NULL,
  opt_d            TEXT NOT NULL,
  correct          TEXT NOT NULL CHECK (correct IN ('A','B','C','D')),
  explanation      TEXT,
  subject_label    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attempts — user_id nullable for non-authed takers
CREATE TABLE public.custom_quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id      UUID NOT NULL REFERENCES public.custom_quizzes(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  score        INT NOT NULL DEFAULT 0,
  total        INT NOT NULL DEFAULT 0,
  answers      JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_quizzes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_quiz_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_quizzes"       ON public.custom_quizzes       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_quiz_items"    ON public.custom_quiz_items    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_quiz_attempts" ON public.custom_quiz_attempts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_read_active_quizzes" ON public.custom_quizzes    FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_quiz_items"     ON public.custom_quiz_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.custom_quizzes q WHERE q.id = quiz_id AND q.is_active = true)
);
CREATE POLICY "public_insert_attempts" ON public.custom_quiz_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_attempts"   ON public.custom_quiz_attempts FOR SELECT USING (completed_at IS NOT NULL);
CREATE POLICY "public_update_own_attempt" ON public.custom_quiz_attempts FOR UPDATE USING (true) WITH CHECK (true);
