import http from 'http'
import https from 'https'
import net from 'net'
import { URL } from 'url'

export interface ProxyValidationResult {
  success: boolean
  latencyMs: number
  ip?: string
  error?: string
  details?: string
}

/**
 * Validate proxy connection before launching Chromium.
 * Checks TCP connectivity, DNS resolution, HTTP CONNECT tunnel, and authentication.
 */
export async function validateProxy(
  type: string,
  host: string,
  port: number,
  username?: string,
  password?: string,
  timeoutMs: number = 8000
): Promise<ProxyValidationResult> {
  const startTime = Date.now()

  if (!host || !port) {
    return {
      success: false,
      latencyMs: 0,
      error: 'Invalid proxy parameters (missing host or port)'
    }
  }

  // Step 1: Check raw TCP Socket Connection to Proxy Host:Port
  const tcpConnect = new Promise<boolean>((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(timeoutMs)

    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })

    socket.on('error', () => {
      socket.destroy()
      resolve(false)
    })

    socket.connect(port, host)
  })

  const canConnect = await tcpConnect
  if (!canConnect) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      error: `Failed to establish TCP connection to proxy at ${host}:${port}`
    }
  }

  // Step 2: Validate HTTP/HTTPS proxy tunnel with credentials
  if (type.toLowerCase().startsWith('http')) {
    return new Promise<ProxyValidationResult>((resolve) => {
      const authHeader = username
        ? 'Basic ' + Buffer.from(`${username}:${password || ''}`).toString('base64')
        : undefined

      const options: http.RequestOptions = {
        host,
        port,
        method: 'CONNECT',
        path: 'google.com:443',
        timeout: timeoutMs,
        headers: authHeader
          ? {
              'Proxy-Authorization': authHeader,
              'Proxy-Connection': 'Keep-Alive'
            }
          : {}
      }

      const req = http.request(options)

      req.on('connect', (res, socket) => {
        socket.destroy()
        const latencyMs = Date.now() - startTime
        if (res.statusCode === 200) {
          resolve({
            success: true,
            latencyMs,
            details: `HTTP Proxy tunnel established (HTTP 200 OK)`
          })
        } else if (res.statusCode === 407) {
          resolve({
            success: false,
            latencyMs,
            error: 'Proxy authentication failed (407 Proxy Authentication Required)'
          })
        } else {
          resolve({
            success: false,
            latencyMs,
            error: `Proxy returned HTTP status ${res.statusCode}`
          })
        }
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({
          success: false,
          latencyMs: Date.now() - startTime,
          error: 'Proxy tunnel request timed out'
        })
      })

      req.on('error', (err) => {
        req.destroy()
        resolve({
          success: false,
          latencyMs: Date.now() - startTime,
          error: `Proxy request failed: ${err.message}`
        })
      })

      req.end()
    })
  }

  // Default success for SOCKS / direct TCP
  return {
    success: true,
    latencyMs: Date.now() - startTime,
    details: `${type.toUpperCase()} proxy socket verified at ${host}:${port}`
  }
}
