'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Question, Option, Section, SubType, Difficulty } from '@/lib/types'
import { SECTION_LABELS, SUB_TYPE_LABELS } from '@/lib/utils'
import { Save, Trash2, ArrowLeft, Plus, X } from 'lucide-react'

interface Props {
  question: (Question & { passage?: { id: string; title: string; section: string } | null }) | null
  passages: { id: string; title: string | null; section: string }[]
}

const SUB_TYPES_BY_SECTION: Record<Section, SubType[]> = {
  reading: ['multiple_choice'],
  listening: ['multiple_choice'],
  writing: ['build_sentence', 'academic_discussion'],
  speaking: ['interview'],
}

export function QuestionEditor({ question, passages }: Props) {
  const router = useRouter()
  const isNew = !question

  const [section, setSection] = useState<Section>(question?.section ?? 'reading')
  const [subType, setSubType] = useState<SubType>(question?.sub_type ?? 'multiple_choice')
  const [questionText, setQuestionText] = useState(question?.question_text ?? '')
  const [options, setOptions] = useState<Option[]>(
    question?.options ?? [
      { label: 'A', text: '' },
      { label: 'B', text: '' },
      { label: 'C', text: '' },
      { label: 'D', text: '' },
    ],
  )
  const [correctAnswer, setCorrectAnswer] = useState(question?.correct_answer ?? '')
  const [explanation, setExplanation] = useState(question?.explanation ?? '')
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty ?? 'medium')
  const [status, setStatus] = useState(question?.status ?? 'draft')
  const [passageId, setPassageId] = useState(question?.passage_id ?? '')
  const [tags, setTags] = useState<string[]>(question?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const hasOptions = subType === 'multiple_choice'

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    const body = {
      section,
      sub_type: subType,
      question_text: questionText,
      options: hasOptions ? options : null,
      correct_answer: hasOptions ? correctAnswer : null,
      explanation: explanation || null,
      difficulty,
      status,
      passage_id: passageId || null,
      tags: tags.length > 0 ? tags : null,
    }

    const method = isNew ? 'POST' : 'PATCH'
    const url = isNew ? '/api/admin/questions' : `/api/admin/questions/${question!.id}`

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save question.')
      setSaving(false)
      return
    }

    router.push('/admin/questions')
    router.refresh()
  }

  async function handleDelete() {
    if (!question) return
    if (!confirm('Delete this question permanently?')) return

    await fetch(`/api/admin/questions/${question.id}`, { method: 'DELETE' })
    router.push('/admin/questions')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-white">
          {isNew ? 'New Question' : 'Edit Question'}
        </h1>
      </div>

      <div className="space-y-5">
        {/* Section + Sub-type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Section</label>
            <select
              value={section}
              onChange={(e) => {
                const s = e.target.value as Section
                setSection(s)
                setSubType(SUB_TYPES_BY_SECTION[s][0])
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {(Object.keys(SECTION_LABELS) as Section[]).map((s) => (
                <option key={s} value={s}>{SECTION_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
            <select
              value={subType}
              onChange={(e) => setSubType(e.target.value as SubType)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {SUB_TYPES_BY_SECTION[section].map((st) => (
                <option key={st} value={st}>{SUB_TYPE_LABELS[st]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Passage link */}
        {(section === 'reading' || section === 'listening') && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Linked Passage (optional)
            </label>
            <select
              value={passageId}
              onChange={(e) => setPassageId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No passage</option>
              {passages
                .filter((p) => p.section === section)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.title ?? 'Untitled passage'}</option>
                ))}
            </select>
          </div>
        )}

        {/* Question text */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Question</label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            placeholder="Enter question text…"
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Options */}
        {hasOptions && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={opt.label} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer(opt.label)}
                    className={`w-7 h-7 rounded-full text-xs font-bold shrink-0 border transition-colors ${
                      correctAnswer === opt.label
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                  <input
                    value={opt.text}
                    onChange={(e) => {
                      const next = [...options]
                      next[i] = { ...opt, text: e.target.value }
                      setOptions(next)
                    }}
                    placeholder={`Option ${opt.label}`}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Click a letter to mark it as correct.</p>
          </div>
        )}

        {/* Explanation */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Explanation (optional)
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            placeholder="Why is the correct answer correct?"
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Difficulty + Status */}
        <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Question['status'])}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">
                {tag}
                <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                  <X className="w-3 h-3 text-slate-500 hover:text-white" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() }}}
              placeholder="Add tag…"
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={addTag}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {!isNew && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !questionText.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Question'}
          </button>
        </div>
      </div>
    </div>
  )
}
