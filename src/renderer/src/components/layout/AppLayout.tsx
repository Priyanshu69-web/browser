import React from 'react'
import { Sidebar } from './Sidebar'
import type { PageId } from '@/types'

interface AppLayoutProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
  onAddProfile?: () => void
  children: React.ReactNode
}

export function AppLayout({ activePage, onNavigate, onAddProfile, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-root)]">
      <Sidebar activePage={activePage} onNavigate={onNavigate} onAddProfile={onAddProfile} />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}
