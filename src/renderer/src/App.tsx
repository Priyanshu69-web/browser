import React, { useState, Component, ReactNode } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ProxySettingsPage } from './pages/ProxySettingsPage'
import { SettingsPage } from './pages/SettingsPage'
import { LogsPage } from './pages/LogsPage'
import { ToastProvider } from './components/ui/Toast'
import type { PageId } from './types'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-[#111418] text-white flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-[#171B21] border border-[#2A2F39] rounded-2xl p-8 text-center space-y-5">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Application Render Error</h2>
              <p className="text-xs text-[#7A8495] mt-2 font-mono break-words bg-[#111418] p-3 rounded-xl border border-[#2A2F39]">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full h-[44px] rounded-xl bg-[#22C55E] hover:bg-[#2DD768] text-black font-bold text-sm transition-all cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AppContent() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [triggerAddProfile, setTriggerAddProfile] = useState(false)

  const handleAddProfileFromSidebar = () => {
    setActivePage('dashboard')
    setTriggerAddProfile(true)
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            onAddProfileTrigger={triggerAddProfile}
            resetAddProfileTrigger={() => setTriggerAddProfile(false)}
          />
        )
      case 'proxy-settings':
        return <ProxySettingsPage />
      case 'settings':
        return <SettingsPage />
      case 'logs':
        return <LogsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <AppLayout
      activePage={activePage}
      onNavigate={setActivePage}
      onAddProfile={handleAddProfileFromSidebar}
    >
      {renderPage()}
    </AppLayout>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  )
}
