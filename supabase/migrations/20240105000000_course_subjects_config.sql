-- Student course/subject preferences + school exam config

-- Aspiring course and subject selections on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS aspiring_course TEXT,
  ADD COLUMN IF NOT EXISTS student_subject_ids UUID[] NOT NULL DEFAULT '{}';

-- Per-school exam configuration (admin-editable)
CREATE TABLE IF NOT EXISTS public.school_exam_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL DEFAULT 40,
  subject_question_counts JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id)
);

ALTER TABLE public.school_exam_config ENABLE ROW LEVEL SECURITY;

-- Public read so the exam start page can read config
CREATE POLICY "public_read_exam_config" ON public.school_exam_config
  FOR SELECT USING (true);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_school_exam_config
    BEFORE UPDATE ON public.school_exam_config
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
