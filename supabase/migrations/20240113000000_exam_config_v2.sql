-- Extend school_exam_config with admin-set duration and required subjects for mock exams
ALTER TABLE school_exam_config
  ADD COLUMN IF NOT EXISTS duration_mins       INTEGER   NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS required_subject_ids UUID[]   NOT NULL DEFAULT '{}';

COMMENT ON COLUMN school_exam_config.duration_mins         IS 'Admin-set mock exam duration in minutes';
COMMENT ON COLUMN school_exam_config.required_subject_ids  IS 'Subjects that must appear in the mock exam for this school';
