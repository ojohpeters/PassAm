-- Persistent AI chat history per user, auto-expires
CREATE TABLE public.ai_chat_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT        NOT NULL,
  provider    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX ai_chat_messages_user_expires ON public.ai_chat_messages (user_id, expires_at);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.ai_chat_messages FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NULL = history disabled; positive int = days to retain
ALTER TABLE public.user_api_keys
  ADD COLUMN IF NOT EXISTS chat_history_days INT;
