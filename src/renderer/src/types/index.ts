// ─── Profile ──────────────────────────────────────────────────────────────────

export type ProfileStatus = 'ready' | 'running' | 'error'

export interface Profile {
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
  proxy_username: string
  proxy_password: string
  proxy_username_encrypted: string
  proxy_password_encrypted: string
  homepage: string
  profile_path: string
  notes: string
  status: ProfileStatus
  last_launched: string
  created_at: string
  updated_at: string
}

export interface ProfileFormData {
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
  proxy_username: string
  proxy_password: string
  homepage: string
  notes: string
}

export const DEFAULT_PROFILE_FORM: ProfileFormData = {
  name: '',
  description: '',
  country: 'US',
  timezone: 'America/New_York',
  language: 'en-US',
  window_width: 1280,
  window_height: 800,
  proxy_type: '',
  proxy_host: '',
  proxy_port: 0,
  proxy_username: '',
  proxy_password: '',
  homepage: 'https://www.google.com',
  notes: ''
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettings {
  default_download_folder: string
  default_homepage: string
  default_browser_executable: string
  theme: 'dark' | 'light'
  auto_update_profiles: string
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export type LogType =
  | 'info'
  | 'error'
  | 'browser_launched'
  | 'browser_closed'
  | 'profile_created'
  | 'profile_deleted'
  | 'profile_updated'
  | 'proxy_success'
  | 'proxy_failure'

export interface LogEntry {
  id: number
  type: LogType
  message: string
  profile_id: string | null
  created_at: string
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type PageId = 'dashboard' | 'proxy-settings' | 'settings' | 'logs'

// ─── Country list ─────────────────────────────────────────────────────────────

export const COUNTRIES = [
  { code: '', label: 'None', flag: '' },
  { code: 'US', label: 'United States', flag: '🇺🇸' },
  { code: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', label: 'Germany', flag: '🇩🇪' },
  { code: 'FR', label: 'France', flag: '🇫🇷' },
  { code: 'JP', label: 'Japan', flag: '🇯🇵' },
  { code: 'CN', label: 'China', flag: '🇨🇳' },
  { code: 'IN', label: 'India', flag: '🇮🇳' },
  { code: 'BR', label: 'Brazil', flag: '🇧🇷' },
  { code: 'CA', label: 'Canada', flag: '🇨🇦' },
  { code: 'AU', label: 'Australia', flag: '🇦🇺' },
  { code: 'KR', label: 'South Korea', flag: '🇰🇷' },
  { code: 'IT', label: 'Italy', flag: '🇮🇹' },
  { code: 'ES', label: 'Spain', flag: '🇪🇸' },
  { code: 'NL', label: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', label: 'Sweden', flag: '🇸🇪' },
  { code: 'SG', label: 'Singapore', flag: '🇸🇬' },
  { code: 'RU', label: 'Russia', flag: '🇷🇺' },
  { code: 'MX', label: 'Mexico', flag: '🇲🇽' },
  { code: 'PL', label: 'Poland', flag: '🇵🇱' }
]

// ─── Timezone list ────────────────────────────────────────────────────────────

export const TIMEZONES = [
  '',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'America/Mexico_City',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Europe/Moscow',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland'
]

// ─── Language list ────────────────────────────────────────────────────────────

export const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'de-DE', label: 'German' },
  { code: 'fr-FR', label: 'French' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'pt-BR', label: 'Portuguese (BR)' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'ru-RU', label: 'Russian' },
  { code: 'nl-NL', label: 'Dutch' },
  { code: 'sv-SE', label: 'Swedish' },
  { code: 'pl-PL', label: 'Polish' },
  { code: 'hi-IN', label: 'Hindi' }
]
