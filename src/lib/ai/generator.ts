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

function getSystemPrompt(section: Section, sub_type: SubType): string {
  if (section === 'reading') return READING_SYSTEM_PROMPT
  if (section === 'listening') return LISTENING_SYSTEM_PROMPT
  if (section === 'writing') return WRITING_SYSTEM_PROMPT
  return SPEAKING_SYSTEM_PROMPT
}

function getUserPrompt(req: GenerationRequest): string {
  const vars = {
    topic: req.topic ?? 'academic (choose an interesting topic)',
    difficulty: req.difficulty ?? 'medium',
    count: req.count ?? 3,
    grammar_focus: req.topic ?? 'relative clauses',
    passage_content: req.passage_content ?? '',
    question_type: 'mixed',
  }

  if (req.section === 'reading') {
    if (req.passage_content) return interpolate(READING_STANDALONE_TEMPLATE, vars)
    return interpolate(READING_PASSAGE_TEMPLATE, vars)
  }

  if (req.section === 'listening') {
    if (req.sub_type === 'multiple_choice') {
      if (req.topic?.includes('exchange') || (req.count ?? 3) === 1) {
        return interpolate(LISTENING_SHORT_EXCHANGE_TEMPLATE, vars)
      }
      return interpolate(LISTENING_LECTURE_TEMPLATE, vars)
    }
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

  const systemPrompt = req.custom_system_prompt ?? getSystemPrompt(req.section, req.sub_type)
  const userPrompt = req.custom_user_prompt ?? getUserPrompt(req)
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

  const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(jsonText)

  const result: GenerationResult = {
    questions: [],
    raw_response: rawText,
    model_used: model,
    tokens_used: message.usage.input_tokens + message.usage.output_tokens,
  }

  if (parsed.passage) {
    result.passage = {
      section: req.section as 'reading' | 'listening',
      title: parsed.passage.title,
      content: parsed.passage.content,
      word_count: parsed.passage.word_count,
      topics: parsed.passage.topics,
      source: 'ai_generated',
      status: 'draft',
    }
  }

  if (parsed.questions) {
    result.questions = parsed.questions.map((q: Record<string, unknown>) => ({
      section: req.section,
      sub_type: req.sub_type,
      question_text: q.question_text as string,
      options: q.options ?? null,
      correct_answer: q.correct_answer ?? null,
      explanation: q.explanation ?? null,
      difficulty: req.difficulty ?? 'medium',
      ai_generated: true,
      status: 'draft',
      generation_metadata: {
        model,
        topic: req.topic,
        question_type: q.question_type,
      },
    }))
  } else if (parsed.question_text) {
    // Single question response
    result.questions = [
      {
        section: req.section,
        sub_type: req.sub_type,
        question_text: parsed.question_text as string,
        options: parsed.options ?? null,
        correct_answer: parsed.correct_answer ?? null,
        explanation: parsed.explanation ?? null,
        difficulty: req.difficulty ?? 'medium',
        ai_generated: true,
        status: 'draft',
        generation_metadata: { model, topic: req.topic },
      },
    ]
  } else if (parsed.questions === undefined && parsed.topic_title) {
    // Speaking interview
    result.questions = (parsed.questions as Record<string, unknown>[] ?? []).map(
      (q: Record<string, unknown>) => ({
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
