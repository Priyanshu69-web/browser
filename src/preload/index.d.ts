import { ElectronAPI } from '@electron-toolkit/preload'

interface ProfileAPI {
  list(): Promise<import('../renderer/src/types').Profile[]>
  get(id: string): Promise<import('../renderer/src/types').Profile | null>
  create(data: Record<string, unknown>): Promise<import('../renderer/src/types').Profile>
  update(id: string, data: Record<string, unknown>): Promise<import('../renderer/src/types').Profile>
  delete(id: string): Promise<boolean>
  duplicate(id: string): Promise<import('../renderer/src/types').Profile>
  launch(id: string): Promise<{ success: boolean; error?: string }>
  close(id: string): Promise<{ success: boolean; error?: string }>
  export(ids: string[]): Promise<{ success: boolean; count?: number; error?: string }>
  import(): Promise<{ success: boolean; count?: number; error?: string }>
}

interface SettingsAPI {
  get(): Promise<Record<string, string>>
  update(key: string, value: string): Promise<boolean>
  selectFolder(): Promise<string | null>
  selectFile(): Promise<string | null>
}

interface LogsAPI {
  list(limit?: number): Promise<import('../renderer/src/types').LogEntry[]>
  clear(): Promise<boolean>
}

interface API {
  profiles: ProfileAPI
  settings: SettingsAPI
  logs: LogsAPI
}

declare global {
  interface Window {
    api: API
    electron: ElectronAPI
  }
}
