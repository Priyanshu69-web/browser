import React from 'react'
import { motion } from 'framer-motion'
import { Plus, LayoutGrid, Network, Settings, Activity, Shield } from 'lucide-react'
import type { PageId } from '@/types'

interface SidebarProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
  onAddProfile?: () => void
}

export function Sidebar({ activePage, onNavigate, onAddProfile }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'All Profiles', icon: LayoutGrid },
    { id: 'proxy-settings', label: 'Proxy Settings', icon: Network },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logs', label: 'Activity Logs', icon: Activity }
  ]

  return (
    <aside className="w-[280px] h-full flex flex-col bg-[#15181D] border-r border-[#2A2F39] text-sm select-none p-4 space-y-5 flex-shrink-0">
      {/* App Logo Header */}
      <div className="h-[56px] flex items-center px-3 border-b border-[#252932] titlebar-drag">
        <div className="flex items-center gap-3 titlebar-no-drag">
          <div className="w-9 h-9 rounded-xl bg-[#22C55E] flex items-center justify-center text-black font-extrabold text-lg shadow-[0_0_14px_rgba(34,197,94,0.35)] flex-shrink-0">
            P
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight leading-tight">ProfileHub</h1>
            <p className="text-xs text-[#7A8495] font-medium leading-none mt-1">Browser Manager</p>
          </div>
        </div>
      </div>

      {/* Primary Action Button — Emerald "+ Create Profile" (48px height, 12px radius) */}
      <div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddProfile}
          className="w-full h-[48px] flex items-center justify-center gap-2.5 rounded-xl bg-[#22C55E] hover:bg-[#2DD768] text-black font-bold text-sm transition-all cursor-pointer shadow-[0_2px_12px_rgba(34,197,94,0.25)]"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Create Profile</span>
        </motion.button>
      </div>

      {/* Navigation Items (56px height, 12px radius, selection indicator) */}
      <nav className="flex-1 space-y-2 pt-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id as PageId)}
              className={`
                relative w-full h-[56px] flex items-center gap-3.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer group
                ${isActive
                  ? 'bg-[#22C55E]/15 text-white'
                  : 'text-[#B6BDC8] hover:text-white hover:bg-white/[0.04]'
                }
              `}
            >
              {/* Left Indicator Bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-[#22C55E]' : 'text-[#7A8495] group-hover:text-white'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer Status */}
      <div className="pt-4 border-t border-[#252932] flex items-center justify-between text-xs text-[#7A8495] font-medium px-2">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]" />
          <span className="text-[#B6BDC8]">Online</span>
        </span>
        <span className="font-mono text-[#7A8495]">v1.0.0</span>
      </div>
    </aside>
  )
}
