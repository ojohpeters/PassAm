-- Error tags: students log why they got a question wrong
CREATE TABLE IF NOT EXISTS public.question_error_tags (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID        NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT question_error_tags_uniq UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS question_error_tags_user_idx ON public.question_error_tags (user_id);

ALTER TABLE public.question_error_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own error tags"
  ON public.question_error_tags FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
