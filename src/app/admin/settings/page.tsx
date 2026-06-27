import { createServiceClient } from '@/lib/supabase/server'
import { AISettingsEditor } from '@/components/admin/AISettingsEditor'
import { READING_SYSTEM_PROMPT, READING_PASSAGE_TEMPLATE } from '@/lib/ai/prompts/reading'
import { LISTENING_SYSTEM_PROMPT, LISTENING_SHORT_EXCHANGE_TEMPLATE, LISTENING_LECTURE_TEMPLATE } from '@/lib/ai/prompts/listening'
import { WRITING_SYSTEM_PROMPT, WRITING_BUILD_SENTENCE_TEMPLATE, WRITING_ACADEMIC_DISCUSSION_TEMPLATE } from '@/lib/ai/prompts/writing'
import { SPEAKING_SYSTEM_PROMPT, SPEAKING_INTERVIEW_TEMPLATE } from '@/lib/ai/prompts/speaking'

const DEFAULT_SETTINGS = [
  { id: 'reading_mc', section: 'reading', sub_type: 'multiple_choice', system_prompt: READING_SYSTEM_PROMPT, user_prompt_template: READING_PASSAGE_TEMPLATE, model: 'claude-sonnet-4-6', temperature: 0.7, max_tokens: 4096 },
  { id: 'listening_se', section: 'listening', sub_type: 'short_exchange', system_prompt: LISTENING_SYSTEM_PROMPT, user_prompt_template: LISTENING_SHORT_EXCHANGE_TEMPLATE, model: 'claude-sonnet-4-6', temperature: 0.7, max_tokens: 1024 },
  { id: 'listening_mc', section: 'listening', sub_type: 'multiple_choice', system_prompt: LISTENING_SYSTEM_PROMPT, user_prompt_template: LISTENING_LECTURE_TEMPLATE, model: 'claude-sonnet-4-6', temperature: 0.7, max_tokens: 4096 },
  { id: 'writing_build', section: 'writing', sub_type: 'build_sentence', system_prompt: WRITING_SYSTEM_PROMPT, user_prompt_template: WRITING_BUILD_SENTENCE_TEMPLATE, model: 'claude-sonnet-4-6', temperature: 0.6, max_tokens: 2048 },
  { id: 'writing_discussion', section: 'writing', sub_type: 'academic_discussion', system_prompt: WRITING_SYSTEM_PROMPT, user_prompt_template: WRITING_ACADEMIC_DISCUSSION_TEMPLATE, model: 'claude-sonnet-4-6', temperature: 0.8, max_tokens: 3000 },
  { id: 'speaking_interview', section: 'speaking', sub_type: 'interview', system_prompt: SPEAKING_SYSTEM_PROMPT, user_prompt_template: SPEAKING_INTERVIEW_TEMPLATE, model: 'claude-sonnet-4-6', temperature: 0.8, max_tokens: 2048 },
]

export default async function SettingsPage() {
  const supabase = createServiceClient()
  const { data: savedSettings } = await supabase.from('ai_settings').select('*')

  const mergedSettings = DEFAULT_SETTINGS.map((def) => {
    const saved = savedSettings?.find((s) => s.id === def.id)
    return saved ?? def
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure prompts, model, and generation parameters per section
        </p>
      </div>
      <AISettingsEditor settings={mergedSettings} defaults={DEFAULT_SETTINGS} />
    </div>
  )
}
