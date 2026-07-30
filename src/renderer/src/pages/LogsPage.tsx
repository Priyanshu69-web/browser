import React from 'react'
import { LogViewer } from '../components/logs/LogViewer'

export function LogsPage() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#111418]">
      {/* Page Header (30px title, 32px padding) */}
      <div className="px-8 py-6 border-b border-[#252932] bg-[#111418] flex-shrink-0">
        <h2 className="text-[30px] font-bold text-white tracking-tight leading-tight">Activity Logs</h2>
        <p className="text-sm text-[#B6BDC8] font-medium mt-1">
          Real-time activity telemetry, browser process events, and debug logs.
        </p>
      </div>

      <div className="flex-1 p-8 flex flex-col overflow-hidden">
        <LogViewer />
      </div>
    </div>
  )
}
