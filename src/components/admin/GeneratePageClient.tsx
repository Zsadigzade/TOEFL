'use client'

import { useState, useCallback } from 'react'
import { GenerateForm } from './GenerateForm'
import { JobList } from './JobList'
import { GenerationJob } from '@/lib/types'

interface AISettingSummary {
  id: string
  section: string
  sub_type: string
  model: string
  temperature: number
}

interface Props {
  initialJobs: GenerationJob[]
  settings: AISettingSummary[]
}

export function GeneratePageClient({ initialJobs, settings }: Props) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGeneratingChange = useCallback((generating: boolean) => {
    setIsGenerating(generating)
  }, [])

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <GenerateForm settings={settings} onGeneratingChange={handleGeneratingChange} />
      <JobList jobs={initialJobs} isGenerating={isGenerating} />
    </div>
  )
}
