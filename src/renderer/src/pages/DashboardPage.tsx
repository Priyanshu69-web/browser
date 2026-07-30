import React, { useState, useEffect, useCallback } from 'react'
import { TopBar } from '../components/layout/TopBar'
import { ProfileTable } from '../components/profiles/ProfileTable'
import { ProfileGrid } from '../components/profiles/ProfileGrid'
import { ProfileForm } from '../components/profiles/ProfileForm'
import { ProfileDeleteDialog } from '../components/profiles/ProfileDeleteDialog'
import { useToast } from '../components/ui/Toast'
import { safeApi } from '@/lib/apiBridge'
import type { Profile, ProfileFormData } from '@/types'

interface DashboardPageProps {
  onAddProfileTrigger?: boolean
  resetAddProfileTrigger?: () => void
}

export function DashboardPage({ onAddProfileTrigger, resetAddProfileTrigger }: DashboardPageProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [deletingProfile, setDeletingProfile] = useState<Profile | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [launchingId, setLaunchingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (onAddProfileTrigger) {
      setShowCreateForm(true)
      if (resetAddProfileTrigger) resetAddProfileTrigger()
    }
  }, [onAddProfileTrigger, resetAddProfileTrigger])

  const loadProfiles = useCallback(async () => {
    try {
      const data = await safeApi.profiles.list()
      setProfiles(data)
    } catch {
      toast('error', 'Failed to load profiles')
    }
  }, [toast])

  useEffect(() => {
    loadProfiles()
    const interval = setInterval(loadProfiles, 3000)
    return () => clearInterval(interval)
  }, [loadProfiles])

  // ─── Search Filtering ───────────────────────────────────────────────────────

  const filteredProfiles = profiles.filter((p) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()
    return Boolean(
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.country && p.country.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.notes && p.notes.toLowerCase().includes(query)) ||
      (p.proxy_host && p.proxy_host.toLowerCase().includes(query)) ||
      (p.proxy_type && p.proxy_type.toLowerCase().includes(query))
    )
  })

  // ─── Selection Handlers ─────────────────────────────────────────────────────

  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedIds(filteredProfiles.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  // ─── Profile CRUD Handlers ──────────────────────────────────────────────────

  const handleCreate = async (data: ProfileFormData) => {
    setFormLoading(true)
    try {
      await safeApi.profiles.create(data)
      toast('success', `Profile "${data.name}" created successfully`)
      setShowCreateForm(false)
      loadProfiles()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (data: ProfileFormData) => {
    if (!editingProfile) return
    setFormLoading(true)
    try {
      await safeApi.profiles.update(editingProfile.id, data)
      toast('success', `Profile "${data.name}" updated successfully`)
      setEditingProfile(null)
      loadProfiles()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingProfile) return
    setDeleteLoading(true)
    try {
      await safeApi.profiles.delete(deletingProfile.id)
      toast('success', `Profile "${deletingProfile.name}" deleted`)
      setSelectedIds((prev) => prev.filter((id) => id !== deletingProfile.id))
      setDeletingProfile(null)
      loadProfiles()
    } catch {
      toast('error', 'Failed to delete profile')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const result = await safeApi.profiles.duplicate(id)
      if (result) {
        toast('success', `Profile duplicated as "${result.name}"`)
        loadProfiles()
      }
    } catch {
      toast('error', 'Failed to duplicate profile')
    }
  }

  const handleLaunch = async (id: string) => {
    setLaunchingId(id)
    try {
      const result = await safeApi.profiles.launch(id)
      if (result.success) {
        toast('success', 'Browser profile launched successfully')
      } else {
        toast('error', result.error || 'Failed to launch browser')
      }
      loadProfiles()
    } catch {
      toast('error', 'Failed to launch browser')
    } finally {
      setLaunchingId(null)
    }
  }

  const handleClose = async (id: string) => {
    try {
      const result = await safeApi.profiles.close(id)
      if (result.success) {
        toast('info', 'Browser stopped')
      } else {
        toast('error', result.error || 'Failed to stop browser')
      }
      loadProfiles()
    } catch {
      toast('error', 'Failed to stop browser')
    }
  }

  // ─── Batch Actions ──────────────────────────────────────────────────────────

  const handleBatchLaunch = async () => {
    for (const id of selectedIds) {
      await safeApi.profiles.launch(id)
    }
    toast('success', `Launched ${selectedIds.length} profiles`)
    loadProfiles()
  }

  const handleBatchStop = async () => {
    for (const id of selectedIds) {
      await safeApi.profiles.close(id)
    }
    toast('info', `Stopped ${selectedIds.length} profiles`)
    loadProfiles()
  }

  const handleBatchDelete = async () => {
    for (const id of selectedIds) {
      await safeApi.profiles.delete(id)
    }
    toast('success', `Deleted ${selectedIds.length} profiles`)
    setSelectedIds([])
    loadProfiles()
  }

  // ─── Import / Export ────────────────────────────────────────────────────────

  const handleImport = async () => {
    try {
      const result = await safeApi.profiles.import()
      if (result.success) {
        toast('success', `Imported ${result.count} profiles`)
        loadProfiles()
      } else if (result.error !== 'Import cancelled') {
        toast('error', result.error || 'Import failed')
      }
    } catch {
      toast('error', 'Failed to import profiles')
    }
  }

  const handleExport = async () => {
    const idsToExport = selectedIds.length > 0 ? selectedIds : profiles.map((p) => p.id)
    if (idsToExport.length === 0) {
      toast('info', 'No profiles to export')
      return
    }
    try {
      const result = await safeApi.profiles.export(idsToExport)
      if (result.success) {
        toast('success', `Exported ${result.count} profiles`)
      } else if (result.error !== 'Export cancelled') {
        toast('error', result.error || 'Export failed')
      }
    } catch {
      toast('error', 'Failed to export profiles')
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-root)]">
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddProfile={() => setShowCreateForm(true)}
        onImport={handleImport}
        onExport={handleExport}
        profileCount={profiles.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCount={selectedIds.length}
        onBatchLaunch={handleBatchLaunch}
        onBatchStop={handleBatchStop}
        onBatchDelete={handleBatchDelete}
      />

      <div className="flex-1 overflow-y-auto">
        {filteredProfiles.length === 0 ? (
          <div className="flex items-center justify-center py-24 px-8">
            <div className="text-center space-y-5 max-w-md">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#171A21] border border-[#262A33] flex items-center justify-center text-zinc-400 shadow-sm">
                <svg className="w-8 h-8 text-[#22C55E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">No profiles found</h3>
                <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
                  Create your first isolated browser profile or adjust your search term.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="h-[40px] px-5 rounded-[10px] bg-[#22C55E] text-black font-bold text-sm hover:bg-[#16A34A] transition-all cursor-pointer shadow-[0_2px_10px_rgba(34,197,94,0.25)]"
              >
                + Create Profile
              </button>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <ProfileTable
            profiles={filteredProfiles}
            selectedIds={selectedIds}
            onSelectToggle={handleSelectToggle}
            onSelectAll={handleSelectAll}
            onLaunch={handleLaunch}
            onClose={handleClose}
            onEdit={setEditingProfile}
            onDelete={setDeletingProfile}
            onDuplicate={handleDuplicate}
            launchingId={launchingId}
          />
        ) : (
          <ProfileGrid
            profiles={filteredProfiles}
            onLaunch={handleLaunch}
            onClose={handleClose}
            onEdit={setEditingProfile}
            onDelete={setDeletingProfile}
            onDuplicate={handleDuplicate}
            onAddProfile={() => setShowCreateForm(true)}
            launchingId={launchingId}
          />
        )}
      </div>

      {/* Create Profile Dialog */}
      <ProfileForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreate}
        loading={formLoading}
      />

      {/* Edit Profile Dialog */}
      <ProfileForm
        open={!!editingProfile}
        onClose={() => setEditingProfile(null)}
        onSubmit={handleUpdate}
        profile={editingProfile}
        loading={formLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ProfileDeleteDialog
        open={!!deletingProfile}
        onClose={() => setDeletingProfile(null)}
        onConfirm={handleDelete}
        profile={deletingProfile}
        loading={deleteLoading}
      />
    </div>
  )
}
