-- Question Sets: named curated quiz pages
CREATE TABLE IF NOT EXISTS public.question_sets (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT        NOT NULL,
  slug         TEXT        NOT NULL UNIQUE,
  description  TEXT,
  emoji        TEXT        NOT NULL DEFAULT '📚',
  school_id    UUID        REFERENCES public.schools(id) ON DELETE SET NULL,
  is_published BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction: questions in a set
CREATE TABLE IF NOT EXISTS public.question_set_questions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id      UUID        NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
  question_id UUID        NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  in_bank     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT question_set_questions_uniq UNIQUE (set_id, question_id)
);

CREATE INDEX IF NOT EXISTS question_set_questions_set_idx ON public.question_set_questions (set_id);

-- Flag on questions: false = set-only, won't appear in drills/exams
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS is_bank_question BOOLEAN NOT NULL DEFAULT true;

-- RLS for question_sets: students can read published sets
ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published sets are publicly readable"
  ON public.question_sets FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins manage sets"
  ON public.question_sets FOR ALL
  USING  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

-- RLS for question_set_questions: same as above
ALTER TABLE public.question_set_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Set questions readable for published sets"
  ON public.question_set_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.question_sets s
      WHERE s.id = set_id AND s.is_published = true
    )
  );

CREATE POLICY "Admins manage set questions"
  ON public.question_set_questions FOR ALL
  USING  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');
