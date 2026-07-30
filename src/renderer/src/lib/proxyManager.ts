import { parseProxyString, ParsedProxy } from './proxyParser'

export interface SavedProxy extends ParsedProxy {
  id: string
  name: string
  created_at: string
}

const STORAGE_KEY = 'gologin_saved_proxies'

export const DEFAULT_WEBSHARE_PROXIES = [
  '31.59.20.176:6754:zkymshdu:jkkgxqqh8e6x',
  '31.56.127.193:7684:zkymshdu:jkkgxqqh8e6x',
  '45.38.107.97:6014:zkymshdu:jkkgxqqh8e6x',
  '198.105.121.200:6462:zkymshdu:jkkgxqqh8e6x',
  '64.137.96.74:6641:zkymshdu:jkkgxqqh8e6x',
  '198.23.243.226:6361:zkymshdu:jkkgxqqh8e6x',
  '38.154.185.97:6370:zkymshdu:jkkgxqqh8e6x',
  '84.247.60.125:6095:zkymshdu:jkkgxqqh8e6x',
  '142.111.67.146:5611:zkymshdu:jkkgxqqh8e6x',
  '191.96.254.138:6185:zkymshdu:jkkgxqqh8e6x'
]

function parseRawProxyToSaved(raw: string, index: number): SavedProxy | null {
  const parsed = parseProxyString(raw)
  if (!parsed) return null

  return {
    ...parsed,
    id: `proxy_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
    name: `Webshare Proxy ${index + 1} (${parsed.host})`,
    created_at: new Date().toISOString()
  }
}

export function getSavedProxies(): SavedProxy[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed to load saved proxies:', err)
  }

  // Initialize with default Webshare proxies if empty
  return resetToDefaultWebshareProxies()
}

export function resetToDefaultWebshareProxies(): SavedProxy[] {
  const defaults: SavedProxy[] = []
  DEFAULT_WEBSHARE_PROXIES.forEach((raw, idx) => {
    const item = parseRawProxyToSaved(raw, idx)
    if (item) defaults.push(item)
  })

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
  } catch (err) {
    console.error('Failed to store default proxies:', err)
  }
  return defaults
}

export function saveBulkProxies(bulkText: string): SavedProxy[] {
  const existing = getSavedProxies()
  const lines = bulkText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const newItems: SavedProxy[] = []

  lines.forEach((line, idx) => {
    const parsed = parseProxyString(line)
    if (parsed) {
      // Check duplicate host:port
      const isDuplicate = existing.some(
        (p) => p.host === parsed.host && p.port === parsed.port
      ) || newItems.some((p) => p.host === parsed.host && p.port === parsed.port)

      if (!isDuplicate) {
        newItems.push({
          ...parsed,
          id: `proxy_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          name: `Proxy (${parsed.host}:${parsed.port})`,
          created_at: new Date().toISOString()
        })
      }
    }
  })

  const updated = [...existing, ...newItems]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save bulk proxies:', err)
  }
  return updated
}

export function addSingleProxy(proxy: ParsedProxy, customName?: string): SavedProxy[] {
  const existing = getSavedProxies()
  const newProxy: SavedProxy = {
    ...proxy,
    id: `proxy_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: customName || `Proxy (${proxy.host}:${proxy.port})`,
    created_at: new Date().toISOString()
  }

  const updated = [newProxy, ...existing]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to add single proxy:', err)
  }
  return updated
}

export function deleteSavedProxy(id: string): SavedProxy[] {
  const existing = getSavedProxies()
  const updated = existing.filter((p) => p.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to delete proxy:', err)
  }
  return updated
}
