'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Section, SubType, Difficulty } from '@/lib/types'
import { SECTION_LABELS, SUB_TYPE_LABELS } from '@/lib/utils'
import { Sparkles, Loader2 } from 'lucide-react'

interface AISettingSummary {
  id: string
  section: string
  sub_type: string
  model: string
  temperature: number
}

interface Props {
  settings: AISettingSummary[]
}

const SUB_TYPES_BY_SECTION: Record<Section, { value: SubType; label: string }[]> = {
  reading: [{ value: 'multiple_choice', label: 'Multiple Choice (with passage)' }],
  listening: [
    { value: 'multiple_choice', label: 'Short Exchange' },
    { value: 'multiple_choice', label: 'Academic Talk' },
  ],
  writing: [
    { value: 'build_sentence', label: 'Build a Sentence' },
    { value: 'academic_discussion', label: 'Academic Discussion' },
  ],
  speaking: [{ value: 'interview', label: 'Interview Questions' }],
}

const TOPIC_SUGGESTIONS: Record<Section, string[]> = {
  reading: [
    'marine biology', 'climate change', 'ancient civilizations', 'cognitive psychology',
    'urban planning', 'renewable energy', 'evolutionary biology', 'economics of trade',
  ],
  listening: [
    'campus life', 'academic advising', 'scientific research', 'history lecture',
    'environmental science', 'psychology class', 'art history',
  ],
  writing: [
    'technology in education', 'remote work', 'social media impact',
    'environmental policy', 'healthcare access', 'urban development',
  ],
  speaking: [
    'cities and urban life', 'commuting and transportation', 'social media',
    'technology habits', 'education systems', 'work-life balance',
  ],
}

export function GenerateForm({ settings }: Props) {
  const router = useRouter()
  const [section, setSection] = useState<Section>('reading')
  const [subType, setSubType] = useState<SubType>('multiple_choice')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [count, setCount] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const currentSetting = settings.find(
    (s) => s.section === section && s.sub_type === subType,
  )

  async function handleGenerate() {
    setGenerating(true)
    setResult(null)

    const res = await fetch('/api/admin/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, sub_type: subType, topic, difficulty, count }),
    })

    const data = await res.json()

    if (res.ok) {
      setResult({ success: true, message: `Generated ${data.generated} question(s) successfully.` })
      router.refresh()
    } else {
      setResult({ success: false, message: data.error ?? 'Generation failed.' })
    }
    setGenerating(false)
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-400" />
        Generate Questions
      </h2>

      <div className="space-y-4">
        {/* Section */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Section</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['reading', 'listening', 'writing', 'speaking'] as Section[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSection(s)
                  setSubType(SUB_TYPES_BY_SECTION[s][0].value)
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                  section === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {SECTION_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-type */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Question Type</label>
          <select
            value={subType}
            onChange={(e) => setSubType(e.target.value as SubType)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SUB_TYPES_BY_SECTION[section].map(({ value, label }) => (
              <option key={`${value}-${label}`} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. marine biology, urban planning…"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {TOPIC_SUGGESTIONS[section].slice(0, 4).map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white rounded transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty + Count */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Count {section === 'reading' ? '(passage sets)' : '(questions)'}
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {currentSetting && (
          <div className="px-3 py-2 bg-slate-800/60 rounded-lg text-xs text-slate-400">
            Model: <span className="text-slate-300">{currentSetting.model}</span> ·
            Temp: <span className="text-slate-300">{currentSetting.temperature}</span>
            {' '}· Custom prompts configured
          </div>
        )}

        {result && (
          <div className={`px-3 py-2 rounded-lg text-sm ${
            result.success
              ? 'bg-green-900/30 border border-green-800 text-green-400'
              : 'bg-red-900/30 border border-red-800 text-red-400'
          }`}>
            {result.message}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate
            </>
          )}
        </button>
      </div>
    </div>
  )
}
