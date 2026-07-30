export interface ParsedProxy {
  type: string
  host: string
  port: number
  username: string
  password: string
}

/**
 * Parses a custom raw proxy string in any common format:
 * - host:port
 * - host:port:user:pass
 * - user:pass@host:port
 * - user:pass:host:port
 * - scheme://host:port:user:pass
 * - scheme://user:pass@host:port
 */
export function parseProxyString(rawInput: string): ParsedProxy | null {
  if (!rawInput || !rawInput.trim()) return null

  let input = rawInput.trim()
  let type = 'http'

  // Extract scheme if present (e.g., http://, https://, socks5://, socks4://)
  const schemeMatch = input.match(/^(https?|socks5|socks4):\/\//i)
  if (schemeMatch) {
    type = schemeMatch[1].toLowerCase()
    input = input.substring(schemeMatch[0].length)
  }

  // Format 1: user:pass@host:port
  if (input.includes('@')) {
    const [authPart, hostPart] = input.split('@')
    const [username, password] = authPart.split(':')
    const [host, portStr] = hostPart.split(':')
    const port = parseInt(portStr, 10) || 8080

    return {
      type,
      host: host || '',
      port,
      username: username || '',
      password: password || ''
    }
  }

  // Format 2: colon separated components
  const parts = input.split(':').map((p) => p.trim())

  if (parts.length === 2) {
    // host:port
    const port = parseInt(parts[1], 10) || 8080
    return {
      type,
      host: parts[0],
      port,
      username: '',
      password: ''
    }
  }

  if (parts.length === 4) {
    // Check if parts[1] or parts[3] is numeric (port)
    const isSecondPartNum = /^\d+$/.test(parts[1])
    const isFourthPartNum = /^\d+$/.test(parts[3])

    if (isSecondPartNum) {
      // host:port:user:pass
      return {
        type,
        host: parts[0],
        port: parseInt(parts[1], 10) || 8080,
        username: parts[2],
        password: parts[3]
      }
    } else if (isFourthPartNum) {
      // user:pass:host:port
      return {
        type,
        host: parts[2],
        port: parseInt(parts[3], 10) || 8080,
        username: parts[0],
        password: parts[1]
      }
    }
  }

  return null
}
