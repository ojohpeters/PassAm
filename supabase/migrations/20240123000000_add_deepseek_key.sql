ALTER TABLE public.user_api_keys
  ADD COLUMN IF NOT EXISTS deepseek_api_key TEXT;
