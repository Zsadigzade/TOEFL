'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Question } from '@/lib/types'
import {
  STATUS_COLORS, DIFFICULTY_COLORS, SECTION_LABELS,
  SUB_TYPE_LABELS, truncate, formatDate,
} from '@/lib/utils'
import { ChevronLeft, ChevronRight, ExternalLink, Bot } from 'lucide-react'

interface Props {
  questions: (Question & { passage?: { id: string; title: string; section: string } | null })[]
  page: number
  totalPages: number
  params: Record<string, string | undefined>
}

export function QuestionTable({ questions, page, totalPages, params }: Props) {
  const router = useRouter()

  function buildPageUrl(p: number) {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v) })
    sp.set('page', String(p))
    return `/admin/questions?${sp.toString()}`
  }

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
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
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
              className="border-b border-slate-800/60 hover:bg-slate-800/30 cursor-pointer transition-colors"
              onClick={() => router.push(`/admin/questions/${q.id}`)}
            >
              <td className="px-4 py-3">
                <span className="text-xs text-slate-300">{SECTION_LABELS[q.section]}</span>
              </td>
              <td className="px-4 py-3">
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
              <td className="px-4 py-3">
                <span className="text-xs text-slate-400">
                  {SUB_TYPE_LABELS[q.sub_type]}
                </span>
              </td>
              <td className="px-4 py-3">
                {q.difficulty && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize ${DIFFICULTY_COLORS[q.difficulty]}`}>
                    {q.difficulty}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[q.status]}`}>
                  {q.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
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
  )
}
