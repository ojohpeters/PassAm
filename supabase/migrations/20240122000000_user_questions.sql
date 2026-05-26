-- Personal question bank: each user can store their own questions
CREATE TABLE public.user_questions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  q_text        TEXT        NOT NULL,
  opt_a         TEXT        NOT NULL,
  opt_b         TEXT        NOT NULL,
  opt_c         TEXT        NOT NULL,
  opt_d         TEXT        NOT NULL,
  correct       TEXT        NOT NULL CHECK (correct IN ('A','B','C','D')),
  explanation   TEXT,
  subject_label TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.user_questions FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "owner_insert" ON public.user_questions FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete" ON public.user_questions FOR DELETE  USING (auth.uid() = user_id);

-- Separate table so user API keys are NOT exposed by the publicly-readable profiles policy
CREATE TABLE public.user_api_keys (
  user_id      UUID        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  groq_api_key TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Only the owner can read or write their own key row
CREATE POLICY "owner_all" ON public.user_api_keys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
