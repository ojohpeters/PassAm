-- Comprehension passages: parent records shared across related questions
CREATE TABLE IF NOT EXISTS public.passages (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  text       TEXT        NOT NULL,
  title      TEXT,
  subject_id UUID        REFERENCES public.subjects(id) ON DELETE SET NULL,
  school_id  UUID        REFERENCES public.schools(id)  ON DELETE SET NULL,
  year       INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link questions to their parent passage (null = standalone question)
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS passage_id UUID REFERENCES public.passages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_questions_passage_id ON public.questions (passage_id);

-- RLS: authenticated users can read passages (joined via questions they already have access to)
ALTER TABLE public.passages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read passages"
  ON public.passages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage passages"
  ON public.passages FOR ALL
  USING  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');
