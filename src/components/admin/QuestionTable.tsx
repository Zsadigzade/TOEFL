'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Question } from '@/lib/types'
import {
  STATUS_COLORS, DIFFICULTY_COLORS, SECTION_LABELS,
  SUB_TYPE_LABELS, truncate, formatDate,
} from '@/lib/utils'
import { ChevronLeft, ChevronRight, ExternalLink, Bot, CheckSquare, Square, Loader2 } from 'lucide-react'

interface Props {
  questions: (Question & { passage?: { id: string; title: string; section: string } | null })[]
  page: number
  totalPages: number
  params: Record<string, string | undefined>
}

export function QuestionTable({ questions, page, totalPages, params }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  function buildPageUrl(p: number) {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v) })
    sp.set('page', String(p))
    return `/admin/questions?${sp.toString()}`
  }

  function toggleAll() {
    if (selected.size === questions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(questions.map((q) => q.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkUpdate(status: string) {
    setBulkLoading(true)
    await fetch('/api/admin/questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected), status }),
    })
    setSelected(new Set())
    setBulkLoading(false)
    router.refresh()
  }

  const allSelected = questions.length > 0 && selected.size === questions.length
  const someSelected = selected.size > 0

  if (questions.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <p className="text-slate-400 text-sm">No questions found.</p>
        <Link
          href="/admin/generate"
          className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300"
        >
          Generate with AI →
        </Link>
      </div>
    )
  }

  return (
    <div>
      {someSelected && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg">
          <span className="text-xs text-slate-400">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            {(['approved', 'active', 'archived', 'draft'] as const).map((s) => (
              <button
                key={s}
                onClick={() => bulkUpdate(s)}
                disabled={bulkLoading}
                className="px-2.5 py-1 text-xs font-medium rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white disabled:opacity-50 transition-colors capitalize"
              >
                {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : `Mark ${s}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 w-10">
                <button onClick={toggleAll} className="text-slate-400 hover:text-white transition-colors">
                  {allSelected
                    ? <CheckSquare className="w-4 h-4 text-blue-400" />
                    : <Square className="w-4 h-4" />
                  }
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 w-24">Section</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Question</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 w-28">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 w-20">Diff.</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 w-24">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 w-32">Created</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr
                key={q.id}
                className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${selected.has(q.id) ? 'bg-blue-900/10' : ''}`}
              >
                <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleOne(q.id) }}>
                  <button className="text-slate-400 hover:text-blue-400 transition-colors">
                    {selected.has(q.id)
                      ? <CheckSquare className="w-4 h-4 text-blue-400" />
                      : <Square className="w-4 h-4" />
                    }
                  </button>
                </td>
                <td
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => router.push(`/admin/questions/${q.id}`)}
                >
                  <span className="text-xs text-slate-300">{SECTION_LABELS[q.section]}</span>
                </td>
                <td
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => router.push(`/admin/questions/${q.id}`)}
                >
                  <div className="flex items-start gap-2">
                    {q.ai_generated && (
                      <Bot className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                    )}
                    <p className="text-slate-200 leading-snug">
                      {truncate(q.question_text, 90)}
                    </p>
                  </div>
                  {q.passage && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Passage: {q.passage.title ?? 'Untitled'}
                    </p>
                  )}
                </td>
                <td
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => router.push(`/admin/questions/${q.id}`)}
                >
                  <span className="text-xs text-slate-400">
                    {SUB_TYPE_LABELS[q.sub_type]}
                  </span>
                </td>
                <td
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => router.push(`/admin/questions/${q.id}`)}
                >
                  {q.difficulty && (
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize ${DIFFICULTY_COLORS[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                  )}
                </td>
                <td
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => router.push(`/admin/questions/${q.id}`)}
                >
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[q.status]}`}>
                    {q.status}
                  </span>
                </td>
                <td
                  className="px-4 py-3 text-xs text-slate-500 cursor-pointer"
                  onClick={() => router.push(`/admin/questions/${q.id}`)}
                >
                  {formatDate(q.created_at)}
                </td>
                <td className="px-4 py-3">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <Link
                href={buildPageUrl(page - 1)}
                className={`p-1.5 rounded transition-colors ${page <= 1 ? 'text-slate-700 pointer-events-none' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link
                href={buildPageUrl(page + 1)}
                className={`p-1.5 rounded transition-colors ${page >= totalPages ? 'text-slate-700 pointer-events-none' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
