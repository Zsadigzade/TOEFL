export type Section = 'reading' | 'listening' | 'writing' | 'speaking'
export type QuestionStatus = 'draft' | 'approved' | 'active' | 'archived'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed'

export type SubType =
  | 'multiple_choice'
  | 'short_exchange'
  | 'build_sentence'
  | 'academic_discussion'
  | 'interview'

export interface Option {
  label: string
  text: string
}

export interface Passage {
  id: string
  section: 'reading' | 'listening'
  title: string | null
  content: string
  word_count: number | null
  difficulty: Difficulty | null
  topics: string[] | null
  source: string
  status: QuestionStatus
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  passage_id: string | null
  section: Section
  sub_type: SubType
  question_text: string
  options: Option[] | null
  correct_answer: string | null
  explanation: string | null
  difficulty: Difficulty | null
  tags: string[] | null
  status: QuestionStatus
  ai_generated: boolean
  generation_metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  passage?: Passage
}

export interface GenerationJob {
  id: string
  status: JobStatus
  section: Section
  sub_type: SubType | null
  requested_count: number
  generated_count: number
  settings: GenerationSettings | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface GenerationSettings {
  model: string
  temperature: number
  max_tokens: number
  prompt_version?: string
  topic?: string
  difficulty?: Difficulty
  passage_id?: string
}

export interface AISettings {
  id: string
  section: Section
  sub_type: SubType
  system_prompt: string
  user_prompt_template: string
  model: string
  temperature: number
  max_tokens: number
  example_questions: Question[] | null
  updated_at: string
}

export interface AdminStats {
  total_questions: number
  approved_questions: number
  draft_questions: number
  active_questions: number
  by_section: Record<Section, number>
  recent_jobs: GenerationJob[]
}
