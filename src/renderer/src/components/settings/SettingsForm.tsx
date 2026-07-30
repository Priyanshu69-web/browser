import React, { useState, useEffect } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import type { AppSettings } from '@/types'
import { Settings, Sliders, Folder, Monitor, ShieldCheck, Database } from 'lucide-react'

export function SettingsForm() {
  const [settings, setSettings] = useState<Partial<AppSettings>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await window.api.settings.get()
      setSettings(data as Partial<AppSettings>)
    } catch {
      toast('error', 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined) {
          await window.api.settings.update(key, String(value))
        }
      }
      toast('success', 'Settings saved successfully')
    } catch {
      toast('error', 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectFolder = async () => {
    try {
      const folder = await window.api.settings.selectFolder()
      if (folder) {
        setSettings((prev) => ({ ...prev, default_download_folder: folder }))
      }
    } catch {
      toast('error', 'Failed to select folder')
    }
  }

  const handleSelectExecutable = async () => {
    try {
      const file = await window.api.settings.selectFile()
      if (file) {
        setSettings((prev) => ({ ...prev, default_browser_executable: file }))
      }
    } catch {
      toast('error', 'Failed to select file')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#2A2F39] border-t-[#22C55E] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl w-full mx-auto text-sm">
      {/* Category Card 1: General Preferences */}
      <div className="bg-[#171B21] rounded-2xl p-6 space-y-5 border border-[#2A2F39] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111418] border border-[#2A2F39] flex items-center justify-center text-[#22C55E]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">General Application Preferences</h3>
            <p className="text-xs text-[#7A8495] mt-0.5">
              Configure startup parameters, default homepage URLs, and browser launch behavior.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Default Homepage URL"
            type="url"
            placeholder="https://www.google.com"
            value={settings.default_homepage || ''}
            onChange={(e) => setSettings((prev) => ({ ...prev, default_homepage: e.target.value }))}
          />
        </div>
      </div>

      {/* Category Card 2: Downloads & Storage Paths */}
      <div className="bg-[#171B21] rounded-2xl p-6 space-y-5 border border-[#2A2F39] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111418] border border-[#2A2F39] flex items-center justify-center text-blue-400">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Downloads &amp; Storage Paths</h3>
            <p className="text-xs text-[#7A8495] mt-0.5">
              Manage default download directories and system Chrome / Playwright Chromium executable paths.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#B6BDC8]">
              Default Download Directory
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                readOnly
                value={settings.default_download_folder || ''}
                placeholder="Select download folder..."
                className="
                  flex-1 rounded-xl px-4 h-[48px] text-sm
                  bg-[#111418] border border-[#2A2F39]
                  text-white placeholder-[#7A8495]
                  cursor-pointer hover:border-[#3F4654] transition-colors
                "
                onClick={handleSelectFolder}
              />
              <Button type="button" variant="secondary" size="md" onClick={handleSelectFolder}>
                Browse
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#B6BDC8]">
              Chromium / Chrome Executable Binary Path
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                readOnly
                value={settings.default_browser_executable || ''}
                placeholder="Auto-detect system Chrome / Playwright Chromium (default)"
                className="
                  flex-1 rounded-xl px-4 h-[48px] text-sm
                  bg-[#111418] border border-[#2A2F39]
                  text-white placeholder-[#7A8495]
                  cursor-pointer hover:border-[#3F4654] transition-colors
                "
                onClick={handleSelectExecutable}
              />
              <Button type="button" variant="secondary" size="md" onClick={handleSelectExecutable}>
                Browse
              </Button>
            </div>
            <p className="text-xs text-[#7A8495]">
              Leave empty to automatically use Playwright Chromium or system installed Google Chrome.
            </p>
          </div>
        </div>
      </div>

      {/* Category Card 3: Privacy & Security Defaults */}
      <div className="bg-[#171B21] rounded-2xl p-6 space-y-4 border border-[#2A2F39] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111418] border border-[#2A2F39] flex items-center justify-center text-[#22C55E]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Privacy &amp; Fingerprint Defaults</h3>
            <p className="text-xs text-[#7A8495] mt-0.5">
              Isolated user data directories and WebRTC IP leak protection are automatically enabled for all profiles.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button type="button" variant="primary" size="md" onClick={handleSave} loading={saving}>
          Save Application Settings
        </Button>
      </div>
    </div>
  )
}
