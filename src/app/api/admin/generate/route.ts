import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateQuestions } from '@/lib/ai/generator'
import { Section, SubType, Difficulty } from '@/lib/types'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const body = await request.json()

  const { section, sub_type, topic, difficulty, count = 1 } = body as {
    section: Section
    sub_type: SubType
    topic?: string
    difficulty?: Difficulty
    count?: number
  }

  // Fetch custom settings if they exist
  const settingIdSuffix =
    sub_type === 'multiple_choice' ? 'mc' :
    sub_type === 'short_exchange' ? 'se' :
    sub_type === 'build_sentence' ? 'build' :
    sub_type === 'academic_discussion' ? 'discussion' :
    sub_type
  const settingId = `${section}_${settingIdSuffix}`
  const { data: customSettings } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('id', settingId)
    .single()

  // Create job record
  const { data: job, error: jobErr } = await supabase
    .from('generation_jobs')
    .insert({
      section,
      sub_type,
      requested_count: count,
      status: 'running',
      started_at: new Date().toISOString(),
      settings: { topic, difficulty, model: customSettings?.model ?? 'claude-sonnet-4-6' },
    })
    .select()
    .single()

  if (jobErr) {
    return NextResponse.json({ error: `Failed to create job: ${jobErr.message}` }, { status: 500 })
  }

  let generatedCount = 0
  let errorMessage: string | undefined

  try {
    const innerCount =
      section === 'reading' ? 5 :
      sub_type === 'short_exchange' ? 1 :
      3

    let totalTokens = 0
    const results = await Promise.all(
      Array.from({ length: count }).map(() =>
        generateQuestions({
          section,
          sub_type,
          topic,
          difficulty,
          count: innerCount,
          model: customSettings?.model,
          temperature: customSettings?.temperature,
          max_tokens: customSettings?.max_tokens,
          custom_system_prompt: customSettings?.system_prompt,
          custom_user_prompt: customSettings?.user_prompt_template,
        }),
      ),
    )

    for (const result of results) {
      totalTokens += result.tokens_used ?? 0

      // Save passage if generated
      let passageId: string | null = null
      if (result.passage) {
        const { data: savedPassage, error: passageErr } = await supabase
          .from('passages')
          .insert(result.passage)
          .select('id')
          .single()
        if (passageErr) throw new Error(`Passage insert failed: ${passageErr.message}`)
        passageId = savedPassage?.id ?? null
      }

      // Save questions
      const questionsToSave = result.questions.map((q) => ({
        ...q,
        passage_id: passageId,
      }))

      if (questionsToSave.length > 0) {
        const { error: qErr } = await supabase.from('questions').insert(questionsToSave)
        if (qErr) throw new Error(`Question insert failed: ${qErr.message}`)
        generatedCount += questionsToSave.length
      }
    }

    if (generatedCount === 0) {
      throw new Error('AI response parsed successfully but no questions could be extracted. Check the prompt format.')
    }

    // Update job as completed
    await supabase
      .from('generation_jobs')
      .update({
        status: 'completed',
        generated_count: generatedCount,
        completed_at: new Date().toISOString(),
        settings: { topic, difficulty, model: customSettings?.model ?? 'claude-sonnet-4-6', tokens_used: totalTokens },
      })
      .eq('id', job?.id)

    return NextResponse.json({ success: true, generated: generatedCount, job_id: job?.id, tokens_used: totalTokens })
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Unknown error'

    await supabase
      .from('generation_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job?.id)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('generation_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data ?? [])
}
