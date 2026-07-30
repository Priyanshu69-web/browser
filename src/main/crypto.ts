import { safeStorage } from 'electron'

/**
 * Encrypts a string using Electron's safeStorage API.
 * Uses OS-level encryption (DPAPI on Windows, Keychain on macOS, libsecret on Linux).
 * Falls back to base64 encoding if safeStorage is not available.
 */
export function encryptString(plaintext: string): string {
  if (!plaintext) return ''

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(plaintext)
    return encrypted.toString('base64')
  }

  // Fallback: base64 encoding (not secure, but functional)
  console.warn('safeStorage not available, falling back to base64 encoding')
  return Buffer.from(plaintext, 'utf-8').toString('base64')
}

/**
 * Decrypts a string that was encrypted with encryptString.
 */
export function decryptString(encrypted: string): string {
  if (!encrypted) return ''

  if (safeStorage.isEncryptionAvailable()) {
    const buffer = Buffer.from(encrypted, 'base64')
    return safeStorage.decryptString(buffer)
  }

  // Fallback: base64 decoding
  return Buffer.from(encrypted, 'base64').toString('utf-8')
}
