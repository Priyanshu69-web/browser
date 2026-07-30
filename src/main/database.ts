import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileRow {
  id: string
  name: string
  description: string
  country: string
  timezone: string
  language: string
  window_width: number
  window_height: number
  proxy_type: string
  proxy_host: string
  proxy_port: number
  proxy_username_encrypted: string
  proxy_password_encrypted: string
  homepage: string
  profile_path: string
  notes: string
  status: string
  last_launched: string
  created_at: string
  updated_at: string
}

export interface LogRow {
  id: number
  type: string
  message: string
  profile_id: string | null
  created_at: string
}

interface DatabaseStore {
  profiles: ProfileRow[]
  settings: Record<string, string>
  logs: LogRow[]
  _logIdCounter: number
}

// ─── Internal State ───────────────────────────────────────────────────────────

let dbPath: string
let store: DatabaseStore

function getDefaultStore(): DatabaseStore {
  return {
    profiles: [],
    settings: {
      default_download_folder: app.getPath('downloads'),
      default_homepage: 'https://www.google.com',
      default_browser_executable: '',
      theme: 'dark',
      auto_update_profiles: 'false'
    },
    logs: [],
    _logIdCounter: 0
  }
}

function loadStore(): DatabaseStore {
  if (existsSync(dbPath)) {
    try {
      const raw = readFileSync(dbPath, 'utf-8')
      return JSON.parse(raw) as DatabaseStore
    } catch {
      console.error('Failed to parse database file, creating fresh store')
      return getDefaultStore()
    }
  }
  return getDefaultStore()
}

function saveStore(): void {
  try {
    const dir = join(dbPath, '..')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(dbPath, JSON.stringify(store, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to save database:', err)
  }
}

// ─── Initialization ───────────────────────────────────────────────────────────

export function initDatabase(): void {
  dbPath = join(app.getPath('userData'), 'browser-profiles.json')
  store = loadStore()

  // Ensure defaults exist in settings
  const defaults: Record<string, string> = {
    default_download_folder: app.getPath('downloads'),
    default_homepage: 'https://www.google.com',
    default_browser_executable: '',
    theme: 'dark',
    auto_update_profiles: 'false'
  }

  for (const [key, value] of Object.entries(defaults)) {
    if (store.settings[key] === undefined) {
      store.settings[key] = value
    }
  }

  saveStore()
  console.log(`Database initialized at: ${dbPath}`)
}

export function getDb(): DatabaseStore {
  if (!store) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return store
}

// ─── Profile CRUD ─────────────────────────────────────────────────────────────

export function getAllProfiles(): ProfileRow[] {
  return [...store.profiles].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
}

export function getProfile(id: string): ProfileRow | undefined {
  return store.profiles.find((p) => p.id === id)
}

export function createProfile(
  profile: Omit<ProfileRow, 'created_at' | 'updated_at' | 'status' | 'last_launched'>
): ProfileRow {
  const now = new Date().toISOString()
  const newProfile: ProfileRow = {
    ...profile,
    status: 'ready',
    last_launched: '',
    created_at: now,
    updated_at: now
  }
  store.profiles.push(newProfile)
  saveStore()
  return newProfile
}

export function updateProfile(id: string, updates: Partial<ProfileRow>): ProfileRow | undefined {
  const index = store.profiles.findIndex((p) => p.id === id)
  if (index === -1) return undefined

  store.profiles[index] = {
    ...store.profiles[index],
    ...updates,
    updated_at: new Date().toISOString()
  }
  saveStore()
  return store.profiles[index]
}

export function deleteProfile(id: string): boolean {
  const index = store.profiles.findIndex((p) => p.id === id)
  if (index === -1) return false

  store.profiles.splice(index, 1)
  saveStore()
  return true
}

// ─── Settings CRUD ────────────────────────────────────────────────────────────

export function getSetting(key: string): string | undefined {
  return store.settings[key]
}

export function getAllSettings(): Record<string, string> {
  return { ...store.settings }
}

export function updateSetting(key: string, value: string): void {
  store.settings[key] = value
  saveStore()
}

// ─── Logs CRUD ────────────────────────────────────────────────────────────────

export function getLogs(limit = 500): LogRow[] {
  const sorted = [...store.logs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  return sorted.slice(0, limit)
}

export function insertLog(type: string, message: string, profileId?: string): void {
  store._logIdCounter = (store._logIdCounter || 0) + 1
  store.logs.push({
    id: store._logIdCounter,
    type,
    message,
    profile_id: profileId || null,
    created_at: new Date().toISOString()
  })

  // Keep only the last 2000 logs to prevent unbounded growth
  if (store.logs.length > 2000) {
    store.logs = store.logs.slice(-1500)
  }

  saveStore()
}

export function clearLogs(): void {
  store.logs = []
  saveStore()
}
