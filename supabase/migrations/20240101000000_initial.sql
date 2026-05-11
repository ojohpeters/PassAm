-- PassAm — initial schema
-- Run via: supabase db push

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Student',
  role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'ADMIN')),
  subscription_status TEXT NOT NULL DEFAULT 'FREE' CHECK (subscription_status IN ('FREE', 'PRO')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL UNIQUE,
  location TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  image_url TEXT,
  explanation TEXT,
  year INTEGER,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (label IN ('A', 'B', 'C', 'D')),
  text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  time_taken_secs INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attempt_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.options(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.daily_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS public.daily_quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_quiz_id UUID NOT NULL REFERENCES public.daily_quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.options(id) ON DELETE SET NULL,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(daily_quiz_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('WRONG_ANSWER', 'TYPO', 'SUGGESTION')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('DAILY_QUIZ_READY', 'STREAK_REMINDER', 'GENERAL')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_schools BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_subjects BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_questions BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_exam_attempts BEFORE UPDATE ON public.exam_attempts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_daily_quizzes BEFORE UPDATE ON public.daily_quizzes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_feedback BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_notifications BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, subscription_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Student'),
    'STUDENT',
    'FREE'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "users_own_profile_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_profile_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "service_can_insert_profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- Schools & subjects — public read
CREATE POLICY "public_read_schools" ON public.schools FOR SELECT USING (true);
CREATE POLICY "public_read_subjects" ON public.subjects FOR SELECT USING (true);

-- Questions & options — authenticated read
CREATE POLICY "auth_read_questions" ON public.questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_options" ON public.options FOR SELECT USING (auth.role() = 'authenticated');

-- Exam attempts
CREATE POLICY "users_own_attempts_select" ON public.exam_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_attempts_insert" ON public.exam_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_attempts_update" ON public.exam_attempts FOR UPDATE USING (auth.uid() = user_id);

-- Attempt answers
CREATE POLICY "users_own_answers_select" ON public.attempt_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.exam_attempts ea WHERE ea.id = attempt_id AND ea.user_id = auth.uid())
);
CREATE POLICY "users_own_answers_insert" ON public.attempt_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.exam_attempts ea WHERE ea.id = attempt_id AND ea.user_id = auth.uid())
);
CREATE POLICY "users_own_answers_update" ON public.attempt_answers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.exam_attempts ea WHERE ea.id = attempt_id AND ea.user_id = auth.uid())
);

-- Daily quizzes
CREATE POLICY "users_own_daily_quizzes_select" ON public.daily_quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_daily_quizzes_insert" ON public.daily_quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_daily_quizzes_update" ON public.daily_quizzes FOR UPDATE USING (auth.uid() = user_id);

-- Daily quiz questions
CREATE POLICY "users_own_dqq_select" ON public.daily_quiz_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.daily_quizzes dq WHERE dq.id = daily_quiz_id AND dq.user_id = auth.uid())
);
CREATE POLICY "users_own_dqq_insert" ON public.daily_quiz_questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.daily_quizzes dq WHERE dq.id = daily_quiz_id AND dq.user_id = auth.uid())
);
CREATE POLICY "users_own_dqq_update" ON public.daily_quiz_questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.daily_quizzes dq WHERE dq.id = daily_quiz_id AND dq.user_id = auth.uid())
);

-- Streaks
CREATE POLICY "users_own_streak_select" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_streak_insert" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_streak_update" ON public.streaks FOR UPDATE USING (auth.uid() = user_id);

-- Feedback
CREATE POLICY "users_own_feedback_select" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_feedback_insert" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE POLICY "users_own_notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- RPC Functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(
  p_school_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  total_score BIGINT,
  attempts BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ea.user_id,
    p.name,
    SUM(ea.score)::BIGINT AS total_score,
    COUNT(ea.id)::BIGINT AS attempts
  FROM public.exam_attempts ea
  JOIN public.profiles p ON p.id = ea.user_id
  WHERE
    ea.completed_at IS NOT NULL
    AND ea.created_at >= date_trunc('week', NOW())
    AND (p_school_id IS NULL OR ea.school_id = p_school_id)
  GROUP BY ea.user_id, p.name
  ORDER BY total_score DESC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_subject_accuracy(p_user_id UUID)
RETURNS TABLE (
  subject_id UUID,
  subject_name TEXT,
  correct BIGINT,
  total BIGINT,
  accuracy NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    aa.subject_id,
    s.name AS subject_name,
    COUNT(aa.id) FILTER (WHERE aa.is_correct = TRUE)::BIGINT AS correct,
    COUNT(aa.id)::BIGINT AS total,
    CASE
      WHEN COUNT(aa.id) = 0 THEN 0::NUMERIC
      ELSE ROUND(
        COUNT(aa.id) FILTER (WHERE aa.is_correct = TRUE)::NUMERIC
        / COUNT(aa.id) * 100
      )
    END AS accuracy
  FROM public.attempt_answers aa
  JOIN public.subjects s ON s.id = aa.subject_id
  JOIN public.exam_attempts ea ON ea.id = aa.attempt_id
  WHERE ea.user_id = p_user_id AND ea.completed_at IS NOT NULL
  GROUP BY aa.subject_id, s.name
  ORDER BY accuracy ASC;
END;
$$;

-- ============================================================
-- Seed data — schools & subjects
-- ============================================================

INSERT INTO public.schools (name, abbreviation, location) VALUES
  ('University of Lagos',                    'UNILAG',  'Lagos'),
  ('Obafemi Awolowo University',             'OAU',     'Ile-Ife'),
  ('University of Ibadan',                   'UI',      'Ibadan'),
  ('University of Benin',                    'UNIBEN',  'Benin City'),
  ('University of Port Harcourt',            'UNIPORT', 'Port Harcourt'),
  ('Air Force Institute of Technology',      'AFIT',    'Kaduna')
ON CONFLICT (abbreviation) DO NOTHING;

INSERT INTO public.subjects (name) VALUES
  ('Mathematics'),
  ('English Language'),
  ('Biology'),
  ('Chemistry'),
  ('Physics'),
  ('Government'),
  ('Economics'),
  ('Literature in English'),
  ('Geography'),
  ('History')
ON CONFLICT DO NOTHING;
