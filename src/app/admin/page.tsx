import { createServiceClient } from '@/lib/supabase/server'
import { Section } from '@/lib/types'
import { SECTION_LABELS, formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  BookOpen, Sparkles, CheckCircle, Clock,
  FileText, Headphones, PenTool, Mic,
} from 'lucide-react'

const SECTION_ICONS = {
  reading: FileText,
  listening: Headphones,
  writing: PenTool,
  speaking: Mic,
}

export default async function AdminDashboard() {
  const supabase = createServiceClient()

  const [questionsResult, jobsResult] = await Promise.all([
    supabase.from('questions').select('section, status'),
    supabase
      .from('generation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const questions = questionsResult.data ?? []
  const recentJobs = jobsResult.data ?? []

  const totalQuestions = questions.length
  const approvedQuestions = questions.filter((q) => q.status === 'approved').length
  const activeQuestions = questions.filter((q) => q.status === 'active').length
  const draftQuestions = questions.filter((q) => q.status === 'draft').length

  const bySection = (['reading', 'listening', 'writing', 'speaking'] as Section[]).reduce(
    (acc, s) => {
      acc[s] = questions.filter((q) => q.section === s).length
      return acc
    },
    {} as Record<Section, number>,
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">TOEFL question bank overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Questions', value: totalQuestions, icon: BookOpen, color: 'text-blue-400' },
          { label: 'Active', value: activeQuestions, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Approved', value: approvedQuestions, icon: CheckCircle, color: 'text-blue-400' },
          { label: 'Draft', value: draftQuestions, icon: Clock, color: 'text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Questions by Section</h2>
          <div className="space-y-3">
            {(Object.entries(bySection) as [Section, number][]).map(([section, count]) => {
              const Icon = SECTION_ICONS[section]
              const pct = totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0
              return (
                <div key={section}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm text-slate-300">{SECTION_LABELS[section]}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Generation Jobs</h2>
            <Link
              href="/admin/generate"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all →
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="text-center py-6">
              <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No generation jobs yet</p>
              <Link
                href="/admin/generate"
                className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300"
              >
                Start generating →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                >
                  <div>
                    <p className="text-sm text-white capitalize">
                      {job.section} · {job.sub_type?.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(job.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {job.generated_count}/{job.requested_count}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'completed' ? 'bg-green-900/40 text-green-400' :
                      job.status === 'failed' ? 'bg-red-900/40 text-red-400' :
                      job.status === 'running' ? 'bg-blue-900/40 text-blue-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Link
          href="/admin/generate"
          className="flex items-center gap-3 p-4 bg-blue-600/10 border border-blue-600/20 rounded-xl hover:bg-blue-600/20 transition-colors group"
        >
          <Sparkles className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
          <div>
            <p className="text-sm font-medium text-white">Generate Questions</p>
            <p className="text-xs text-slate-400">AI-powered batch generation</p>
          </div>
        </Link>
        <Link
          href="/admin/questions"
          className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors group"
        >
          <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
          <div>
            <p className="text-sm font-medium text-white">Manage Questions</p>
            <p className="text-xs text-slate-400">Review, edit, approve</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
