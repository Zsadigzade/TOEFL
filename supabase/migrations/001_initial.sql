-- TOEFL Platform Initial Schema

-- Passages (reading/listening texts shared by questions)
CREATE TABLE passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL CHECK (section IN ('reading', 'listening')),
  title TEXT,
  content TEXT NOT NULL,
  word_count INT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topics TEXT[],
  source TEXT DEFAULT 'ai_generated',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passage_id UUID REFERENCES passages(id) ON DELETE SET NULL,
  section TEXT NOT NULL CHECK (section IN ('reading', 'listening', 'writing', 'speaking')),
  sub_type TEXT NOT NULL CHECK (sub_type IN ('multiple_choice', 'build_sentence', 'academic_discussion', 'interview')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'archived')),
  ai_generated BOOLEAN DEFAULT false,
  generation_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Generation jobs
CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  section TEXT NOT NULL CHECK (section IN ('reading', 'listening', 'writing', 'speaking')),
  sub_type TEXT CHECK (sub_type IN ('multiple_choice', 'build_sentence', 'academic_discussion', 'interview')),
  requested_count INT DEFAULT 1,
  generated_count INT DEFAULT 0,
  settings JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI generation settings (one row per section+sub_type combo)
CREATE TABLE ai_settings (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  sub_type TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  model TEXT DEFAULT 'claude-sonnet-4-6',
  temperature FLOAT DEFAULT 0.7,
  max_tokens INT DEFAULT 4096,
  example_questions JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER passages_updated_at
  BEFORE UPDATE ON passages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_questions_section ON questions(section);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_passage_id ON questions(passage_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_generation_jobs_created_at ON generation_jobs(created_at DESC);

-- RLS: only service role can write, anon can read active questions
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Admin (service role) full access
CREATE POLICY "service_full_access_passages" ON passages TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_questions" ON questions TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_jobs" ON generation_jobs TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_settings" ON ai_settings TO service_role USING (true) WITH CHECK (true);

-- Users can read active questions/passages (for later user section)
CREATE POLICY "users_read_active_passages" ON passages FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "users_read_active_questions" ON questions FOR SELECT TO authenticated USING (status = 'active');
