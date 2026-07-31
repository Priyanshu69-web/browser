import { chromium, BrowserContext, CDPSession, Page } from 'playwright'
import { getProfile, updateProfile, getSetting } from './database'
import { decryptString } from './crypto'
import { addLog } from './logger'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { validateProxy } from './proxy-validator'

// Track running browser instances (Playwright context OR native child process)
const runningBrowsers = new Map<string, BrowserContext>()
const runningProcesses = new Map<string, ChildProcess>()

/**
 * Auto-detect GoLogin's proprietary Orbita Browser executable on local machine.
 */
export function getOrbitaPath(): string | undefined {
  const customPath = getSetting('default_browser_executable')
  if (customPath && customPath.trim() !== '' && existsSync(customPath)) {
    return customPath
  }
  return undefined
}

/**
 * Launch a browser profile using Playwright Anti-Detect Engine or custom browser executable.
 */
export async function launchProfile(profileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    addLog('info', `[LOG] Initiating launch for profile ID: ${profileId}`)
    if (runningBrowsers.has(profileId) || runningProcesses.has(profileId)) {
      addLog('error', `[LOG] Profile ${profileId} is already running.`)
      return { success: false, error: 'Profile is already running' }
    }

    const profile = getProfile(profileId)
    if (!profile) {
      addLog('error', `[LOG] Profile ${profileId} not found in database.`)
      return { success: false, error: 'Profile not found' }
    }

    const userDataDir = profile.profile_path || join(app.getPath('userData'), 'profiles', profileId)

    if (!existsSync(userDataDir)) {
      mkdirSync(userDataDir, { recursive: true })
    }

    const proxyUsername = decryptString(profile.proxy_username_encrypted) || profile.proxy_username || ''
    const proxyPassword = decryptString(profile.proxy_password_encrypted) || profile.proxy_password || ''
    const homepage = profile.homepage || getSetting('default_homepage') || 'https://www.google.com'

    addLog('info', `[LOG] Profile "${profile.name}" loaded. User Data Dir: ${userDataDir}, Homepage: ${homepage}`)

    // ── Check if Custom Executable is defined ─────────────────────────────
    const customExecutablePath = getOrbitaPath()

    if (customExecutablePath) {
      addLog('browser_launched', `[LOG] Launching Custom Browser (${customExecutablePath}) for "${profile.name}"`, profileId)

      const args: string[] = [
        `--user-data-dir=${userDataDir}`,
        `--window-size=${profile.window_width || 1280},${profile.window_height || 800}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--lang=en-US'
      ]

      if (profile.proxy_host && profile.proxy_host.trim() !== '') {
        const rawProxyType = (profile.proxy_type || 'http').toLowerCase()
        const port = profile.proxy_port || 80
        const scheme = rawProxyType.includes('socks') ? (rawProxyType.includes('socks4') ? 'socks4' : 'socks5') : 'http'

        args.push(`--proxy-server=${scheme}://${profile.proxy_host}:${port}`)
      }

      args.push(homepage)

      const child = spawn(customExecutablePath, args, {
        detached: true,
        stdio: 'ignore'
      })

      child.unref()
      runningProcesses.set(profileId, child)

      updateProfile(profileId, {
        status: 'running',
        last_launched: new Date().toISOString()
      })

      child.on('exit', (code) => {
        runningProcesses.delete(profileId)
        updateProfile(profileId, { status: 'ready' })
        addLog('browser_closed', `[LOG] Custom browser closed for "${profile.name}" (exit code: ${code})`, profileId)
      })

      return { success: true }
    }

    // ── Playwright Engine ───────────────────────────────────────────────────
    const chromiumVersion = '151.0.0.0'
    const chromiumFullVersion = '151.0.7922.34'
    const spoofedUserAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromiumVersion} Safari/537.36`

    const args: string[] = [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-infobars',
      '--disable-component-update',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-features=IsolateOrigins,site-per-process',
      '--lang=en-US,en',
      `--window-size=${profile.window_width || 1280},${profile.window_height || 800}`,
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--enforce-webrtc-ip-permission-check'
    ]

    let proxyConfig: { server: string; username?: string; password?: string; bypass?: string } | undefined

    if (profile.proxy_host && profile.proxy_host.trim() !== '') {
      const rawProxyType = (profile.proxy_type || 'http').toLowerCase()
      const port = profile.proxy_port || 80

      const validation = await validateProxy(rawProxyType, profile.proxy_host, port, proxyUsername, proxyPassword, 5000)
      if (validation.success) {
        addLog('proxy_success', `[LOG] Proxy OK (${validation.latencyMs}ms): ${validation.details || 'tunnel open'}`, profileId)
      } else {
        addLog('proxy_failure', `[LOG] Pre-flight proxy failure: ${validation.error}`, profileId)
        return {
          success: false,
          error: `Proxy Connection Failed: ${validation.error}. Please update or disable the proxy for "${profile.name}".`
        }
      }

      const scheme = rawProxyType.includes('socks') ? (rawProxyType.includes('socks4') ? 'socks4' : 'socks5') : 'http'

      proxyConfig = {
        server: `${scheme}://${profile.proxy_host}:${port}`,
        bypass: '<loopback>'
      }
      if (proxyUsername) proxyConfig.username = proxyUsername
      if (proxyPassword) proxyConfig.password = proxyPassword
      addLog('info', `[LOG] Proxy configured: ${proxyConfig.server} (User: ${proxyUsername ? 'yes' : 'no'})`, profileId)
    }

    const launchOptions: Record<string, unknown> = {
      headless: false,
      userAgent: spoofedUserAgent,
      viewport: {
        width: profile.window_width || 1280,
        height: profile.window_height || 800
      },
      locale: profile.language || 'en-US',
      timezoneId: profile.timezone || 'America/New_York',
      ignoreHTTPSErrors: true,
      ignoreDefaultArgs: ['--enable-automation'],
      args
    }

    if (proxyConfig) {
      launchOptions.proxy = proxyConfig
    }

    addLog('browser_launched', `[LOG] Launching Playwright Context for "${profile.name}"`, profileId)

    const context = await chromium.launchPersistentContext(userDataDir, launchOptions)
    addLog('info', `[LOG] Persistent Context created successfully for "${profile.name}"`, profileId)

    // Setup logging for page events
    function setupPageLogging(page: Page, label: string) {
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) {
          addLog('info', `[LOG] Page (${label}) MainFrame Navigated to: ${frame.url()}`, profileId)
        }
      })
      page.on('request', (req) => {
        addLog('info', `[LOG] Page (${label}) Request Start: ${req.method()} ${req.url()}`, profileId)
      })
      page.on('response', (res) => {
        addLog('info', `[LOG] Page (${label}) Response: ${res.status()} ${res.url()}`, profileId)
      })
      page.on('requestfailed', (req) => {
        addLog('error', `[LOG] Page (${label}) Request Failed: ${req.url()} (${req.failure()?.errorText || 'Unknown'})`, profileId)
      })
      page.on('pageerror', (err) => {
        addLog('error', `[LOG] Page (${label}) Unhandled Exception: ${err.message}`, profileId)
      })
    }

    runningBrowsers.set(profileId, context)

    updateProfile(profileId, {
      status: 'running',
      last_launched: new Date().toISOString()
    })

    for (const existingPage of context.pages()) {
      setupPageLogging(existingPage, 'existing')
    }

    context.on('page', (newPage: Page) => {
      addLog('info', `[LOG] New tab/page created in context`, profileId)
      setupPageLogging(newPage, 'new-tab')
    })

    const pages = context.pages()
    const mainPage = pages.length > 0 ? pages[0] : await context.newPage()

    if (pages.length === 0) {
      setupPageLogging(mainPage, 'main')
    }

    addLog('info', `[LOG] Navigating main page to homepage: ${homepage}`, profileId)

    mainPage.goto(homepage, { timeout: 35000, waitUntil: 'domcontentloaded' })
      .then((response) => {
        const status = response ? response.status() : 'OK'
        addLog('info', `[LOG] Navigation finished for ${homepage} (Status: ${status})`, profileId)
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err)
        addLog('error', `[LOG] Navigation error for ${homepage}: ${msg}`, profileId)
      })

    context.on('close', () => {
      runningBrowsers.delete(profileId)
      updateProfile(profileId, { status: 'ready' })
      addLog('browser_closed', `[LOG] Browser closed for "${profile.name}"`, profileId)
    })

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog('error', `[LOG] Launch failed: ${errorMessage}`, profileId)
    updateProfile(profileId, { status: 'error' })
    return { success: false, error: errorMessage }
  }
}

