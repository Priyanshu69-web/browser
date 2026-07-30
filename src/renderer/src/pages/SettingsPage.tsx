import React from 'react'
import { SettingsForm } from '../components/settings/SettingsForm'

export function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#111418]">
      {/* Page Header (30px title, 32px padding) */}
      <div className="px-8 py-6 border-b border-[#252932] bg-[#111418]">
        <h2 className="text-[30px] font-bold text-white tracking-tight leading-tight">Application Settings</h2>
        <p className="text-sm text-[#B6BDC8] font-medium mt-1">
          Manage global application preferences, download locations, and browser binary paths.
        </p>
      </div>

      <div className="p-8">
        <SettingsForm />
      </div>
    </div>
  )
}
