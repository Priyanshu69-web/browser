# ProfileHub — Browser Profile Manager

A desktop application for managing isolated Chromium browser profiles for development, testing, and QA workflows.

Built with **Electron + React + TypeScript + Tailwind CSS + SQLite + Playwright**.

## Features

- **Profile Dashboard** — Create, edit, duplicate, and delete browser profiles with a premium dark UI
- **Browser Isolation** — Each profile has its own cookies, cache, local storage, IndexedDB, extensions, and history
- **Proxy Configuration** — Per-profile proxy support (HTTP, HTTPS, SOCKS5) with encrypted credential storage
- **Playwright Browser Launch** — Launch isolated Chromium instances using Playwright's persistent context
- **SQLite Database** — Profile data stored in SQLite with WAL mode for performance
- **Encrypted Credentials** — Proxy passwords encrypted using OS-level encryption (DPAPI on Windows, Keychain on macOS)
- **Import/Export** — Export profiles as JSON, import on another machine
- **Logging** — Full activity log with filtering (browser launched/closed, profile CRUD, proxy status)
- **Settings** — Configurable homepage, download folder, browser executable path, and theme
- **Search & Filter** — Quickly find profiles by name, country, or description

## Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** 9+
- **Windows**: Visual Studio Build Tools with C++ workload (for `better-sqlite3` native compilation)
  - Install via: `npm install -g windows-build-tools` or install Visual Studio with "Desktop development with C++" workload
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Linux**: `build-essential`, `python3`

## Setup

```bash
# Clone the repository
git clone <repo-url>
cd GoLogin-Replica

# Install dependencies
npm install

# Rebuild native modules for Electron
npm run rebuild

# Install Playwright's Chromium browser
npx playwright install chromium

# Start development server
npm run dev
```

## Project Structure

```
src/
├── main/                          # Electron main process
│   ├── index.ts                   # App entry, window creation
│   ├── database.ts                # SQLite (better-sqlite3) CRUD
│   ├── browser-launcher.ts        # Playwright browser launcher
│   ├── crypto.ts                  # Credential encryption (safeStorage)
│   ├── ipc-handlers.ts            # IPC message handlers
│   └── logger.ts                  # Logging system
├── preload/
│   ├── index.ts                   # Context bridge API
│   └── index.d.ts                 # TypeScript declarations
└── renderer/                      # React frontend
    ├── index.html
    └── src/
        ├── App.tsx                # Root component with routing
        ├── main.tsx               # React entry point
        ├── assets/main.css        # Tailwind + design system
        ├── types/index.ts         # Shared TypeScript types
        ├── components/
        │   ├── ui/                # Button, Input, Select, Badge, Dialog, Toast, SearchBar
        │   ├── layout/            # Sidebar, TopBar, AppLayout
        │   ├── profiles/          # ProfileCard, ProfileGrid, ProfileForm, ProfileDeleteDialog
        │   ├── proxy/             # ProxyForm
        │   ├── settings/          # SettingsForm
        │   └── logs/              # LogViewer
        └── pages/                 # DashboardPage, ProxySettingsPage, SettingsPage, LogsPage
```

## Build for Production

```bash
npm run build
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 34 |
| Frontend | React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Build Tool | electron-vite 3 |
| Database | SQLite via better-sqlite3 |
| Browser Engine | Chromium via Playwright |
| Encryption | Electron safeStorage (OS-level) |

## Security Notes

- Proxy credentials are encrypted at rest using the OS-level keychain (DPAPI on Windows, Keychain on macOS, libsecret on Linux)
- The application uses `contextIsolation: true` and `nodeIntegration: false` for security
- All database operations occur in the main process only — the renderer communicates via IPC
- This application does not attempt to circumvent website security, anti-fraud systems, or browser fingerprinting protections

## License

MIT
