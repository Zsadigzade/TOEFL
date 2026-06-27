'use client'

import { useState } from 'react'
import { SECTION_LABELS, SUB_TYPE_LABELS } from '@/lib/utils'
import { Save, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'

interface Setting {
  id: string
  section: string
  sub_type: string
  system_prompt: string
  user_prompt_template: string
  model: string
  temperature: number
  max_tokens: number
}

interface Props {
  settings: Setting[]
  defaults: Setting[]
}

const MODELS = [
  'claude-sonnet-4-6',
  'claude-opus-4-8',
  'claude-haiku-4-5-20251001',
]

export function AISettingsEditor({ settings: initialSettings, defaults }: Props) {
  const [settings, setSettings] = useState(initialSettings)
  const [expanded, setExpanded] = useState<string | null>(settings[0]?.id ?? null)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  function updateSetting(id: string, key: string, value: unknown) {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)),
    )
  }

  function resetToDefault(id: string) {
    const def = defaults.find((d) => d.id === id)
    if (!def) return
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...def } : s)))
  }

  async function saveSetting(setting: Setting) {
    setSaving(setting.id)

    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setting),
    })

    setSaving(null)
    if (res.ok) {
      setSaved(setting.id)
      setTimeout(() => setSaved(null), 2000)
    }
  }

  return (
    <div className="space-y-3">
      {settings.map((setting) => {
        const isOpen = expanded === setting.id

        return (
          <div key={setting.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : setting.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-white text-left">
                    {SECTION_LABELS[setting.section]} — {SUB_TYPE_LABELS[setting.sub_type]}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 text-left">
                    {setting.model} · temp {setting.temperature}
                  </p>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-slate-800">
                {/* Model + Params */}
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Model</label>
                    <select
                      value={setting.model}
                      onChange={(e) => updateSetting(setting.id, 'model', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {MODELS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Temperature ({setting.temperature})
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={setting.temperature}
                      onChange={(e) => updateSetting(setting.id, 'temperature', parseFloat(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Max Tokens</label>
                    <input
                      type="number"
                      min={512}
                      max={8192}
                      step={512}
                      value={setting.max_tokens}
                      onChange={(e) => updateSetting(setting.id, 'max_tokens', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    System Prompt
                  </label>
                  <textarea
                    value={setting.system_prompt}
                    onChange={(e) => updateSetting(setting.id, 'system_prompt', e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                  />
                </div>

                {/* User Prompt Template */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    User Prompt Template{' '}
                    <span className="text-slate-500 font-normal">
                      (use {'{{topic}}'}, {'{{difficulty}}'}, {'{{count}}'})
                    </span>
                  </label>
                  <textarea
                    value={setting.user_prompt_template}
                    onChange={(e) => updateSetting(setting.id, 'user_prompt_template', e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => resetToDefault(setting.id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Reset prompts and params to code defaults (does not save)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to defaults
                  </button>
                  <button
                    onClick={() => saveSetting(setting)}
                    disabled={saving === setting.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving === setting.id ? 'Saving…' : saved === setting.id ? 'Saved ✓' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
