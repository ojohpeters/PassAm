-- Add time limit and calculator toggle to custom_quizzes
ALTER TABLE public.custom_quizzes
  ADD COLUMN IF NOT EXISTS time_limit_minutes INT,
  ADD COLUMN IF NOT EXISTS show_calculator BOOLEAN NOT NULL DEFAULT false;
