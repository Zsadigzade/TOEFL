import { createServiceClient } from '@/lib/supabase/server'
import { QuestionFilters } from '@/components/admin/QuestionFilters'
import { QuestionTable } from '@/components/admin/QuestionTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface SearchParams {
  section?: string
  status?: string
  sub_type?: string
  search?: string
  page?: string
  [key: string]: string | undefined
}

const PAGE_SIZE = 20

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = createServiceClient()
  const page = parseInt(params.page ?? '1')
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('questions')
    .select('*, passage:passages(id, title, section)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (params.section) query = query.eq('section', params.section)
  if (params.status) query = query.eq('status', params.status)
  if (params.sub_type) query = query.eq('sub_type', params.sub_type)
  if (params.search) query = query.ilike('question_text', `%${params.search}%`)

  const { data: questions, count } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Question Bank</h1>
          <p className="text-slate-400 text-sm mt-1">
            {count ?? 0} total questions
          </p>
        </div>
        <Link
          href="/admin/questions/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </Link>
      </div>

      <QuestionFilters params={params} />

      <QuestionTable
        questions={questions ?? []}
        page={page}
        totalPages={totalPages}
        params={params}
      />
    </div>
  )
}