/**
 * Close a running browser profile.
 */
export async function closeProfile(profileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const context = runningBrowsers.get(profileId)
    if (context) {
      await context.close()
      runningBrowsers.delete(profileId)
      updateProfile(profileId, { status: 'ready' })
      return { success: true }
    }

    const child = runningProcesses.get(profileId)
    if (child) {
      child.kill('SIGTERM')
      runningProcesses.delete(profileId)
      updateProfile(profileId, { status: 'ready' })
      return { success: true }
    }

    return { success: false, error: 'Profile is not running' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog('error', `Failed to close browser: ${errorMessage}`, profileId)
    return { success: false, error: errorMessage }
  }
}

export function isProfileRunning(profileId: string): boolean {
  return runningBrowsers.has(profileId) || runningProcesses.has(profileId)
}

export function getRunningProfileIds(): string[] {
  return [
    ...Array.from(runningBrowsers.keys()),
    ...Array.from(runningProcesses.keys())
  ]
}

export async function closeAllBrowsers(): Promise<void> {
  const promises = Array.from(runningBrowsers.entries()).map(async ([id, context]) => {
    try {
      await context.close()
      updateProfile(id, { status: 'ready' })
    } catch {}
  })
  await Promise.all(promises)
  runningBrowsers.clear()

  for (const [id, child] of runningProcesses.entries()) {
    try {
      child.kill('SIGTERM')
      updateProfile(id, { status: 'ready' })
    } catch {}
  }
  runningProcesses.clear()
}
