import { insertLog } from './database'

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

/**
 * Add a log entry to both the database and console.
 */
export function addLog(type: LogType, message: string, profileId?: string): void {
  try {
    // Log to console with timestamp
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${type.toUpperCase()}]`
    if (type === 'error' || type === 'proxy_failure') {
      console.error(`${prefix} ${message}`)
    } else {
      console.log(`${prefix} ${message}`)
    }

    // Log to database
    insertLog(type, message, profileId)
  } catch (err) {
    // Don't let logging errors crash the app
    console.error('Failed to write log:', err)
  }
}
