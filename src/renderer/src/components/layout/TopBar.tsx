import React from 'react'
import { SearchBar } from '../ui/SearchBar'
import { Plus, Download, Upload, LayoutList, LayoutGrid, Play, Square, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface TopBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onAddProfile: () => void
  onImport: () => void
  onExport: () => void
  profileCount: number
  viewMode: 'table' | 'grid'
  onViewModeChange: (mode: 'table' | 'grid') => void
  selectedCount: number
  onBatchLaunch?: () => void
  onBatchStop?: () => void
  onBatchDelete?: () => void
}

export function TopBar({
  searchQuery,
  onSearchChange,
  onAddProfile,
  onImport,
  onExport,
  profileCount,
  viewMode,
  onViewModeChange,
  selectedCount,
  onBatchLaunch,
  onBatchStop,
  onBatchDelete
}: TopBarProps) {
  return (
    <header className="border-b border-[#2A2F39] bg-[#111418] select-none flex-shrink-0">
      {/* Main Page Title Header */}
      <div className="px-8 py-5 flex items-center justify-between border-b border-[#252932] titlebar-drag">
        <div className="titlebar-no-drag">
          <h1 className="text-[26px] font-bold text-white tracking-tight leading-tight">
            Profiles
          </h1>
          <p className="text-sm text-[#B6BDC8] font-medium mt-0.5">
            Manage isolated browser identities
          </p>
        </div>

        <div className="flex items-center gap-3 titlebar-no-drag">
          <button
            type="button"
            onClick={onImport}
            title="Import Profiles (JSON)"
            className="h-[42px] px-4 rounded-xl bg-[#171B21] border border-[#2A2F39] hover:border-[#3F4654] text-[#B6BDC8] hover:text-white transition-all cursor-pointer flex items-center gap-2 text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            title="Export Profiles (JSON)"
            className="h-[42px] px-4 rounded-xl bg-[#171B21] border border-[#2A2F39] hover:border-[#3F4654] text-[#B6BDC8] hover:text-white transition-all cursor-pointer flex items-center gap-2 text-sm font-semibold"
          >
            <Upload className="w-4 h-4" />
            <span>Export</span>
          </button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddProfile}
            className="h-[42px] px-5 rounded-xl bg-[#22C55E] hover:bg-[#2DD768] text-black font-bold text-sm transition-all cursor-pointer flex items-center gap-2 shadow-[0_2px_12px_rgba(34,197,94,0.25)]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Profile</span>
          </motion.button>
        </div>
      </div>

      {/* Toolbar Sub-Header: Search & Controls */}
      <div className="h-[60px] flex items-center justify-between px-8 bg-[#171B21]/40">
        <div className="flex items-center gap-4">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search profiles..."
            className="w-[280px]"
          />

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-[#111418] border border-[#2A2F39] text-[#B6BDC8] text-xs font-semibold flex items-center gap-2">
              <span>All profiles</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] font-bold">{profileCount}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-xl"
            >
              <span className="text-xs font-bold text-blue-400 mr-1">
                {selectedCount} selected
              </span>
              {onBatchLaunch && (
                <button
                  type="button"
                  onClick={onBatchLaunch}
                  className="px-3 py-1.5 rounded-lg bg-[#22C55E] text-black font-bold text-xs hover:bg-[#2DD768] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Run</span>
                </button>
              )}
              {onBatchStop && (
                <button
                  type="button"
                  onClick={onBatchStop}
                  className="px-3 py-1.5 rounded-lg bg-[#111418] border border-[#2A2F39] text-white font-semibold text-xs hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              )}
              {onBatchDelete && (
                <button
                  type="button"
                  onClick={onBatchDelete}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 font-semibold text-xs hover:bg-red-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </motion.div>
          )}

          <div className="flex items-center gap-1 rounded-xl bg-[#111418] border border-[#2A2F39] p-1">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-[#171B21] text-white shadow-sm border border-[#2A2F39]' : 'text-[#7A8495] hover:text-white'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#171B21] text-white shadow-sm border border-[#2A2F39]' : 'text-[#7A8495] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
