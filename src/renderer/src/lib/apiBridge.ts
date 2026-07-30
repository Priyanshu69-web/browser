import type { Profile, ProfileFormData, LogEntry, AppSettings } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY_PROFILES = 'bpm_mock_profiles'
const STORAGE_KEY_SETTINGS = 'bpm_mock_settings'
const STORAGE_KEY_LOGS = 'bpm_mock_logs'

function getMockProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES)
    if (raw) return JSON.parse(raw)
  } catch {}
  return [
    {
      id: 'demo-1',
      name: 'Default Profile (US)',
      description: 'GoLogin development profile with US locale',
      country: 'US',
      timezone: 'America/New_York',
      language: 'en-US',
      window_width: 1366,
      window_height: 768,
      proxy_type: 'http',
      proxy_host: '192.168.1.100',
      proxy_port: 8080,
      proxy_username: 'dev_user',
      proxy_password: '••••••••',
      proxy_username_encrypted: '',
      proxy_password_encrypted: '',
      homepage: 'https://www.google.com',
      profile_path: '/profiles/demo-1',
      notes: 'Initial test profile',
      status: 'ready',
      last_launched: new Date(Date.now() - 3600000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-2',
      name: 'QA Testing (Germany)',
      description: 'SOCKS5 Proxy test environment',
      country: 'DE',
      timezone: 'Europe/Berlin',
      language: 'de-DE',
      window_width: 1920,
      window_height: 1080,
      proxy_type: 'socks5',
      proxy_host: 'de.proxy-service.com',
      proxy_port: 1080,
      proxy_username: '',
      proxy_password: '',
      proxy_username_encrypted: '',
      proxy_password_encrypted: '',
      homepage: 'https://whoer.net',
      profile_path: '/profiles/demo-2',
      notes: 'Clean SOCKS5 IP for QA',
      status: 'ready',
      last_launched: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
}

function saveMockProfiles(profiles: Profile[]) {
  localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles))
}

