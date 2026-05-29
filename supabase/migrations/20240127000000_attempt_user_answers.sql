-- Stores exam answers for personal/community bank questions mixed into an attempt
CREATE TABLE IF NOT EXISTS public.attempt_user_answers (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id       UUID        NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  user_question_id UUID        NOT NULL REFERENCES public.user_questions(id) ON DELETE CASCADE,
  subject_name     TEXT,
  selected_option  TEXT        CHECK (selected_option IN ('A','B','C','D')),
  is_correct       BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, user_question_id)
);

ALTER TABLE public.attempt_user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON public.attempt_user_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts ea
      WHERE ea.id = attempt_id AND ea.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_attempts ea
      WHERE ea.id = attempt_id AND ea.user_id = auth.uid()
    )
  );
