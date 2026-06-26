'use client'

import { GenerationJob } from '@/lib/types'
import { SECTION_LABELS, formatDate } from '@/lib/utils'
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'

interface Props {
  jobs: GenerationJob[]
}

const JOB_STATUS_CONFIG = {
  completed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-900/20' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20' },
  running: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-900/20' },
  pending: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-800' },
}

export function JobList({ jobs }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4">Generation History</h2>

      {jobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No jobs yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {jobs.map((job) => {
            const cfg = JOB_STATUS_CONFIG[job.status]
            const Icon = cfg.icon
            return (
              <div
                key={job.id}
                className={`flex items-start gap-3 p-3 rounded-lg border border-slate-800/60 ${cfg.bg}`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color} ${job.status === 'running' ? 'animate-spin' : ''}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">
                      {SECTION_LABELS[job.section]} ·{' '}
                      {job.sub_type?.replace(/_/g, ' ')}
                    </p>
                    <span className="text-xs text-slate-500 shrink-0">
                      {job.generated_count}/{job.requested_count}
                    </span>
                  </div>
                  {job.settings && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {((job.settings as unknown) as Record<string, unknown>).topic as string || 'No topic specified'} · {((job.settings as unknown) as Record<string, unknown>).difficulty as string}
                    </p>
                  )}
                  {job.error_message && (
                    <p className="text-xs text-red-400 mt-0.5 line-clamp-2">{job.error_message}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">{formatDate(job.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
