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
 * Attach CDP-level proxy authentication to a page (for HTTP proxies).
 */
async function attachProxyAuth(page: Page, username: string, password: string): Promise<void> {
  let cdp: CDPSession | null = null
  try {
    cdp = await page.context().newCDPSession(page)
    await cdp.send('Fetch.enable', {
      handleAuthRequests: true,
      patterns: [{ urlPattern: '*' }]
    })
    cdp.on('Fetch.authRequired', async (event: Record<string, unknown>) => {
      try {
        await cdp!.send('Fetch.continueWithAuth', {
          requestId: event.requestId,
          authChallengeResponse: {
            response: 'ProvideCredentials',
            username,
            password
          }
        })
      } catch {
        // Ignore
      }
    })
    cdp.on('Fetch.requestPaused', async (event: Record<string, unknown>) => {
      try {
        await cdp!.send('Fetch.continueRequest', {
          requestId: event.requestId
        })
      } catch {
        // Ignore
      }
    })
  } catch {
    // Ignore
  }
}
/**
 * Launch a browser profile using Playwright Anti-Detect Engine or custom browser executable.
 */
export async function launchProfile(profileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (runningBrowsers.has(profileId) || runningProcesses.has(profileId)) {
      return { success: false, error: 'Profile is already running' }
    }
    const profile = getProfile(profileId)
    if (!profile) {
      return { success: false, error: 'Profile not found' }
    }
    const userDataDir = profile.profile_path || join(app.getPath('userData'), 'profiles', profileId)
    if (!existsSync(userDataDir)) {
      mkdirSync(userDataDir, { recursive: true })
    }
    const proxyUsername = decryptString(profile.proxy_username_encrypted) || profile.proxy_username || ''
    const proxyPassword = decryptString(profile.proxy_password_encrypted) || profile.proxy_password || ''
    const homepage = profile.homepage || getSetting('default_homepage') || 'https://www.google.com'
    // ── Check if Custom Executable is defined ─────────────────────────────
    const customExecutablePath = getOrbitaPath()
    if (customExecutablePath) {
      addLog('browser_launched', `Launching Custom Browser (${customExecutablePath}) for "${profile.name}"`, profileId)
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
        addLog('browser_closed', `Custom browser closed for "${profile.name}" (exit code: ${code})`, profileId)
      })
      return { success: true }
    }
    // ── Playwright Anti-Detect Engine ───────────────────────────────────────
    //
    // Key design principles:
    // 1. Do NOT override things Chromium already does correctly (plugins, webdriver)
    // 2. Use CDP Network.setUserAgentOverride for Client Hints brand injection
    // 3. Block WebRTC IP leaks via Chromium flags
    // 4. Match real Chromium version in UA to avoid version mismatches
    //
    // The actual Playwright Chromium version — must match to avoid UA↔ClientHints↔Features mismatch
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
      // ── WebRTC IP Leak Prevention ──
      // Forces all WebRTC ICE candidates to go through the proxy, preventing real IP exposure
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--enforce-webrtc-ip-permission-check'
    ]
    let isHttpProxy = false
    let proxyConfig: { server: string; username?: string; password?: string; bypass?: string } | undefined
    if (profile.proxy_host && profile.proxy_host.trim() !== '') {
      const rawProxyType = (profile.proxy_type || 'http').toLowerCase()
      const port = profile.proxy_port || 80
      const validation = await validateProxy(rawProxyType, profile.proxy_host, port, proxyUsername, proxyPassword, 8000)
      if (validation.success) {
        addLog('proxy_success', `Proxy OK (${validation.latencyMs}ms): ${validation.details || 'tunnel open'}`, profileId)
      } else {
        addLog('proxy_failure', `Pre-flight warning: ${validation.error}`, profileId)
      }
      const scheme = rawProxyType.includes('socks') ? (rawProxyType.includes('socks4') ? 'socks4' : 'socks5') : 'http'
      if (!rawProxyType.includes('socks')) {
        isHttpProxy = true
      }
      proxyConfig = {
        server: `${scheme}://${profile.proxy_host}:${port}`,
        bypass: '<loopback>'
      }
      if (proxyUsername) proxyConfig.username = proxyUsername
      if (proxyPassword) proxyConfig.password = proxyPassword
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
      // Removing --enable-automation makes navigator.webdriver=false natively (no JS hack needed)
      ignoreDefaultArgs: ['--enable-automation'],
      args
    }
    if (proxyConfig) {
      launchOptions.proxy = proxyConfig
    }
    addLog('browser_launched', `Launching Anti-Detect Engine for "${profile.name}"`, profileId)
    const context = await chromium.launchPersistentContext(userDataDir, launchOptions)
    // ── CDP: Inject Client Hints brands ("Google Chrome") ──────────────────
    // Playwright's Chromium is unbranded — it sends "Chromium" only.
    // Real Chrome sends "Google Chrome" + "Chromium" + greased brand.
    // We use Network.setUserAgentOverride with userAgentMetadata to fix this.
    // This also removes Pragma/Cache-Control headers that Playwright injects.
    async function applyAntiDetectCDP(page: Page): Promise<void> {
      let cdp: CDPSession | null = null
      try {
        cdp = await page.context().newCDPSession(page)
        // Inject "Google Chrome" brand into Client Hints (Issue #3, #10, #22)
        await cdp.send('Network.setUserAgentOverride', {
          userAgent: spoofedUserAgent,
          acceptLanguage: 'en-US,en;q=0.9',
          platform: 'Win32',
          userAgentMetadata: {
            brands: [
              { brand: 'Google Chrome', version: '151' },
              { brand: 'Chromium', version: '151' },
              { brand: 'Not)A;Brand', version: '24' }
            ],
            fullVersionList: [
              { brand: 'Google Chrome', version: chromiumFullVersion },
              { brand: 'Chromium', version: chromiumFullVersion },
              { brand: 'Not)A;Brand', version: '24.0.0.0' }
            ],
            fullVersion: chromiumFullVersion,
            platform: 'Windows',
            platformVersion: '10.0.0',
            architecture: 'x86',
            model: '',
            mobile: false,
            bitness: '64',
            wow64: false
          }
        })
        // Remove Pragma/Cache-Control headers that Playwright injects (Issue #7)
        await cdp.send('Network.setExtraHTTPHeaders', {
          headers: {
            'Pragma': '',
            'Cache-Control': ''
          }
        })
      } catch {
        // Non-fatal: CDP session may fail on some pages
      }
    }
    // Minimal init script — only override what Chromium gets WRONG, not what it gets right.
    // Native Chromium already provides:
    //   - navigator.webdriver = false (when --enable-automation is removed)
    //   - navigator.plugins = 5 correct PDF plugins
    //   - navigator.vendor = "Google Inc."
    //   - navigator.languages = ["en-US", "en"]
    await context.addInitScript(() => {
      // Clean up CDP/automation detection artifacts
      try {
        const cleanProps = ['cdc_adoQpoasnfa76pfcZLmcfl_Array', 'cdc_adoQpoasnfa76pfcZLmcfl_Promise', 'cdc_adoQpoasnfa76pfcZLmcfl_Symbol', '$cdc_asdjflasutdfhxcv_']
        cleanProps.forEach((prop) => {
          delete (window as any)[prop]
          delete (document as any)[prop]
        })
      } catch {}

      // hardwareConcurrency: GoLogin reports 4, our system leaks 8 (Issue #5)
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 })
      // deviceMemory: Playwright Chromium strips this property, GoLogin reports 8
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
      // Ensure window.chrome object exists with proper structure
      if (!(window as any).chrome) {
        ;(window as any).chrome = {}
      }
      const c = (window as any).chrome
      c.app = c.app || {
        isInstalled: false,
        InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
        RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
      }
      c.csi = c.csi || function () { return { startE: Date.now(), onloadT: Date.now() + 100, pageT: 50, tran: 15 } }
      c.loadTimes = c.loadTimes || function () {
        return {
          requestTime: Date.now() / 1000 - 0.5,
          startLoadTime: Date.now() / 1000 - 0.4,
          commitLoadTime: Date.now() / 1000 - 0.2,
          finishDocumentLoadTime: Date.now() / 1000 - 0.1,
          finishLoadTime: Date.now() / 1000,
          firstPaintTime: Date.now() / 1000 - 0.2,
          firstPaintAfterLoadTime: 0,
          navigationType: 'Other',
          wasFetchedViaSpdy: true,
          wasNpnNegotiated: true,
          npnNegotiatedProtocol: 'h2',
          wasAlternateProtocolAvailable: false,
          connectionInfo: 'h2'
        }
      }
      c.runtime = c.runtime || {
        OnInstalledReason: { INSTALL: 'install', UPDATE: 'update' },
        OnRestartRequiredReason: { APP_UPDATE: 'app_update' },
        PlatformArch: { ARM: 'arm', X86_64: 'x86_64' },
        PlatformOs: { WIN: 'win', MAC: 'mac', CROS: 'cros', LINUX: 'linux' },
        connect: function () {},
        sendMessage: function () {}
      }
      // Permissions API: return consistent results for notifications
      try {
        const originalQuery = window.Permissions.prototype.query
        ;(window.Permissions.prototype as any).query = function (parameters: any) {
          if (parameters && parameters.name === 'notifications') {
            return Promise.resolve({ state: Notification.permission || 'granted', onchange: null })
          }
          return originalQuery.apply(this, arguments as any)
        }
      } catch {}
    })
    runningBrowsers.set(profileId, context)
    updateProfile(profileId, {
      status: 'running',
      last_launched: new Date().toISOString()
    })
    // Apply CDP anti-detect + proxy auth to all existing and new pages
    for (const existingPage of context.pages()) {
      await applyAntiDetectCDP(existingPage)
      if (isHttpProxy && proxyUsername) {
        await attachProxyAuth(existingPage, proxyUsername, proxyPassword)
      }
    }
    context.on('page', async (newPage: Page) => {
      await applyAntiDetectCDP(newPage)
      if (isHttpProxy && proxyUsername) {
        await attachProxyAuth(newPage, proxyUsername, proxyPassword)
      }
    })
    const pages = context.pages()
    const mainPage = pages.length > 0 ? pages[0] : await context.newPage()
    if (pages.length === 0) {
      await applyAntiDetectCDP(mainPage)
      if (isHttpProxy && proxyUsername) {
        await attachProxyAuth(mainPage, proxyUsername, proxyPassword)
      }
    }
    mainPage.goto(homepage, { timeout: 35000, waitUntil: 'domcontentloaded' })
      .then(() => addLog('info', `Loaded: ${homepage}`, profileId))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err)
        addLog('error', `Navigation note: ${msg}`, profileId)
      })
    context.on('close', () => {
      runningBrowsers.delete(profileId)
      updateProfile(profileId, { status: 'ready' })
      addLog('browser_closed', `Browser closed for "${profile.name}"`, profileId)
    })
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog('error', `Launch failed: ${errorMessage}`, profileId)
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
