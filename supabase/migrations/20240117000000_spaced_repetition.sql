-- Add spaced-repetition fields to question_error_tags
ALTER TABLE public.question_error_tags
  ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interval_days  INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS ease           FLOAT   NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS review_count   INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows: schedule first review 3 days after tagging
UPDATE public.question_error_tags
SET next_review_at = created_at + INTERVAL '3 days'
WHERE next_review_at IS NULL;

-- Index for efficient "what's due today?" queries
CREATE INDEX IF NOT EXISTS question_error_tags_review_idx
  ON public.question_error_tags (user_id, next_review_at);
