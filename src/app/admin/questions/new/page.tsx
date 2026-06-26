import { createServiceClient } from '@/lib/supabase/server'
import { QuestionEditor } from '@/components/admin/QuestionEditor'

export default async function NewQuestionPage() {
  const supabase = createServiceClient()
  const { data: passages } = await supabase
    .from('passages')
    .select('id, title, section')
    .in('status', ['active', 'approved'])

  return <QuestionEditor question={null} passages={passages ?? []} />
}
