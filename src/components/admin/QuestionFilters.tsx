'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'

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
  const [searchValue, setSearchValue] = useState(params.search ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(overrides: Record<string, string>) {
    const sp = new URLSearchParams()
    const merged = {
      section: params.section ?? '',
      status: params.status ?? '',
      sub_type: params.sub_type ?? '',
      search: searchValue,
      ...overrides,
    }
    Object.entries(merged).forEach(([k, v]) => { if (v) sp.set(k, v) })
    return `${pathname}?${sp.toString()}`
  }

  function updateFilter(key: string, value: string) {
    router.push(buildUrl({ [key]: value }))
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ search: searchValue }))
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={searchValue}
          placeholder="Search questions…"
          onChange={(e) => setSearchValue(e.target.value)}
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
