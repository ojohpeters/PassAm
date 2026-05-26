ALTER TABLE public.user_api_keys
  ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
