import { contextBridge, ipcRenderer } from 'electron'

// ─── API exposed to the renderer process ──────────────────────────────────────

const api = {
  // Profile operations
  profiles: {
    list: (): Promise<unknown[]> => ipcRenderer.invoke('profiles:list'),
    get: (id: string): Promise<unknown> => ipcRenderer.invoke('profiles:get', id),
    create: (data: Record<string, unknown>): Promise<unknown> =>
      ipcRenderer.invoke('profiles:create', data),
    update: (id: string, data: Record<string, unknown>): Promise<unknown> =>
      ipcRenderer.invoke('profiles:update', id, data),
    delete: (id: string): Promise<boolean> => ipcRenderer.invoke('profiles:delete', id),
    duplicate: (id: string): Promise<unknown> => ipcRenderer.invoke('profiles:duplicate', id),
    launch: (id: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('profiles:launch', id),
    close: (id: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('profiles:close', id),
    export: (ids: string[]): Promise<{ success: boolean; count?: number; error?: string }> =>
      ipcRenderer.invoke('profiles:export', ids),
    import: (): Promise<{ success: boolean; count?: number; error?: string }> =>
      ipcRenderer.invoke('profiles:import')
  },

  // Settings operations
  settings: {
    get: (): Promise<Record<string, string>> => ipcRenderer.invoke('settings:get'),
    update: (key: string, value: string): Promise<boolean> =>
      ipcRenderer.invoke('settings:update', key, value),
    selectFolder: (): Promise<string | null> => ipcRenderer.invoke('settings:select-folder'),
    selectFile: (): Promise<string | null> => ipcRenderer.invoke('settings:select-file')
  },

  // Log operations
  logs: {
    list: (limit?: number): Promise<unknown[]> => ipcRenderer.invoke('logs:list', limit),
    clear: (): Promise<boolean> => ipcRenderer.invoke('logs:clear')
  }
}

// Expose in main world
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose API:', error)
  }
} else {
  // @ts-ignore
  window.api = api
}
