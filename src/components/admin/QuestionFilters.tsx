'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  params: {
    section?: string
    status?: string
    sub_type?: string
    search?: string
  }
}

const SECTIONS = [
  { value: '', label: 'All Sections' },
  { value: 'reading', label: 'Reading' },
  { value: 'listening', label: 'Listening' },
  { value: 'writing', label: 'Writing' },
  { value: 'speaking', label: 'Speaking' },
]

const STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

export function QuestionFilters({ params }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function updateFilter(key: string, value: string) {
    const sp = new URLSearchParams()
    if (params.section && key !== 'section') sp.set('section', params.section)
    if (params.status && key !== 'status') sp.set('status', params.status)
    if (params.sub_type && key !== 'sub_type') sp.set('sub_type', params.sub_type)
    if (params.search && key !== 'search') sp.set('search', params.search)
    if (value) sp.set(key, value)
    router.push(`${pathname}?${sp.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          defaultValue={params.search}
          placeholder="Search questions…"
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
        />
      </div>

      <select
        value={params.section ?? ''}
        onChange={(e) => updateFilter('section', e.target.value)}
        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {SECTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <select
        value={params.status ?? ''}
        onChange={(e) => updateFilter('status', e.target.value)}
        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {STATUSES.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  )
}
