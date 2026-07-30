import { ipcMain, app, dialog } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { join } from 'path'
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs'
import {
  getAllProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  getAllSettings,
  updateSetting,
  getLogs,
  clearLogs,
  ProfileRow
} from './database'
import { encryptString, decryptString } from './crypto'
import { launchProfile, closeProfile, isProfileRunning, getRunningProfileIds } from './browser-launcher'
import { addLog } from './logger'

export function registerIpcHandlers(): void {
  // ─── Profile Handlers ───────────────────────────────────────────────────────

  ipcMain.handle('profiles:list', () => {
    const profiles = getAllProfiles()
    // Check which ones are actually running
    const runningIds = getRunningProfileIds()
    return profiles.map((p) => ({
      ...p,
      status: runningIds.includes(p.id) ? 'running' : p.status === 'running' ? 'ready' : p.status,
      // Decrypt proxy credentials for the UI
      proxy_username: decryptString(p.proxy_username_encrypted),
      proxy_password: decryptString(p.proxy_password_encrypted)
    }))
  })

  ipcMain.handle('profiles:get', (_event, id: string) => {
    const profile = getProfile(id)
    if (!profile) return null
    return {
      ...profile,
      proxy_username: decryptString(profile.proxy_username_encrypted),
      proxy_password: decryptString(profile.proxy_password_encrypted)
    }
  })

  ipcMain.handle('profiles:create', (_event, data: Record<string, unknown>) => {
    const id = uuidv4()
    const profilePath = join(app.getPath('userData'), 'profiles', id)

    // Create profile directory
    if (!existsSync(profilePath)) {
      mkdirSync(profilePath, { recursive: true })
    }

    const profile = createProfile({
      id,
      name: (data.name as string) || 'New Profile',
      description: (data.description as string) || '',
      country: (data.country as string) || '',
      timezone: (data.timezone as string) || '',
      language: (data.language as string) || 'en-US',
      window_width: (data.window_width as number) || 1280,
      window_height: (data.window_height as number) || 800,
      proxy_type: (data.proxy_type as string) || '',
      proxy_host: (data.proxy_host as string) || '',
      proxy_port: (data.proxy_port as number) || 0,
      proxy_username_encrypted: encryptString((data.proxy_username as string) || ''),
      proxy_password_encrypted: encryptString((data.proxy_password as string) || ''),
      homepage: (data.homepage as string) || 'https://www.google.com',
      profile_path: profilePath,
      notes: (data.notes as string) || ''
    })

    addLog('profile_created', `Profile "${profile.name}" created`, id)
    return profile
  })

  ipcMain.handle('profiles:update', (_event, id: string, data: Record<string, unknown>) => {
    const updates: Partial<ProfileRow> = {}

    // Map simple fields
    const simpleFields = [
      'name', 'description', 'country', 'timezone', 'language',
      'window_width', 'window_height', 'proxy_type', 'proxy_host',
      'proxy_port', 'homepage', 'notes'
    ] as const

    for (const field of simpleFields) {
      if (data[field] !== undefined) {
        (updates as Record<string, unknown>)[field] = data[field]
      }
    }

    // Handle proxy credentials encryption
    if (data.proxy_username !== undefined) {
      updates.proxy_username_encrypted = encryptString(data.proxy_username as string)
    }
    if (data.proxy_password !== undefined) {
      updates.proxy_password_encrypted = encryptString(data.proxy_password as string)
    }

    const profile = updateProfile(id, updates)
    if (profile) {
      addLog('profile_updated', `Profile "${profile.name}" updated`, id)
    }
    return profile
  })

  ipcMain.handle('profiles:delete', (_event, id: string) => {
    const profile = getProfile(id)
    if (!profile) return false

    // Close browser if running
    if (isProfileRunning(id)) {
      closeProfile(id)
    }

    // Delete profile directory
    if (profile.profile_path && existsSync(profile.profile_path)) {
      try {
        rmSync(profile.profile_path, { recursive: true, force: true })
      } catch (err) {
        console.error('Failed to delete profile directory:', err)
      }
    }

    const result = deleteProfile(id)
    if (result) {
      addLog('profile_deleted', `Profile "${profile.name}" deleted`, id)
    }
    return result
  })

  ipcMain.handle('profiles:duplicate', (_event, id: string) => {
    const original = getProfile(id)
    if (!original) return null

    const newId = uuidv4()
    const profilePath = join(app.getPath('userData'), 'profiles', newId)

    if (!existsSync(profilePath)) {
      mkdirSync(profilePath, { recursive: true })
    }

    const duplicate = createProfile({
      id: newId,
      name: `${original.name} (Copy)`,
      description: original.description,
      country: original.country,
      timezone: original.timezone,
      language: original.language,
      window_width: original.window_width,
      window_height: original.window_height,
      proxy_type: original.proxy_type,
      proxy_host: original.proxy_host,
      proxy_port: original.proxy_port,
      proxy_username_encrypted: original.proxy_username_encrypted,
      proxy_password_encrypted: original.proxy_password_encrypted,
      homepage: original.homepage,
      profile_path: profilePath,
      notes: original.notes
    })

    addLog('profile_created', `Profile "${duplicate.name}" duplicated from "${original.name}"`, newId)
    return duplicate
  })

  // ─── Browser Handlers ──────────────────────────────────────────────────────

  ipcMain.handle('profiles:launch', async (_event, id: string) => {
    return launchProfile(id)
  })

  ipcMain.handle('profiles:close', async (_event, id: string) => {
    return closeProfile(id)
  })

  // ─── Import/Export Handlers ─────────────────────────────────────────────────

  ipcMain.handle('profiles:export', async (_event, ids: string[]) => {
    const profiles = ids.map((id) => {
      const p = getProfile(id)
      if (!p) return null
      return {
        name: p.name,
        description: p.description,
        country: p.country,
        timezone: p.timezone,
        language: p.language,
        window_width: p.window_width,
        window_height: p.window_height,
        proxy_type: p.proxy_type,
        proxy_host: p.proxy_host,
        proxy_port: p.proxy_port,
        proxy_username: decryptString(p.proxy_username_encrypted),
        proxy_password: decryptString(p.proxy_password_encrypted),
        homepage: p.homepage,
        notes: p.notes
      }
    }).filter(Boolean)

    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Profiles',
      defaultPath: 'profiles-export.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    })

    if (filePath) {
      writeFileSync(filePath, JSON.stringify(profiles, null, 2), 'utf-8')
      addLog('info', `Exported ${profiles.length} profiles to ${filePath}`)
      return { success: true, count: profiles.length }
    }

    return { success: false, error: 'Export cancelled' }
  })

  ipcMain.handle('profiles:import', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Import Profiles',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    })

    if (filePaths.length === 0) {
      return { success: false, error: 'Import cancelled' }
    }

    try {
      const content = readFileSync(filePaths[0], 'utf-8')
      const profiles = JSON.parse(content) as Record<string, unknown>[]

      let importedCount = 0
      for (const data of profiles) {
        const id = uuidv4()
        const profilePath = join(app.getPath('userData'), 'profiles', id)

        if (!existsSync(profilePath)) {
          mkdirSync(profilePath, { recursive: true })
        }

        createProfile({
          id,
          name: (data.name as string) || 'Imported Profile',
          description: (data.description as string) || '',
          country: (data.country as string) || '',
          timezone: (data.timezone as string) || '',
          language: (data.language as string) || 'en-US',
          window_width: (data.window_width as number) || 1280,
          window_height: (data.window_height as number) || 800,
          proxy_type: (data.proxy_type as string) || '',
          proxy_host: (data.proxy_host as string) || '',
          proxy_port: (data.proxy_port as number) || 0,
          proxy_username_encrypted: encryptString((data.proxy_username as string) || ''),
          proxy_password_encrypted: encryptString((data.proxy_password as string) || ''),
          homepage: (data.homepage as string) || 'https://www.google.com',
          profile_path: profilePath,
          notes: (data.notes as string) || ''
        })
        importedCount++
      }

      addLog('info', `Imported ${importedCount} profiles from ${filePaths[0]}`)
      return { success: true, count: importedCount }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to import: ${msg}` }
    }
  })

  // ─── Settings Handlers ─────────────────────────────────────────────────────

  ipcMain.handle('settings:get', () => {
    return getAllSettings()
  })

  ipcMain.handle('settings:update', (_event, key: string, value: string) => {
    updateSetting(key, value)
    return true
  })

  ipcMain.handle('settings:select-folder', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return filePaths.length > 0 ? filePaths[0] : null
  })

  ipcMain.handle('settings:select-file', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Executables', extensions: ['exe', 'app', ''] }]
    })
    return filePaths.length > 0 ? filePaths[0] : null
  })

  // ─── Logs Handlers ─────────────────────────────────────────────────────────

  ipcMain.handle('logs:list', (_event, limit?: number) => {
    return getLogs(limit)
  })

  ipcMain.handle('logs:clear', () => {
    clearLogs()
    addLog('info', 'Logs cleared')
    return true
  })
}
