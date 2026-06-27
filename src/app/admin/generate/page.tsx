import { createServiceClient } from '@/lib/supabase/server'
import { GeneratePageClient } from '@/components/admin/GeneratePageClient'

export default async function GeneratePage() {
  const supabase = createServiceClient()

  const [{ data: jobs }, { data: settings }] = await Promise.all([
    supabase
      .from('generation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('ai_settings').select('id, section, sub_type, model, temperature'),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Question Generator</h1>
        <p className="text-slate-400 text-sm mt-1">
          Generate TOEFL-quality questions using Claude
        </p>
      </div>

      <GeneratePageClient initialJobs={jobs ?? []} settings={settings ?? []} />
    </div>
  )
}
