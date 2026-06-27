import Anthropic from '@anthropic-ai/sdk'
import { Section, SubType, Difficulty, Question, Passage } from '@/lib/types'
import {
  READING_SYSTEM_PROMPT,
  READING_PASSAGE_TEMPLATE,
  READING_STANDALONE_TEMPLATE,
} from './prompts/reading'
import {
  LISTENING_SYSTEM_PROMPT,
  LISTENING_SHORT_EXCHANGE_TEMPLATE,
  LISTENING_LECTURE_TEMPLATE,
} from './prompts/listening'
import {
  WRITING_SYSTEM_PROMPT,
  WRITING_BUILD_SENTENCE_TEMPLATE,
  WRITING_ACADEMIC_DISCUSSION_TEMPLATE,
} from './prompts/writing'
import {
  SPEAKING_SYSTEM_PROMPT,
  SPEAKING_INTERVIEW_TEMPLATE,
} from './prompts/speaking'

export interface GenerationRequest {
  section: Section
  sub_type: SubType
  topic?: string
  difficulty?: Difficulty
  count?: number
  passage_id?: string
  passage_content?: string
  model?: string
  temperature?: number
  max_tokens?: number
  custom_system_prompt?: string
  custom_user_prompt?: string
}

export interface GenerationResult {
  passage?: Partial<Passage>
  questions: Partial<Question>[]
  raw_response: string
  model_used: string
  tokens_used?: number
}

function interpolate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
  )
}

function buildVars(req: GenerationRequest): Record<string, string | number> {
  return {
    topic: req.topic ?? 'academic (choose an interesting topic)',
    difficulty: req.difficulty ?? 'medium',
    count: req.count ?? 3,
    grammar_focus: 'mixed grammar structures (relative clauses, passive voice, conditionals)',
    passage_content: req.passage_content ?? '',
    question_type: 'mixed',
  }
}

function getSystemPrompt(section: Section): string {
  if (section === 'reading') return READING_SYSTEM_PROMPT
  if (section === 'listening') return LISTENING_SYSTEM_PROMPT
  if (section === 'writing') return WRITING_SYSTEM_PROMPT
  return SPEAKING_SYSTEM_PROMPT
}

function getUserPrompt(req: GenerationRequest, vars: Record<string, string | number>): string {
  if (req.section === 'reading') {
    if (req.passage_content) return interpolate(READING_STANDALONE_TEMPLATE, vars)
    return interpolate(READING_PASSAGE_TEMPLATE, vars)
  }

  if (req.section === 'listening') {
    if (req.sub_type === 'short_exchange') {
      return interpolate(LISTENING_SHORT_EXCHANGE_TEMPLATE, vars)
    }
    return interpolate(LISTENING_LECTURE_TEMPLATE, vars)
  }

  if (req.section === 'writing') {
    if (req.sub_type === 'build_sentence') {
      return interpolate(WRITING_BUILD_SENTENCE_TEMPLATE, vars)
    }
    return interpolate(WRITING_ACADEMIC_DISCUSSION_TEMPLATE, vars)
  }

  return interpolate(SPEAKING_INTERVIEW_TEMPLATE, vars)
}

export async function generateQuestions(
  req: GenerationRequest,
): Promise<GenerationResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  })

  const vars = buildVars(req)
  const systemPrompt = req.custom_system_prompt ?? getSystemPrompt(req.section)
  const userPrompt = req.custom_user_prompt
    ? interpolate(req.custom_user_prompt, vars)
    : getUserPrompt(req, vars)
  const model = req.model ?? 'claude-sonnet-4-6'

  const message = await client.messages.create({
    model,
    max_tokens: req.max_tokens ?? 4096,
    temperature: req.temperature ?? 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const rawText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonText = jsonMatch ? jsonMatch[1].trim() : rawText.trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error(`AI returned invalid JSON for ${req.section}/${req.sub_type}. Preview: ${rawText.slice(0, 300)}`)
  }

  const result: GenerationResult = {
    questions: [],
    raw_response: rawText,
    model_used: model,
    tokens_used: message.usage.input_tokens + message.usage.output_tokens,
  }

  const p = parsed as Record<string, unknown>

  if (p.passage) {
    const passage = p.passage as Record<string, unknown>
    result.passage = {
      section: req.section as 'reading' | 'listening',
      title: passage.title as string | null,
      content: passage.content as string,
      word_count: passage.word_count as number | null,
      topics: passage.topics as string[] | null,
      source: 'ai_generated',
      status: 'draft',
    }
  }

  if (Array.isArray(p.questions) && !p.topic_title) {
    result.questions = (p.questions as Record<string, unknown>[]).map((q) => ({
      section: req.section,
      sub_type: req.sub_type,
      question_text: q.question_text as string,
      options: (q.options ?? null) as import('@/lib/types').Option[] | null,
      correct_answer: (q.correct_answer ?? null) as string | null,
      explanation: (q.explanation ?? null) as string | null,
      difficulty: req.difficulty ?? 'medium',
      ai_generated: true,
      status: 'draft',
      generation_metadata: {
        model,
        topic: req.topic,
        question_type: q.question_type,
      },
    }))
  } else if (p.question_text) {
    const extra: Record<string, unknown> = {}
    if (p.words_to_arrange) extra.words_to_arrange = p.words_to_arrange
    if (p.context) extra.context = p.context
    if (p.script) extra.script = p.script
    if (p.professor_name) extra.professor_name = p.professor_name
    if (p.sample_response_a) extra.sample_response_a = p.sample_response_a
    if (p.sample_response_b) extra.sample_response_b = p.sample_response_b
    if (p.scoring_criteria) extra.scoring_criteria = p.scoring_criteria
    result.questions = [
      {
        section: req.section,
        sub_type: req.sub_type,
        question_text: p.question_text as string,
        options: (p.options ?? null) as import('@/lib/types').Option[] | null,
        correct_answer: (p.correct_answer ?? null) as string | null,
        explanation: (p.explanation ?? null) as string | null,
        difficulty: req.difficulty ?? 'medium',
        ai_generated: true,
        status: 'draft',
        generation_metadata: { model, topic: req.topic, ...extra },
      },
    ]
  } else if (p.topic_title && Array.isArray(p.questions)) {
    result.questions = (p.questions as Record<string, unknown>[]).map((q) => ({
      section: req.section,
      sub_type: req.sub_type,
      question_text: q.question_text as string,
      options: null,
      correct_answer: null,
      difficulty: req.difficulty ?? 'medium',
      ai_generated: true,
      status: 'draft',
      generation_metadata: { model, topic: req.topic, question_type: q.question_type },
    }),
    )
  }

  return result
}