export const safeApi = {
  profiles: {
    list: async (): Promise<Profile[]> => {
      if (window.api?.profiles) {
        return window.api.profiles.list()
      }
      return getMockProfiles()
    },
    get: async (id: string): Promise<Profile | null> => {
      if (window.api?.profiles) {
        return window.api.profiles.get(id)
      }
      const list = getMockProfiles()
      return list.find((p) => p.id === id) || null
    },
    create: async (data: ProfileFormData): Promise<Profile> => {
      if (window.api?.profiles) {
        return window.api.profiles.create(data as unknown as Record<string, unknown>)
      }
      const list = getMockProfiles()
      const newP: Profile = {
        id: uuidv4(),
        name: data.name || 'New Profile',
        description: data.description || '',
        country: data.country || '',
        timezone: data.timezone || '',
        language: data.language || 'en-US',
        window_width: Number(data.window_width) || 1280,
        window_height: Number(data.window_height) || 800,
        proxy_type: data.proxy_type || '',
        proxy_host: data.proxy_host || '',
        proxy_port: Number(data.proxy_port) || 0,
        proxy_username: data.proxy_username || '',
        proxy_password: data.proxy_password || '',
        proxy_username_encrypted: '',
        proxy_password_encrypted: '',
        homepage: data.homepage || 'https://www.google.com',
        profile_path: `/profiles/${uuidv4()}`,
        notes: data.notes || '',
        status: 'ready',
        last_launched: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      list.unshift(newP)
      saveMockProfiles(list)
      return newP
    },
    update: async (id: string, data: ProfileFormData): Promise<Profile> => {
      if (window.api?.profiles) {
        return window.api.profiles.update(id, data as unknown as Record<string, unknown>)
      }
      const list = getMockProfiles()
      const idx = list.findIndex((p) => p.id === id)
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...data,
          window_width: Number(data.window_width) || 1280,
          window_height: Number(data.window_height) || 800,
          proxy_port: Number(data.proxy_port) || 0,
          updated_at: new Date().toISOString()
        }
        saveMockProfiles(list)
        return list[idx]
      }
      throw new Error('Profile not found')
    },
    delete: async (id: string): Promise<boolean> => {
      if (window.api?.profiles) {
        return window.api.profiles.delete(id)
      }
      const list = getMockProfiles().filter((p) => p.id !== id)
      saveMockProfiles(list)
      return true
    },
    duplicate: async (id: string): Promise<Profile> => {
      if (window.api?.profiles) {
        return window.api.profiles.duplicate(id)
      }
      const list = getMockProfiles()
      const orig = list.find((p) => p.id === id)
      if (!orig) throw new Error('Profile not found')
      const dup: Profile = {
        ...orig,
        id: uuidv4(),
        name: `${orig.name} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      list.unshift(dup)
      saveMockProfiles(list)
      return dup
    },
    launch: async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (window.api?.profiles) {
        return window.api.profiles.launch(id)
      }
      // Browser fallback simulation
      const list = getMockProfiles()
      const idx = list.findIndex((p) => p.id === id)
      if (idx !== -1) {
        list[idx].status = 'running'
        list[idx].last_launched = new Date().toISOString()
        saveMockProfiles(list)
        setTimeout(() => {
          const l = getMockProfiles()
          const i = l.findIndex((p) => p.id === id)
          if (i !== -1) {
            l[i].status = 'ready'
            saveMockProfiles(l)
          }
        }, 8000)
      }
      return { success: true }
    },
    close: async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (window.api?.profiles) {
        return window.api.profiles.close(id)
      }
      const list = getMockProfiles()
      const idx = list.findIndex((p) => p.id === id)
      if (idx !== -1) {
        list[idx].status = 'ready'
        saveMockProfiles(list)
      }
      return { success: true }
    },
    export: async (ids: string[]): Promise<{ success: boolean; count?: number; error?: string }> => {
      if (window.api?.profiles) {
        return window.api.profiles.export(ids)
      }
      const profiles = getMockProfiles().filter((p) => ids.includes(p.id))
      const json = JSON.stringify(profiles, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'profiles-export.json'
      a.click()
      URL.revokeObjectURL(url)
      return { success: true, count: profiles.length }
    },
    import: async (): Promise<{ success: boolean; count?: number; error?: string }> => {
      if (window.api?.profiles) {
        return window.api.profiles.import()
      }
      return { success: false, error: 'Import via file dialog is enabled in Desktop App mode' }
    }
  },
  settings: {
    get: async (): Promise<Record<string, string>> => {
      if (window.api?.settings) {
        return window.api.settings.get()
      }
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS)
      return raw ? JSON.parse(raw) : { default_homepage: 'https://www.google.com', theme: 'dark' }
    },
    update: async (key: string, value: string): Promise<boolean> => {
      if (window.api?.settings) {
        return window.api.settings.update(key, value)
      }
      const current = await safeApi.settings.get()
      current[key] = value
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(current))
      return true
    },
    selectFolder: async (): Promise<string | null> => {
      if (window.api?.settings) {
        return window.api.settings.selectFolder()
      }
      return '/downloads/browser-profiles'
    },
    selectFile: async (): Promise<string | null> => {
      if (window.api?.settings) {
        return window.api.settings.selectFile()
      }
      return '/usr/bin/chromium'
    }
  },
  logs: {
    list: async (limit?: number): Promise<LogEntry[]> => {
      if (window.api?.logs) {
        return window.api.logs.list(limit) as Promise<LogEntry[]>
      }
      const raw = localStorage.getItem(STORAGE_KEY_LOGS)
      const logs: LogEntry[] = raw ? JSON.parse(raw) : []
      return logs.slice(0, limit || 500)
    },
    clear: async (): Promise<boolean> => {
      if (window.api?.logs) {
        return window.api.logs.clear()
      }
      localStorage.removeItem(STORAGE_KEY_LOGS)
      return true
    }
  }
}
