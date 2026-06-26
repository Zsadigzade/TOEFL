import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { QuestionEditor } from '@/components/admin/QuestionEditor'

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  if (id === 'new') {
    return <QuestionEditor question={null} passages={[]} />
  }

  const [{ data: question }, { data: passages }] = await Promise.all([
    supabase
      .from('questions')
      .select('*, passage:passages(*)')
      .eq('id', id)
      .single(),
    supabase.from('passages').select('id, title, section').eq('status', 'active'),
  ])

  if (!question) notFound()

  return <QuestionEditor question={question} passages={passages ?? []} />
}
